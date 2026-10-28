// Shapes returned by the backend (dashboard/backend/app) and the helpers that fetch them.

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
export interface Step { id: string; name: string; done: boolean }
export interface Activity { file: string; age: number; kb: number }

export interface BlindSelected { pdb: string; comp: string; name: string; heavy_atoms: number; resolution: number; mw: number }
export interface BlindRow {
  pdb: string; ligand: string; method: string; run: number
  top_rmsd: number | null; best_rmsd: number | null; best_rank: number | null; score: number | null
}
export interface Blind { selected: BlindSelected[]; rows: BlindRow[]; rejected: Record<string, number>; n_candidates?: number }

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
}

export interface Gpu { name: string; util: number; mem_used: number; mem_total: number; temp: number }
export interface LogTail { file: string; age: number; tail: string[] }
export interface Live { jobs: Job[]; gpu: Gpu | null; logs: LogTail[] }

export interface DiffDockPose { rank: number; confidence: number | null; rmsd: number; mol: string }
export interface VinaPose { pose: number; score: number; rmsd: number; mol: string }
export interface ComplexDetail {
  pdb: string; ligand: string; protein: string; crystal: string; center: [number, number, number]
  has_traj: boolean; diffdock: DiffDockPose[]; vina: VinaPose[]
}
export interface Trajectory { frames: string | null }

export async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url}: ${r.status}`)
  return r.json() as Promise<T>
}

export const api = {
  data: () => getJSON<Dashboard>('/api/data'),
  version: () => getJSON<Version>('/api/version'),
  live: () => getJSON<Live>('/api/live'),
  complex: (pdb: string) => getJSON<ComplexDetail>(`/api/complexes/${pdb}`),
  trajectory: (pdb: string, rank: number) => getJSON<Trajectory>(`/api/complexes/${pdb}/trajectory/${rank}`),
}
