import type { ComplexDetail } from '../../../domain/entities'
import { classify } from '../../../domain/rmsd'
import { seedsOf } from '../../../domain/vina'
import { describeFit, f2 } from '../../format'
import { Box } from '../../ui/Box'
import { cn } from '../../ui/cn'
import { Note } from '../../ui/Text'
import { toneBorder } from '../../ui/tone'

const PRESSED = 'aria-pressed:border-x-docked aria-pressed:border-t-docked aria-pressed:bg-docked/18'

function Chip({ n, rmsd, selected, onClick }: { n: number; rmsd: number; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={selected} title={`RMSD ${f2(rmsd)} Å`} onClick={onClick}
      className={cn('min-w-[46px] cursor-pointer rounded-[5px] border border-b-[3px] border-line bg-paper px-1.5 pt-1 pb-[5px] text-center leading-tight text-ink', toneBorder(classify(rmsd)), PRESSED)}>
      <b className="block font-mono text-[13px] font-medium">{n}</b><small className="font-mono text-[11px]">{f2(rmsd)}</small>
    </button>
  )
}

const Group = ({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[128px_minmax(0,1fr)] items-center gap-3 border-t border-line px-3.5 py-2.5 first:border-t-0 max-[1180px]:grid-cols-1 max-[1180px]:gap-1.5">
    <div><b className="block font-semibold">{title}</b><small className="text-xs text-muted">{sub}</small></div>
    {children}
  </div>
)

interface Props {
  detail: ComplexDetail
  ddRank: number
  vinaSeed: number
  vinaPose: number
  onDiffDock: (rank: number) => void
  onSeed: (seed: number) => void
  onVina: (pose: number) => void
}

/** Pick which DiffDock / Vina pose is drawn; each chip is coloured by its RMSD to the crystal. */
export function PoseChips({ detail, ddRank, vinaSeed, vinaPose, onDiffDock, onSeed, onVina }: Props) {
  const d = detail.diffdock.find(p => p.rank === ddRank)
  const v = detail.vina.find(p => p.seed === vinaSeed && p.pose === vinaPose)
  const seeds = seedsOf(detail.vina)
  return (
    <Box>
      <Group title="DiffDock" sub="posição por confiança">
        <div className="flex flex-wrap gap-1.5">
          {detail.diffdock.map(p => <Chip key={p.rank} n={p.rank} rmsd={p.rmsd} selected={p.rank === ddRank} onClick={() => onDiffDock(p.rank)} />)}
          {!detail.diffdock.length && <Note>sem poses ainda</Note>}
        </div>
      </Group>
      <Group title="Vina" sub="execução e pose, por score">
        <div className="grid min-w-0 gap-2">
          <div role="group" aria-label="Execução do Vina" className="flex flex-wrap gap-1.5">
            {seeds.map(s => (
              <button key={s.seed} type="button" aria-pressed={s.seed === vinaSeed} onClick={() => onSeed(s.seed)} title="RMSD da pose 1 desta execução"
                className={cn('cursor-pointer rounded-[5px] border border-b-[3px] border-line bg-paper px-2.5 pt-[3px] pb-1 font-mono text-xs text-ink', toneBorder(classify(s.top)), PRESSED)}>
                seed {s.seed} · <b className="font-medium">{f2(s.top)}</b> Å
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detail.vina.filter(p => p.seed === vinaSeed).map(p => <Chip key={p.pose} n={p.pose} rmsd={p.rmsd} selected={p.pose === vinaPose} onClick={() => onVina(p.pose)} />)}
          </div>
          {!detail.vina.length && <Note>sem poses ainda</Note>}
        </div>
      </Group>
      <div className="grid gap-[3px] border-t border-line px-3.5 py-2.5 text-[13px] text-muted [&_b]:font-semibold [&_b]:text-ink">
        {d && (
          <span>
            <b>DiffDock, posição {d.rank}:</b> {f2(d.rmsd)} Å, {describeFit(d.rmsd)}
            {d.confidence !== null && <> · confiança {f2(d.confidence)}</>}.{' '}
            {d.rank === 1 ? 'É a pose que o DiffDock escolheria.' : 'O DiffDock escolheria a posição 1.'}
          </span>
        )}
        {v && (
          <span>
            <b>Vina, seed {v.seed}, pose {v.pose}:</b> {f2(v.rmsd)} Å, {describeFit(v.rmsd)} · score {f2(v.score)} kcal/mol.{' '}
            {v.pose === 1 ? 'É a pose que o Vina escolheria nesta execução.' : 'O Vina escolheria a pose 1.'}
          </span>
        )}
      </div>
    </Box>
  )
}
