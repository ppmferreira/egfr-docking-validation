"""Blind redocking test: Vina and DiffDock on EGFR complexes released after the DiffDock training data.

Complexes come from data/blind/selected.json (see 07_blind_select.py). Protocols were fixed beforehand:
  Vina:     box 20 A centred on the crystal ligand, exhaustiveness 32, seeds 1-3 (this gives Vina the pocket).
  DiffDock: blind docking, 10 samples, default settings (no pocket given).
RMSD is symmetry-aware, heavy atoms, no re-alignment. Results are appended per complex to results/blind_results.csv.
"""
from __future__ import annotations
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import pandas as pd
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolAlign
from meeko import PDBQTMolecule, RDKitMolCreate

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod


multi, dd = load('04d_redock_multi'), load('06_diffdock')
OUT = ROOT / 'results' / 'blind'
CSV = ROOT / 'results' / 'blind_results.csv'


def rmsd_to(ref, mol):
    return rdMolAlign.CalcRMS(Chem.RemoveHs(mol), ref)


def prepare(entry):
    pdb_id, comp, smiles = entry['pdb'], entry['comp'], entry['smiles']
    text = (ROOT / 'data' / 'blind' / f'{pdb_id}.pdb').read_text()
    prot, lig = multi.split_complex(text, comp)
    pose = Chem.MolFromPDBBlock('\n'.join(lig) + '\nEND\n', removeHs=True, sanitize=False)
    ref = Chem.RemoveHs(AllChem.AssignBondOrdersFromTemplate(Chem.MolFromSmiles(smiles), pose))
    pts = [tuple(ref.GetConformer().GetAtomPosition(i)) for i in range(ref.GetNumAtoms())]
    center = [sum(p[k] for p in pts) / len(pts) for k in range(3)]
    d = OUT / pdb_id; d.mkdir(parents=True, exist_ok=True)
    rec_pdb = d / 'receptor.pdb'; rec_pdb.write_text('\n'.join(prot) + '\nTER\nEND\n')
    return ref, center, rec_pdb, d


def run_vina(entry, ref, center, rec_pdb, d, seeds, cpu):
    rec = d / 'receptor.pdbqt'
    base = ['mk_prepare_receptor.py', '--read_pdb', str(rec_pdb), '--write_pdbqt', str(rec), '--default_altloc', 'A']
    try:
        multi.run(base)
    except subprocess.CalledProcessError:
        multi.run(base + ['--allow_bad_res'])
    mol = Chem.AddHs(Chem.MolFromSmiles(entry['smiles']))
    p = AllChem.ETKDGv3(); p.randomSeed = 42
    if AllChem.EmbedMolecule(mol, p) != 0:
        raise RuntimeError('3D embedding failed')
    AllChem.MMFFOptimizeMolecule(mol, maxIters=500)
    mol.SetProp('_Name', entry['comp'])
    sdf = d / 'ligand.sdf'
    w = Chem.SDWriter(str(sdf)); w.write(mol); w.close()
    lig_q = d / 'ligand.pdbqt'
    multi.run(['mk_prepare_ligand.py', '-i', str(sdf), '-o', str(lig_q)])
    rows = []
    for seed in seeds:
        res = d / f'vina_s{seed}.pdbqt'
        multi.run(['vina', '--receptor', str(rec), '--ligand', str(lig_q),
                   '--center_x', f'{center[0]:.3f}', '--center_y', f'{center[1]:.3f}', '--center_z', f'{center[2]:.3f}',
                   '--size_x', '20', '--size_y', '20', '--size_z', '20', '--out', str(res), '--seed', str(seed),
                   '--exhaustiveness', '32', '--num_modes', '9', '--cpu', str(cpu)])
        scores = [float(l.split()[3]) for l in res.read_text().splitlines() if l.startswith('REMARK VINA RESULT')]
        poses = RDKitMolCreate.from_pdbqt_mol(PDBQTMolecule.from_file(str(res), skip_typing=True))[0]
        rms = []
        for conf in poses.GetConformers():
            m = Chem.Mol(poses); m.RemoveAllConformers(); m.AddConformer(Chem.Conformer(conf), assignId=True)
            rms.append(rmsd_to(ref, m))
        rows.append({'method': 'vina', 'run': seed, 'top_rmsd': round(rms[0], 2), 'best_rmsd': round(min(rms), 2),
                     'best_rank': rms.index(min(rms)) + 1, 'score': scores[0]})
    return rows


