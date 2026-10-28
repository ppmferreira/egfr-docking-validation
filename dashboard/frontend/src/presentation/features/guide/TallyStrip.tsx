import type { Findings } from '../../../domain/findings'
import { f2 } from '../../format'
import { cn } from '../../ui/cn'
import { Tip } from '../../ui/Tip'

type Row = Findings['tally'][number]

function Cell({ hit, label }: { hit: boolean; label: string }) {
  return (
    <Tip label={label}>
      <span tabIndex={0} role="img" aria-label={label} className={cn('size-5 rounded-[5px] outline-offset-2', hit ? 'bg-pass/90' : 'bg-fail')} />
    </Tip>
  )
}

function Line({ name, rows, pick }: { name: string; rows: Row[]; pick: (r: Row) => { hit: boolean; text: string } }) {
  const groups: [string, Row[]][] = [['treino', rows.filter(r => r.group === 'train')], ['cegos', rows.filter(r => r.group === 'blind')]]
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="w-[74px] font-mono text-[12.5px] text-muted">{name}</span>
      {groups.map(([g, items]) => items.length > 0 && (
        <div key={g} className="flex items-center gap-1">
          <span className="pr-1 text-xs text-muted">{g}</span>
          {items.map(r => { const p = pick(r); return <Cell key={r.pdb} hit={p.hit} label={`${r.pdb} · ${r.lig}: ${p.text}`} /> })}
        </div>
      ))}
    </div>
  )
}

/** One square per complex and method: green when the method got the pose right, red when it did not. */
export function TallyStrip({ tally }: { tally: Row[] }) {
  return (
    <div className="grid gap-2.5" aria-label="Acertos por complexo">
      <Line name="DiffDock" rows={tally} pick={r => ({ hit: r.ddHit, text: `${f2(r.dd)} Å` })} />
      <Line name="Vina" rows={tally} pick={r => ({ hit: r.vinaHit, text: `média ${f2(r.vina)} Å` })} />
    </div>
  )
}
