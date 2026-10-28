"""Download PDB 1M17 and build provisional receptor + box from crystallized AQ4.

This is NOT complete receptor preparation. See README.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]


def prepare_pdb(pdb_text: str, outdir: Path):
    ligand_points = []
    protein_lines = []
    for line in pdb_text.splitlines():
        if line.startswith('HETATM') and line[17:20].strip() == 'AQ4':
            alt = line[16].strip()
            element = line[76:78].strip().upper() if len(line) >= 78 else ''
            if alt not in ('', 'A') or element in ('H', 'D'):
                continue
            try:
                ligand_points.append(tuple(float(line[i:i+8]) for i in (30, 38, 46)))
            except ValueError:
                pass
        if line.startswith('ATOM  ') and line[21] == 'A':
            if line[16].strip() in ('', 'A'):
                protein_lines.append(line)
    if len(ligand_points) < 10:
        raise ValueError('AQ4 coordinates absent or incomplete in PDB 1M17.')
    if len(protein_lines) < 100:
        raise ValueError('Expected protein chain A missing in 1M17.')
    center = [round(sum(x[j] for x in ligand_points) / len(ligand_points), 3) for j in range(3)]
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / 'egfr_protein_provisional.pdb').write_text('\n'.join(protein_lines) + '\nTER\nEND\n')
    box = {f'center_{axis}': v for axis, v in zip('xyz', center)}
    box.update({f'size_{axis}': 22 for axis in 'xyz'})
    (outdir / 'egfr_box.txt').write_text('\n'.join(f'{k} = {v}' for k, v in box.items()) + '\n')
    meta = {'pdb_id': '1M17', 'bound_ligand': 'AQ4 (erlotinib)', 'ligand_atoms_used': len(ligand_points),
            'center_angstrom': center, 'box_size_angstrom': [22, 22, 22],
            'note': 'Provisional box centered on AQ4; receptor MUST be chemically prepared and protocol validated.'}
    (outdir / 'target_metadata.json').write_text(json.dumps(meta, indent=2))
    return meta


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--pdb', type=Path, help='Use an already downloaded PDB (for offline use).')
    args = p.parse_args()
    out = ROOT / 'data'
    out.mkdir(exist_ok=True)
    if args.pdb:
        raw = args.pdb.read_text()
    else:
        url = 'https://files.rcsb.org/download/1M17.pdb'
        r = requests.get(url, timeout=45)
        r.raise_for_status()
        raw = r.text
        (out / '1M17.pdb').write_text(raw)
    meta = prepare_pdb(raw, out)
    print('Target:', meta['pdb_id'], '| ligand:', meta['bound_ligand'])
    print('Provisional docking box center (Å):', meta['center_angstrom'])
    print('Files: data/egfr_protein_provisional.pdb, data/egfr_box.txt')
    print('IMPORTANT: Review and prepare protein; these files are NOT a validated docking protocol.')


if __name__ == '__main__':
    main()
