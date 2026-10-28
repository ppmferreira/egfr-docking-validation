import { CheckSquare, Square } from 'lucide-react'
import type { TabId } from '../../../application/routes'
import { titleOf, type ItemStatus, type RoadmapItem } from '../../../domain/roadmap'
import { AccordionItem } from '../../ui/Accordion'
import { Button } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { Progress } from '../../ui/Progress'
import { StatusIcon } from '../../ui/StatusIcon'
import { CommandBox } from './CommandBox'

const STATUS: Record<ItemStatus, { label: string; cls: string }> = {
  done: { label: 'Concluído', cls: 'border-pass bg-pass/12 text-pass' },
  running: { label: 'Em andamento', cls: 'border-warn text-warn' },
  pending: { label: 'Pendente', cls: 'border-line text-muted' },
  blocked: { label: 'Aguardando', cls: 'border-line text-muted' },
}
const AREA = { ciência: 'Ciência', dados: 'Dados', entrega: 'Entrega' } as const
const CHIP = 'rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap'

export function RoadmapItemCard({ item, index, onGo }: { item: RoadmapItem; index: number; onGo: (t: TabId) => void }) {
  const st = STATUS[item.status]
  const checked = item.status === 'done'
  const aside = (
    <span className="hidden gap-1.5 sm:flex">
      <span className={cn(CHIP, 'border-line text-muted')}>{AREA[item.area]}</span>
      <span className={cn(CHIP, st.cls)}>{st.label}</span>
    </span>
  )
  const title = (
    <span className="flex items-center gap-3">
      <StatusIcon status={item.status} className="size-5" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{index + 1}. {item.title}</span>
        {item.status === 'running' && item.progress && (
          <span className="mt-1 flex max-w-[360px] items-center gap-2"><Progress value={100 * item.progress.done / item.progress.total} className="flex-1" label={item.title} /><span className="font-mono text-[11.5px] font-normal text-muted">{item.progress.done}/{item.progress.total}</span></span>
        )}
      </span>
    </span>
  )
  return (
    <AccordionItem value={item.id} title={title} aside={aside} className="mb-2.5 overflow-hidden rounded-lg border! border-line bg-panel last:mb-0">
      <div className="grid gap-3.5">
        <p className="m-0 max-w-[78ch]">{item.why}</p>
        <div>
          <div className="mb-1 font-mono text-[11px] tracking-[0.08em] text-muted uppercase">Pronto quando</div>
          <ul className="m-0 grid list-none gap-1 p-0">
            {item.doneWhen.map(c => (
              <li key={c} className="flex items-start gap-2 text-ink">
                {checked ? <CheckSquare className="mt-px size-4 shrink-0 text-pass" aria-hidden /> : <Square className="mt-px size-4 shrink-0 text-muted" aria-hidden />}{c}
              </li>
            ))}
          </ul>
        </div>
        {item.blockedBy.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5"><span>Depende de:</span>{item.blockedBy.map(id => <span key={id} className={cn(CHIP, 'border-line text-ink')}>{titleOf(id)}</span>)}</div>
        )}
        {item.command && item.status !== 'done' && <CommandBox command={item.command} />}
        {item.link && <Button className="-ml-2 w-fit" href={`#${item.link}`} onNavigate={e => { e.preventDefault(); onGo(item.link!) }}>Ver resultados</Button>}
      </div>
    </AccordionItem>
  )
}
