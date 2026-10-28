export const mean = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length

export function groupBy<T>(rows: T[], key: (r: T) => string): Record<string, T[]> {
  const g: Record<string, T[]> = {}
  rows.forEach(r => (g[key(r)] ||= []).push(r))
  return g
}

const ranks = (xs: number[]): number[] => {
  const order = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0])
  const out = new Array<number>(xs.length)
  for (let i = 0; i < order.length;) {
    let j = i
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++
    for (let k = i; k <= j; k++) out[order[k][1]] = (i + j) / 2 + 1   // ties share their average rank
    i = j + 1
  }
  return out
}

/** Spearman rank correlation (Pearson on ranks); null when it is undefined. */
export function spearman(x: number[], y: number[]): number | null {
  if (x.length < 3 || x.length !== y.length) return null
  const rx = ranks(x), ry = ranks(y), mx = mean(rx), my = mean(ry)
  let sxy = 0, sxx = 0, syy = 0
  rx.forEach((v, i) => { sxy += (v - mx) * (ry[i] - my); sxx += (v - mx) ** 2; syy += (ry[i] - my) ** 2 })
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null
}
