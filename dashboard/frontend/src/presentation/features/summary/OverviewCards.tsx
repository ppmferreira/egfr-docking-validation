import type { Dashboard } from '../../../domain/entities'
import { summarizeFindings } from '../../../domain/findings'
import { overallProgress } from '../../../domain/pipeline'
import { f2 } from '../../format'
import { CountUp } from '../../ui/CountUp'
import { Stat } from '../../ui/Stat'

/** Four numbers that say where the project stands. */
export function OverviewCards({ data }: { data: Dashboard }) {
  const f = summarizeFindings(data)
  const done = data.steps.filter(s => s.status === 'done').length
  const lib = f.enrichment
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      <Stat label="Etapas do pipeline" value={<><CountUp value={done} />/{data.steps.length}</>} progress={overallProgress(data.steps)}
        caption={data.steps.some(s => s.status === 'running') ? 'uma etapa está rodando' : 'concluídas'} />
      <Stat label="Complexos testados" value={<CountUp value={f.train.n + f.blind.n} />} caption={`${f.train.n} clássicos · ${f.blind.n} cegos (2022 em diante)`} />
      {f.ranking
        ? <Stat label="Ranking: AUC contra decoys" value={f2(f.ranking.aucDecoys)} caption={`${lib?.total ?? 0} moléculas docadas · 0,50 é acaso, 1,00 é perfeito`} />
        : <Stat label="Biblioteca de enriquecimento" value={lib && lib.total ? <><CountUp value={lib.done} />/{lib.total}</> : '–'}
            progress={lib && lib.total ? lib.done / lib.total : undefined}
            caption={lib?.status === 'running' ? 'moléculas docadas até agora' : lib?.status === 'done' ? 'docking concluído' : 'ainda não iniciada'} />}
      <Stat label="Compostos do ChEMBL" value={<span className="inline-flex items-baseline gap-2">236<span className="font-sans text-sm text-muted">únicos</span></span>} caption={`${f.compounds.n} no docking inicial`} />
    </div>
  )
}
