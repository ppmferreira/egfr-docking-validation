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


def _rows(path):
    """Data rows in a CSV (header excluded); 0 when the file does not exist yet."""
    return max(sum(1 for _ in path.open()) - 1, 0) if path.is_file() else 0


def steps():
    """Pipeline stages with their state, read from the files each script writes (never typed in by hand)."""
    jobs = [j['name'] for j in running_jobs()]
    data, res = ROOT / 'data', ROOT / 'results'
    enrich = data / 'enrichment'
    library = _rows(enrich / 'chembl_actives_inactives.csv') + _rows(enrich / 'decoys.csv')
    blind_sel = json.loads((data / 'blind' / 'selected.json').read_text())['selected'] if (data / 'blind' / 'selected.json').is_file() else []
    blind_done = len({r for r in pd.read_csv(res / 'blind_results.csv').pdb}) if (res / 'blind_results.csv').is_file() else 0
    # (id, name, script, finished?, progress or None)
    stages = [
        ('01', 'Estrutura da proteína (1M17)', '01_target.py', (data / 'egfr_box.txt').is_file(), None),
        ('02', 'Dados de atividade do ChEMBL', '02_chembl.py', (res / 'docking_shortlist.csv').is_file(), None),
        ('03', 'Formas 3D dos 16 compostos', '03_ligands.py', (data / 'ligands_sdf').exists(), None),
        ('04', 'Docking dos 16 compostos', '04_docking.py', (res / 'vina_scores.csv').is_file(), None),
        ('04b', 'Redocking do erlotinibe', '04b_redocking.py', (res / 'redocking_rmsd.csv').is_file(), None),
        ('04c', 'Varredura de parâmetros', '04c_redocking_sweep.py', (res / 'redocking_sweep.csv').is_file(), (_rows(res / 'redocking_sweep.csv'), SWEEP_TOTAL)),
        ('04d', 'Redocking em 4WKQ e 1XKK', '04d_redock_multi.py', (res / 'redocking_multi.csv').is_file(), (_rows(res / 'redocking_multi.csv'), MULTI_TOTAL)),
        ('06', 'DiffDock nos três complexos', '06_diffdock.py', (res / 'diffdock_results.csv').is_file(), None),
        ('07', 'Seleção dos complexos cegos', '07_blind_select.py', bool(blind_sel), None),
        ('08', 'Teste cego (Vina e DiffDock)', '08_blind_run.py', bool(blind_sel) and blind_done >= len(blind_sel), (blind_done, len(blind_sel)) if blind_sel else None),
        ('09', 'Tabelas e figuras do relatório', '09_report_figures.py', (res / 'report_tables.md').is_file(), None),
        ('10', 'Ativos e inativos do ChEMBL', '10_enrichment_data.py', (enrich / 'chembl_actives_inactives.csv').is_file(), None),
        ('11', 'Decoys', '11_decoys.py', (enrich / 'decoys.csv').is_file(), None),
        ('12', 'Docking da biblioteca de enriquecimento', '12_enrichment_dock.py',
         bool(library) and _rows(res / 'enrichment_scores.csv') >= library, (_rows(res / 'enrichment_scores.csv'), library) if library else None),
        ('13', 'Análise de enriquecimento (ROC, EF1%)', '13_enrichment_analysis.py', (res / 'enrichment_tables.md').is_file(), None),
    ]
    out = []
    for sid, name, script, finished, progress in stages:
        running = any(j.startswith(f'{sid}_') for j in jobs)
        status = 'done' if finished and not running else 'running' if running else 'pending'
        out.append({'id': sid, 'name': name, 'script': script, 'status': status,
                    'progress': {'done': progress[0], 'total': progress[1]} if progress and progress[1] else None})
    return out


def redocking_summary():
    """Vina poses of the first erlotinib redocking (scores and RMSD only; the 3D poses live in structures.py)."""
    table = ROOT / 'results' / 'redocking_rmsd.csv'
    if not table.is_file():
        return None
    df = pd.read_csv(table)
    return {'poses': [{'pose': int(r.pose), 'score': float(r.vina_score_kcal_mol), 'rmsd': float(r.rmsd_to_crystal_A)}
                      for r in df.itertuples()]}


def enrichment_payload():
    """ROC/AUC results written by scripts/13_enrichment_analysis.py (None until the analysis has run)."""
    f = ROOT / 'results' / 'enrichment_metrics.json'
    return json.loads(f.read_text()) if f.is_file() else None


def dashboard_data():
    rows, done = sweep_rows()
    mrows, mdone = multi_rows()
    return {'blind': blind_payload(), 'diffdock': diffdock_rows(), 'activity': activity(), 'jobs': running_jobs(),
            'multi': {'rows': mrows, 'done': mdone, 'total': MULTI_TOTAL}, 'steps': steps(),
            'redocking': redocking_summary(), 'sweep': {'rows': rows, 'done': done, 'total': SWEEP_TOTAL},
            'docking': docking_rows(), 'enrichment': enrichment_payload()}
