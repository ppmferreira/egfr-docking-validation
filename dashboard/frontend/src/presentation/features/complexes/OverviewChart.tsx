import type { Entry } from '../../../domain/benchmark'
import { HIT_THRESHOLD } from '../../../domain/rmsd'
import { f2 } from '../../format'

interface Props { entries: Entry[]; current: string | null; onPick: (pdb: string) => void }

const W = 290, H = 290, M = { l: 36, r: 10, t: 12, b: 34 }
const ticks = (max: number) => Array.from({ length: Math.floor(max) + 1 }, (_, i) => i)

/** Every finished complex as one point: DiffDock RMSD across, Vina RMSD up. The 2 Å lines split hits from misses. */
export function OverviewChart({ entries, current, onPick }: Props) {
  const pts = entries.filter(e => e.dd !== null && e.vina !== null)
  const xmax = Math.max(4, Math.ceil(Math.max(...pts.map(p => p.dd!)) + 0.5))
  const ymax = Math.max(4, Math.ceil(Math.max(...pts.map(p => p.vina!)) + 0.5))
  const x = (v: number) => M.l + (W - M.l - M.r) * v / xmax
  const y = (v: number) => H - M.b - (H - M.t - M.b) * v / ymax
  const hit = HIT_THRESHOLD
  return (
    <div className="grid gap-2 px-3 pt-2.5 pb-3">
      <svg className="block h-auto w-full" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="RMSD do DiffDock contra o do Vina, um ponto por complexo">
        <rect x={M.l} y={y(hit)} width={x(hit) - M.l} height={y(0) - y(hit)} fill="var(--pass)" opacity={0.1} />
        {ticks(xmax).map(v => <g key={`x${v}`}><line x1={x(v)} x2={x(v)} y1={M.t} y2={H - M.b} stroke="var(--line)" /><text x={x(v)} y={H - M.b + 13} textAnchor="middle">{v}</text></g>)}
        {ticks(ymax).map(v => <g key={`y${v}`}><line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={M.l - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
        <line x1={x(hit)} x2={x(hit)} y1={M.t} y2={H - M.b} stroke="var(--ink)" strokeDasharray="4 3" />
        <line x1={M.l} x2={W - M.r} y1={y(hit)} y2={y(hit)} stroke="var(--ink)" strokeDasharray="4 3" />
        <text x={(W + M.l) / 2} y={H - 4} textAnchor="middle">RMSD do DiffDock (Å)</text>
        <text transform={`translate(10 ${(H - M.b + M.t) / 2}) rotate(-90)`} textAnchor="middle">RMSD médio do Vina (Å)</text>
        {pts.map(p => {
          const selected = p.pdb === current
          return (
            <g key={p.pdb} tabIndex={0} role="button" aria-label={`${p.pdb}, ${p.lig}`} className="cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-[3]"
              onClick={() => onPick(p.pdb)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(p.pdb) } }}>
              <title>{`${p.pdb} · ${p.lig}\nDiffDock ${f2(p.dd)} Å · Vina ${f2(p.vina)} Å`}</title>
              {selected && <circle cx={x(p.dd!)} cy={y(p.vina!)} r={9} fill="none" stroke="var(--ink)" strokeWidth={1.5} />}
              <circle cx={x(p.dd!)} cy={y(p.vina!)} r={5.5} fill={p.group === 'blind' ? 'var(--docked)' : 'var(--panel)'} stroke="var(--docked)" strokeWidth={2} />
            </g>
          )
        })}
        {pts.filter(p => p.pdb === current).map(p => (
          <text key={p.pdb} x={x(p.dd!) + 11} y={y(p.vina!) + 4} style={{ fill: 'var(--ink)', fontWeight: 600 }}>{p.pdb}</text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted [&_i]:mr-1.5 [&_i]:inline-block [&_i]:size-[9px] [&_i]:rounded-full [&_i]:border-[1.5px] [&_i]:border-docked">
        <span><i />treino</span><span><i className="bg-docked" />cegos</span>
        <span><i className="rounded-sm border-0 bg-pass/25" />os dois acertam</span>
        <span>tracejado: 2 Å · clique num ponto para abrir</span>
      </div>
    </div>
  )
}
