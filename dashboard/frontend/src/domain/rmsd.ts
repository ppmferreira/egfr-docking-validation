/** A pose counts as a hit when its RMSD to the crystal ligand is at most 2 Å. */
export const HIT_THRESHOLD = 2
export const NEAR_THRESHOLD = 3

export type Verdict = 'ok' | 'near' | 'bad'

export const isHit = (rmsd: number): boolean => rmsd <= HIT_THRESHOLD
export const classify = (rmsd: number): Verdict => (rmsd <= HIT_THRESHOLD ? 'ok' : rmsd <= NEAR_THRESHOLD ? 'near' : 'bad')
