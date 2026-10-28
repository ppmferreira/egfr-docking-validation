import type { VinaPose } from './entities'

/** Seeds present in a complex's Vina poses, each with the RMSD of the pose Vina ranked first (the one it would pick). */
export function seedsOf(poses: VinaPose[]): { seed: number; top: number }[] {
  const seeds = [...new Set(poses.map(p => p.seed))].sort((a, b) => a - b)
  return seeds.map(seed => ({ seed, top: poses.find(p => p.seed === seed && p.pose === 1)?.rmsd ?? NaN }))
}
