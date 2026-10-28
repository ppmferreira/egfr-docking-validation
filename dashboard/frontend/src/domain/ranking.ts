import type { DockRow } from './entities'
import { spearman } from './stats'

export interface RankedCompound extends DockRow {
  /** 1 = best Vina score (most negative). */
  scoreRank: number
  /** 1 = most potent (highest pIC50). */
  potencyRank: number
}

/** Ranks the docked compounds twice: by Vina score and by measured potency. A good scoring function would give the same order. */
export function rankCompounds(rows: DockRow[]): RankedCompound[] {
  const byScore = [...rows].sort((a, b) => a.vina_score_kcal_mol - b.vina_score_kcal_mol)
  const byPotency = [...rows].sort((a, b) => b.pIC50 - a.pIC50)
  return byScore.map((r, i) => ({ ...r, scoreRank: i + 1, potencyRank: byPotency.findIndex(x => x.chembl_id === r.chembl_id) + 1 }))
}

export interface RankingSummary {
  n: number
  rho: number | null
  /** How many of the `k` most potent compounds are also among the `k` best-scoring ones. */
  topOverlap: { k: number; shared: number }
  /** Expected overlap if the order were random: k·k/n. */
  topChance: number
  scoreRange: { best: number; worst: number }
  potencyRange: { best: number; worst: number }
}

export function summarizeRanking(rows: DockRow[], k = 5): RankingSummary {
  const ranked = rankCompounds(rows)
  const kk = Math.min(k, ranked.length)
  const scores = rows.map(r => r.vina_score_kcal_mol), pots = rows.map(r => r.pIC50)
  return {
    n: rows.length,
    rho: spearman(scores, pots),
    topOverlap: { k: kk, shared: ranked.filter(r => r.scoreRank <= kk && r.potencyRank <= kk).length },
    topChance: rows.length ? (kk * kk) / rows.length : 0,
    scoreRange: { best: Math.min(...scores), worst: Math.max(...scores) },
    potencyRange: { best: Math.max(...pots), worst: Math.min(...pots) },
  }
}
