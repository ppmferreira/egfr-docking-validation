"""Exploratory comparison of docking scores and heterogeneous public IC50 measurements.
Not a predictive model validation. Requires an adequately validated docking setup first.
"""
from __future__ import annotations
from pathlib import Path
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]


def main():
    scores = pd.read_csv(ROOT / 'results' / 'vina_scores.csv')
    activities = pd.read_csv(ROOT / 'results' / 'docking_shortlist.csv')
    df = scores.merge(activities, on='chembl_id', how='inner').dropna(subset=['vina_score_kcal_mol', 'pIC50'])
    if len(df) < 3:
        raise SystemExit('Need at least three compounds with Vina scores and pIC50.')
    # A more negative Vina score is preferred, but NOT experimentally established affinity.
    spearman = df['vina_score_kcal_mol'].corr(df['pIC50'], method='spearman')
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.scatter(df.vina_score_kcal_mol, df.pIC50, alpha=0.8)
    ax.set_xlabel('Vina docking score (kcal/mol; approximate)')
    ax.set_ylabel('pIC50 from heterogeneous ChEMBL assays')
    ax.set_title(f'EGFR retrospective exploration (n={len(df)}, Spearman r={spearman:.2f})')
    fig.tight_layout()
    (ROOT / 'figures').mkdir(exist_ok=True)
    fig.savefig(ROOT / 'figures' / 'vina_vs_ic50.png', dpi=200)
    print('Generated figures/vina_vs_ic50.png')
    print('Warning: correlation here is NOT prospective predictive performance.')


if __name__ == '__main__':
    main()
