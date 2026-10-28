import type { Dashboard } from './entities'
import { isHit } from './rmsd'
import { groupBy, mean } from './stats'

/** Vina's redocking result for one structure, over the seeds run with the 20 Å box. */
export interface VinaSummary { pdb: string; ligand: string; n: number; mean: number; pass: number; best: number }

export function summarizeVina(d: Dashboard): VinaSummary[] {
  const rows = d.multi.rows.filter(r => r.box_A === 20)
  return Object.entries(groupBy(rows, r => r.pdb)).map(([pdb, a]) => ({
    pdb, ligand: a[0].ligand, n: a.length, mean: mean(a.map(x => x.top_rmsd)),
    pass: a.filter(x => x.top_pass).length, best: mean(a.map(x => x.best_rmsd)),
  }))
}

/** Did the protocol validated on erlotinib hold on the other complexes? A structure passes with 2 of 3 seeds. */
export function assessValidation(d: Dashboard) {
  const ms = summarizeVina(d)
  return {
    ms,
    complete: ms.length >= 3 && d.multi.rows.length >= d.multi.total,
    okAll: ms.length >= 3 && ms.every(m => m.pass >= 2),
    nOk: ms.filter(m => m.pass >= 2).length,
  }
}

/** One complex as listed on screen: a development structure or one from the blind test, with both methods' RMSD. */
export interface Entry {
  pdb: string; group: 'train' | 'blind'; lig: string; name: string
  res?: number; pending?: boolean; skipped?: boolean
  dd: number | null; vina: number | null; vpass: number | null; vn: number | null
}

export function listComplexes(d: Dashboard): Entry[] {
  const vina = summarizeVina(d)
  const train: Entry[] = [...new Set(d.diffdock.map(r => r.pdb))].map(pdb => {
    const r1 = d.diffdock.find(r => r.pdb === pdb && r.rank === 1) ?? d.diffdock.find(r => r.pdb === pdb)!
    const v = vina.find(m => m.pdb === pdb)
    return { pdb, group: 'train', lig: r1.ligand, name: r1.ligand, dd: r1.rmsd, vina: v?.mean ?? null, vpass: v?.pass ?? null, vn: v?.n ?? null }
  })
  const blind: Entry[] = d.blind.selected.map(s => {
    const r = d.blind.rows.filter(x => x.pdb === s.pdb)
    const v = r.filter(x => x.method === 'vina' && x.top_rmsd !== null)
    const dd = r.find(x => x.method === 'diffdock')
    return {
      pdb: s.pdb, group: 'blind', lig: s.comp, name: s.name, res: s.resolution, pending: r.length === 0,
      skipped: r.some(x => x.method === 'skipped'), dd: dd?.top_rmsd ?? null,
      vina: v.length ? mean(v.map(x => x.top_rmsd!)) : null,
      vpass: v.length ? v.filter(x => isHit(x.top_rmsd!)).length : null, vn: v.length || null,
    }
  })
  return [...train, ...blind]
}

/** How many of the given complexes each method got right (DiffDock: pose 1; Vina: at least 2 of its seeds). */
export function countHits(entries: Entry[]) {
  return {
    n: entries.length,
    diffdock: entries.filter(e => e.dd !== null && isHit(e.dd)).length,
    vina: entries.filter(e => e.vpass !== null && e.vpass >= 2).length,
  }
}

export const finishedBlind = (entries: Entry[]): Entry[] => entries.filter(e => e.group === 'blind' && !e.pending && !e.skipped)
