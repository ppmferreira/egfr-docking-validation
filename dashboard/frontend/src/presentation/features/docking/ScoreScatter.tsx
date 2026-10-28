import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { DockRow } from '../../../domain/entities'
import { f2 } from '../../format'

const AXIS = { fill: 'var(--muted)', fontSize: 11 }

function Tip({ active, payload }: { active?: boolean; payload?: { payload: DockRow }[] }) {
  const r = active && payload?.[0]?.payload
  if (!r) return null
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-[12px] shadow-md">
      <div className="font-mono font-semibold">{r.chembl_id}</div>
      <div className="text-muted">score do Vina {f2(r.vina_score_kcal_mol)} kcal/mol</div>
      <div className="text-muted">pIC50 {f2(r.pIC50)} (IC50 {r.ic50_nM >= 1000 ? Math.round(r.ic50_nM) : r.ic50_nM.toPrecision(3)} nM)</div>
    </div>
  )
}

/** Vina score against measured pIC50. The score axis is flipped so that "better" is up and to the right on both axes:
 *  a scoring function that works would put the dots along the rising diagonal. */
export function ScoreScatter({ rows }: { rows: DockRow[] }) {
  const xs = rows.map(r => r.vina_score_kcal_mol), ys = rows.map(r => r.pIC50)
  const xd: [number, number] = [Math.floor(Math.min(...xs)), Math.ceil(Math.max(...xs))]
  const yd: [number, number] = [Math.floor(Math.min(...ys)), Math.ceil(Math.max(...ys))]
  return (
    <div className="h-[340px]" role="img" aria-label="Score do Vina contra pIC50 medido, 16 compostos">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, bottom: 28, left: 4 }}>
          <CartesianGrid stroke="var(--line)" />
          <XAxis type="number" dataKey="vina_score_kcal_mol" reversed domain={xd} tickCount={xd[1] - xd[0] + 1} allowDecimals={false} tick={AXIS} stroke="var(--line)"
            label={{ value: '← pior   score do Vina (kcal/mol)   melhor →', position: 'bottom', offset: 8, fill: 'var(--muted)', fontSize: 11 }} />
          <YAxis type="number" dataKey="pIC50" domain={yd} tickCount={yd[1] - yd[0] + 1} allowDecimals={false} tick={AXIS} stroke="var(--line)" width={44}
            label={{ value: 'potência medida (pIC50) →', angle: -90, position: 'insideLeft', fill: 'var(--muted)', fontSize: 11 }} />
          <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'var(--muted)' }} content={<Tip />} />
          <Scatter data={rows} fill="var(--docked)" fillOpacity={0.85} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
