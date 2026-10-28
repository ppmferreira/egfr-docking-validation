"""Local dashboard for the EGFR virtual screening project.

Run inside the egfr-vs environment:  python dashboard/server.py
Then open http://localhost:8765 in the browser. Reads project files on every request.
"""
from __future__ import annotations
import ast
import importlib.util
import json
import math
import mimetypes
import re
import subprocess
import time
from functools import lru_cache
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import pandas as pd
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolAlign
from meeko import PDBQTMolecule, RDKitMolCreate

ROOT = Path(__file__).resolve().parents[1]
HERE = Path(__file__).resolve().parent
PORT = 8765
SWEEP_TOTAL = 42
MULTI_TOTAL = 18


def load_script(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod


WATCH = ['results/*.csv', 'results/*.log', 'results/redocking/*', 'data/*.csv', 'data/*.txt', 'data/*.json',
         'figures/*.png']
SKIP = ('dashboard.log',)


def watched_files():
    files = []
    for pattern in WATCH:
        files += [f for f in ROOT.glob(pattern) if f.is_file() and f.name not in SKIP]
    return files


def running_jobs():
    """Pipeline scripts and docking engines currently running on this machine."""
    try:
        out = subprocess.run(['ps', '-eo', 'etimes=,args='], capture_output=True, text=True, timeout=5).stdout
    except (OSError, subprocess.SubprocessError):
        return []
    jobs = []
    for line in out.splitlines():
        secs, _, args = line.strip().partition(' ')
        args = args.strip()
        if 'dashboard/server.py' in args or not secs.isdigit():
            continue
        for part in args.split():
            name = Path(part).name
            if part.startswith(('scripts/', str(ROOT / 'scripts'))) and name.endswith('.py') and name[:2].isdigit():
                jobs.append({'name': name, 'seconds': int(secs)}); break
            if name == 'vina' and part == args.split()[0]:
                jobs.append({'name': 'vina (docking)', 'seconds': int(secs)}); break
    seen, uniq = set(), []
    for j in jobs:
        if j['name'] not in seen:
            seen.add(j['name']); uniq.append(j)
    return uniq


def version():
    files = watched_files()
    stamp = max((f.stat().st_mtime for f in files), default=0)
    count = len(files)
    return {'stamp': round(stamp, 3), 'files': count, 'jobs': running_jobs()}


def gpu_stats():
    exe = '/usr/lib/wsl/lib/nvidia-smi'
    try:
        out = subprocess.run([exe, '--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu',
                              '--format=csv,noheader,nounits'], capture_output=True, text=True, timeout=5).stdout.strip()
        name, util, used, total, temp = [x.strip() for x in out.split(',')]
        return {'name': name, 'util': int(util), 'mem_used': int(used), 'mem_total': int(total), 'temp': int(temp)}
    except (OSError, ValueError, subprocess.SubprocessError):
        return None


def log_tails(max_files=3, lines=60, recent_s=900):
    """Tail of the most recently written logs. tqdm bars rewrite one line with \\r, so split on both."""
    now = time.time()
    cands = list((ROOT / 'results').glob('*.log')) + list((ROOT / 'results').glob('diffdock/*.log'))
    cands = [f for f in cands if f.name != 'dashboard.log' and now - f.stat().st_mtime < recent_s]
    out = []
    for f in sorted(cands, key=lambda f: f.stat().st_mtime, reverse=True)[:max_files]:
        text = f.read_text(errors='replace')[-12000:]
        parts = [p for p in text.replace('\r', '\n').split('\n') if p.strip()]
        out.append({'file': str(f.relative_to(ROOT)), 'age': int(now - f.stat().st_mtime), 'tail': parts[-lines:]})
    return out


def diffdock_rows():
    csv = ROOT / 'results' / 'diffdock_results.csv'
    if not csv.is_file():
        return []
    return json.loads(pd.read_csv(csv).to_json(orient='records'))


@lru_cache(maxsize=8)
def complex_payload(pdb):
    """Protein (chain A, as given to docking) and crystal ligand for any complex used in the redocking tests."""
    rec = ROOT / 'results' / 'redocking_multi' / f'{pdb}_receptor.pdb'
    if not rec.is_file():
        return None
    dd = load_script('06_diffdock')
    lines = [l for l in rec.read_text().splitlines() if l.startswith('ATOM')]
    mol = dd.crystal_ligand(pdb)
    pts = [tuple(mol.GetConformer().GetAtomPosition(i)) for i in range(mol.GetNumAtoms())]
    return {'protein': '\n'.join(lines) + '\nEND\n', 'crystal': Chem.MolToMolBlock(mol),
            'center': [sum(p[k] for p in pts) / len(pts) for k in range(3)]}


def _blind_entry(pdb):
    f = ROOT / 'data' / 'blind' / 'selected.json'
    if not f.is_file():
        return None
    return next((e for e in json.loads(f.read_text())['selected'] if e['pdb'] == pdb), None)


def _read_poses(files, ref):
    """DiffDock rankN sdf files (the one carrying the confidence wins) as molblocks with RMSD to the crystal ligand."""
    out, seen = [], set()
    for sdf in sorted(files, key=lambda f: '_confidence' not in f.name):
        m = re.match(r'rank(\d+)(?:_confidence(-?[\d.]+))?\.sdf', sdf.name)
        if not m or int(m.group(1)) in seen:
            continue
        mol = Chem.MolFromMolFile(str(sdf), removeHs=True)
        if mol is None:
            continue
        seen.add(int(m.group(1)))
        out.append({'rank': int(m.group(1)), 'confidence': float(m.group(2)) if m.group(2) else None,
                    'rmsd': round(rdMolAlign.CalcRMS(mol, ref), 2), 'mol': Chem.MolToMolBlock(mol)})
    return sorted(out, key=lambda r: r['rank'])


def _vina_poses(pdbqt, ref):
    if not pdbqt.is_file():
        return []
    scores = [float(l.split()[3]) for l in pdbqt.read_text().splitlines() if l.startswith('REMARK VINA RESULT')]
    poses = RDKitMolCreate.from_pdbqt_mol(PDBQTMolecule.from_file(str(pdbqt), skip_typing=True))[0]
    out = []
    for i, conf in enumerate(poses.GetConformers()):
        m = Chem.Mol(poses); m.RemoveAllConformers(); m.AddConformer(Chem.Conformer(conf), assignId=True)
        m = Chem.RemoveHs(m)
        out.append({'pose': i + 1, 'score': scores[i], 'rmsd': round(rdMolAlign.CalcRMS(m, ref), 2), 'mol': Chem.MolToMolBlock(m)})
    return out


def cx_payload(pdb):
    """Cached per structure, re-read when a blind-test run writes new files into its folder."""
    d = ROOT / 'results' / 'blind' / pdb
    return _cx_payload(pdb, max((int(f.stat().st_mtime) for f in d.rglob('*') if f.is_file()), default=0) if d.is_dir() else 0)


@lru_cache(maxsize=16)
def _cx_payload(pdb, _sig):
    """Everything the Complexos view draws for one structure: protein, crystal ligand, all DiffDock poses and the
    Vina poses of seed 1 (box 20 A). Works for the development complexes and for the blind-test ones."""
    if complex_payload(pdb) is not None:
        base = complex_payload(pdb)
        ref = load_script('06_diffdock').crystal_ligand(pdb)
        dd_dir = ROOT / 'results' / 'diffdock' / pdb
        vina = ROOT / 'results' / 'redocking_multi' / f'{pdb}_b20_s1.pdbqt'
        name = next((r['ligand'] for r in diffdock_rows() if r['pdb'] == pdb), pdb)
        has_traj = any(dd_dir.glob('rank*_reverseprocess.pdb'))
    else:
        entry, d = _blind_entry(pdb), ROOT / 'results' / 'blind' / pdb
        if entry is None or not (d / 'receptor.pdb').is_file():
            return None
        multi = load_script('04d_redock_multi')
        text = (ROOT / 'data' / 'blind' / f'{pdb}.pdb').read_text()
        _, lig = multi.split_complex(text, entry['comp'])
        try:
            pose = Chem.MolFromPDBBlock('\n'.join(lig) + '\nEND\n', removeHs=True, sanitize=False)
            ref = Chem.RemoveHs(AllChem.AssignBondOrdersFromTemplate(Chem.MolFromSmiles(entry['smiles']), pose))
        except Exception:
            return None
        pts = [tuple(ref.GetConformer().GetAtomPosition(i)) for i in range(ref.GetNumAtoms())]
        lines = [l for l in (d / 'receptor.pdb').read_text().splitlines() if l.startswith('ATOM')]
        base = {'protein': '\n'.join(lines) + '\nEND\n', 'crystal': Chem.MolToMolBlock(ref),
                'center': [sum(p[k] for p in pts) / len(pts) for k in range(3)]}
        dd_dir, vina, name, has_traj = d / 'diffdock' / pdb, d / 'vina_s1.pdbqt', entry['comp'], False
    return {**base, 'pdb': pdb, 'ligand': name, 'has_traj': has_traj,
            'diffdock': _read_poses(dd_dir.glob('rank*.sdf'), ref), 'vina': _vina_poses(vina, ref)}


def diffdock_vis(pdb, rank):
    f = ROOT / 'results' / 'diffdock' / pdb / f'rank{int(rank)}_reverseprocess.pdb'
    if not f.is_file():
        return {'frames': None}
    # DiffDock's trajectory file: MODEL 1 is the reference conformer, MODEL 2 the input pose; the rest are
    # reverse-diffusion steps. Hydrogens are not moved by the sampler (they stay at the reference position), so drop them.
    models = [m for m in f.read_text().split('ENDMDL') if 'MODEL' in m][2:]
    out = []
    for m in models:
        atoms = [l for l in m.splitlines() if l.startswith(('ATOM', 'HETATM')) and l[76:78].strip().upper() != 'H']
        out.append('MODEL\n' + '\n'.join(atoms) + '\nENDMDL')
    return {'frames': '\n'.join(out) + '\nEND\n'}


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


def live():
    return {'jobs': running_jobs(), 'gpu': gpu_stats(), 'logs': log_tails()}


def activity(limit=10):
    now = time.time()
    rows = sorted(watched_files(), key=lambda f: f.stat().st_mtime, reverse=True)[:limit]
    return [{'file': str(f.relative_to(ROOT)), 'age': int(now - f.stat().st_mtime),
             'kb': round(f.stat().st_size / 1024, 1)} for f in rows]


def redocking_payload():
    docked = ROOT / 'results' / 'redocking' / 'erlotinib_docked.pdbqt'
    return _redocking_payload(docked.stat().st_mtime if docked.is_file() else 0)


@lru_cache(maxsize=2)
def _redocking_payload(_mtime):
    docked = ROOT / 'results' / 'redocking' / 'erlotinib_docked.pdbqt'
    table = ROOT / 'results' / 'redocking_rmsd.csv'
    if not (docked.is_file() and table.is_file() and (ROOT / 'data' / '1M17.pdb').is_file()):
        return None
    rd = load_script('04b_redocking')
    ref = Chem.RemoveHs(rd.crystal_ligand(ROOT / 'data' / '1M17.pdb'))
    pts = [tuple(ref.GetConformer().GetAtomPosition(i)) for i in range(ref.GetNumAtoms())]
    lines = [l for l in (ROOT / 'data' / 'egfr_protein_provisional.pdb').read_text().splitlines()
             if l.startswith('ATOM')]
    near = {l[21:27] for l in lines
            if min(math.dist(tuple(float(l[i:i + 8]) for i in (30, 38, 46)), p) for p in pts) <= 10}
    df = pd.read_csv(table)
    poses = RDKitMolCreate.from_pdbqt_mol(PDBQTMolecule.from_file(str(docked), skip_typing=True))[0]
    out = []
    for i, conf in enumerate(poses.GetConformers()):
        m = Chem.Mol(poses); m.RemoveAllConformers(); m.AddConformer(Chem.Conformer(conf), assignId=True)
        out.append({'pose': int(df.pose[i]), 'score': float(df.vina_score_kcal_mol[i]),
                    'rmsd': float(df.rmsd_to_crystal_A[i]), 'mol': Chem.MolToMolBlock(Chem.RemoveHs(m))})
    return {'protein': '\n'.join(lines) + '\nEND\n', 'pocket_resi': sorted({int(k[1:5]) for k in near}),
            'crystal': Chem.MolToMolBlock(ref), 'poses': out}


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


def api_data():
    rows, done = sweep_rows()
    mrows, mdone = multi_rows()
    return {'blind': blind_payload(), 'diffdock': diffdock_rows(), 'activity': activity(), 'jobs': running_jobs(), 'multi': {'rows': mrows, 'done': mdone, 'total': MULTI_TOTAL}, 'steps': steps(), 'redocking': redocking_payload(), 'sweep': {'rows': rows, 'done': done, 'total': SWEEP_TOTAL},
            'docking': docking_rows()}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body: bytes, ctype: str):
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ('/', '/index.html'):
            return self._send(200, (HERE / 'index.html').read_bytes(), 'text/html; charset=utf-8')
        if path == '/api/diffdock_vis':
            from urllib.parse import parse_qs, urlparse
            q = parse_qs(urlparse(self.path).query)
            pdb = ''.join(c for c in q.get('pdb', ['1M17'])[0] if c.isalnum())
            rank = q.get('rank', ['1'])[0]
            return self._send(200, json.dumps(diffdock_vis(pdb, rank if rank.isdigit() else 1)).encode(), 'application/json')
        if path == '/api/complex':
            from urllib.parse import parse_qs, urlparse
            pdb = ''.join(c for c in parse_qs(urlparse(self.path).query).get('pdb', ['1M17'])[0] if c.isalnum())
            return self._send(200, json.dumps(complex_payload(pdb)).encode(), 'application/json')
        if path == '/api/cx':
            from urllib.parse import parse_qs, urlparse
            pdb = ''.join(c for c in parse_qs(urlparse(self.path).query).get('pdb', ['1M17'])[0] if c.isalnum())
            return self._send(200, json.dumps(cx_payload(pdb)).encode(), 'application/json')
        if path == '/api/live':
            return self._send(200, json.dumps(live()).encode(), 'application/json')
        if path == '/api/version':
            return self._send(200, json.dumps(version()).encode(), 'application/json')
        if path == '/api/data':
            return self._send(200, json.dumps(api_data()).encode(), 'application/json')
        if path.startswith('/figures/'):
            f = (ROOT / 'figures' / Path(path).name)
            if f.is_file():
                return self._send(200, f.read_bytes(), mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
        self._send(404, b'not found', 'text/plain')

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'Painel em http://localhost:{PORT}  (Ctrl+C para parar)', flush=True)
    server.serve_forever()
