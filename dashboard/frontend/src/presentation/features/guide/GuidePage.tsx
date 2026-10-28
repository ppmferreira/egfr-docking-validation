import { useMemo } from 'react'
import type { TabId } from '../../../application/routes'
import type { Dashboard } from '../../../domain/entities'
import { summarizeFindings } from '../../../domain/findings'
import { Faq } from './Faq'
import { Findings } from './Findings'
import { Hero } from './Hero'
import { Journey } from './Journey'
import { Methods } from './Methods'
import { PanelMap } from './PanelMap'
import { Question } from './Question'
import { RmsdExplorer } from './RmsdExplorer'
import { ScreenTour } from './ScreenTour'
import { Toc } from './Toc'

/** "Comece aqui": the project explained from the question to the results, with the numbers kept up to date. */
export default function GuidePage({ data, onGo }: { data: Dashboard; onGo: (t: TabId) => void }) {
  const f = useMemo(() => summarizeFindings(data), [data])
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_190px]">
      <div className="grid min-w-0 gap-10">
        <div id="resumo-rapido" className="scroll-mt-[calc(var(--barh,72px)+16px)]"><Hero f={f} /></div>
        <Question />
        <Journey f={f} onGo={onGo} />
        <RmsdExplorer f={f} />
        <Methods />
        <Findings f={f} onGo={onGo} />
        <ScreenTour onGo={onGo} />
        <Faq f={f} />
        <PanelMap onGo={onGo} />
      </div>
      <Toc />
    </div>
  )
}
