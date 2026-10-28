import type { Dashboard, EnrichPoint, EnrichTask } from '../../../domain/entities'
import { f2 } from '../../format'
import { Answer } from '../../ui/Answer'
import { Box, Pad } from '../../ui/Box'
import { Grid, Page } from '../../ui/Layout'
import { TableWrap } from '../../ui/TableWrap'

const W = 300, H = 260, m = { l: 40, r: 10, t: 10, b: 36 }
const X = (v: number) => m.l + (W - m.l - m.r) * v
const Y = (v: number) => H - m.b - (H - m.t - m.b) * v
const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join('')

/** ROC curve of the Vina score and of the size-only baseline for one task. */
function Roc({ task }: { task: EnrichTask }) {
  const vina = task.scorers.find(s => s.name === 'Vina')!, base = task.scorers.find(s => s.name.startsWith('Heavy'))!
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }} role="img" aria-label={task.name}>
      {[0, 0.5, 1].map(v => <g key={v}>
        <line x1={X(v)} x2={X(v)} y1={m.t} y2={H - m.b} stroke="var(--line)" /><text x={X(v)} y={H - m.b + 14} textAnchor="middle">{v}</text>
        <line x1={m.l} x2={W - m.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" /><text x={m.l - 6} y={Y(v) + 4} textAnchor="end">{v}</text>
      </g>)}
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="var(--muted)" strokeDasharray="3 3" />
      <path d={path(base.roc)} fill="none" stroke="var(--muted)" strokeWidth={1.8} strokeDasharray="6 3" />
      <path d={path(vina.roc)} fill="none" stroke="var(--docked)" strokeWidth={2.4} />
      <text x={(W + m.l) / 2} y={H - 4} textAnchor="middle">falsos positivos</text>
      <text transform={`translate(11 ${H / 2}) rotate(-90)`} textAnchor="middle">ativos recuperados</text>
    </svg>
  )
}

const CLASSES: { id: EnrichPoint['label']; name: string; color: string }[] = [
  { id: 'active', name: 'ativos', color: 'var(--pass)' }, { id: 'inactive', name: 'inativos medidos', color: 'var(--warn)' }, { id: 'decoy', name: 'decoys', color: 'var(--muted)' },
]

/** Vina score of every docked compound, one column per class. */
function Strip({ points }: { points: EnrichPoint[] }) {
  const w = 420, h = 280, mm = { l: 44, r: 12, t: 12, b: 40 }
  const lo = Math.floor(Math.min(...points.map(p => p.score))), hi = Math.ceil(Math.max(...points.map(p => p.score)))
  const Yv = (v: number) => mm.t + (h - mm.t - mm.b) * (v - hi) / (lo - hi)
  const colW = (w - mm.l - mm.r) / CLASSES.length
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w }} role="img" aria-label="Score do Vina por classe">
      {Array.from({ length: hi - lo + 1 }, (_, i) => hi - i).map(v => <g key={v}><line x1={mm.l} x2={w - mm.r} y1={Yv(v)} y2={Yv(v)} stroke="var(--line)" /><text x={mm.l - 6} y={Yv(v) + 4} textAnchor="end">{v}</text></g>)}
      {CLASSES.map((c, ci) => {
        const pts = points.filter(p => p.label === c.id), cx = mm.l + colW * (ci + 0.5)
        const med = [...pts].map(p => p.score).sort((a, b) => a - b)[Math.floor(pts.length / 2)]
        return <g key={c.id}>
          {pts.map((p, i) => <circle key={i} cx={cx + ((i * 37) % 100 - 50) / 100 * colW * 0.8} cy={Yv(p.score)} r={2.6} fill={c.color} opacity={0.55} />)}
          <line x1={cx - colW * 0.42} x2={cx + colW * 0.42} y1={Yv(med)} y2={Yv(med)} stroke="var(--ink)" strokeWidth={2}><title>mediana {med}</title></line>
          <text x={cx} y={h - 20} textAnchor="middle">{c.name}</text><text x={cx} y={h - 6} textAnchor="middle" fill="var(--muted)">n = {pts.length} · mediana {f2(med)}</text>
        </g>
      })}
      <text transform={`translate(11 ${h / 2}) rotate(-90)`} textAnchor="middle">score do Vina (kcal/mol)</text>
    </svg>
  )
}

