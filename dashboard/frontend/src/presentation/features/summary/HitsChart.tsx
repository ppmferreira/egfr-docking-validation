import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Entry } from '../../../domain/benchmark'
import { HIT_THRESHOLD } from '../../../domain/rmsd'
import { f2 } from '../../format'
import { Segmented } from '../../ui/Segmented'

type Filter = 'all' | 'train' | 'blind'
const AXIS = { fill: 'var(--muted)', fontSize: 11 }

/** RMSD of each method for every finished complex; the dashed line is the 2 Å limit for a hit. */
export function HitsChart({ entries }: { entries: Entry[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const rows = useMemo(() => entries
    .filter(e => e.dd !== null && e.vina !== null && (filter === 'all' || e.group === filter))
    .map(e => ({ pdb: e.pdb, diffdock: e.dd!, vina: e.vina! })), [entries, filter])
  return (
    <div className="rounded-lg border border-line bg-panel p-3.5 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="m-0 max-w-[60ch] text-[13px] text-muted">
          Quanto menor a barra, mais perto do cristal. Abaixo da linha tracejada (2 Å) o método acertou. Para o Vina, a barra é a média das 3 seeds, e ele conta como acerto quando 2 de 3 seeds ficam até 2 Å: uma média mais alta ainda pode ser acerto.
        </p>
        <Segmented<Filter> label="Quais complexos mostrar" value={filter} onChange={setFilter}
          options={[{ value: 'all', label: 'Todos' }, { value: 'train', label: 'Clássicos' }, { value: 'blind', label: 'Cegos' }]} />
      </div>
      <div className="mt-3 h-80" role="img" aria-label="RMSD do DiffDock e do Vina por complexo">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barGap={2}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="pdb" tick={AXIS} stroke="var(--line)" tickLine={false} />
            <YAxis tick={AXIS} stroke="var(--line)" tickLine={false} width={44} label={{ value: 'RMSD (Å)', angle: -90, position: 'insideLeft', fill: 'var(--muted)', fontSize: 11 }} />
            <Tooltip cursor={{ fill: 'var(--docked)', fillOpacity: 0.08 }} formatter={(v) => `${f2(Number(v))} Å`}
              contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--ink)' }} labelStyle={{ color: 'var(--ink)', fontWeight: 600 }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
            <ReferenceLine y={HIT_THRESHOLD} stroke="var(--ink)" strokeDasharray="5 4" label={{ value: '2 Å', position: 'right', fill: 'var(--muted)', fontSize: 11 }} />
            <Bar dataKey="diffdock" name="DiffDock" fill="var(--docked)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="vina" name="Vina (média)" fill="var(--vina)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
