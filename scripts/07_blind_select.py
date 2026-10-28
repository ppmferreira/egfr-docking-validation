"""Select EGFR-inhibitor complexes for a blind redocking test (published after the DiffDock training data).

Rules are fixed before any docking is run and applied identically to every candidate in
data/blind/candidates.json (RCSB search: UniProt P00533, X-ray, released >= 2022-01-01, <= 2.8 A):
  1. Chain A has the hinge motif Gln-Leu-Met-Pro-Phe-Gly-Cys (ATP site marker).
  2. A non-polymer residue of chain A with 18-70 heavy atoms and no phosphorus (no nucleotides).
  3. That ligand makes a hinge hydrogen bond: an N or O atom within 3.5 A of the Met backbone N or O.
  4. Not covalently bound (no LINK record involving the ligand).
  5. One entry per ligand component id (best resolution kept).
Output: data/blind/selected.json with the chemistry template (SMILES from the PDB chemical component dictionary).
"""
from __future__ import annotations
import json
import math
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'blind'
THREE = ['GLN', 'LEU', 'MET', 'PRO', 'PHE', 'GLY', 'CYS']


def fetch_pdb(pdb_id: str) -> str:
    f = OUT / f'{pdb_id}.pdb'
    if not f.is_file():
        r = requests.get(f'https://files.rcsb.org/download/{pdb_id}.pdb', timeout=60)
        r.raise_for_status(); f.write_text(r.text)
    return f.read_text()


def ccd_smiles(comp: str):
    r = requests.get(f'https://data.rcsb.org/rest/v1/core/chemcomp/{comp}', timeout=30)
    r.raise_for_status()
    d = r.json()
    desc = d.get('rcsb_chem_comp_descriptor', {})
    smi = desc.get('SMILES_stereo') or desc.get('SMILES')
    return smi, d.get('chem_comp', {}).get('name'), d.get('chem_comp', {}).get('formula_weight')


def analyse(pdb_id: str):
    text = fetch_pdb(pdb_id)
    res_name, res_atoms = {}, {}
    order = []
    het = {}
    resolution = None
    linked = set()
    for l in text.splitlines():
        if l.startswith('REMARK   2 RESOLUTION'):
            try:
                resolution = float(l.split()[3])
            except (ValueError, IndexError):
                pass
        if l.startswith('LINK'):
            for a in (l[17:20].strip(), l[47:50].strip()):
                linked.add(a)
        if l.startswith('ATOM  ') and l[21] == 'A' and l[16].strip() in ('', 'A'):
            key = (int(l[22:26]), l[26].strip())
            if key not in res_name:
                res_name[key] = l[17:20]; order.append(key)
            res_atoms.setdefault(key, {})[l[12:16].strip()] = (float(l[30:38]), float(l[38:46]), float(l[46:54]))
        elif l.startswith('HETATM') and l[21] == 'A' and l[16].strip() in ('', 'A') and l[17:20].strip() != 'HOH':
            el = l[76:78].strip().upper()
            key = (l[17:20].strip(), int(l[22:26]))
            het.setdefault(key, []).append((el, (float(l[30:38]), float(l[38:46]), float(l[46:54]))))
    names = [res_name[k] for k in order]
    hinge = None
    for i in range(len(names) - len(THREE) + 1):
        if names[i:i + len(THREE)] == THREE:
            hinge = order[i + 2]; break
    if hinge is None:
        return None, 'no hinge motif in chain A'
    backbone = [res_atoms[hinge][a] for a in ('N', 'O') if a in res_atoms[hinge]]
    best = None
    for (comp, num), atoms in het.items():
        heavy = [a for a in atoms if a[0] not in ('H', 'D')]
        if not 18 <= len(heavy) <= 70 or any(a[0] == 'P' for a in heavy):
            continue
        if comp in linked:
            return None, f'{comp} covalently linked'
        hb = any(a[0] in ('N', 'O') and math.dist(a[1], b) <= 3.5 for a in heavy for b in backbone)
        if hb:
            best = (comp, num, len(heavy), hinge[0])
            break
    if best is None:
        return None, 'no ligand with hinge hydrogen bond'
    return {'pdb': pdb_id, 'comp': best[0], 'resnum': best[1], 'heavy_atoms': best[2], 'hinge_residue': best[3],
            'resolution': resolution}, None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ids = json.loads((OUT / 'candidates.json').read_text())
    kept, rejected = [], {}
    for pdb_id in ids:
        try:
            row, why = analyse(pdb_id)
        except (requests.RequestException, ValueError) as exc:
            row, why = None, f'error: {exc}'
        if row:
            kept.append(row)
        else:
            rejected[pdb_id] = why
    # one entry per ligand component, best resolution first
    best = {}
    for r in sorted(kept, key=lambda r: (r['resolution'] or 9)):
        best.setdefault(r['comp'], r)
    selected = []
    for comp, r in best.items():
        smi, name, mw = ccd_smiles(comp)
        r.update({'smiles': smi, 'name': name, 'mw': mw}); selected.append(r)
    (OUT / 'selected.json').write_text(json.dumps({'selected': selected, 'rejected': rejected}, indent=1))
    print(f'candidates {len(ids)}; with hinge H-bond ligand {len(kept)}; unique ligands {len(selected)}')
    from collections import Counter
    print('rejection reasons:', dict(Counter(rejected.values())))
    for r in selected:
        print(r['pdb'], r['comp'], r['heavy_atoms'], 'atoms', r['resolution'], 'A', (r['name'] or '')[:50])


if __name__ == '__main__':
    main()
