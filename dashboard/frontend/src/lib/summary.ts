import type { Dashboard } from '../api'
import { groupBy, mean } from './format'

export interface VinaSummary { pdb: string; ligand: string; n: number; mean: number; pass: number; best: number }

/** Vina redocking per structure, box 20 A (the configuration chosen before the cross-complex test). */
export function multiSummary(d: Dashboard): VinaSummary[] {
  const rows = d.multi.rows.filter(r => r.box_A === 20)
  return Object.entries(groupBy(rows, r => r.pdb)).map(([pdb, a]) => ({
    pdb, ligand: a[0].ligand, n: a.length, mean: mean(a.map(x => x.top_rmsd)),
    pass: a.filter(x => x.top_pass).length, best: mean(a.map(x => x.best_rmsd)),
  }))
}

export function verdict(d: Dashboard) {
  const ms = multiSummary(d)
  return {
    ms,
    complete: ms.length >= 3 && d.multi.rows.length >= d.multi.total,
    okAll: ms.length >= 3 && ms.every(m => m.pass >= 2),
    nOk: ms.filter(m => m.pass >= 2).length,
  }
}

/** One row of the Complexos list: a development complex or a blind-test one, with both methods' RMSD. */
export interface Entry {
  pdb: string; group: 'train' | 'blind'; lig: string; name: string
  res?: number; pending?: boolean; skipped?: boolean
  dd: number | null; vina: number | null; vpass: number | null; vn: number | null
}

export function complexEntries(d: Dashboard): Entry[] {
  const ms = multiSummary(d)
  const train: Entry[] = [...new Set(d.diffdock.map(r => r.pdb))].map(pdb => {
    const r1 = d.diffdock.find(r => r.pdb === pdb && r.rank === 1) ?? d.diffdock.find(r => r.pdb === pdb)!
    const v = ms.find(m => m.pdb === pdb)
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
      vpass: v.length ? v.filter(x => x.top_rmsd! <= 2).length : null, vn: v.length || null,
    }
  })
  return [...train, ...blind]
}
