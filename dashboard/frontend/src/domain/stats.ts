export const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length

export function groupBy<T>(rows: T[], key: (r: T) => string): Record<string, T[]> {
  const g: Record<string, T[]> = {}
  rows.forEach(r => (g[key(r)] ||= []).push(r))
  return g
}
