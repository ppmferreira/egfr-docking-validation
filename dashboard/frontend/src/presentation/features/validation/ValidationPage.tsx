import { assessValidation, countHits, listComplexes, seedRuns } from '../../../domain/benchmark'
import type { Dashboard } from '../../../domain/entities'
import { classify } from '../../../domain/rmsd'
import { summarizeSweep } from '../../../domain/sweep'
import { f2 } from '../../format'
import { Answer } from '../../ui/Answer'
import { Box, Pad } from '../../ui/Box'
import { Page } from '../../ui/Layout'
import { PageSection } from '../../ui/PageSection'
import { TableWrap } from '../../ui/TableWrap'
import { Takeaway } from '../../ui/Takeaway'
import { Note } from '../../ui/Text'
import { tone } from '../../ui/tone'
import { SeedStrip } from './SeedStrip'
import { SweepGrid } from './SweepGrid'

export default function ValidationPage({ data }: { data: Dashboard }) {
  const v = assessValidation(data)
  const sweep = summarizeSweep(data.sweep.rows)
  const runs = seedRuns(data).sort((a, b) => a.pdb.localeCompare(b.pdb) || a.box - b.box)
  const train = listComplexes(data).filter(e => e.group === 'train' && e.dd !== null)
  const hits = countHits(train)
  const best = sweep.length ? sweep.reduce((a, b) => (b.mean < a.mean ? b : a)) : null
  const worst = sweep.length ? Math.max(...sweep.map(s => s.mean)) : 0

  return (
    <Page className="gap-8">
      {!data.multi.rows.length
        ? <Answer kind="warn" chip="Rodando">Os testes em outros complexos ainda não produziram resultados.</Answer>
        : v.okAll
          ? <Answer kind="ok" chip="Passou">A configuração escolhida no erlotinibe acertou em todos os complexos.</Answer>
          : <Answer kind="fail" chip={v.complete ? 'Não passou' : 'Parcial'}>
              A configuração ajustada no erlotinibe (caixa de 20 Å) só acertou <b>{v.nOk} de {v.ms.length}</b> estruturas. {v.complete
                ? 'O resultado do erlotinibe não se repete nos outros ligantes.'
                : `Faltam ${data.multi.total - data.multi.rows.length} execuções.`}
            </Answer>}

      <PageSection title="1. Qual configuração do Vina funciona melhor?"
        intro={<>Testamos 14 combinações de tamanho da caixa de busca, exhaustiveness (esforço da busca) e águas do cristal, só no erlotinibe (1M17). Cada célula é a média de 3 seeds, e <b className="font-semibold text-ink">menor é melhor</b>: o número é a distância da pose 1 ao ligante do cristal, em Å.</>}>
        {sweep.length > 0 ? (
          <>
            <Box title={data.sweep.done ? 'Varredura concluída' : `Em andamento: ${data.sweep.rows.length} de ${data.sweep.total} execuções`}>
              <Pad><SweepGrid configs={sweep} /></Pad>
            </Box>
            {best && (
              <Takeaway>
                {best.mean <= 2
                  ? <>A melhor configuração ficou em <b>{f2(best.mean)} Å</b>, dentro do limite de 2 Å.</>
                  : <>Nenhuma configuração chegou a 2 Å na média. A melhor foi caixa de <b>{best.box} Å</b> com exhaustiveness <b>{best.exhaustiveness}</b> ({f2(best.mean)} Å) e a pior, {f2(worst)} Å. A média sofre porque uma seed errada, sozinha, puxa o valor para cima.</>}
              </Takeaway>
            )}
          </>
        ) : <Box padded><Note>Aguardando a varredura.</Note></Box>}
      </PageSection>

      <PageSection title="2. A configuração escolhida repete o acerto em outros complexos?"
        intro="Usamos a caixa de 20 Å (e exhaustiveness 32), fixadas antes do teste, em três estruturas de EGFR. Cada ponto é uma seed. Ponto verde dentro da faixa verde é uma seed que acertou."
      >
        {runs.length > 0 ? (
          <>
            <Box title="RMSD de cada seed do Vina"><Pad><SeedStrip runs={runs} /></Pad></Box>
            <Takeaway>
              Com a caixa de 20 Å, <b>{v.nOk} de {v.ms.length}</b> estruturas tiveram pelo menos 2 seeds acertando.{' '}
              {v.ms.filter(m => m.pass < 2).map(m => `${m.pdb} ficou em ${f2(m.mean)} Å`).join(' e ')}{v.ms.some(m => m.pass < 2) && ': perto do limite, mas fora.'}
            </Takeaway>
          </>
        ) : <Box padded><Note>Aguardando as primeiras execuções.</Note></Box>}
      </PageSection>

      <PageSection title="3. E o DiffDock nos mesmos complexos?"
        intro="O DiffDock não usa caixa nem ajuste: recebe a proteína e o ligante e propõe poses. Vale a pose que ele mesmo considera a melhor (maior confiança).">
        <Box title="Pose escolhida por cada método">
          <TableWrap><table className="data-table">
            <thead><tr><th>Estrutura</th><th>Ligante</th><th>DiffDock Å</th><th>Vina Å (média das seeds)</th><th>Seeds do Vina ≤ 2 Å</th></tr></thead>
            <tbody>
              {train.map(e => (
                <tr key={e.pdb}>
                  <td>{e.pdb}</td><td>{e.lig}</td>
                  <td className={tone(classify(e.dd!))}>{f2(e.dd)}</td>
                  <td className={e.vina !== null ? tone(classify(e.vina)) : ''}>{e.vina !== null ? f2(e.vina) : '–'}</td>
                  <td>{e.vpass !== null ? `${e.vpass} de ${e.vn}` : '–'}</td>
                </tr>
              ))}
              {!train.length && <tr><td colSpan={5}>Aguardando o DiffDock.</td></tr>}
            </tbody>
          </table></TableWrap>
        </Box>
        {train.length > 0 && (
          <>
            <Takeaway>O DiffDock acertou <b>{hits.diffdock} de {hits.n}</b> e o Vina, <b>{hits.vina} de {hits.n}</b>.</Takeaway>
            <Note className="max-w-[78ch]"><b>Cuidado:</b> 1M17, 4WKQ e 1XKK são antigas e provavelmente estão nos dados de treino do DiffDock, então o acerto dele pode ser em parte memória. O teste que decide é o cego, com estruturas publicadas depois do treino (tela Complexos).</Note>
          </>
        )}
      </PageSection>
    </Page>
  )
}
