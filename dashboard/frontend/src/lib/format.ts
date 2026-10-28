export const f2 = (x: number | null | undefined): string => Number(x).toFixed(2)

/** Colour class for an RMSD to the crystal pose: up to 2 A counts as a hit. */
export type Verdict = 'ok' | 'near' | 'bad'
export const cls = (rmsd: number): Verdict => (rmsd <= 2 ? 'ok' : rmsd <= 3 ? 'near' : 'bad')

export const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length

export const how = (r: number): string => (r <= 2 ? 'sobre o cristal' : r <= 3 ? 'perto do cristal' : 'longe do cristal')

export function groupBy<T>(rows: T[], key: (r: T) => string): Record<string, T[]> {
  const g: Record<string, T[]> = {}
  rows.forEach(r => (g[key(r)] ||= []).push(r))
  return g
}

export function ago(s: number): string {
  return s < 5 ? 'agora' : s < 60 ? `há ${s} s` : s < 3600 ? `há ${Math.floor(s / 60)} min`
    : s < 86400 ? `há ${Math.floor(s / 3600)} h` : `há ${Math.floor(s / 86400)} d`
}

export const dur = (s: number): string => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`)
