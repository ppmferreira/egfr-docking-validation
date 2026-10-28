export type Frame = number[][]

/** Atom coordinates of every model in a PDB trajectory (columns 31-54 of the ATOM/HETATM lines). */
export function parseFrames(text: string): Frame[] {
  return text.split(/^ENDMDL.*$/m)
    .map(block => block.split('\n').filter(l => /^(ATOM|HETATM)/.test(l))
      .map(l => [parseFloat(l.slice(30, 38)), parseFloat(l.slice(38, 46)), parseFloat(l.slice(46, 54))]))
    .filter(f => f.length)
}

export const centroid = (pts: number[][]): number[] =>
  pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map(x => x / pts.length)

export const distance = (a: number[], b: number[]): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
