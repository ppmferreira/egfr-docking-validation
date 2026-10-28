import type { SeedRun } from '../../../domain/benchmark'
import { HIT_THRESHOLD, isHit } from '../../../domain/rmsd'
import { f2 } from '../../format'

const MAX = 10
const W = 640, L = 150, R = 24, ROW = 30, TOP = 8, BOTTOM = 40
const x = (v: number) => L + (W - L - R) * Math.min(v, MAX) / MAX

/** Every Vina seed as a dot on the RMSD scale: left of the green zone (≤ 2 Å) the seed found the crystal pose. */
export function SeedStrip({ runs }: { runs: SeedRun[] }) {
  const H = TOP + runs.length * ROW + BOTTOM
  const axisY = TOP + runs.length * ROW
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="RMSD de cada seed do Vina, por estrutura e tamanho de caixa" className="block text-[12px]">
      <rect x={x(0)} y={TOP} width={x(HIT_THRESHOLD) - x(0)} height={runs.length * ROW} className="fill-pass/12" />
      {[0, 2, 4, 6, 8, 10].map(t => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={TOP} y2={axisY} className="stroke-line" />
          <text x={x(t)} y={axisY + 15} textAnchor="middle" className="fill-muted font-mono">{t === 10 ? '10+' : t}</text>
        </g>
      ))}
      <line x1={x(HIT_THRESHOLD)} x2={x(HIT_THRESHOLD)} y1={TOP} y2={axisY} className="stroke-ink" strokeDasharray="4 3" />
      <text x={(x(0) + x(HIT_THRESHOLD)) / 2} y={axisY + 30} textAnchor="middle" className="fill-pass">acertou</text>
      <text x={(L + W - R) / 2 + 20} y={axisY + 30} textAnchor="middle" className="fill-muted">RMSD da pose 1 ao cristal (Å)</text>
      {runs.map((r, i) => {
        const y = TOP + i * ROW + ROW / 2
        const first = i === 0 || runs[i - 1].pdb !== r.pdb
        return (
          <g key={`${r.pdb}-${r.box}`}>
            {first && i > 0 && <line x1={0} x2={W - R} y1={TOP + i * ROW} y2={TOP + i * ROW} className="stroke-line" />}
            <text x={0} y={y + 4} className="fill-ink font-mono text-[13px] font-medium">{first ? r.pdb : ''}</text>
            <text x={52} y={y + 4} className="fill-muted font-mono">caixa {r.box} Å</text>
            <line x1={x(0)} x2={x(MAX)} y1={y} y2={y} className="stroke-line" />
            {r.rmsds.map((v, k) => (
              <circle key={k} cx={x(v)} cy={y} r={6} className={isHit(v) ? 'fill-pass' : 'fill-fail'} fillOpacity={0.85}>
                <title>seed {k + 1}: {f2(v)} Å</title>
              </circle>
            ))}
          </g>
        )
      })}
    </svg>
  )
}
