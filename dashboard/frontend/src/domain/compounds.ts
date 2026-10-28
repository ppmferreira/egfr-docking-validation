import type { Compound } from './entities'
import { spearman } from './stats'

export type PotencyId = 'high' | 'good' | 'mid' | 'low'
/** Potency bands by measured pIC50 (pIC50 8 = 10 nM, 7 = 100 nM, 6 = 1 µM), most potent first. */
export const POTENCY: { id: PotencyId; min: number; label: string; hint: string }[] = [
  { id: 'high', min: 8, label: 'Muito potente', hint: 'IC50 abaixo de 10 nM' },
  { id: 'good', min: 7, label: 'Potente', hint: '10 a 100 nM' },
  { id: 'mid', min: 6, label: 'Moderado', hint: '0,1 a 1 µM' },
  { id: 'low', min: -Infinity, label: 'Fraco', hint: 'acima de 1 µM' },
]
export const potencyOf = (pIC50: number): PotencyId => POTENCY.find(p => pIC50 >= p.min)!.id

/** Lipinski's rule of five, the two limits that fit on a MW × logP plot. */
export const LIPINSKI = { mw: 500, logP: 5 }
export const withinLipinski = (c: Compound): boolean => c.MW <= LIPINSKI.mw && c.logP <= LIPINSKI.logP

export interface ChemSummary {
  n: number
  byPotency: Record<PotencyId, number>
  lipinski: number
  mw: { min: number; max: number }
  logP: { min: number; max: number }
  /** Compounds per pIC50 unit (5–6, 6–7, ...). */
  histogram: { from: number; count: number }[]
  /** Spearman correlation of pIC50 with molecular weight and with logP. */
  corr: { mw: number | null; logP: number | null }
}

export function summarizeChemistry(cs: Compound[]): ChemSummary {
  const byPotency: Record<PotencyId, number> = { high: 0, good: 0, mid: 0, low: 0 }
  cs.forEach(c => byPotency[potencyOf(c.pIC50)]++)
  const lo = cs.length ? Math.floor(Math.min(...cs.map(c => c.pIC50))) : 0
  const hi = cs.length ? Math.floor(Math.max(...cs.map(c => c.pIC50))) : 0
  const histogram = Array.from({ length: hi - lo + 1 }, (_, i) => ({ from: lo + i, count: cs.filter(c => Math.floor(c.pIC50) === lo + i).length }))
  const span = (xs: number[]) => ({ min: Math.min(...xs), max: Math.max(...xs) })
  return {
    n: cs.length, byPotency, lipinski: cs.filter(withinLipinski).length, histogram,
    mw: span(cs.map(c => c.MW)), logP: span(cs.map(c => c.logP)),
    corr: { mw: spearman(cs.map(c => c.MW), cs.map(c => c.pIC50)), logP: spearman(cs.map(c => c.logP), cs.map(c => c.pIC50)) },
  }
}
