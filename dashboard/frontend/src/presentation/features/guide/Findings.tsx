import { ArrowLeftRight, Gauge, History, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TabId } from '../../../application/routes'
import type { Findings as FindingsData } from '../../../domain/findings'
import { f2 } from '../../format'
import { Box } from '../../ui/Box'
import { Button } from '../../ui/Button'
import { PageSection } from '../../ui/PageSection'

const list = (xs: string[]) => (xs.length ? xs.join(', ') : 'nenhum')

function Finding({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Box className="flex gap-3 p-4">
      <span className="pt-0.5 text-docked [&_svg]:size-5" aria-hidden>{icon}</span>
      <div className="grid gap-1">
        <h3 className="m-0 text-base font-semibold">{title}</h3>
        <p className="m-0 max-w-[80ch] text-[13px] text-muted [&_b]:font-semibold [&_b]:text-ink">{children}</p>
      </div>
    </Box>
  )
}

/** What the tests showed, and what they do not allow us to say. */
export function Findings({ f, onGo }: { f: FindingsData; onGo: (t: TabId) => void }) {
  const { train, blind, blindMisses, seedSpread, vinaTrain } = f
  const trainMisses = vinaTrain.filter(m => m.pass < 2)
  return (
    <PageSection id="achados" title="O que encontramos">
      <div className="grid gap-3">
        <Finding icon={<Gauge />} title="O Vina acerta bem quando o bolsão é conhecido, mas não sempre">
          Nos complexos novos acertou {blind.vina} de {blind.n}. Nos {train.n} clássicos, só {train.vina} de {train.n}
          {trainMisses.length > 0 && <>: {trainMisses.map(m => `${m.pdb} (${f2(m.mean)} Å)`).join(' e ')} ficaram fora do limite de 2 Å</>}.
          {seedSpread && <> As execuções do mesmo complexo também divergem: em <b>{seedSpread.pdb}</b>, as 3 seeds deram {seedSpread.seeds.map(f2).join(', ')} Å. Por isso olhamos a média e quantas seeds acertam, não uma execução só.</>}
        </Finding>
        <Finding icon={<ArrowLeftRight />} title="O DiffDock acerta sem receber o bolsão, mas erra mais nos complexos novos">
          Acertou {train.diffdock} de {train.n} nos clássicos e {blind.diffdock} de {blind.n} nos novos. Errou: <b>{list(blindMisses.diffdock)}</b>. O Vina errou: <b>{list(blindMisses.vina)}</b>.
          {blindMisses.diffdock.some(x => blindMisses.vina.includes(x)) && <> Quando os dois erram o mesmo complexo, vale abrir o 3D para ver o que há de diferente nele.</>}
        </Finding>
        <Finding icon={<History />} title="Acertar o encaixe não basta para ordenar moléculas">
          Mesmo com o Vina acertando muitos encaixes, o score dele quase não acompanha a potência medida em laboratório (ρ = {f.compounds.spearman === null ? '–' : f2(f.compounds.spearman)} em {f.compounds.n} moléculas).
          O teste de pose responde se o programa coloca a molécula no lugar certo; ordenar por potência é outra pergunta, que o teste de enriquecimento tenta responder.
        </Finding>
      </div>
      <div className="rounded-lg border border-warn/60 bg-warn/5 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="m-0 flex items-center gap-2 text-[15px] font-semibold text-warn"><TriangleAlert className="size-4" aria-hidden />O que ainda não dá para concluir</h3>
          <Button href="#cx" onNavigate={e => { e.preventDefault(); onGo('cx') }}>Ver os complexos</Button>
        </div>
        <ul className="m-0 grid list-disc gap-1.5 pl-5 text-[13px] [&_b]:font-semibold">
          <li><b>Amostra pequena.</b> São {train.n} + {blind.n} complexos. Um complexo a mais ou a menos muda bastante a porcentagem.</li>
          <li><b>Comparação desigual.</b> O Vina recebe o bolsão e o DiffDock não. Não dá para dizer que um método é melhor que o outro em geral.</li>
          <li><b>Memória do DiffDock.</b> Nos clássicos o acerto pode ser parcialmente memorização; só os cegos descartam isso.</li>
          <li><b>Receptor simplificado.</b> Usamos só a cadeia A de cada estrutura e, na maioria dos testes, sem águas.</li>
          <li><b>Potência.</b> Os scores dos 16 compostos ainda não ordenam moléculas de forma útil.</li>
        </ul>
      </div>
    </PageSection>
  )
}
