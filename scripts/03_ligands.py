"""Generate approximate initial 3D conformers for Vina/Meeko ligand preparation.

The chosen protonation/tautomer state is not necessarily appropriate for binding.
"""
from __future__ import annotations
from pathlib import Path
import pandas as pd
from rdkit import Chem
from rdkit.Chem import AllChem

ROOT = Path(__file__).resolve().parents[1]


def make_sdf(smiles: str, name: str, path: Path):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError('Invalid SMILES')
    mol = Chem.AddHs(mol)
    params = AllChem.ETKDGv3()
    params.randomSeed = 42
    status = AllChem.EmbedMolecule(mol, params)
    if status != 0:
        raise RuntimeError('3D embedding failed')
    if AllChem.MMFFHasAllMoleculeParams(mol):
        AllChem.MMFFOptimizeMolecule(mol, maxIters=250)
    else:
        AllChem.UFFOptimizeMolecule(mol, maxIters=250)
    mol.SetProp('_Name', str(name))
    writer = Chem.SDWriter(str(path))
    writer.write(mol)
    writer.close()
    return mol


def main():
    shortlist_file = ROOT / 'results' / 'docking_shortlist.csv'
    if not shortlist_file.exists():
        raise SystemExit('Run scripts/02_chembl.py first')
    df = pd.read_csv(shortlist_file)
    outdir = ROOT / 'data' / 'ligands_sdf'
    outdir.mkdir(parents=True, exist_ok=True)
    failures = []
    count = 0
    for row in df.itertuples():
        try:
            make_sdf(row.smiles, row.chembl_id, outdir / f'{row.chembl_id}.sdf')
            count += 1
        except Exception as exc:
            failures.append((row.chembl_id, str(exc)))
    print(f'Created {count} 3D conformers in {outdir}')
    for name, reason in failures:
        print(f'FAILED {name}: {reason}')
    print('Review protonation, stereochemistry and tautomer states before interpreting docking.')


if __name__ == '__main__':
    main()
