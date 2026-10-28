import { Target, TrendingDown, Trophy } from 'lucide-react'
import type { Dashboard } from '../../../domain/entities'
import { rankCompounds, summarizeRanking } from '../../../domain/ranking'
import { f2 } from '../../format'
import { Answer } from '../../ui/Answer'
import { Box, Pad } from '../../ui/Box'
import { Page } from '../../ui/Layout'
import { PageSection } from '../../ui/PageSection'
import { Stat } from '../../ui/Stat'
import { Takeaway } from '../../ui/Takeaway'
import { Note } from '../../ui/Text'
import { RankTable } from './RankTable'
import { ScoreScatter } from './ScoreScatter'

export default function DockingPage({ data }: { data: Dashboard }) {
  if (!data.docking.length) return <Page><Answer kind="warn" chip="Aguardando">O docking dos 16 compostos ainda não gerou resultados.</Answer></Page>
  const s = summarizeRanking(data.docking)
  const ranked = rankCompounds(data.docking)
  const rho = s.rho
  const verdict = rho === null ? null : rho <= -0.5 ? 'ok' : rho <= -0.3 ? 'warn' : 'fail'
  return (
    <Page className="gap-8">
      <Answer kind={verdict ?? 'warn'} chip={verdict === 'ok' ? 'Ordena' : verdict === 'warn' ? 'Fraca' : 'Não ordena'}>
        O score do Vina <b>não ordena estes {s.n} compostos pela potência medida</b>: dos {s.topOverlap.k} mais potentes, só {s.topOverlap.shared} {s.topOverlap.shared === 1 ? 'está' : 'estão'} entre os {s.topOverlap.k} melhores scores (ao acaso seria cerca de {s.topChance.toFixed(1)}).
        Acertar a pose, como no teste cego, não garante acertar a ordem dos compostos.
      </Answer>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Stat icon={<TrendingDown />} label="Correlação de Spearman" value={rho === null ? '–' : rho.toFixed(2).replace('-', '−')}
          caption={<>Entre o score e o pIC50. Perto de −1 seria ordem quase perfeita, perto de 0 não há relação. Com {s.n} compostos, um valor assim pode ser acaso.</>} />
        <Stat icon={<Trophy />} label={`Top ${s.topOverlap.k} em comum`} value={<>{s.topOverlap.shared} <span className="text-[16px] text-muted">de {s.topOverlap.k}</span></>}
          caption="Compostos que estão entre os mais potentes e também entre os melhores scores." />
        <Stat icon={<Target />} label="Faixa dos scores" value={<>{f2(s.scoreRange.best)} a {f2(s.scoreRange.worst)}</>}
          caption={<>kcal/mol. A potência vai de pIC50 {f2(s.potencyRange.worst)} a {f2(s.potencyRange.best)}.</>} />
      </div>

      <PageSection title="O score acompanha a potência?"
        intro="Cada ponto é um dos 16 compostos do ChEMBL encaixados na proteína. Os dois eixos crescem para “melhor”, então um método que funciona deixaria os pontos subindo na diagonal.">
        <Box><Pad><ScoreScatter rows={data.docking} /></Pad></Box>
        <Takeaway>Os pontos ficam espalhados, sem a diagonal. Esses 16 compostos servem para estudar o fluxo, não para escolher qual composto é melhor.</Takeaway>
      </PageSection>

      <PageSection title="Posição de cada composto nas duas listas"
        intro="Se o Vina ordenasse bem, cada composto ocuparia a mesma posição nas duas. A última coluna mostra quantos lugares ele ficou fora: verde até 2, amarelo até 5, vermelho acima disso.">
        <Box><RankTable rows={ranked} /></Box>
        <Note>Score mais negativo é melhor. Posição 1 é o melhor score na primeira lista e o composto mais potente na segunda. Diferença positiva (+5) quer dizer que o Vina colocou o composto 5 lugares acima do que a potência medida justifica; negativa, abaixo.</Note>
      </PageSection>
    </Page>
  )
}
