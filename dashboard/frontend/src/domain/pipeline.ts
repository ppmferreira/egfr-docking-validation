import type { Step } from './entities'

/** The pipeline in three phases, so the Resumo can show where the project is without listing 15 stages flat. */
export const PHASES: { title: string; blurb: string; ids: string[] }[] = [
  { title: 'Preparação', blurb: 'Proteína, dados de laboratório e moléculas', ids: ['01', '02', '03', '04'] },
  { title: 'Validação do docking', blurb: 'O protocolo acerta onde a resposta é conhecida?', ids: ['04b', '04c', '04d', '06', '07', '08', '09'] },
  { title: 'Enriquecimento', blurb: 'O score separa ativos de inativos?', ids: ['10', '11', '12', '13'] },
]

export interface PhaseSummary { title: string; blurb: string; steps: Step[]; done: number; total: number; running: boolean }

export function summarizePhases(steps: Step[]): PhaseSummary[] {
  return PHASES.map(p => {
    const inPhase = p.ids.map(id => steps.find(s => s.id === id)).filter((s): s is Step => !!s)
    return { title: p.title, blurb: p.blurb, steps: inPhase, done: inPhase.filter(s => s.status === 'done').length, total: inPhase.length, running: inPhase.some(s => s.status === 'running') }
  })
}

/** Share of the stages that are finished, counting a running stage by how far along it is. */
export function overallProgress(steps: Step[]): number {
  if (!steps.length) return 0
  const part = (s: Step) => (s.status === 'done' ? 1 : s.status === 'running' && s.progress ? s.progress.done / s.progress.total : 0)
  return steps.reduce((a, s) => a + part(s), 0) / steps.length
}
