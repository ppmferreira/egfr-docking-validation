import type { SweepRow } from './entities'
import { groupBy, mean } from './stats'

export interface SweepConfig { waters: string; box: number; exhaustiveness: number; n: number; mean: number; pass: number; best: number }

/** One line per (waters, box, exhaustiveness) configuration of the Vina parameter sweep. */
export function summarizeSweep(rows: SweepRow[]): SweepConfig[] {
  return Object.values(groupBy(rows, r => `${r.waters}|${r.box_A}|${r.exhaustiveness}`)).map(a => ({
    waters: a[0].waters, box: a[0].box_A, exhaustiveness: a[0].exhaustiveness, n: a.length,
    mean: mean(a.map(x => x.top_rmsd)), pass: a.filter(x => x.top_pass).length, best: Math.min(...a.map(x => x.best_rmsd)),
  }))
}
