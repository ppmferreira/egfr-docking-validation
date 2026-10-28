import type { Dashboard } from '../api'
import { Answer, Box } from '../components/Answer'
import { f2 } from '../lib/format'

function Scatter({ rows }: { rows: Dashboard['docking'] }) {
  if (!rows.length) return <>Sem dados.</>
  const W = 420, H = 300, m = { l: 44, r: 12, t: 12, b: 38 }
  const xs = rows.map(r => r.vina_score_kcal_mol), ys = rows.map(r => r.pIC50)
  const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs)), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys))
  const X = (v: number) => m.l + (W - m.l - m.r) * (v - x0) / (x1 - x0)
  const Y = (v: number) => H - m.b - (H - m.t - m.b) * (v - y0) / (y1 - y0)
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
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

export default function Docking({ data }: { data: Dashboard }) {
  const rows = [...data.docking].sort((a, b) => a.vina_score_kcal_mol - b.vina_score_kcal_mol)
  return (
    <section>
      <Answer kind="warn" chip="Cuidado">Estes scores <b>ainda não são confiáveis</b>, porque o protocolo não foi validado. Servem para estudar o fluxo, não para concluir qual composto é melhor.</Answer>
      <div className="grid">
        <Box title="Score do Vina × pIC50"><div className="pad"><Scatter rows={data.docking} /></div></Box>
        <Box title="16 compostos, do melhor ao pior score">
          <div className="tablewrap"><table>
            <thead><tr><th>ChEMBL</th><th>Score</th><th>pIC50</th><th>IC50 nM</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.chembl_id}><td>{r.chembl_id}</td><td>{f2(r.vina_score_kcal_mol)}</td><td>{f2(r.pIC50)}</td>
                <td>{r.ic50_nM >= 1000 ? Math.round(r.ic50_nM) : r.ic50_nM.toPrecision(3)}</td></tr>
            ))}</tbody>
          </table></div>
        </Box>
      </div>
    </section>
  )
}
