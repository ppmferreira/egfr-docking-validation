import type { Entry } from '../../../domain/benchmark'
import { classify, isHit } from '../../../domain/rmsd'
import { f2 } from '../../format'
import { cn } from '../../ui/cn'
import { tone } from '../../ui/tone'

function Tile({ label, value, caption }: { label: string; value: number | null; caption: string }) {
  return (
    <div className="min-w-[156px] rounded-lg border border-line bg-panel px-3.5 pt-2 pb-2.5">
      <small className="block font-mono text-[11px] text-muted">{label}</small>
      <strong className={cn('block font-mono text-[26px] leading-[1.2] font-medium tracking-[-0.02em]', value !== null && tone(classify(value)))}>{value === null ? '–' : `${f2(value)} Å`}</strong>
      <span className="text-[12.5px] text-muted">{caption}</span>
    </div>
  )
}

export function ComplexHeader({ entry }: { entry: Entry }) {
  const origin = entry.group === 'train'
    ? 'Estrutura antiga, provavelmente nos dados de treino do DiffDock.'
    : `Publicada depois do treino do DiffDock${entry.res ? ` · ${entry.res} Å de resolução` : ''}.`
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-7 gap-y-2.5">
      <div>
        <h2 className="m-0 text-2xl leading-[1.15] font-semibold tracking-tight">{entry.pdb}<span className="ml-2 text-[15px] font-normal text-muted">{entry.lig}</span></h2>
        <div className="mt-1 max-w-[52ch] text-[13px] text-muted">{origin}</div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Tile label="DiffDock · pose 1" value={entry.dd} caption={entry.dd === null ? 'sem resultado' : isHit(entry.dd) ? 'acertou' : 'errou'} />
        <Tile label={`Vina · média de ${entry.vn ?? 3} seeds`} value={entry.vina} caption={entry.vn ? `${entry.vpass} de ${entry.vn} seeds ≤ 2 Å` : 'sem resultado'} />
      </div>
    </div>
  )
}
