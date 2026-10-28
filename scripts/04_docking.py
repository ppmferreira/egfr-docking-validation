"""Optional docking after checking/preparing the protein and installing CLI tools.
Do NOT publish docking results as experimentally validated affinity predictions.
"""
from __future__ import annotations
from pathlib import Path
import re
import shutil
import subprocess
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]


def first_score(pdbqt: Path):
    # Typical AutoDock Vina output:
    # REMARK VINA RESULT:    -7.4      0.000      0.000
    for line in pdbqt.read_text(errors='replace').splitlines():
        m = re.match(r'^REMARK VINA RESULT:\s+(-?\d+(?:\.\d+)?)', line)
        if m:
            return float(m.group(1))
    return None


def main():
    for program in ('mk_prepare_ligand.py', 'vina'):
        if not shutil.which(program):
            raise SystemExit(f'{program} not found on PATH. Follow official installation docs in README.')
    receptor = ROOT / 'data' / 'egfr_receptor.pdbqt'
    box = ROOT / 'data' / 'egfr_box.txt'
    if not receptor.is_file():
        raise SystemExit('Missing prepared receptor data/egfr_receptor.pdbqt; see README and validate preparation.')
    if not box.is_file():
        raise SystemExit('Missing box config. Run scripts/01_target.py')
    sdf_dir = ROOT / 'data' / 'ligands_sdf'
    sd_files = sorted(sdf_dir.glob('*.sdf'))
    if not sd_files:
        raise SystemExit('No ligand SDFs. Run scripts/03_ligands.py')
    pdbqt_dir = ROOT / 'data' / 'ligands_pdbqt'; pdbqt_dir.mkdir(exist_ok=True)
    poses_dir = ROOT / 'results' / 'poses'; poses_dir.mkdir(parents=True, exist_ok=True)
    records = []
    for sdf in sd_files:
        ligand = pdbqt_dir / (sdf.stem + '.pdbqt')
        output = poses_dir / (sdf.stem + '_docked.pdbqt')
        try:
            subprocess.run(['mk_prepare_ligand.py', '-i', str(sdf), '-o', str(ligand)], check=True,
                           capture_output=True, text=True)
            subprocess.run(['vina', '--receptor', str(receptor), '--ligand', str(ligand),
                            '--config', str(box), '--out', str(output), '--seed', '42',
                            '--exhaustiveness', '8', '--cpu', '2'], check=True,
                           capture_output=True, text=True)
            records.append({'chembl_id': sdf.stem, 'vina_score_kcal_mol': first_score(output),
                            'status': 'completed'})
            print(f'{sdf.stem}: {records[-1]["vina_score_kcal_mol"]} kcal/mol')
        except subprocess.CalledProcessError as exc:
            print(f'FAILED {sdf.stem}: {(exc.stderr or exc.stdout)[-500:]}')
            records.append({'chembl_id': sdf.stem, 'vina_score_kcal_mol': None,
                            'status': f'failed ({exc.returncode})'})
    if not records:
        raise SystemExit('No ligand files processed')
    df = pd.DataFrame(records).sort_values('vina_score_kcal_mol', na_position='last')
    df.to_csv(ROOT / 'results' / 'vina_scores.csv', index=False)
    print('Saved results/vina_scores.csv; do not interpret as experimentally measured binding affinity.')


if __name__ == '__main__':
    main()
