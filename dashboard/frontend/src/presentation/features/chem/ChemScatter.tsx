import { CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { LIPINSKI, POTENCY, potencyOf, type PotencyId } from '../../../domain/compounds'
import type { Compound } from '../../../domain/entities'
import { f2 } from '../../format'
import { POTENCY_COLOR } from './potency'

const AXIS = { fill: 'var(--muted)', fontSize: 11 }

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Compound }[] }) {
  const c = active && payload?.[0]?.payload
  if (!c) return null
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-[12px] shadow-md">
      <div className="font-mono font-semibold">{c.chembl_id}</div>
      <div className="text-muted">massa {f2(c.MW)} Da · logP {f2(c.logP)}</div>
      <div className="text-muted">pIC50 {f2(c.pIC50)} (IC50 {c.ic50_nM >= 1000 ? Math.round(c.ic50_nM) : c.ic50_nM.toPrecision(3)} nM)</div>
    </div>
  )
}

/** Molecular weight against logP, one colour per potency band; the shaded area is where Lipinski's rule of five is met. */
export function ChemScatter({ compounds, shown, docked }: { compounds: Compound[]; shown: Set<PotencyId>; docked: Set<string> }) {
  const xs = compounds.map(c => c.MW), ys = compounds.map(c => c.logP)
  const x0 = Math.floor(Math.min(...xs) / 50) * 50, x1 = Math.ceil(Math.max(...xs) / 50) * 50
  const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys))
  return (
    <div className="h-[420px]" role="img" aria-label="Peso molecular contra logP dos compostos, coloridos pela potência">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 20, bottom: 28, left: 4 }}>
          <CartesianGrid stroke="var(--line)" />
          <ReferenceArea x1={x0} x2={LIPINSKI.mw} y1={y0} y2={LIPINSKI.logP} fill="var(--pass)" fillOpacity={0.07} stroke="none" ifOverflow="hidden" />
          <XAxis type="number" dataKey="MW" domain={[x0, x1]} tick={AXIS} stroke="var(--line)"
            label={{ value: 'massa molecular (Da)', position: 'bottom', offset: 8, fill: 'var(--muted)', fontSize: 11 }} />
          <YAxis type="number" dataKey="logP" domain={[y0, y1]} ticks={Array.from({ length: Math.floor((y1 - y0) / 2) + 1 }, (_, i) => y0 + 2 * i)} tick={AXIS} stroke="var(--line)" width={40}
            label={{ value: 'logP (lipofilicidade)', angle: -90, position: 'insideLeft', fill: 'var(--muted)', fontSize: 11 }} />
          <ReferenceLine x={LIPINSKI.mw} stroke="var(--ink)" strokeDasharray="4 3" strokeOpacity={0.55} label={{ value: '500 Da', position: 'insideTopRight', fill: 'var(--muted)', fontSize: 11 }} />
          <ReferenceLine y={LIPINSKI.logP} stroke="var(--ink)" strokeDasharray="4 3" strokeOpacity={0.55} label={{ value: 'logP 5', position: 'insideTopLeft', fill: 'var(--muted)', fontSize: 11 }} />
          <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'var(--muted)' }} content={<Tip />} />
          {[...POTENCY].reverse().filter(p => shown.has(p.id)).map(p => (
            <Scatter key={p.id} name={p.label} data={compounds.filter(c => potencyOf(c.pIC50) === p.id && !docked.has(c.chembl_id))}
              fill={POTENCY_COLOR[p.id]} fillOpacity={0.9} isAnimationActive={false} />
          ))}
          <Scatter name="Docados" data={compounds.filter(c => docked.has(c.chembl_id) && shown.has(potencyOf(c.pIC50)))}
            fill="var(--crystal)" stroke="var(--ink)" strokeWidth={1.5} shape="diamond" isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
