"""Sweep redocking protocol variables (box size, exhaustiveness, crystallographic waters).

Reuses the chemistry/RMSD logic of 04b_redocking.py. Each configuration is run with several
Vina seeds because single-seed results are noisy. Exploratory protocol tuning on one complex:
passing here does not prove generalization to other ligands.
"""
from __future__ import annotations
import argparse
import importlib.util
import math
from pathlib import Path
import subprocess
import pandas as pd
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolAlign
from meeko import PDBQTMolecule, RDKitMolCreate

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('redock', ROOT / 'scripts' / '04b_redocking.py')
redock = importlib.util.module_from_spec(spec); spec.loader.exec_module(redock)


def build_receptor(pdb_text: str, ligand_xyz, waters: str, outdir: Path) -> Path:
    """waters: 'none' | 'near' (chain A HOH within 6 A of AQ4) | 'all' (chain A HOH)."""
    lines = []
    for l in pdb_text.splitlines():
        if l.startswith('ATOM  ') and l[21] == 'A' and l[16].strip() in ('', 'A'):
            lines.append(l)
        elif l.startswith('HETATM') and l[17:20] == 'HOH' and l[21] == 'A' and l[16].strip() in ('', 'A'):
            if waters == 'all':
                lines.append(l)
            elif waters == 'near':
                xyz = tuple(float(l[i:i + 8]) for i in (30, 38, 46))
                if any(math.dist(xyz, p) <= 6.0 for p in ligand_xyz):
                    lines.append(l)
    pdb = outdir / f'receptor_{waters}.pdb'
    pdb.write_text('\n'.join(lines) + '\nTER\nEND\n')
    pdbqt = outdir / f'receptor_{waters}.pdbqt'
    subprocess.run(['mk_prepare_receptor.py', '--read_pdb', str(pdb), '--write_pdbqt', str(pdbqt),
                    '--default_altloc', 'A'], check=True, capture_output=True, text=True)
    return pdbqt


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--seeds', type=int, nargs='+', default=[1, 2, 3])
    ap.add_argument('--cpu', type=int, default=12)
    args = ap.parse_args()
    data, results = ROOT / 'data', ROOT / 'results'
    outdir = results / 'redocking_sweep'; outdir.mkdir(parents=True, exist_ok=True)
    pdb_text = (data / '1M17.pdb').read_text()
    ref = Chem.RemoveHs(redock.crystal_ligand(data / '1M17.pdb'))
    lig_xyz = [tuple(ref.GetConformer().GetAtomPosition(i)) for i in range(ref.GetNumAtoms())]
    center = {k: float(v) for k, v in (l.split(' = ') for l in (data / 'egfr_box.txt').read_text().splitlines()
                                       if l.startswith('center'))}
    # Ligand input: same fresh conformer as 04b (not the crystal pose).
    lig = Chem.AddHs(Chem.MolFromSmiles(redock.ERLOTINIB_SMILES))
    p = AllChem.ETKDGv3(); p.randomSeed = 42
    AllChem.EmbedMolecule(lig, p); AllChem.MMFFOptimizeMolecule(lig, maxIters=500)
    lig.SetProp('_Name', 'erlotinib')
    sdf = outdir / 'erlotinib_input.sdf'
    w = Chem.SDWriter(str(sdf)); w.write(lig); w.close()
    lig_pdbqt = outdir / 'erlotinib.pdbqt'
    redock.run(['mk_prepare_ligand.py', '-i', str(sdf), '-o', str(lig_pdbqt)])

    receptors = {}
    for wat in ('none', 'near', 'all'):
        try:
            receptors[wat] = build_receptor(pdb_text, lig_xyz, wat, outdir)
        except subprocess.CalledProcessError as exc:
            print(f'Receptor with waters={wat} failed to prepare: {(exc.stderr or exc.stdout)[-300:]}')

    configs = [(w, s, e) for w in ('none',) for s in (16, 20, 22, 26) for e in (8, 32, 64)]
    configs += [(w, 22, 32) for w in ('near', 'all') if w in receptors]
    rows = []
    for waters, size, exh in configs:
        for seed in args.seeds:
            out = outdir / f'{waters}_b{size}_e{exh}_s{seed}.pdbqt'
            cmd = ['vina', '--receptor', str(receptors[waters]), '--ligand', str(lig_pdbqt),
                   '--center_x', str(center['center_x']), '--center_y', str(center['center_y']),
                   '--center_z', str(center['center_z']), '--size_x', str(size), '--size_y', str(size),
                   '--size_z', str(size), '--out', str(out), '--seed', str(seed),
                   '--exhaustiveness', str(exh), '--num_modes', '9', '--cpu', str(args.cpu)]
            redock.run(cmd)
            scores = [float(l.split()[3]) for l in out.read_text().splitlines()
                      if l.startswith('REMARK VINA RESULT')]
            poses = RDKitMolCreate.from_pdbqt_mol(PDBQTMolecule.from_file(str(out), skip_typing=True))[0]
            rmsds = []
            for conf in poses.GetConformers():
                m = Chem.Mol(poses); m.RemoveAllConformers()
                m.AddConformer(Chem.Conformer(conf), assignId=True)
                rmsds.append(rdMolAlign.CalcRMS(Chem.RemoveHs(m), ref))
            rows.append({'waters': waters, 'box_A': size, 'exhaustiveness': exh, 'seed': seed,
                         'top_score': scores[0], 'top_rmsd': round(rmsds[0], 2),
                         'best_rmsd': round(min(rmsds), 2), 'best_rank': rmsds.index(min(rmsds)) + 1,
                         'top_pass': rmsds[0] <= 2.0})
            print(rows[-1], flush=True)
    df = pd.DataFrame(rows)
    df.to_csv(results / 'redocking_sweep.csv', index=False)
    summary = df.groupby(['waters', 'box_A', 'exhaustiveness']).agg(
        mean_top_rmsd=('top_rmsd', 'mean'), top_pass=('top_pass', 'sum'), n=('seed', 'size'),
        mean_best_rmsd=('best_rmsd', 'mean'), mean_best_rank=('best_rank', 'mean')).round(2)
    summary.to_csv(results / 'redocking_sweep_summary.csv')
    print(summary.to_string())


if __name__ == '__main__':
    main()
