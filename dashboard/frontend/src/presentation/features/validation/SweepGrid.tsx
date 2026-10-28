import type { SweepConfig } from '../../../domain/sweep'
import { classify } from '../../../domain/rmsd'
import { f2 } from '../../format'
import { cn } from '../../ui/cn'
import { tone } from '../../ui/tone'

const CELL = { ok: 'bg-pass/15', near: 'bg-warn/15', bad: 'bg-fail/15' } as const
/** Configuration the next tests reuse (see scripts/06 and 07). */
const CHOSEN = { box: 20, exhaustiveness: 32 }

const WATERS: Record<string, string> = { none: 'sem águas', near: 'águas perto do ligante', all: 'todas as águas' }

function Cell({ c, best }: { c: SweepConfig | undefined; best: boolean }) {
  if (!c) return <div className="rounded-md border border-dashed border-line p-3 text-center text-[13px] text-muted">–</div>
  const chosen = c.box === CHOSEN.box && c.exhaustiveness === CHOSEN.exhaustiveness
  return (
    <div className={cn('relative grid gap-0.5 rounded-md border p-3 text-center', CELL[classify(c.mean)], best ? 'border-ink' : 'border-line')}>
      <div className={cn('font-mono text-[20px] leading-tight font-medium', tone(classify(c.mean)))}>{f2(c.mean)}</div>
      <div className="text-[12px] text-muted">{c.pass} de {c.n} seeds ≤ 2 Å</div>
      {(best || chosen) && (
        <div className="mt-0.5 flex justify-center gap-1.5 text-[11px] font-medium">
          {best && <span className="rounded-[3px] bg-ink px-1.5 text-paper">melhor</span>}
          {chosen && <span className="rounded-[3px] border border-docked px-1.5 text-docked">usada depois</span>}
        </div>
      )}
    </div>
  )
}

/** Mean RMSD of Vina's pose 1 in the erlotinib sweep: one cell per box size × exhaustiveness. */
export function SweepGrid({ configs }: { configs: SweepConfig[] }) {
  const plain = configs.filter(c => c.waters === 'none')
  const boxes = [...new Set(plain.map(c => c.box))].sort((a, b) => a - b)
  const exs = [...new Set(plain.map(c => c.exhaustiveness))].sort((a, b) => a - b)
  const extra = configs.filter(c => c.waters !== 'none')
  const best = configs.reduce((a, b) => (b.mean < a.mean ? b : a))
  const at = (box: number, ex: number) => plain.find(c => c.box === box && c.exhaustiveness === ex)
  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto">
        <div className="grid min-w-[460px] gap-2" style={{ gridTemplateColumns: `88px repeat(${exs.length}, minmax(0, 1fr))` }}>
          <div className="self-end text-[12px] text-muted">caixa de busca</div>
          {exs.map(e => <div key={e} className="self-end text-center text-[12px] text-muted">exhaustiveness <b className="font-mono text-[13px] font-medium text-ink">{e}</b></div>)}
          {boxes.map(b => (
            <div key={b} className="contents">
              <div className="self-center font-mono text-[13px] font-medium">{b} Å</div>
              {exs.map(e => <Cell key={e} c={at(b, e)} best={at(b, e) === best} />)}
            </div>
          ))}
        </div>
      </div>
      {extra.length > 0 && (
        <div>
          <div className="mb-1.5 text-[13px] text-muted">Mesma caixa de 22 Å e exhaustiveness 32, mudando só as águas do cristal:</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2">
            {[at(22, 32), ...extra].filter((c): c is SweepConfig => !!c).map(c => (
              <div key={c.waters} className="grid gap-0.5">
                <div className="text-[12px] text-muted">{WATERS[c.waters] ?? c.waters}</div>
                <Cell c={c} best={c === best} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
