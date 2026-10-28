import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { potencyOf, type ChemSummary } from '../../../domain/compounds'
import { POTENCY_COLOR } from './potency'

const AXIS = { fill: 'var(--muted)', fontSize: 11 }

/** How many compounds fall in each pIC50 unit. */
export function PotencyHistogram({ bins }: { bins: ChemSummary['histogram'] }) {
  const data = bins.map(b => ({ ...b, label: `${b.from}–${b.from + 1}` }))
  return (
    <div className="h-[240px]" role="img" aria-label="Número de compostos por faixa de pIC50">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="var(--line)" tickLine={false} label={{ value: 'pIC50 (maior = mais potente)', position: 'bottom', offset: 4, fill: 'var(--muted)', fontSize: 11 }} />
          <YAxis tick={AXIS} stroke="var(--line)" tickLine={false} width={36} allowDecimals={false} label={{ value: 'compostos', angle: -90, position: 'insideLeft', fill: 'var(--muted)', fontSize: 11 }} />
          <Tooltip cursor={{ fill: 'var(--docked)', fillOpacity: 0.08 }} formatter={v => [`${v} compostos`, '']} separator=""
            contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--ink)' }} labelStyle={{ color: 'var(--ink)', fontWeight: 600 }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map(b => <Cell key={b.from} fill={POTENCY_COLOR[potencyOf(b.from + 0.5)]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
