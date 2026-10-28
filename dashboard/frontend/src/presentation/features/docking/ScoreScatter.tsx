import type { DockRow } from '../../../domain/entities'

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

/** Vina score against measured pIC50 for the 16 docked compounds. */
export function ScoreScatter({ rows }: { rows: DockRow[] }) {
  if (!rows.length) return <>Sem dados.</>
  const W = 420, H = 300, m = { l: 44, r: 12, t: 12, b: 38 }
  const xs = rows.map(r => r.vina_score_kcal_mol), ys = rows.map(r => r.pIC50)
  const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs)), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys))
  const X = (v: number) => m.l + (W - m.l - m.r) * (v - x0) / (x1 - x0)
  const Y = (v: number) => H - m.b - (H - m.t - m.b) * (v - y0) / (y1 - y0)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
      {range(x0, x1).map(v => <g key={`x${v}`}><line x1={X(v)} x2={X(v)} y1={m.t} y2={H - m.b} stroke="var(--line)" /><text x={X(v)} y={H - m.b + 14} textAnchor="middle">{v}</text></g>)}
      {range(y0, y1).map(v => <g key={`y${v}`}><line x1={m.l} x2={W - m.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={m.l - 6} y={Y(v) + 4} textAnchor="end">{v}</text></g>)}
      {rows.map(r => <circle key={r.chembl_id} cx={X(r.vina_score_kcal_mol)} cy={Y(r.pIC50)} r={5} fill="var(--docked)" opacity={0.8}><title>{r.chembl_id}</title></circle>)}
      <text x={(W + m.l) / 2} y={H - 4} textAnchor="middle">score do Vina (kcal/mol)</text>
      <text transform={`translate(11 ${H / 2}) rotate(-90)`} textAnchor="middle">pIC50</text>
    </svg>
  )
}
