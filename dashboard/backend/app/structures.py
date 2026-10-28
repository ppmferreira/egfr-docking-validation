"""3D payloads: protein, crystal ligand, DiffDock and Vina poses for one complex, built with RDKit and Meeko."""
from __future__ import annotations
import importlib.util
import json
import re
from functools import lru_cache
from pathlib import Path
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolAlign
from meeko import PDBQTMolecule, RDKitMolCreate
from .config import ROOT
from .results import diffdock_rows


def load_script(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / f'{name}.py')
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod


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


def _vina_poses(pdbqt, ref, seed):
    if not pdbqt.is_file():
        return []
    scores = [float(l.split()[3]) for l in pdbqt.read_text().splitlines() if l.startswith('REMARK VINA RESULT')]
    poses = RDKitMolCreate.from_pdbqt_mol(PDBQTMolecule.from_file(str(pdbqt), skip_typing=True))[0]
    out = []
    for i, conf in enumerate(poses.GetConformers()):
        m = Chem.Mol(poses); m.RemoveAllConformers(); m.AddConformer(Chem.Conformer(conf), assignId=True)
        m = Chem.RemoveHs(m)
        out.append({'seed': seed, 'pose': i + 1, 'score': scores[i], 'rmsd': round(rdMolAlign.CalcRMS(m, ref), 2), 'mol': Chem.MolToMolBlock(m)})
    return out


def cx_payload(pdb):
    """Cached per structure, re-read when a blind-test run writes new files into its folder."""
    d = ROOT / 'results' / 'blind' / pdb
    return _cx_payload(pdb, max((int(f.stat().st_mtime) for f in d.rglob('*') if f.is_file()), default=0) if d.is_dir() else 0)


@lru_cache(maxsize=16)
def _cx_payload(pdb, _sig):
    """Everything the Complexos view draws for one structure: protein, crystal ligand, all DiffDock poses and the
    Vina poses of every seed run (box 20 A). Works for the development complexes and for the blind-test ones."""
    if complex_payload(pdb) is not None:
        base = complex_payload(pdb)
        ref = load_script('06_diffdock').crystal_ligand(pdb)
        dd_dir = ROOT / 'results' / 'diffdock' / pdb
        vina_file = lambda seed: ROOT / 'results' / 'redocking_multi' / f'{pdb}_b20_s{seed}.pdbqt'
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
        dd_dir, name, has_traj = d / 'diffdock' / pdb, entry['comp'], False
        vina_file = lambda seed: d / f'vina_s{seed}.pdbqt'
    return {**base, 'pdb': pdb, 'ligand': name, 'has_traj': has_traj,
            'diffdock': _read_poses(dd_dir.glob('rank*.sdf'), ref), 'vina': [p for seed in (1, 2, 3) for p in _vina_poses(vina_file(seed), ref, seed)]}


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
