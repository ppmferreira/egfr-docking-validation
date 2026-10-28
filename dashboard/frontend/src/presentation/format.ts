import { HIT_THRESHOLD, NEAR_THRESHOLD } from '../domain/rmsd'

export const f2 = (x: number | null | undefined): string => Number(x).toFixed(2)

export const describeFit = (rmsd: number): string =>
  rmsd <= HIT_THRESHOLD ? 'sobre o cristal' : rmsd <= NEAR_THRESHOLD ? 'perto do cristal' : 'longe do cristal'

export function ago(s: number): string {
  return s < 5 ? 'agora' : s < 60 ? `há ${s} s` : s < 3600 ? `há ${Math.floor(s / 60)} min`
    : s < 86400 ? `há ${Math.floor(s / 3600)} h` : `há ${Math.floor(s / 86400)} d`
}

export const dur = (s: number): string => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`)
