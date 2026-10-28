import { useMemo } from 'react'
import type { TabId } from '../../../application/routes'
import { listComplexes } from '../../../domain/benchmark'
import type { Dashboard } from '../../../domain/entities'
import { ago } from '../../format'
import { PageSection } from '../../ui/PageSection'
import { Glossary } from './Glossary'
import { HitsChart } from './HitsChart'
import { OverviewCards } from './OverviewCards'
import { PhaseCards } from './PhaseCards'

/** The project in numbers: where the pipeline stands, how each method did, what changed lately. */
export default function SummaryPage({ data, onGo }: { data: Dashboard; onGo: (t: TabId) => void }) {
  const entries = useMemo(() => listComplexes(data), [data])
  return (
    <div className="grid gap-8">
      <OverviewCards data={data} />
      <PageSection title="Acerto de cada método, por complexo" intro="O resultado dos dois métodos nos mesmos complexos. A comparação não é de igual para igual: o Vina recebe a posição do bolsão.">
        <HitsChart entries={entries} />
      </PageSection>
      <PageSection title="Etapas do projeto" intro="Cada etapa muda de estado sozinha quando o script termina de escrever seus arquivos.">
        <PhaseCards steps={data.steps} onGo={onGo} />
      </PageSection>
      <PageSection title="Atividade recente">
        <ul className="m-0 list-none overflow-hidden rounded-lg border border-line bg-panel p-0">
          {data.activity.map(a => (
            <li key={a.file} className="flex justify-between gap-3 border-t border-line px-3.5 py-2 font-mono text-xs first:border-t-0">
              <span className="break-all">{a.file}</span><span className="whitespace-nowrap text-muted">{ago(a.age)}</span>
            </li>
          ))}
          {!data.activity.length && <li className="px-3.5 py-2 text-muted">Sem arquivos ainda.</li>}
        </ul>
      </PageSection>
      <PageSection title="Glossário"><Glossary /></PageSection>
    </div>
  )
}