def run_diffdock(entry, ref, rec_pdb, d):
    out = d / 'diffdock'; out.mkdir(exist_ok=True)
    cmd = [str(dd.DD_PYTHON), 'inference.py', '--config', 'default_inference_args.yaml', '--protein_path', str(rec_pdb),
           '--ligand', entry['smiles'], '--out_dir', str(out), '--complex_name', entry['pdb'],
           '--samples_per_complex', '10', '--batch_size', '5']
    with (d / 'diffdock.log').open('w') as fh:
        subprocess.run(cmd, cwd=dd.DIFFDOCK, check=True, stdout=fh, stderr=subprocess.STDOUT,
                       env={**__import__('os').environ, 'PYTHONUNBUFFERED': '1'})
    import re
    seen, rms = set(), []
    for sdf in sorted((out / entry['pdb']).glob('rank*.sdf'), key=lambda f: '_confidence' not in f.name):
        m = re.match(r'rank(\d+)(?:_confidence(-?[\d.]+))?\.sdf', sdf.name)
        if not m or int(m.group(1)) in seen:
            continue
        seen.add(int(m.group(1)))
        mol = Chem.MolFromMolFile(str(sdf), removeHs=True)
        if mol is not None:
            rms.append((int(m.group(1)), round(rmsd_to(ref, mol), 2), float(m.group(2)) if m.group(2) else None))
    rms.sort()
    best = min(rms, key=lambda r: r[1])
    return [{'method': 'diffdock', 'run': 1, 'top_rmsd': rms[0][1], 'best_rmsd': best[1], 'best_rank': best[0],
             'score': rms[0][2]}]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', nargs='+')
    ap.add_argument('--seeds', type=int, nargs='+', default=[1, 2, 3])
    ap.add_argument('--cpu', type=int, default=8)
    args = ap.parse_args()
    sel = json.loads((ROOT / 'data' / 'blind' / 'selected.json').read_text())['selected']
    if args.only:
        sel = [e for e in sel if e['pdb'] in args.only]
    OUT.mkdir(parents=True, exist_ok=True)
    done = pd.read_csv(CSV) if CSV.is_file() else pd.DataFrame()
    for entry in sel:
        if len(done) and entry['pdb'] in set(done.pdb):
            print(f'{entry["pdb"]}: already done, skipping', flush=True); continue
        print(f'{entry["pdb"]} ({entry["comp"]}): preparing', flush=True)
        try:
            ref, center, rec_pdb, d = prepare(entry)
        except Exception as exc:
            print(f'{entry["pdb"]}: SKIPPED, could not build reference ligand: {exc}', flush=True)
            pd.DataFrame([{'pdb': entry['pdb'], 'ligand': entry['comp'], 'method': 'skipped', 'run': 0,
                           'note': str(exc)[:120]}]).to_csv(CSV, mode='a', header=not CSV.is_file(), index=False)
            continue
        rows = []
        for name, fn in (('vina', lambda: run_vina(entry, ref, center, rec_pdb, d, args.seeds, args.cpu)),
                         ('diffdock', lambda: run_diffdock(entry, ref, rec_pdb, d))):
            print(f'{entry["pdb"]}: running {name}', flush=True)
            try:
                rows += fn()
            except Exception as exc:
                print(f'{entry["pdb"]}: {name} FAILED: {exc}', flush=True)
                rows.append({'method': name + '_failed', 'run': 0, 'note': str(exc)[:120]})
        df = pd.DataFrame(rows).assign(pdb=entry['pdb'], ligand=entry['comp'])
        df.to_csv(CSV, mode='a', header=not CSV.is_file(), index=False)
        for r in rows:
            print(f'{entry["pdb"]} {r}', flush=True)
    print('BLIND_DONE', flush=True)


if __name__ == '__main__':
    main()
