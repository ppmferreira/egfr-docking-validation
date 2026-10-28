import type { Dashboard } from '../api'
import { Answer, Box } from '../components/Answer'
import { cls, f2, groupBy, mean } from '../lib/format'
import { verdict } from '../lib/summary'

function SweepChart({ data }: { data: Dashboard }) {
  const groups = Object.entries(groupBy(data.sweep.rows, r => `${r.waters}|${r.box_A}|${r.exhaustiveness}`)).map(([k, a]) => {
    const [w, b, e] = k.split('|')
    return { w, b: +b, e: +e, n: a.length, mean: mean(a.map(x => x.top_rmsd)), pass: a.filter(x => x.top_pass).length, best: Math.min(...a.map(x => x.best_rmsd)) }
  })
  if (!groups.length) return null
  const W = 640, rowH = 22, L = 150, H = groups.length * rowH + 30, mx = Math.max(10, ...groups.map(s => s.mean))
  const sc = (x: number) => L + (W - L - 20) * x / mx
  return (
    <>
      <Box title="RMSD médio da pose 1, por configuração">
        <div className="pad tablewrap">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 480, maxWidth: W }}>
            {groups.map((s, i) => {
              const y = 12 + i * rowH
              return (
                <g key={i}>
                  <text x={0} y={y + 11}>{s.w} · {s.b} Å · ex {s.e}</text>
                  <rect x={L} y={y} width={sc(s.mean) - L} height={14} fill={s.mean <= 2 ? 'var(--pass)' : 'var(--fail)'} opacity={0.8} />
                  <text x={sc(s.mean) + 6} y={y + 11}>{f2(s.mean)}</text>
                </g>
              )
            })}
            <line x1={sc(2)} x2={sc(2)} y1={4} y2={H - 14} stroke="var(--ink)" strokeDasharray="4 3" />
            <text x={sc(2) - 4} y={H - 2} textAnchor="end">2 Å</text>
          </svg>
        </div>
      </Box>
      <Box title="Tabela da varredura">
        <div className="tablewrap"><table>
          <thead><tr><th>Águas</th><th>Caixa Å</th><th>Exhaust.</th><th>Seeds</th><th>RMSD médio Å</th><th>Acertos</th><th>Melhor RMSD Å</th></tr></thead>
          <tbody>{groups.map((s, i) => (
            <tr key={i}><td>{s.w}</td><td>{s.b}</td><td>{s.e}</td><td>{s.n}</td><td className={cls(s.mean)}>{f2(s.mean)}</td><td>{s.pass}/{s.n}</td><td>{f2(s.best)}</td></tr>
          ))}</tbody>
        </table></div>
      </Box>
    </>
  )
}

