"""Redocking validation: dock erlotinib (AQ4) back into 1M17 and compare to the crystal pose.

The ligand is rebuilt from SMILES (correct chemistry), embedded from a random conformer
(not the crystal coordinates), docked with Vina and compared to the crystallographic pose
by symmetry-aware heavy-atom RMSD without re-alignment (same receptor frame).
A commonly used working criterion is RMSD <= 2.0 A for the top-ranked pose.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import shutil
import subprocess
import pandas as pd
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolAlign
from meeko import PDBQTMolecule, RDKitMolCreate

ROOT = Path(__file__).resolve().parents[1]
# Erlotinib; used as chemistry template for the crystallographic AQ4 coordinates.
ERLOTINIB_SMILES = 'COCCOc1cc2ncnc(Nc3cccc(c3)C#C)c2cc1OCCOC'


def crystal_ligand(pdb_file: Path) -> Chem.Mol:
    lines = []
    for line in pdb_file.read_text().splitlines():
        if line.startswith('HETATM') and line[17:20].strip() == 'AQ4' and line[21] == 'A':
            if line[16].strip() in ('', 'A'):
                lines.append(line)
    template = Chem.MolFromSmiles(ERLOTINIB_SMILES)
    pose = Chem.MolFromPDBBlock('\n'.join(lines) + '\nEND\n', removeHs=True, sanitize=False)
    if pose is None:
        raise ValueError('Could not parse AQ4 from PDB')
    mol = AllChem.AssignBondOrdersFromTemplate(template, pose)
    Chem.SanitizeMol(mol)
    return mol


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--exhaustiveness', type=int, default=32)
    ap.add_argument('--seed', type=int, default=42)
    args = ap.parse_args()
    for program in ('vina', 'mk_prepare_ligand.py'):
        if not shutil.which(program):
            raise SystemExit(f'{program} not found on PATH')
    data, results = ROOT / 'data', ROOT / 'results'
    for f in ('1M17.pdb', 'egfr_receptor.pdbqt', 'egfr_box.txt'):
        if not (data / f).is_file():
            raise SystemExit(f'Missing data/{f}; run scripts 01 and receptor preparation first')
    outdir = results / 'redocking'; outdir.mkdir(parents=True, exist_ok=True)

    ref = crystal_ligand(data / '1M17.pdb')
    Chem.MolToMolFile(ref, str(outdir / 'erlotinib_crystal.mol'))

    # Fresh 3D conformer from SMILES with a random starting orientation (no crystal bias).
    lig = Chem.AddHs(Chem.MolFromSmiles(ERLOTINIB_SMILES))
    params = AllChem.ETKDGv3(); params.randomSeed = args.seed
    if AllChem.EmbedMolecule(lig, params) != 0:
        raise SystemExit('3D embedding failed')
    AllChem.MMFFOptimizeMolecule(lig, maxIters=500)
    lig.SetProp('_Name', 'erlotinib')
    sdf = outdir / 'erlotinib_input.sdf'
    w = Chem.SDWriter(str(sdf)); w.write(lig); w.close()

    pdbqt_in, pdbqt_out = outdir / 'erlotinib.pdbqt', outdir / 'erlotinib_docked.pdbqt'
    run(['mk_prepare_ligand.py', '-i', str(sdf), '-o', str(pdbqt_in)])
    run(['vina', '--receptor', str(data / 'egfr_receptor.pdbqt'), '--ligand', str(pdbqt_in),
         '--config', str(data / 'egfr_box.txt'), '--out', str(pdbqt_out),
         '--seed', str(args.seed), '--exhaustiveness', str(args.exhaustiveness),
         '--num_modes', '9', '--cpu', '4'])

    pm = PDBQTMolecule.from_file(str(pdbqt_out), skip_typing=True)
    mols = RDKitMolCreate.from_pdbqt_mol(pm)
    poses = mols[0]
    scores = [float(l.split()[3]) for l in pdbqt_out.read_text().splitlines()
              if l.startswith('REMARK VINA RESULT')]
    rows = []
    ref_h =Chem.RemoveHs(ref)
    for i, conf in enumerate(poses.GetConformers()):
        m = Chem.Mol(poses)
        m.RemoveAllConformers(); m.AddConformer(Chem.Conformer(conf), assignId=True)
        m = Chem.RemoveHs(m)
        rmsd = rdMolAlign.CalcRMS(m, ref_h)  # symmetry-aware, no alignment
        rows.append({'pose': i + 1, 'vina_score_kcal_mol': scores[i],
                     'rmsd_to_crystal_A': round(rmsd, 3)})
    df = pd.DataFrame(rows)
    df.to_csv(results / 'redocking_rmsd.csv', index=False)
    print(df.to_string(index=False))
    top = df.iloc[0]
    best = df.loc[df.rmsd_to_crystal_A.idxmin()]
    print(f'\nTop-ranked pose RMSD: {top.rmsd_to_crystal_A} A (criterion <= 2.0 A: '
          f'{"PASS" if top.rmsd_to_crystal_A <= 2.0 else "FAIL"})')
    print(f'Best RMSD among poses: {best.rmsd_to_crystal_A} A (pose {int(best.pose)})')
    print('Results: results/redocking_rmsd.csv, results/redocking/')


if __name__ == '__main__':
    main()
