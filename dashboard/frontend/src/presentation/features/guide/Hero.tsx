import { FlaskConical, Microscope, Brain, TrendingDown } from 'lucide-react'
import type { Findings } from '../../../domain/findings'
import { f2 } from '../../format'
import { CountUp } from '../../ui/CountUp'
import { Stat } from '../../ui/Stat'
import { TallyStrip } from './TallyStrip'

/** The whole story at a glance: the verdict, four numbers, and a square per complex for each method. */
export function Hero({ f }: { f: Findings }) {
  const total = f.train.n + f.blind.n
  const ddHits = f.train.diffdock + f.blind.diffdock
  const vinaHits = f.train.vina + f.blind.vina
  return (
    <div className="grid gap-5 rounded-lg border border-line bg-panel p-4 sm:p-6">
      <div className="grid gap-2.5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-fail px-2.5 py-0.5 text-[12.5px] font-medium text-fail"><FlaskConical className="size-3.5" aria-hidden />{f.ranking ? 'Ranking não validado' : 'Validação parcial'}</span>
        <h1 className="m-0 max-w-[30ch] text-[22px] leading-tight font-semibold tracking-tight sm:text-[28px]">{f.ranking
          ? 'Os métodos encaixam bem a molécula, mas o score do Vina não separa ativos de decoys.'
          : 'Os dois métodos acertam muitos encaixes, mas nenhum acerta todos.'}</h1>
        <p className="m-0 max-w-[70ch] text-muted">
          {f.ranking
            ? <>Acertar onde a molécula fica (a pose) e ordenar moléculas por atividade são perguntas diferentes. A primeira deu resultado bom; a segunda, não: AUC <b className="text-ink">{f2(f.ranking.aucDecoys)}</b> contra decoys, onde 0,50 é o acaso. Os scores ainda não servem para priorizar moléculas.</>
            : <>O resultado muda conforme o complexo testado. Por isso os scores dos <b className="text-ink">{f.compounds.n} compostos</b> ainda não devem ser usados para ordenar moléculas.</>}
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(165px,1fr))] gap-3">
        <Stat icon={<Brain />} label="DiffDock acertou" value={<><CountUp value={ddHits} />/{total}</>} caption={`${f.train.diffdock}/${f.train.n} clássicos · ${f.blind.diffdock}/${f.blind.n} cegos`} />
        <Stat icon={<Microscope />} label="Vina acertou" value={<><CountUp value={vinaHits} />/{total}</>} caption={`${f.train.vina}/${f.train.n} clássicos · ${f.blind.vina}/${f.blind.n} cegos`} />
        <Stat icon={<FlaskConical />} label="Vina no erlotinibe, pose 1" value={f.erlotinib ? `${f2(f.erlotinib.top)} Å` : '–'}
          caption={f.erlotinib ? `a pose certa estava em ${f.erlotinib.bestPose}º, a ${f2(f.erlotinib.best)} Å` : 'sem resultado'} />
        {f.ranking
          ? <Stat icon={<TrendingDown />} label="Ranking: AUC contra decoys" value={f2(f.ranking.aucDecoys)} caption={`IC 95% ${f2(f.ranking.lo)} a ${f2(f.ranking.hi)} · 0,50 é acaso`} />
          : <Stat icon={<TrendingDown />} label="Score × potência (ρ)" value={f.compounds.spearman === null ? '–' : f2(f.compounds.spearman)} caption={`${f.compounds.n} moléculas: relação fraca`} />}
      </div>
      <div>
        <p className="mb-2 text-[13px] text-muted">Cada quadrado é um complexo. Verde: o método acertou; vermelho: errou. Passe o mouse para ver qual.</p>
        <TallyStrip tally={f.tally} />
      </div>
    </div>
  )
}