export default function Validation({ data }: { data: Dashboard }) {
  const v = verdict(data)
  const dd = groupBy(data.diffdock, r => r.pdb)
  const vina = Object.fromEntries(v.ms.map(m => [m.pdb, m]))
  const byBox = Object.entries(groupBy(data.multi.rows, r => `${r.pdb}|${r.ligand}|${r.box_A}`))
  const sweepPct = 100 * data.sweep.rows.length / data.sweep.total
  return (
    <section>
      {!data.multi.rows.length
        ? <Answer kind="warn" chip="Rodando">Os testes em outros complexos ainda não produziram resultados.</Answer>
        : v.okAll
          ? <Answer kind="ok" chip="Passou">A configuração de caixa 20 Å acertou em todos os complexos.</Answer>
          : <Answer kind="fail" chip={v.complete ? 'Não passou' : 'Parcial'}>
              Com a caixa de 20 Å, <b>{v.nOk} de {v.ms.length}</b> estruturas tiveram pelo menos 2 seeds acertando.{' '}
              {v.complete ? 'O resultado no erlotinibe não se repete nos outros ligantes.' : `Faltam ${data.multi.total - data.multi.rows.length} execuções.`}
            </Answer>}
      <h2>Vina contra DiffDock</h2>
      <p className="lead">O mesmo teste nos mesmos complexos. O RMSD é a distância à pose do cristal, e vale a pose que cada método escolheria como a melhor (limite de 2 Å).</p>
      <Box title="Pose escolhida por cada método">
        <div className="tablewrap"><table>
          <thead><tr><th>Estrutura</th><th>Ligante</th><th>Vina RMSD Å</th><th>DiffDock RMSD Å</th><th>Melhor pose do DiffDock Å</th></tr></thead>
          <tbody>
            {Object.entries(dd).map(([pdb, a]) => {
              const r1 = a.find(r => r.rank === 1) ?? a[0], best = a.reduce((x, y) => (y.rmsd < x.rmsd ? y : x)), m = vina[pdb]
              return (
                <tr key={pdb}><td>{pdb}</td><td>{r1.ligand}</td><td className={m ? cls(m.mean) : ''}>{m ? f2(m.mean) : '–'}</td>
                  <td className={cls(r1.rmsd)}>{f2(r1.rmsd)}</td><td>{f2(best.rmsd)} (posição {best.rank})</td></tr>
              )
            })}
            {!data.diffdock.length && <tr><td colSpan={5}>Aguardando o DiffDock.</td></tr>}
          </tbody>
        </table></div>
        {data.diffdock.length > 0 && <div className="pad note"><b>Cuidado:</b> as estruturas 1M17, 4WKQ e 1XKK são antigas e provavelmente fazem parte dos dados de treino do DiffDock. O acerto aqui pode ser em parte memória do modelo. O teste que decide é com complexos publicados depois do treino dele.</div>}
      </Box>
      <h2>Outros complexos de EGFR (teste de generalização)</h2>
      <p className="lead">O mesmo protocolo (caixa e exhaustiveness fixados antes) aplicado a outras estruturas cristalográficas. Cada cartão é uma estrutura com 3 seeds do Vina.</p>
      <div className="cards">
        {v.ms.map(m => (
          <div className="box cx" key={m.pdb}>
            <div className="nm"><b>{m.pdb}</b><span className={`tag ${m.pass >= 2 ? 'ok' : m.mean <= 3 ? 'run' : 'bad'}`}>{m.pass >= 2 ? 'acertou' : m.mean <= 3 ? 'quase' : 'errou'}</span></div>
            <span className="note">{m.ligand}</span><div className={`big ${cls(m.mean)}`}>{f2(m.mean)} Å</div>
            <span className="note">RMSD médio da pose 1 · {m.pass} de {m.n} seeds ≤ 2 Å</span>
          </div>
        ))}
        {!v.ms.length && <div className="box pad note">Aguardando as primeiras execuções.</div>}
      </div>
      <Box title="Resultados por estrutura e caixa">
        <div className="tablewrap"><table>
          <thead><tr><th>Estrutura</th><th>Ligante</th><th>Caixa Å</th><th>RMSD médio Å</th><th>Acertos</th><th>Melhor pose</th></tr></thead>
          <tbody>
            {byBox.map(([k, a]) => {
              const [pdb, lig, box] = k.split('|'), m = mean(a.map(x => x.top_rmsd))
              return (
                <tr key={k}><td>{pdb}</td><td>{lig}</td><td>{box}</td><td className={cls(m)}>{f2(m)}</td>
                  <td>{a.filter(x => x.top_pass).length}/{a.length}</td>
                  <td>{f2(mean(a.map(x => x.best_rmsd)))} Å, posição {mean(a.map(x => x.best_rank)).toFixed(1)}</td></tr>
              )
            })}
            {!byBox.length && <tr><td colSpan={6}>Aguardando.</td></tr>}
          </tbody>
        </table></div>
      </Box>
      <h2>Varredura de parâmetros (só erlotinibe)</h2>
      <p className="lead">Quais configurações do Vina aproximam a pose 1 do cristal. A linha tracejada marca o limite de 2 Å. Ajustar no mesmo caso que se quer validar pode enganar, por isso o teste acima.</p>
      <Box title={data.sweep.done ? 'Varredura concluída' : `Varredura em andamento: ${data.sweep.rows.length} de ${data.sweep.total} execuções`}>
        <div className="pad"><div style={{ height: 10, background: 'var(--line)', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', width: `${sweepPct}%`, background: 'var(--docked)' }} /></div></div>
      </Box>
      <SweepChart data={data} />
    </section>
  )
}