export default function EnrichmentPage({ data }: { data: Dashboard }) {
  const e = data.enrichment
  if (!e) return <Page><Answer kind="no" chip="Aguardando">A análise de enriquecimento ainda não rodou (<code>scripts/13_enrichment_analysis.py</code>).</Answer></Page>
  const a = e.tasks[0], b = e.tasks[1], c = e.tasks[2]
  const vA = a.scorers[0]
  return (
    <Page>
      <Answer kind="fail" chip="Não separa">
        Contra decoys, o Vina acerta pouco mais que um sorteio: <b>AUC {f2(vA.auc)}</b> (IC 95% {f2(vA.lo)} a {f2(vA.hi)}; 0,50 é acaso). O ranking pelo Vina <b>não prioriza</b> os ativos nesta biblioteca.
        Contra inativos medidos, o número de átomos sozinho ({f2(b.scorers[2].auc)}) vence o Vina ({f2(b.scorers[0].auc)}): os inativos são menores, e o Vina em parte só mede tamanho.
      </Answer>
      <Grid>
        {e.tasks.map(t => (
          <Box key={t.name} title={t.name}>
            <Pad>
              <Roc task={t} />
              <p className="m-0 mt-2 text-[12px] text-muted">
                <b style={{ color: 'var(--docked)' }}>Vina</b> · <b>tracejado</b>: só contar átomos pesados · {t.n_pos} ativos × {t.n_neg} controles
              </p>
            </Pad>
          </Box>
        ))}
      </Grid>
      <Grid>
        <Box title="Onde cada classe cai no score (mais negativo = melhor)"><Pad><Strip points={e.points} /></Pad></Box>
        <Box title="Métricas (IC 95% por bootstrap)">
          <TableWrap><table className="data-table">
            <thead><tr><th>Tarefa</th><th>Método</th><th>AUC</th><th>EF1%</th><th>EF5%</th></tr></thead>
            <tbody>{[a, b, c].flatMap(t => t.scorers.map((s, i) => (
              <tr key={t.name + s.name}><td>{i === 0 ? t.name.split(':')[0] : ''}</td><td>{s.name}</td>
                <td>{f2(s.auc)} <span className="text-muted">({f2(s.lo)}–{f2(s.hi)})</span></td><td>{s.ef1.toFixed(1)}</td><td>{s.ef5.toFixed(1)}</td></tr>
            )))}</tbody>
          </table></TableWrap>
          <Pad className="text-[12px] text-muted">
            A: ativos × decoys · B: ativos × inativos medidos · C: ambos. EF máximo possível: {a.ef_max.toFixed(0)} (A), {b.ef_max.toFixed(0)} (B), {c.ef_max.toFixed(0)} (C), por isso a AUC é a métrica principal.
            Correlação entre score e nº de átomos: {f2(e.spearman_size)}.
          </Pad>
        </Box>
      </Grid>
      <Box title="Como ler, e o que limita a conclusão">
        <Pad className="grid gap-2 text-[13px]">
          <p className="m-0"><b>AUC</b>: chance de um ativo sortear um score melhor que um controle. 0,5 = acaso; 1 = perfeito.</p>
          <p className="m-0">Limites: um único receptor (9BY4), uma seed e exhaustiveness 8; decoys do ChEMBL (não DUD-E), assumidos inativos; SMILES neutros, sem protonação; docking com a caixa no sítio do ligante cristalográfico. Docking não mede afinidade.</p>
        </Pad>
      </Box>
    </Page>
  )
}
