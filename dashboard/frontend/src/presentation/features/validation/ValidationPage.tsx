import { assessValidation } from '../../../domain/benchmark'
import type { Dashboard } from '../../../domain/entities'
import { classify } from '../../../domain/rmsd'
import { groupBy, mean } from '../../../domain/stats'
import { summarizeSweep } from '../../../domain/sweep'
import { f2 } from '../../format'
import { Answer } from '../../ui/Answer'
import { Box, Pad } from '../../ui/Box'
import { Page } from '../../ui/Layout'
import { Tag } from '../../ui/Tag'
import { TableWrap } from '../../ui/TableWrap'
import { Lead, Note } from '../../ui/Text'
import { cn } from '../../ui/cn'
import { tone } from '../../ui/tone'
import { SweepChart, SweepProgress } from './SweepChart'

export default function ValidationPage({ data }: { data: Dashboard }) {
  const v = assessValidation(data)
  const byPdb = groupBy(data.diffdock, r => r.pdb)
  const vinaOf = Object.fromEntries(v.ms.map(m => [m.pdb, m]))
  const byBox = Object.entries(groupBy(data.multi.rows, r => `${r.pdb}|${r.ligand}|${r.box_A}`))
  const sweep = summarizeSweep(data.sweep.rows)
  return (
    <Page>
      {!data.multi.rows.length
        ? <Answer kind="warn" chip="Rodando">Os testes em outros complexos ainda não produziram resultados.</Answer>
        : v.okAll
          ? <Answer kind="ok" chip="Passou">A configuração de caixa 20 Å acertou em todos os complexos.</Answer>
          : <Answer kind="fail" chip={v.complete ? 'Não passou' : 'Parcial'}>
              Com a caixa de 20 Å, <b>{v.nOk} de {v.ms.length}</b> estruturas tiveram pelo menos 2 seeds acertando.{' '}
              {v.complete ? 'O resultado no erlotinibe não se repete nos outros ligantes.' : `Faltam ${data.multi.total - data.multi.rows.length} execuções.`}
            </Answer>}

      <h2 className="m-0 text-base font-semibold">Vina contra DiffDock</h2>
      <Lead>O mesmo teste nos mesmos complexos. O RMSD é a distância à pose do cristal, e vale a pose que cada método escolheria como a melhor (limite de 2 Å).</Lead>
      <Box title="Pose escolhida por cada método">
        <TableWrap><table className="data-table">
          <thead><tr><th>Estrutura</th><th>Ligante</th><th>Vina RMSD Å</th><th>DiffDock RMSD Å</th><th>Melhor pose do DiffDock Å</th></tr></thead>
          <tbody>
            {Object.entries(byPdb).map(([pdb, a]) => {
              const r1 = a.find(r => r.rank === 1) ?? a[0], best = a.reduce((x, y) => (y.rmsd < x.rmsd ? y : x)), m = vinaOf[pdb]
              return (
                <tr key={pdb}><td>{pdb}</td><td>{r1.ligand}</td>
                  <td className={m ? tone(classify(m.mean)) : ''}>{m ? f2(m.mean) : '–'}</td>
                  <td className={tone(classify(r1.rmsd))}>{f2(r1.rmsd)}</td><td>{f2(best.rmsd)} (posição {best.rank})</td></tr>
              )
            })}
            {!data.diffdock.length && <tr><td colSpan={5}>Aguardando o DiffDock.</td></tr>}
          </tbody>
        </table></TableWrap>
        {data.diffdock.length > 0 && <Pad><Note><b>Cuidado:</b> as estruturas 1M17, 4WKQ e 1XKK são antigas e provavelmente fazem parte dos dados de treino do DiffDock. O acerto aqui pode ser em parte memória do modelo. O teste que decide é com complexos publicados depois do treino dele.</Note></Pad>}
      </Box>

      <h2 className="m-0 text-base font-semibold">Outros complexos de EGFR (teste de generalização)</h2>
      <Lead>O mesmo protocolo (caixa e exhaustiveness fixados antes) aplicado a outras estruturas cristalográficas. Cada cartão é uma estrutura com 3 seeds do Vina.</Lead>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
        {v.ms.map(m => (
          <Box key={m.pdb} className="grid gap-1.5 p-3.5">
            <div className="flex items-baseline justify-between gap-2"><b className="font-mono text-[15px] font-medium">{m.pdb}</b><Tag kind={m.pass >= 2 ? 'ok' : m.mean <= 3 ? 'run' : 'bad'}>{m.pass >= 2 ? 'acertou' : m.mean <= 3 ? 'quase' : 'errou'}</Tag></div>
            <Note>{m.ligand}</Note>
            <div className={cn('font-mono text-[26px] font-medium tracking-[-0.02em]', tone(classify(m.mean)))}>{f2(m.mean)} Å</div>
            <Note>RMSD médio da pose 1 · {m.pass} de {m.n} seeds ≤ 2 Å</Note>
          </Box>
        ))}
        {!v.ms.length && <Box padded><Note>Aguardando as primeiras execuções.</Note></Box>}
      </div>
      <Box title="Resultados por estrutura e caixa">
        <TableWrap><table className="data-table">
          <thead><tr><th>Estrutura</th><th>Ligante</th><th>Caixa Å</th><th>RMSD médio Å</th><th>Acertos</th><th>Melhor pose</th></tr></thead>
          <tbody>
            {byBox.map(([k, a]) => {
              const [pdb, lig, box] = k.split('|'), m = mean(a.map(x => x.top_rmsd))
              return (
                <tr key={k}><td>{pdb}</td><td>{lig}</td><td>{box}</td><td className={tone(classify(m))}>{f2(m)}</td>
                  <td>{a.filter(x => x.top_pass).length}/{a.length}</td>
                  <td>{f2(mean(a.map(x => x.best_rmsd)))} Å, posição {mean(a.map(x => x.best_rank)).toFixed(1)}</td></tr>
              )
            })}
            {!byBox.length && <tr><td colSpan={6}>Aguardando.</td></tr>}
          </tbody>
        </table></TableWrap>
      </Box>

      <h2 className="m-0 text-base font-semibold">Varredura de parâmetros (só erlotinibe)</h2>
      <Lead>Quais configurações do Vina aproximam a pose 1 do cristal. A linha tracejada marca o limite de 2 Å. Ajustar no mesmo caso que se quer validar pode enganar, por isso o teste acima.</Lead>
      <Box title={data.sweep.done ? 'Varredura concluída' : `Varredura em andamento: ${data.sweep.rows.length} de ${data.sweep.total} execuções`}>
        <SweepProgress done={data.sweep.rows.length} total={data.sweep.total} />
      </Box>
      {sweep.length > 0 && (
        <>
          <Box title="RMSD médio da pose 1, por configuração"><Pad><TableWrap><SweepChart configs={sweep} /></TableWrap></Pad></Box>
          <Box title="Tabela da varredura">
            <TableWrap><table className="data-table">
              <thead><tr><th>Águas</th><th>Caixa Å</th><th>Exhaust.</th><th>Seeds</th><th>RMSD médio Å</th><th>Acertos</th><th>Melhor RMSD Å</th></tr></thead>
              <tbody>{sweep.map((s, i) => (
                <tr key={i}><td>{s.waters}</td><td>{s.box}</td><td>{s.exhaustiveness}</td><td>{s.n}</td><td className={tone(classify(s.mean))}>{f2(s.mean)}</td><td>{s.pass}/{s.n}</td><td>{f2(s.best)}</td></tr>
              ))}</tbody>
            </table></TableWrap>
          </Box>
        </>
      )}
    </Page>
  )
}
