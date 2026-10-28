"""Summary tables and figures for REPORT.md, computed only from files in results/.

Writes figures/redocking_summary.png and results/report_tables.md. Nothing here is typed in by hand: every number in
the report should be reproducible by running this script.
"""
from __future__ import annotations
from pathlib import Path
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
LIMIT = 2.0


def main():
    res = ROOT / 'results'
    multi = pd.read_csv(res / 'redocking_multi.csv')
    dd = pd.read_csv(res / 'diffdock_results.csv')
    blind = pd.read_csv(res / 'blind_results.csv')
    sweep = pd.read_csv(res / 'redocking_sweep.csv')

    # --- known complexes (published 2002-2014; probably in DiffDock's training data) ---
    old_v = multi[multi.box_A == 20].groupby(['pdb', 'ligand']).agg(
        vina_mean=('top_rmsd', 'mean'), vina_median=('top_rmsd', 'median'), vina_pass=('top_pass', 'sum'), n=('seed', 'size')).reset_index()
    old_d = dd[dd['rank'] == 1][['pdb', 'rmsd']].rename(columns={'rmsd': 'diffdock'})
    old = old_v.merge(old_d, on='pdb')

    # --- blind complexes (released 2022 or later) ---
    v = blind[blind.method == 'vina'].groupby(['pdb', 'ligand']).agg(
        vina_mean=('top_rmsd', 'mean'), vina_median=('top_rmsd', 'median'), vina_pass=('top_rmsd', lambda s: int((s <= LIMIT).sum())),
        vina_runs=('top_rmsd', list)).reset_index()
    d = blind[blind.method == 'diffdock'][['pdb', 'top_rmsd', 'best_rmsd', 'best_rank']].rename(
        columns={'top_rmsd': 'diffdock', 'best_rmsd': 'dd_best', 'best_rank': 'dd_best_rank'})
    b = v.merge(d, on='pdb')
    b['vina_ok'] = b.vina_pass >= 2
    b['dd_ok'] = b.diffdock <= LIMIT

    lines = ['## Known complexes (Vina box 20 A, 3 seeds; DiffDock top-ranked pose)', '',
             '| PDB | Ligand | Vina mean RMSD (A) | Vina seeds <= 2 A | DiffDock RMSD (A) |', '|---|---|---|---|---|']
    for r in old.itertuples():
        lines.append(f'| {r.pdb} | {r.ligand} | {r.vina_mean:.2f} | {r.vina_pass}/{r.n} | {r.diffdock:.2f} |')
    lines += ['', '## Blind complexes (released 2022 or later)', '',
              '| PDB | Ligand | Vina RMSD per seed (A) | Vina success | DiffDock RMSD (A) | DiffDock success | DiffDock best of 10 (A) |',
              '|---|---|---|---|---|---|---|']
    for r in b.itertuples():
        runs = ', '.join(f'{x:.2f}' for x in r.vina_runs)
        lines.append(f'| {r.pdb} | {r.ligand} | {runs} | {"yes" if r.vina_ok else "no"} ({r.vina_pass}/3) | '
                     f'{r.diffdock:.2f} | {"yes" if r.dd_ok else "no"} | {r.dd_best:.2f} (rank {int(r.dd_best_rank)}) |')
    lines += ['', f'Blind totals: Vina {int(b.vina_ok.sum())}/{len(b)} (success = at least 2 of 3 seeds <= {LIMIT} A), '
                  f'DiffDock {int(b.dd_ok.sum())}/{len(b)} (top-ranked pose <= {LIMIT} A).',
              f'Vina seed-level: {int((blind[blind.method == "vina"].top_rmsd <= LIMIT).sum())}/'
              f'{int((blind.method == "vina").sum())} runs <= {LIMIT} A.', '']
    s = sweep.groupby(['waters', 'box_A', 'exhaustiveness']).agg(mean_top_rmsd=('top_rmsd', 'mean'),
                                                                  passes=('top_pass', 'sum')).round(2)
    lines += ['## Parameter sweep on 1M17 (erlotinib), 3 seeds each', '',
              '| Waters | Box (A) | Exhaustiveness | Mean top RMSD (A) | Seeds <= 2 A |', '|---|---|---|---|---|']
    for (w, box, ex), r in s.iterrows():
        lines.append(f'| {w} | {box} | {ex} | {r.mean_top_rmsd:.2f} | {int(r.passes)}/3 |')
    lines.append('')
    (res / 'report_tables.md').write_text('\n'.join(lines))

    # --- figure ---
    plt.rcParams.update({'font.size': 9, 'axes.spines.top': False, 'axes.spines.right': False})
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.2), gridspec_kw={'width_ratios': [len(old), len(b)]})
    for ax, df, title, vcol in ((axes[0], old, 'Known (2002-2014)', 'vina_median'),
                                (axes[1], b, 'Blind (2022 or later)', 'vina_median')):
        x = range(len(df)); w = 0.38
        ax.bar([i - w / 2 for i in x], df[vcol], w, label='Vina, median of 3 seeds (pocket given)', color='#8196a3')
        ax.bar([i + w / 2 for i in x], df.diffdock, w, label='DiffDock (blind)', color='#0b7c8c')
        ax.axhline(LIMIT, color='k', ls='--', lw=1); ax.text(-0.45, LIMIT + 0.12, '2 A limit', ha='left', fontsize=8)
        ax.set_xticks(list(x)); ax.set_xticklabels(df.pdb, rotation=45, ha='right')
        ax.set_title(title, loc='left', fontweight='bold', fontsize=10); ax.set_ylim(0, 8.5)
    axes[0].set_ylabel('RMSD of top-ranked pose to crystal (A)'); axes[1].legend(frameon=False, loc='upper left', bbox_to_anchor=(0.0, 0.93))
    fig.text(0.01, -0.02, 'Vina: median of 3 seeds (per-seed values in report_tables.md). DiffDock: one run of 10 samples, top by confidence. '
             'Vina was given the pocket; DiffDock was not.', fontsize=7.5, color='#555')
    fig.tight_layout()
    fig.savefig(ROOT / 'figures' / 'redocking_summary.png', dpi=200, bbox_inches='tight')
    print('\n'.join(lines))


if __name__ == '__main__':
    main()
