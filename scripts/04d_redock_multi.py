"""Redocking in several EGFR complexes to test whether a protocol generalizes beyond 1M17.

Each complex: download PDB, keep protein chain A (altloc A, no waters/HETATM), rebuild the
co-crystal ligand from SMILES, dock from a fresh conformer, compute symmetry-aware heavy-atom
RMSD to the crystal pose. Protocol parameters are fixed before looking at results.
"""
from __future__ import annotations
import argparse
import math
from pathlib import Path
import subprocess
import pandas as pd
import requests
from rdkit import Chem
from rdkit.Chem import AllChem, rdMolAlign
from meeko import PDBQTMolecule, RDKitMolCreate

ROOT = Path(__file__).resolve().parents[1]
COMPLEXES = {
    '1M17': ('AQ4', 'erlotinib', 'COCCOc1cc2ncnc(Nc3cccc(c3)C#C)c2cc1OCCOC'),
    '4WKQ': ('IRE', 'gefitinib', 'COc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCCN1CCOCC1'),
    '1XKK': ('FMM', 'lapatinib', 'CS(=O)(=O)CCNCc1ccc(o1)-c1ccc2ncnc(Nc3ccc(OCc4cccc(F)c4)c(Cl)c3)c2c1'),
}


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def fetch(pdb_id: str, folder: Path) -> str:
    f = folder / f'{pdb_id}.pdb'
    if not f.is_file():
        r = requests.get(f'https://files.rcsb.org/download/{pdb_id}.pdb', timeout=60)
        r.raise_for_status(); f.write_text(r.text)
    return f.read_text()


def split_complex(text: str, code: str):
    prot, lig = [], []
    for l in text.splitlines():
        if l.startswith('ATOM  ') and l[21] == 'A' and l[16].strip() in ('', 'A'):
            prot.append(l)
        elif l.startswith('HETATM') and l[17:20].strip() == code and l[21] == 'A' and l[16].strip() in ('', 'A'):
            if l[76:78].strip().upper() not in ('H', 'D'):
                lig.append(l)
    return prot, lig


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--boxes', type=float, nargs='+', default=[20, 22])
    ap.add_argument('--exhaustiveness', type=int, default=32)
    ap.add_argument('--seeds', type=int, nargs='+', default=[1, 2, 3])
    ap.add_argument('--cpu', type=int, default=12)
    args = ap.parse_args()
    out = ROOT / 'results' / 'redocking_multi'; out.mkdir(parents=True, exist_ok=True)
    data = ROOT / 'data' / 'complexes'; data.mkdir(parents=True, exist_ok=True)
    rows = []
    for pdb_id, (code, name, smiles) in COMPLEXES.items():
        text = fetch(pdb_id, data)
        prot, lig = split_complex(text, code)
        template = Chem.MolFromSmiles(smiles)
        pose = Chem.MolFromPDBBlock('\n'.join(lig) + '\nEND\n', removeHs=True, sanitize=False)
        ref = Chem.RemoveHs(AllChem.AssignBondOrdersFromTemplate(template, pose))
        pts = [tuple(ref.GetConformer().GetAtomPosition(i)) for i in range(ref.GetNumAtoms())]
        center = [sum(p[k] for p in pts) / len(pts) for k in range(3)]
        rec_pdb = out / f'{pdb_id}_receptor.pdb'
        rec_pdb.write_text('\n'.join(prot) + '\nTER\nEND\n')
        rec = out / f'{pdb_id}_receptor.pdbqt'
        base = ['mk_prepare_receptor.py', '--read_pdb', str(rec_pdb), '--write_pdbqt', str(rec),
                '--default_altloc', 'A']
        try:
            run(base)
        except subprocess.CalledProcessError:
            # Residues with missing atoms/chain breaks are dropped by Meeko; they must be far from the pocket.
            print(f'{pdb_id}: strict receptor preparation failed; retrying with --allow_bad_res', flush=True)
            run(base + ['--allow_bad_res'])
        mol = Chem.AddHs(Chem.MolFromSmiles(smiles))
        p = AllChem.ETKDGv3(); p.randomSeed = 42
        AllChem.EmbedMolecule(mol, p); AllChem.MMFFOptimizeMolecule(mol, maxIters=500)
        mol.SetProp('_Name', name)
        sdf = out / f'{pdb_id}_{name}.sdf'
        w = Chem.SDWriter(str(sdf)); w.write(mol); w.close()
        lig_q = out / f'{pdb_id}_{name}.pdbqt'
        run(['mk_prepare_ligand.py', '-i', str(sdf), '-o', str(lig_q)])
        for box in args.boxes:
            for seed in args.seeds:
                res = out / f'{pdb_id}_b{int(box)}_s{seed}.pdbqt'
                run(['vina', '--receptor', str(rec), '--ligand', str(lig_q),
                     '--center_x', f'{center[0]:.3f}', '--center_y', f'{center[1]:.3f}', '--center_z', f'{center[2]:.3f}',
                     '--size_x', str(box), '--size_y', str(box), '--size_z', str(box),
                     '--out', str(res), '--seed', str(seed), '--exhaustiveness', str(args.exhaustiveness),
                     '--num_modes', '9', '--cpu', str(args.cpu)])
                scores = [float(l.split()[3]) for l in res.read_text().splitlines() if l.startswith('REMARK VINA RESULT')]
                poses = RDKitMolCreate.from_pdbqt_mol(PDBQTMolecule.from_file(str(res), skip_typing=True))[0]
                rmsds = []
                for conf in poses.GetConformers():
                    m = Chem.Mol(poses); m.RemoveAllConformers(); m.AddConformer(Chem.Conformer(conf), assignId=True)
                    rmsds.append(rdMolAlign.CalcRMS(Chem.RemoveHs(m), ref))
                rows.append({'pdb': pdb_id, 'ligand': name, 'box_A': int(box), 'seed': seed,
                             'top_score': scores[0], 'top_rmsd': round(rmsds[0], 2),
                             'best_rmsd': round(min(rmsds), 2), 'best_rank': rmsds.index(min(rmsds)) + 1,
                             'top_pass': rmsds[0] <= 2.0})
                print(rows[-1], flush=True)
    df = pd.DataFrame(rows)
    df.to_csv(ROOT / 'results' / 'redocking_multi.csv', index=False)
    summary = df.groupby(['pdb', 'ligand', 'box_A']).agg(
        mean_top_rmsd=('top_rmsd', 'mean'), top_pass=('top_pass', 'sum'), n=('seed', 'size'),
        mean_best_rmsd=('best_rmsd', 'mean'), mean_best_rank=('best_rank', 'mean')).round(2)
    summary.to_csv(ROOT / 'results' / 'redocking_multi_summary.csv')
    print(summary.to_string())


if __name__ == '__main__':
    main()
