import { Crosshair, FlaskConical, Info, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Box } from '../../ui/Box'
import { PageSection } from '../../ui/PageSection'

const IDEAS: { icon: ReactNode; title: string; text: ReactNode }[] = [
  { icon: <FlaskConical />, title: 'EGFR', text: <>Proteína da superfície das células (uma quinase). Hiperativa, estimula o crescimento de certos tumores. <b>Erlotinibe</b>, <b>gefitinibe</b> e <b>lapatinibe</b> se encaixam no bolsão onde ela liga o ATP e a desligam.</> },
  { icon: <Crosshair />, title: 'Docking', text: <>Prever no computador <i>como</i> uma molécula se encaixa nesse bolsão e dar uma nota ao encaixe. A <b>triagem virtual</b> usa isso para ordenar muitas moléculas e escolher as mais promissoras.</> },
  { icon: <RotateCcw />, title: 'Redocking', text: <>O teste de confiança: pegar casos em que a resposta já é conhecida (o cristal mostra onde a molécula realmente fica) e conferir se o programa acerta. Só depois as notas de moléculas novas merecem alguma confiança.</> },
]

export function Question() {
  return (
    <PageSection id="pergunta" title="A pergunta do projeto"
      intro="Se o programa encaixa a molécula no lugar errado, a nota não significa nada e o ranking é ruído. Por isso o projeto testa o programa antes de confiar nele.">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
        {IDEAS.map(i => (
          <Box key={i.title} className="grid gap-2 p-4">
            <div className="flex items-center gap-2 text-docked [&_svg]:size-5"><span aria-hidden>{i.icon}</span><h3 className="m-0 text-base font-semibold text-ink">{i.title}</h3></div>
            <p className="m-0 text-[13px] text-muted [&_b]:font-semibold [&_b]:text-ink">{i.text}</p>
          </Box>
        ))}
      </div>
      <div className="flex gap-3 rounded-lg border border-docked/50 bg-docked/5 p-3.5 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-docked">
        <Info aria-hidden />
        <p className="m-0"><b>Este projeto não descobre um fármaco novo.</b> É uma demonstração retrospectiva: testar um fluxo de triagem com dados públicos e documentar onde ele funciona e onde não funciona.</p>
      </div>
    </PageSection>
  )
}
