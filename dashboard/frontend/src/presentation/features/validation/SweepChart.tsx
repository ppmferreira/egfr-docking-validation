import type { SweepConfig } from '../../../domain/sweep'
import { HIT_THRESHOLD } from '../../../domain/rmsd'
import { f2 } from '../../format'
import { Pad } from '../../ui/Box'
import { Progress } from '../../ui/Progress'

export function SweepProgress({ done, total }: { done: number; total: number }) {
  return <Pad><Progress value={100 * done / total} label="Execuções da varredura" /></Pad>
}

/** Mean RMSD of Vina's pose 1 for each parameter configuration, with the 2 Å line. */
export function SweepChart({ configs }: { configs: SweepConfig[] }) {
  const W = 640, rowH = 22, L = 150, H = configs.length * rowH + 30, mx = Math.max(10, ...configs.map(s => s.mean))
  const x = (v: number) => L + (W - L - 20) * v / mx
  return (
    <svg className="block min-w-[480px]" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
      {configs.map((s, i) => {
        const y = 12 + i * rowH
        return (
          <g key={i}>
            <text x={0} y={y + 11}>{s.waters} · {s.box} Å · ex {s.exhaustiveness}</text>
            <rect x={L} y={y} width={x(s.mean) - L} height={14} fill={s.mean <= HIT_THRESHOLD ? 'var(--pass)' : 'var(--fail)'} opacity={0.8} />
            <text x={x(s.mean) + 6} y={y + 11}>{f2(s.mean)}</text>
          </g>
        )
      })}
      <line x1={x(HIT_THRESHOLD)} x2={x(HIT_THRESHOLD)} y1={4} y2={H - 14} stroke="var(--ink)" strokeDasharray="4 3" />
      <text x={x(HIT_THRESHOLD) - 4} y={H - 2} textAnchor="end">2 Å</text>
    </svg>
  )
}
