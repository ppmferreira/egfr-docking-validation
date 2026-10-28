"""Tables the analysis scripts wrote to results/ and data/, shaped for the frontend."""
from __future__ import annotations
import ast
import json
from collections import Counter
import pandas as pd
from .config import MULTI_TOTAL, ROOT, SWEEP_TOTAL
from .system import activity, running_jobs


def diffdock_rows():
    csv = ROOT / 'results' / 'diffdock_results.csv'
    if not csv.is_file():
        return []
    return json.loads(pd.read_csv(csv).to_json(orient='records'))


def blind_payload():
    sel_file = ROOT / 'data' / 'blind' / 'selected.json'
    if not sel_file.is_file():
        return {'selected': [], 'rows': [], 'rejected': {}}
    d = json.loads(sel_file.read_text())
    csv = ROOT / 'results' / 'blind_results.csv'
    rows = json.loads(pd.read_csv(csv).where(lambda x: x.notna(), None).to_json(orient='records')) if csv.is_file() else []
    from collections import Counter

    def reason(r):
        if r.startswith('error: 404'):
            return 'sem arquivo no formato PDB (só mmCIF)'
        if 'covalently' in r:
            return 'ligante covalente'
        return {'no hinge motif in chain A': 'cadeia A sem o motivo do hinge',
                'no ligand with hinge hydrogen bond': 'sem ligante ligado ao hinge'}.get(r, r)
    return {'selected': [{k: r.get(k) for k in ('pdb', 'comp', 'name', 'heavy_atoms', 'resolution', 'mw')} for r in d['selected']],
            'rows': rows, 'rejected': dict(Counter(reason(v) for v in d.get('rejected', {}).values())), 'n_candidates': len(d.get('rejected', {})) + len(d['selected'])}


def sweep_rows():
    csv = ROOT / 'results' / 'redocking_sweep.csv'
    if csv.is_file():
        return json.loads(pd.read_csv(csv).to_json(orient='records')), True
    log = ROOT / 'results' / 'sweep.log'
    rows = []
    if log.is_file():
        for line in log.read_text().splitlines():
            if line.startswith('{'):
                try:
                    rows.append(ast.literal_eval(line))
                except (ValueError, SyntaxError):
                    pass
    return rows, False


def multi_rows():
    csv = ROOT / 'results' / 'redocking_multi.csv'
    log = ROOT / 'results' / 'multi.log'
    # A newer log means a run is in progress; the CSV is only final when it is not older than the log.
    if csv.is_file() and not (log.is_file() and log.stat().st_mtime > csv.stat().st_mtime):
        return json.loads(pd.read_csv(csv).to_json(orient='records')), True
    rows = []
    if log.is_file():
        for line in log.read_text().splitlines():
            if line.startswith("{'pdb'"):
                try:
                    rows.append(ast.literal_eval(line))
                except (ValueError, SyntaxError):
                    pass
    return rows, False


def docking_rows():
    scores, short = ROOT / 'results' / 'vina_scores.csv', ROOT / 'results' / 'docking_shortlist.csv'
    if not (scores.is_file() and short.is_file()):
        return []
    df = pd.read_csv(scores).merge(pd.read_csv(short), on='chembl_id')
    return json.loads(df[['chembl_id', 'vina_score_kcal_mol', 'pIC50', 'ic50_nM', 'MW', 'logP']].to_json(orient='records'))


def steps():
    def has(p): return (ROOT / p).exists()
    cur = ROOT / 'data' / 'egfr_compounds_curated.csv'
    n_cur = max(sum(1 for _ in cur.open()) - 1, 0) if cur.is_file() else 0
    return [
        {'id': '01', 'name': 'Estrutura da proteína (PDB 1M17)', 'done': has('data/egfr_box.txt')},
        {'id': '02', 'name': f'Dados do ChEMBL ({n_cur} compostos únicos)', 'done': has('results/docking_shortlist.csv')},
        {'id': '03', 'name': 'Conformeros 3D dos 16 compostos', 'done': has('data/ligands_sdf')},
        {'id': '04', 'name': 'Docking dos 16 compostos', 'done': has('results/vina_scores.csv')},
        {'id': '04b', 'name': 'Redocking do erlotinibe', 'done': has('results/redocking_rmsd.csv')},
        {'id': '04c', 'name': 'Varredura de parâmetros (erlotinibe)', 'done': has('results/redocking_sweep.csv')},
        {'id': '04d', 'name': 'Redocking em outros complexos (4WKQ, 1XKK)', 'done': has('results/redocking_multi.csv')},
    ]


def redocking_summary():
    """Vina poses of the first erlotinib redocking (scores and RMSD only; the 3D poses live in structures.py)."""
    table = ROOT / 'results' / 'redocking_rmsd.csv'
    if not table.is_file():
        return None
    df = pd.read_csv(table)
    return {'poses': [{'pose': int(r.pose), 'score': float(r.vina_score_kcal_mol), 'rmsd': float(r.rmsd_to_crystal_A)}
                      for r in df.itertuples()]}


def dashboard_data():
    rows, done = sweep_rows()
    mrows, mdone = multi_rows()
    return {'blind': blind_payload(), 'diffdock': diffdock_rows(), 'activity': activity(), 'jobs': running_jobs(),
            'multi': {'rows': mrows, 'done': mdone, 'total': MULTI_TOTAL}, 'steps': steps(),
            'redocking': redocking_summary(), 'sweep': {'rows': rows, 'done': done, 'total': SWEEP_TOTAL},
            'docking': docking_rows()}
