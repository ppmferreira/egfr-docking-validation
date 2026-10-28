import { cls } from '../../lib/format'
import { f2 } from '../../lib/format'
import type { Entry } from '../../lib/summary'

function Num({ v }: { v: number | null }) {
  return v === null ? <span className="n">–</span> : <span className={`n ${cls(v)}`}>{f2(v)}</span>
}

function Group({ title, items, current, onPick }: { title: string; items: Entry[]; current: string | null; onPick: (pdb: string) => void }) {
  if (!items.length) return null
  return (
    <>
      <div className="cxgt"><span>{title}</span><span>DiffDock</span><span>Vina</span></div>
      {items.map(e => {
        const disabled = e.skipped || e.pending
        return (
          <button key={e.pdb} type="button" className="cxrow" aria-pressed={e.pdb === current} disabled={disabled}
            title={e.name} onClick={() => onPick(e.pdb)}>
            <span><b>{e.pdb}</b><small>{e.skipped ? 'descartado' : e.pending ? 'aguardando' : e.lig}</small></span>
            {disabled ? <span className="w" /> : <><Num v={e.dd} /><Num v={e.vina} /></>}
          </button>
        )
      })}
    </>
  )
}

export function ComplexList({ entries, current, onPick }: { entries: Entry[]; current: string | null; onPick: (pdb: string) => void }) {
  return (
    <div className="box cxlist">
      <h3>Complexos</h3>
      <Group title="Treino" items={entries.filter(e => e.group === 'train')} current={current} onPick={onPick} />
      <Group title="Cegos (pós-2021)" items={entries.filter(e => e.group === 'blind')} current={current} onPick={onPick} />
    </div>
  )
}
