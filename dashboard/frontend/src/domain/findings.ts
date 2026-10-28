import { countHits, finishedBlind, listComplexes, summarizeVina, type VinaSummary } from './benchmark'
import type { Dashboard, StepStatus } from './entities'
import { isHit } from './rmsd'
import { spearman } from './stats'
import { summarizeSweep, type SweepConfig } from './sweep'

export interface Hits { n: number; diffdock: number; vina: number }

/** The numbers the "Comece aqui" page quotes, all derived from the project's result files. */
export interface Findings {
  train: Hits
  blind: Hits & { selected: number }
  /** First Vina redocking of erlotinib (1M17): where pose 1 landed, and the closest pose it found. */
  erlotinib: { top: number; best: number; bestPose: number } | null
  /** Vina score against measured pIC50 for the docked compounds. */
  compounds: { n: number; spearman: number | null }
  sweep: { runs: number; best: SweepConfig | null }
  vinaTrain: VinaSummary[]
  /** Complexes of the blind test each method missed (RMSD of pose 1 above 2 Å). */
  blindMisses: { diffdock: string[]; vina: string[] }
  /** The complex whose Vina seeds disagree the most: shows why one run is not enough. */
  seedSpread: { pdb: string; seeds: number[] } | null
  /** Real values to mark on the RMSD scale: a clear miss, a clear hit and a method's worst blind case. */
  scaleExamples: { label: string; rmsd: number }[]
  /** One line per finished complex: did each method get it right? */
  tally: { pdb: string; group: 'train' | 'blind'; lig: string; dd: number; ddHit: boolean; vina: number; vinaHit: boolean }[]
  /** Docking of the actives / inactives / decoys library (stage 12), when it exists. */
  enrichment: { status: StepStatus; done: number; total: number } | null
  /** Result of the ranking test (stage 13): AUC of Vina against decoys and against measured inactives, with the size-only baseline. */
  ranking: { aucDecoys: number; lo: number; hi: number; vsInactives: number; sizeInactives: number; nActives: number; nDecoys: number; nInactives: number } | null
}

function summarizeRanking(d: Dashboard): Findings['ranking'] {
  const a = d.enrichment?.tasks[0], b = d.enrichment?.tasks[1]
  if (!a || !b) return null
  return {
    aucDecoys: a.scorers[0].auc, lo: a.scorers[0].lo, hi: a.scorers[0].hi,
    vsInactives: b.scorers[0].auc, sizeInactives: b.scorers[2].auc, nActives: a.n_pos, nDecoys: a.n_neg, nInactives: b.n_neg,
  }
}

export function summarizeFindings(d: Dashboard): Findings {
  const entries = listComplexes(d)
  const done = finishedBlind(entries)
  const poses = d.redocking?.poses ?? []
  const closest = poses.length ? poses.reduce((a, b) => (b.rmsd < a.rmsd ? b : a)) : null
  const scored = d.docking
  const configs = summarizeSweep(d.sweep.rows)

  const seedsByPdb: Record<string, number[]> = {}
  d.multi.rows.filter(r => r.box_A === 20).forEach(r => (seedsByPdb[r.pdb] ||= []).push(r.top_rmsd))
  d.blind.rows.filter(r => r.method === 'vina' && r.top_rmsd !== null).forEach(r => (seedsByPdb[r.pdb] ||= []).push(r.top_rmsd!))
  const spreads = Object.entries(seedsByPdb).filter(([, v]) => v.length > 1)
    .sort((a, b) => (Math.max(...b[1]) - Math.min(...b[1])) - (Math.max(...a[1]) - Math.min(...a[1])))

  const firstTrain = entries.find(e => e.group === 'train' && e.dd !== null)
  const worstBlind = done.filter(e => e.dd !== null).sort((a, b) => b.dd! - a.dd!)[0]
  const scaleExamples = [
    poses.length ? { label: 'Vina no erlotinibe, pose 1', rmsd: poses[0].rmsd } : null,
    firstTrain ? { label: `DiffDock em ${firstTrain.pdb}`, rmsd: firstTrain.dd! } : null,
    worstBlind ? { label: `DiffDock em ${worstBlind.pdb}`, rmsd: worstBlind.dd! } : null,
  ].filter((x): x is { label: string; rmsd: number } => x !== null)

  return {
    train: countHits(entries.filter(e => e.group === 'train')),
    blind: { ...countHits(done), selected: entries.filter(e => e.group === 'blind').length },
    erlotinib: poses.length && closest ? { top: poses[0].rmsd, best: closest.rmsd, bestPose: closest.pose } : null,
    compounds: { n: scored.length, spearman: spearman(scored.map(r => r.vina_score_kcal_mol), scored.map(r => r.pIC50)) },
    sweep: { runs: d.sweep.rows.length, best: configs.length ? configs.reduce((a, b) => (b.mean < a.mean ? b : a)) : null },
    vinaTrain: summarizeVina(d),
    blindMisses: {
      diffdock: done.filter(e => e.dd !== null && e.dd > 2).map(e => e.pdb),
      vina: done.filter(e => e.vpass !== null && e.vpass < 2).map(e => e.pdb),
    },
    seedSpread: spreads.length ? { pdb: spreads[0][0], seeds: spreads[0][1] } : null,
    scaleExamples,
    tally: entries.filter(e => !e.pending && !e.skipped && e.dd !== null && e.vina !== null).map(e => ({
      pdb: e.pdb, group: e.group, lig: e.lig, dd: e.dd!, ddHit: isHit(e.dd!), vina: e.vina!, vinaHit: (e.vpass ?? 0) >= 2,
    })),
    enrichment: (() => {
      const st = d.steps.find(x => x.id === '12')
      return st ? { status: st.status, done: st.progress?.done ?? 0, total: st.progress?.total ?? 0 } : null
    })(),
    ranking: summarizeRanking(d),
  }
}
