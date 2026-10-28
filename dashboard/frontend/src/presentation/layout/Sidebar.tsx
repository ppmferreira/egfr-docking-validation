import type { ReactNode } from 'react'
import type { TabId } from '../../application/routes'
import { TAB_GROUPS, TAB_TITLES } from '../navigation'
import { cn } from '../ui/cn'

interface Props { current: TabId; onGo: (t: TabId) => void; badge: (id: TabId) => ReactNode }

export function Sidebar({ current, onGo, badge }: Props) {
  return (
    <nav role="tablist" aria-label="Seções do painel"
      className="sticky top-[var(--barh,72px)] grid max-h-[calc(100vh-var(--barh,72px))] gap-[18px] self-start overflow-y-auto py-5 pb-6 max-[860px]:static max-[860px]:flex max-[860px]:max-h-none max-[860px]:gap-1.5 max-[860px]:overflow-x-auto max-[860px]:border-b max-[860px]:border-line max-[860px]:py-2.5 max-[860px]:pb-1">
      {TAB_GROUPS.map(([name, ids]) => (
        <div key={name} className="grid gap-px max-[860px]:flex max-[860px]:flex-none max-[860px]:gap-0.5">
          <div className="px-2.5 pb-[5px] font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase max-[860px]:hidden">{name}</div>
          {ids.map(id => (
            <button key={id} type="button" role="tab" aria-selected={current === id} onClick={() => onGo(id)}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between gap-2 rounded-r border-l-2 border-transparent bg-transparent px-2.5 py-[7px] text-left text-[13.5px] font-medium text-muted hover:bg-docked/[0.07] hover:text-ink',
                'max-[860px]:w-auto max-[860px]:rounded-none max-[860px]:border-b-2 max-[860px]:border-l-0 max-[860px]:whitespace-nowrap',
                current === id && 'border-docked bg-docked/12 text-ink',
              )}>
              <span>{TAB_TITLES[id]}</span>
              <i className="inline-flex items-center font-mono text-[11px] font-medium text-muted not-italic empty:hidden">{badge(id)}</i>
            </button>
          ))}
        </div>
      ))}
    </nav>
  )
}
