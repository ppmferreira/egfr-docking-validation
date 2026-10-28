// What the project knows about: pipeline results, docking poses and the machine running them.
// Plain data only; nothing here knows about React, HTTP or the 3D library.

export interface Job { name: string; seconds: number }
export interface Version { stamp: number; files: number; jobs: Job[] }

export interface DiffDockRow { pdb: string; ligand: string; rank: number; confidence: number | null; rmsd: number }
export interface MultiRow {
  pdb: string; ligand: string; box_A: number; seed: number
  top_score: number; top_rmsd: number; best_rmsd: number; best_rank: number; top_pass: boolean
}
export interface SweepRow {
  waters: string; box_A: number; exhaustiveness: number; seed: number
  top_rmsd: number; top_pass: boolean; best_rmsd: number
}
export interface DockRow { chembl_id: string; vina_score_kcal_mol: number; pIC50: number; ic50_nM: number; MW: number; logP: number }
/** A curated ChEMBL compound with measured EGFR potency. */
export interface Compound { chembl_id: string; MW: number; logP: number; pIC50: number; ic50_nM: number }
export type StepStatus = 'done' | 'running' | 'pending'
/** One stage of the analysis pipeline, as reported by the backend from the files each script writes. */
export interface Step { id: string; name: string; script: string; status: StepStatus; progress: { done: number; total: number } | null }
export interface Activity { file: string; age: number; kb: number }

export interface BlindSelected { pdb: string; comp: string; name: string; heavy_atoms: number; resolution: number; mw: number }
export interface BlindRow {
  pdb: string; ligand: string; method: string; run: number
  top_rmsd: number | null; best_rmsd: number | null; best_rank: number | null; score: number | null
}
export interface Blind { selected: BlindSelected[]; rows: BlindRow[]; rejected: Record<string, number>; n_candidates?: number }

export interface EnrichScorer { name: string; auc: number; lo: number; hi: number; ap: number; ef1: number; ef5: number; roc: [number, number][] }
export interface EnrichTask {
  name: string; n_pos: number; n_neg: number; ef_max: number
  diff: { value: number; lo: number; hi: number }; scorers: EnrichScorer[]
}
export interface EnrichPoint { label: 'active' | 'inactive' | 'decoy'; score: number; heavy: number }
export interface Enrichment { tasks: EnrichTask[]; points: EnrichPoint[]; spearman_size: number; status: Record<string, string> }

export interface Dashboard {
  blind: Blind
  diffdock: DiffDockRow[]
  activity: Activity[]
  jobs: Job[]
  multi: { rows: MultiRow[]; done: boolean; total: number }
  steps: Step[]
  redocking: { poses: { pose: number; score: number; rmsd: number }[] } | null
  sweep: { rows: SweepRow[]; done: boolean; total: number }
  docking: DockRow[]
  compounds: Compound[]
  enrichment: Enrichment | null
}

export interface Gpu { name: string; util: number; mem_used: number; mem_total: number; temp: number }
export interface LogTail { file: string; age: number; tail: string[] }
export interface Live { jobs: Job[]; gpu: Gpu | null; logs: LogTail[] }

export interface DiffDockPose { rank: number; confidence: number | null; rmsd: number; mol: string }
export interface VinaPose { seed: number; pose: number; score: number; rmsd: number; mol: string }
export interface ComplexDetail {
  pdb: string; ligand: string; protein: string; crystal: string; center: [number, number, number]
  has_traj: boolean; diffdock: DiffDockPose[]; vina: VinaPose[]
}
export interface Trajectory { frames: string | null }
