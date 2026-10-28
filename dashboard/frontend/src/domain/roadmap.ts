import type { Step, StepStatus } from './entities'

export type Phase = 'ciência' | 'dados' | 'entrega'

interface Definition {
  id: string
  title: string
  why: string
  doneWhen: string[]
  /** Pipeline stages whose state decides this item's state. */
  stages: string[]
  /** Items that must be finished first. */
  after?: string[]
  command?: string
  area: Phase
  link?: 'cx' | 'valid' | 'dock' | 'chem'
  /** Set when the work is not a script (writing, decisions): it is judged by a file or by hand. */
  manual?: StepStatus
}

const DEFINITIONS: Definition[] = [
  {
    id: 'protocol', area: 'ciência', title: 'Validar o protocolo de docking em mais de um complexo', link: 'cx', stages: ['04d', '06', '08'],
    why: 'Sem acertar a pose de fármacos conhecidos, os scores de moléculas novas não significam nada.',
    doneWhen: ['Redocking em complexos clássicos e em complexos publicados depois do treino do DiffDock', 'Critérios de seleção fixados antes de rodar', 'Resultado por complexo e por seed registrado'],
  },
  {
    id: 'library', area: 'dados', title: 'Montar ativos, inativos medidos e decoys', stages: ['10', '11'],
    why: 'Os 16 compostos foram escolhidos pela potência, sem controle negativo. Sem inativos, não dá para medir se o docking separa ativos de inativos.',
    doneWhen: ['Ativos (IC50 ≤ 100 nM) e inativos medidos (IC50 ≥ 10 µM) do ChEMBL', 'Decoys com propriedades parecidas e estrutura diferente dos ativos', 'Regras fixadas antes de qualquer docking'],
    command: 'python scripts/10_enrichment_data.py && python scripts/11_decoys.py',
  },
  {
    id: 'screen', area: 'ciência', title: 'Rodar o docking da biblioteca inteira', stages: ['12'], after: ['library', 'protocol'], link: 'dock',
    why: 'É o experimento principal: o mesmo receptor e o mesmo protocolo validado, aplicados a todos os ativos, inativos e decoys.',
    doneWhen: ['Todos os ligantes com score, ou falhas contadas por classe', 'Ordem embaralhada, para que uma execução parcial ainda seja uma amostra justa'],
    command: 'python scripts/12_enrichment_dock.py',
  },
  {
    id: 'metrics', area: 'ciência', title: 'Medir o desempenho: ROC AUC, PR-AUC e EF1%', stages: ['13'], after: ['screen'],
    why: 'Compara o ranking do Vina com um controle trivial, o número de átomos pesados. Se o controle empatar, o docking não acrescenta nada.',
    doneWhen: ['AUC e fator de enriquecimento com intervalo de confiança (bootstrap)', 'Diferença do Vina para o controle com intervalo de confiança', 'Três tarefas: contra decoys, contra inativos medidos e contra os dois'],
    command: 'python scripts/13_enrichment_analysis.py',
  },
  {
    id: 'chembl', area: 'dados', title: 'Corrigir a coleta do ChEMBL', stages: ['10'], link: 'chem',
    why: 'A coleta original lia só os primeiros 500 registros, sem ordenação, misturando EGFR selvagem e mutante.',
    doneWhen: ['Coleta paginada completa, só ensaios bioquímicos de EGFR humana', 'Sem sinalizadores de validade de dado'],
  },
  {
    id: 'improve', area: 'ciência', title: 'Melhorar o docking, se a análise pedir', stages: [], after: ['metrics'], manual: 'pending',
    why: 'A medição mostrou que o Vina não separa ativos de decoys (AUC perto de 0,5). Antes de trocar de método, vale testar o que pode estar atrapalhando: o receptor escolhido, a seed e o esforço de busca, a protonação das moléculas e a escolha dos decoys.',
    doneWhen: ['Repetir com mais seeds e exhaustiveness maior, e com um segundo receptor', 'Testar decoys do DUD-E, se o site estiver acessível', 'Testar um re-scoring ou um score de aprendizado de máquina contra o mesmo controle de tamanho', 'Decisão registrada: o protocolo atual basta ou precisa mudar'],
  },
  {
    id: 'report', area: 'entrega', title: 'Fechar o relatório e o repositório', stages: ['09', '13'], after: ['metrics'],
    why: 'O resultado precisa ser reproduzível por quem não estava aqui: números gerados dos arquivos, não digitados.',
    doneWhen: ['REPORT.md com tabelas geradas por script', 'README atualizado, licença, sem arquivos Zone.Identifier'],
    command: 'python scripts/09_report_figures.py',
  },
]

export type ItemStatus = 'done' | 'running' | 'pending' | 'blocked'

export interface RoadmapItem extends Omit<Definition, 'manual'> {
  status: ItemStatus
  progress: { done: number; total: number } | null
  blockedBy: string[]
}

/** Each roadmap item's state follows its pipeline stages; an item whose prerequisites are unfinished is blocked. */
export function buildRoadmap(steps: Step[]): RoadmapItem[] {
  const byId = new Map(steps.map(s => [s.id, s]))
  const own = new Map<string, { status: ItemStatus; progress: RoadmapItem['progress'] }>()
  for (const d of DEFINITIONS) {
    const st = d.stages.map(id => byId.get(id)).filter((s): s is Step => !!s)
    const status: ItemStatus = d.manual ?? (!st.length ? 'pending' : st.every(s => s.status === 'done') ? 'done' : st.some(s => s.status === 'running' || s.status === 'done') ? 'running' : 'pending')
    own.set(d.id, { status, progress: st.find(s => s.status === 'running')?.progress ?? null })
  }
  return DEFINITIONS.map(({ manual: _manual, ...d }) => {
    const mine = own.get(d.id)!
    const blockedBy = (d.after ?? []).filter(id => own.get(id)?.status !== 'done')
    return { ...d, progress: mine.progress, blockedBy, status: mine.status === 'pending' && blockedBy.length ? 'blocked' : mine.status }
  })
}

export const titleOf = (id: string): string => DEFINITIONS.find(d => d.id === id)?.title ?? id
