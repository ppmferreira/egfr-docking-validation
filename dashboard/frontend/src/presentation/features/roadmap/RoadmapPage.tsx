import { useMemo, useState } from 'react'
import type { TabId } from '../../../application/routes'
import type { Dashboard } from '../../../domain/entities'
import { buildRoadmap } from '../../../domain/roadmap'
import { Accordion } from '../../ui/Accordion'
import { Progress } from '../../ui/Progress'
import { Segmented } from '../../ui/Segmented'
import { RoadmapItemCard } from './RoadmapItemCard'

type Filter = 'all' | 'open' | 'done'

/** What is left to do. Each item's state is read from the pipeline, so it changes by itself as scripts finish. */
export default function RoadmapPage({ data, onGo }: { data: Dashboard; onGo: (t: TabId) => void }) {
  const items = useMemo(() => buildRoadmap(data.steps), [data.steps])
  const [filter, setFilter] = useState<Filter>('all')
  const done = items.filter(i => i.status === 'done').length
  const running = items.filter(i => i.status === 'running').length
  const shown = items.filter(i => filter === 'all' || (filter === 'done') === (i.status === 'done'))
  const firstOpen = items.find(i => i.status !== 'done')?.id
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-lg border border-line bg-panel p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
          <h1 className="m-0 text-[22px] font-semibold tracking-tight sm:text-[28px]">{done} de {items.length} itens concluídos</h1>
          <span className="text-muted">{running ? `${running} em andamento agora` : 'nada rodando agora'}</span>
        </div>
        <Progress value={100 * done / items.length} tone="pass" className="h-2" label="Itens concluídos" />
        <p className="m-0 max-w-[74ch] text-muted">O que falta, em ordem. As primeiras etapas decidem se o resto tem valor científico. O estado de cada item vem dos arquivos que os scripts escrevem; não é preenchido à mão.</p>
      </div>
      <Segmented<Filter> label="Filtrar itens" value={filter} onChange={setFilter}
        options={[{ value: 'all', label: 'Todos' }, { value: 'open', label: 'Em aberto' }, { value: 'done', label: 'Concluídos' }]} />
      <Accordion key={filter} type="single" defaultValue={shown.find(i => i.id === firstOpen)?.id} bare>
        {shown.map(item => <RoadmapItemCard key={item.id} item={item} index={items.indexOf(item)} onGo={onGo} />)}
      </Accordion>
      {!shown.length && <p className="m-0 text-muted">Nenhum item neste filtro.</p>}
    </div>
  )
}
