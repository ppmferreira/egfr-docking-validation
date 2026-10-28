import { useState } from 'react'
import type { Entry } from '../../../domain/benchmark'
import { classify } from '../../../domain/rmsd'
import { f2 } from '../../format'
import { Box } from '../../ui/Box'
import { cn } from '../../ui/cn'
import { Segmented } from '../../ui/Segmented'
import { tone } from '../../ui/tone'
import { OverviewChart } from './OverviewChart'

const COLS = 'grid grid-cols-[1fr_52px_52px] gap-x-2'

const Num = ({ v }: { v: number | null }) =>
  v === null ? <span className="text-right font-mono text-[13px] font-medium">–</span> : <span className={cn('text-right font-mono text-[13px] font-medium', tone(classify(v)))}>{f2(v)}</span>

interface GroupProps { title: string; items: Entry[]; current: string | null; onPick: (pdb: string) => void }

function Group({ title, items, current, onPick }: GroupProps) {
  if (!items.length) return null
  return (
    <>
      <div className={cn(COLS, 'sticky top-0 z-1 border-t border-line bg-paper px-3 pt-[9px] pb-[5px] font-mono text-[11px] font-medium text-muted [&>span+span]:text-right')}>
        <span>{title}</span><span>DiffDock</span><span>Vina</span>
      </div>
      {items.map(e => {
        const disabled = e.skipped || e.pending
        return (
          <button key={e.pdb} type="button" aria-pressed={e.pdb === current} disabled={disabled} title={e.name} onClick={() => onPick(e.pdb)}
            className={cn(COLS, 'w-full cursor-pointer items-baseline border-t border-l-[3px] border-line border-l-transparent bg-transparent py-2 pr-3 pl-[9px] text-left text-ink hover:bg-docked/[0.07] aria-pressed:border-l-docked aria-pressed:bg-docked/13 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent')}>
            <span><b className="font-mono text-[13.5px] font-medium">{e.pdb}</b><small className="block text-xs font-normal text-muted">{e.skipped ? 'descartado' : e.pending ? 'aguardando' : e.lig}</small></span>
            {disabled ? <span className="col-span-2" /> : <><Num v={e.dd} /><Num v={e.vina} /></>}
          </button>
        )
      })}
    </>
  )
}

interface Props { entries: Entry[]; current: string | null; onPick: (pdb: string) => void }
type View = 'list' | 'chart'

export function ComplexList({ entries, current, onPick }: Props) {
  const [view, setView] = useState<View>('list')
  return (
    <Box className="sticky top-[calc(var(--barh,72px)+14px)] max-h-[calc(100vh-var(--barh,72px)-28px)] overflow-y-auto max-[1180px]:static max-[1180px]:max-h-[260px]">
      <div className="flex items-center justify-between border-b border-line py-1.5 pr-2.5 pl-3.5">
        <h3 className="m-0 font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase">Complexos</h3>
        <Segmented<View> label="Forma de ver os complexos" value={view} onChange={setView} options={[{ value: 'list', label: 'Lista' }, { value: 'chart', label: 'Mapa' }]} />
      </div>
      {view === 'list' ? (
        <>
          <Group title="Treino" items={entries.filter(e => e.group === 'train')} current={current} onPick={onPick} />
          <Group title="Cegos (pós-2021)" items={entries.filter(e => e.group === 'blind')} current={current} onPick={onPick} />
        </>
      ) : <OverviewChart entries={entries} current={current} onPick={onPick} />}
    </Box>
  )
}
