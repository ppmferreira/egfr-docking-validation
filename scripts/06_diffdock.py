"""Redocking with DiffDock on the same EGFR complexes used for Vina (see 04d_redock_multi.py).

DiffDock runs in its own conda env (diffdock). Poses are scored against the crystal ligand with the same
symmetry-aware heavy-atom RMSD as the Vina experiments, so the two methods are directly comparable.
DiffDock is blind docking: it receives the protein and the SMILES, with no pocket or box.
"""
from __future__ import annotations
import argparse
import importlib.util
import os
from pathlib import Path
import re
import subprocess
import pandas as pd
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolAlign

ROOT = Path(__file__).resolve().parents[1]
DIFFDOCK = ROOT.parent / 'tools' / 'DiffDock'
DD_PYTHON = Path.home() / 'miniforge3' / 'envs' / 'diffdock' / 'bin' / 'python'

spec = importlib.util.spec_from_file_location('multi', ROOT / 'scripts' / '04d_redock_multi.py')
multi = importlib.util.module_from_spec(spec); spec.loader.exec_module(multi)


def crystal_ligand(pdb_id: str):
    code, name, smiles = multi.COMPLEXES[pdb_id]
    text = (ROOT / 'data' / 'complexes' / f'{pdb_id}.pdb').read_text()
    _, lig = multi.split_complex(text, code)
    pose = Chem.MolFromPDBBlock('\n'.join(lig) + '\nEND\n', removeHs=True, sanitize=False)
    return Chem.RemoveHs(AllChem.AssignBondOrdersFromTemplate(Chem.MolFromSmiles(smiles), pose))


def run_diffdock(pdb_id: str, samples: int, batch: int, out: Path, vis: bool = False):
    code, name, smiles = multi.COMPLEXES[pdb_id]
    protein = ROOT / 'results' / 'redocking_multi' / f'{pdb_id}_receptor.pdb'
    if not protein.is_file():
        raise SystemExit(f'{protein} missing; run scripts/04d_redock_multi.py first')
    out.mkdir(parents=True, exist_ok=True)
    cmd = [str(DD_PYTHON), 'inference.py', '--config', 'default_inference_args.yaml',
           '--protein_path', str(protein), '--ligand', smiles, '--out_dir', str(out),
           '--complex_name', pdb_id, '--samples_per_complex', str(samples), '--batch_size', str(batch)]
    if vis:
        cmd.append('--save_visualisation')  # writes rankN_reverseprocess.pdb: every diffusion step
    log = out / f'{pdb_id}.log'
    with log.open('w') as fh:
        # Unbuffered so the dashboard's live tab shows progress while DiffDock runs.
        subprocess.run(cmd, cwd=DIFFDOCK, check=True, stdout=fh, stderr=subprocess.STDOUT,
                       env={**os.environ, 'PYTHONUNBUFFERED': '1'})


def score_poses(pdb_id: str, out: Path):
    ref = crystal_ligand(pdb_id)
    rows, seen = [], set()
    # DiffDock writes rankN.sdf (best-first copy) and rankN_confidenceX.sdf; keep the one with confidence.
    files = sorted(out.glob(f'{pdb_id}/rank*.sdf'), key=lambda f: '_confidence' not in f.name)
    for sdf in files:
        m = re.match(r'rank(\d+)(?:_confidence(-?[\d.]+))?\.sdf', sdf.name)
        if not m or int(m.group(1)) in seen:
            continue
        seen.add(int(m.group(1)))
        mol = Chem.MolFromMolFile(str(sdf), removeHs=True)
        if mol is None:
            continue
        rows.append({'pdb': pdb_id, 'ligand': multi.COMPLEXES[pdb_id][1], 'rank': int(m.group(1)),
                     'confidence': float(m.group(2)) if m.group(2) else None,
                     'rmsd': round(rdMolAlign.CalcRMS(mol, ref), 2)})
    return sorted(rows, key=lambda r: r['rank'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', nargs='+', default=list(multi.COMPLEXES))
    ap.add_argument('--samples', type=int, default=10)
    ap.add_argument('--batch', type=int, default=5)
    ap.add_argument('--vis', action='store_true', help='also save the reverse-diffusion trajectory of each pose')
    ap.add_argument('--score-only', action='store_true', help='skip DiffDock, only score existing poses')
    args = ap.parse_args()
    out = ROOT / 'results' / 'diffdock'
    allrows = []
    for pdb_id in args.only:
        if not args.score_only:
            print(f'{pdb_id}: running DiffDock ({args.samples} samples)...', flush=True)
            run_diffdock(pdb_id, args.samples, args.batch, out, args.vis)
        rows = score_poses(pdb_id, out)
        allrows += rows
        if rows:
            best = min(rows, key=lambda r: r['rmsd'])
            print(f'{pdb_id}: top-ranked RMSD {rows[0]["rmsd"]} A; best RMSD {best["rmsd"]} A (rank {best["rank"]})', flush=True)
    pd.DataFrame(allrows).to_csv(ROOT / 'results' / 'diffdock_results.csv', index=False)
    print('Saved results/diffdock_results.csv')


if __name__ == '__main__':
    main()
