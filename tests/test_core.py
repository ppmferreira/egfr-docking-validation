"""Offline smoke tests without requesting remote PDB/ChEMBL resources."""
from __future__ import annotations
import importlib.util
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def load(script):
    path = ROOT / 'scripts' / script
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_chembl_descriptor():
    mod = load('02_chembl.py')
    sample = {'standard_type': 'IC50', 'standard_units': 'nM', 'standard_relation': '=',
              'target_organism': 'Homo sapiens', 'target_chembl_id': 'CHEMBL203',
              'molecule_chembl_id': 'CHEMBLDEMO', 'canonical_smiles': 'CCO',
              'standard_value': '100'}
    # Molecules with <6 heavy atoms must be filtered.
    assert mod.describe_record(sample) is None
    sample['canonical_smiles'] = 'CC(=O)Oc1ccccc1C(=O)O'
    row = mod.describe_record(sample)
    assert row and abs(row['pIC50'] - 7) < 1e-8
    sample['standard_relation'] = '>'
    assert mod.describe_record(sample) is None


def test_smiles_to_3d():
    mod = load('03_ligands.py')
    with tempfile.TemporaryDirectory() as td:
        file = Path(td) / 'test.sdf'
        mol = mod.make_sdf('CC(=O)Oc1ccccc1C(=O)O', 'demo', file)
        assert file.exists() and mol.GetNumConformers() == 1


def test_pdbqt_score():
    mod = load('04_docking.py')
    with tempfile.TemporaryDirectory() as td:
        file = Path(td) / 'test.pdbqt'
        file.write_text('REMARK VINA RESULT: -7.3 0.00 0.00\n')
        assert mod.first_score(file) == -7.3


if __name__ == '__main__':
    test_chembl_descriptor()
    test_smiles_to_3d()
    test_pdbqt_score()
    print('All offline smoke tests passed.')
