"""Enrichment analysis of the Vina screen (results/enrichment_scores.csv).

Tasks (positives = measured actives, IC50 <= 100 nM):
  A  actives vs property-matched decoys (assumed inactive)
  B  actives vs experimentally measured inactives (IC50 >= 10 uM)
  C  actives vs both
Scorers (higher = more likely active): Vina (-score), Vina per heavy atom ("ligand efficiency"), and the trivial
baseline heavy-atom count. Metrics: ROC AUC, average precision (PR-AUC), EF1% and EF5%, with 95% bootstrap CIs
(2000 resamples, stratified by class). The Vina-minus-baseline AUC difference is bootstrapped on the same resamples.
Only compounds that docked successfully are scored; failures are reported by class.
"""
from __future__ import annotations
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
RNG = np.random.default_rng(42)
B = 2000


def auc(pos, neg):
    allv = np.concatenate([pos, neg]); ranks = pd.Series(allv).rank().to_numpy()
    return (ranks[:len(pos)].sum() - len(pos) * (len(pos) + 1) / 2) / (len(pos) * len(neg))


def avg_precision(y, s):
    o = np.argsort(-s, kind='stable'); y = y[o]
    tp = np.cumsum(y); prec = tp / np.arange(1, len(y) + 1)
    return float((prec * y).sum() / y.sum())


def ef(y, s, frac):
    n = len(y); k = max(1, int(round(frac * n)))
    o = np.argsort(-s, kind='stable')[:k]
    return float((y[o].sum() / k) / (y.sum() / n))


def boot(y, s, fn, other=None):
    pos, neg = np.where(y == 1)[0], np.where(y == 0)[0]; vals = []
    for _ in range(B):
        idx = np.concatenate([RNG.choice(pos, len(pos)), RNG.choice(neg, len(neg))])
        vals.append(fn(y[idx], s[idx]) if other is None else fn(y[idx], s[idx]) - fn(y[idx], other[idx]))
    return np.percentile(vals, [2.5, 97.5])


def evaluate(df, negs):
    d = df[df.label.isin(['active'] + negs)].copy()
    y = (d.label == 'active').astype(int).to_numpy()
    scores = {'Vina': -d.vina_score.to_numpy(), 'Vina per heavy atom': (-d.vina_score / d.heavy_atoms).to_numpy(),
              'Heavy-atom count (baseline)': d.heavy_atoms.to_numpy().astype(float)}
    rows = []
    for name, s in scores.items():
        a = auc(s[y == 1], s[y == 0]); lo, hi = boot(y, s, lambda yy, ss: auc(ss[yy == 1], ss[yy == 0]))
        rows.append({'scorer': name, 'AUC': a, 'AUC_lo': lo, 'AUC_hi': hi, 'AP': avg_precision(y, s),
                     'EF1%': ef(y, s, .01), 'EF5%': ef(y, s, .05), 'EF_max': len(y) / y.sum(), 'n_pos': int(y.sum()),
                     'n_neg': int(len(y) - y.sum())})
    diff = auc(scores['Vina'][y == 1], scores['Vina'][y == 0]) - auc(scores['Heavy-atom count (baseline)'][y == 1],
                                                                       scores['Heavy-atom count (baseline)'][y == 0])
    dlo, dhi = boot(y, scores['Vina'], lambda yy, ss: auc(ss[yy == 1], ss[yy == 0]), other=scores['Heavy-atom count (baseline)'])
    return pd.DataFrame(rows), (diff, dlo, dhi), (y, scores)


def roc(y, s):
    o = np.argsort(-s, kind='stable'); yy = y[o]
    return np.concatenate([[0], np.cumsum(1 - yy) / (1 - yy).sum()]), np.concatenate([[0], np.cumsum(yy) / yy.sum()])


def main():
    df = pd.read_csv(ROOT / 'results' / 'enrichment_scores.csv')
    status = df.groupby('label').status.apply(lambda s: f'{(s == "ok").sum()} docked, {(s != "ok").sum()} failed').to_dict()
    ok = df[df.status == 'ok'].copy()
    out = ['# Enrichment results (Vina, receptor 9BY4)', '', f'Docking outcome by class: {status}', '']
    tasks = {'A: actives vs decoys': ['decoy'], 'B: actives vs measured inactives': ['inactive'],
             'C: actives vs inactives + decoys': ['inactive', 'decoy']}
    fig, axes = plt.subplots(1, 3, figsize=(13, 4.1)); store = {}
    for (tname, negs) in tasks.items():
        if (ok.label.isin(negs).sum() < 5) or ((ok.label == 'active').sum() < 5):
            continue
        res, diff, (y, scores) = evaluate(ok, negs); store[tname] = (y, scores)
        out += [f'## {tname}', '', f'Positives {res.n_pos[0]}, negatives {res.n_neg[0]} (maximum possible EF = {res.EF_max[0]:.1f})', '',
                '| Scorer | ROC AUC (95% CI) | Avg. precision | EF1% | EF5% |', '|---|---|---|---|---|']
        for r in res.itertuples():
            out.append(f'| {r.scorer} | {r.AUC:.2f} ({r.AUC_lo:.2f} to {r.AUC_hi:.2f}) | {r.AP:.2f} | {r._7:.1f} | {r._8:.1f} |')
        out += ['', f'AUC difference, Vina minus size baseline: {diff[0]:+.2f} (95% CI {diff[1]:+.2f} to {diff[2]:+.2f})', '']
    for ax, tname in zip(axes[:2], ['A: actives vs decoys', 'B: actives vs measured inactives']):
        if tname not in store:
            continue
        y, s = store[tname]
        for name, col, ls in (('Vina', '#0b7c8c', '-'), ('Heavy-atom count (baseline)', '#8196a3', '--')):
            x_, y_ = roc(y, s[name]); ax.plot(x_, y_, color=col, ls=ls, lw=2, label=f'{name}  AUC {auc(s[name][y == 1], s[name][y == 0]):.2f}')
        ax.plot([0, 1], [0, 1], color='k', lw=.8, ls=':'); ax.set_title(tname, loc='left', fontsize=10, fontweight='bold')
        ax.set_xlabel('False positive rate'); ax.set_ylabel('True positive rate'); ax.legend(frameon=False, fontsize=8, loc='lower right')
    ax = axes[2]
    groups = [ok[ok.label == k].vina_score.to_numpy() for k in ('active', 'inactive', 'decoy')]
    ax.boxplot(groups, tick_labels=['active', 'inactive', 'decoy'], showfliers=False, medianprops={'color': '#0b7c8c'})
    for i, g in enumerate(groups, 1):
        ax.scatter(RNG.normal(i, .06, len(g)), g, s=6, alpha=.5, color='#555')
    ax.set_ylabel('Vina score (kcal/mol)'); ax.set_title('Score by class (more negative = better)', loc='left', fontsize=10, fontweight='bold')
    for a in axes:
        a.spines[['top', 'right']].set_visible(False)
    fig.tight_layout(); fig.savefig(ROOT / 'figures' / 'enrichment.png', dpi=200, bbox_inches='tight')
    corr = ok[['vina_score', 'heavy_atoms']].corr(method='spearman').iloc[0, 1]
    out += [f'Spearman correlation between Vina score and heavy-atom count (all docked compounds): {corr:+.2f}', '']
    (ROOT / 'results' / 'enrichment_tables.md').write_text('\n'.join(out))
    print('\n'.join(out))


if __name__ == '__main__':
    main()
