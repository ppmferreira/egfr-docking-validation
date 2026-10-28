"""Dock the enrichment library (actives, experimental inactives, decoys) into one validated EGFR receptor with Vina.

Receptor: 9BY4 (EGFR kinase domain, wild-type sequence, 2.31 A, non-covalent osimertinib), chosen by a rule fixed beforehand:
wild-type sequence, Vina correct in 3/3 seeds in the blind redocking test, receptor prepared without dropping residues,
best resolution. Box: 20 A centred on the crystal ligand (the protocol validated in REPORT.md).
Vina: exhaustiveness 8, one seed (42), best-pose score recorded. The ligand order is shuffled (seed 42) so a partial
run is an unbiased sample. Results are appended per ligand to results/enrichment_scores.csv; reruns resume.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
import subprocess
import tempfile
import threading
import time
import pandas as pd
from rdkit import Chem
from rdkit.Chem import AllChem
from meeko import MoleculePreparation, PDBQTWriterLegacy

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'enrichment'
OUT = ROOT / 'results' / 'enrichment_scores.csv'
RECEPTOR = ROOT / 'results' / 'blind' / '9BY4' / 'receptor.pdbqt'
LOCK = threading.Lock()


def box_from_crystal():
    f = DATA / 'box_9BY4.json'
    if f.is_file():
        return json.loads(f.read_text())
    pts = []
    for l in (ROOT / 'data' / 'blind' / '9BY4.pdb').read_text().splitlines():
        if l.startswith('HETATM') and l[17:20].strip() == 'Q6K' and l[21] == 'A' and l[16].strip() in ('', 'A') \
                and l[76:78].strip().upper() not in ('H', 'D'):
            pts.append((float(l[30:38]), float(l[38:46]), float(l[46:54])))
    c = [round(sum(p[k] for p in pts) / len(pts), 3) for k in range(3)]
    box = {'center': c, 'size': 20, 'ligand_atoms': len(pts)}
    f.write_text(json.dumps(box)); return box


def score_ligand(row, box, cpu, work):
    mol = Chem.AddHs(Chem.MolFromSmiles(row['smiles']))
    p = AllChem.ETKDGv3(); p.randomSeed = 42
    if AllChem.EmbedMolecule(mol, p) != 0:
        p.useRandomCoords = True
        if AllChem.EmbedMolecule(mol, p) != 0:
            return {'status': 'embed_failed'}
    if AllChem.MMFFHasAllMoleculeParams(mol):
        AllChem.MMFFOptimizeMolecule(mol, maxIters=500)
    setups = MoleculePreparation().prepare(mol)
    pdbqt, ok, err = PDBQTWriterLegacy.write_string(setups[0])
    if not ok:
        return {'status': f'meeko_failed: {err[:60]}'}
    lig, res = work / f'{row["uid"]}.pdbqt', work / f'{row["uid"]}_out.pdbqt'
    lig.write_text(pdbqt)
    c = box['center']
    try:
        subprocess.run(['vina', '--receptor', str(RECEPTOR), '--ligand', str(lig), '--center_x', str(c[0]), '--center_y', str(c[1]),
                        '--center_z', str(c[2]), '--size_x', '20', '--size_y', '20', '--size_z', '20', '--out', str(res),
                        '--seed', '42', '--exhaustiveness', '8', '--num_modes', '3', '--cpu', str(cpu)],
                       check=True, capture_output=True, text=True, timeout=900)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        return {'status': f'vina_failed: {str(exc)[:60]}'}
    m = re.search(r'REMARK VINA RESULT:\s+(-?\d+\.\d+)', res.read_text())
    for f in (lig, res):
        f.unlink(missing_ok=True)
    return {'status': 'ok', 'vina_score': float(m.group(1))} if m else {'status': 'no_score'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=3)
    ap.add_argument('--cpu', type=int, default=4)
    ap.add_argument('--limit', type=int, help='dock only the first N ligands of the shuffled list (for a test)')
    args = ap.parse_args()
    parts = [pd.read_csv(DATA / 'chembl_actives_inactives.csv'), pd.read_csv(DATA / 'decoys.csv')]
    lib = pd.concat(parts, ignore_index=True)
    lib['uid'] = lib.label + '_' + lib.chembl_id.astype(str)
    lib = lib.sample(frac=1, random_state=42).reset_index(drop=True)
    done = set(pd.read_csv(OUT).uid) if OUT.is_file() else set()
    todo = lib[~lib.uid.isin(done)]
    if args.limit:
        todo = todo.head(args.limit)
    box = box_from_crystal()
    work = Path(tempfile.mkdtemp(prefix='enrich_'))
    print(f'{len(lib)} ligands; {len(done)} done; docking {len(todo)} with {args.workers} workers x {args.cpu} cpu', flush=True)
    t0, n = time.time(), [0]

    def job(r):
        row = r._asdict() if hasattr(r, '_asdict') else dict(r)
        try:
            res = score_ligand(row, box, args.cpu, work)
        except Exception as exc:
            res = {'status': f'error: {str(exc)[:60]}'}
        rec = {'uid': row['uid'], 'chembl_id': row['chembl_id'], 'label': row['label'], 'smiles': row['smiles'],
               'heavy_atoms': row['heavy_atoms'], 'MW': row['MW'], 'logP': row['logP'], 'RotB': row['RotB'], **res}
        with LOCK:
            pd.DataFrame([rec]).to_csv(OUT, mode='a', header=not OUT.is_file(), index=False)
            n[0] += 1
            print(f'[{n[0]}/{len(todo)}] {rec["uid"]} {rec.get("vina_score", rec["status"])}  ({(time.time() - t0) / n[0]:.1f} s each)', flush=True)

    with ThreadPoolExecutor(args.workers) as ex:
        list(ex.map(job, todo.itertuples(index=False)))
    print('ENRICH_DOCK_DONE', flush=True)


if __name__ == '__main__':
    main()
