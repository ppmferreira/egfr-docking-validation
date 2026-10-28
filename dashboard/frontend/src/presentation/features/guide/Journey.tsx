import type { ReactNode } from 'react'
import type { TabId } from '../../../application/routes'
import type { Findings } from '../../../domain/findings'
import { f2 } from '../../format'
import { Button } from '../../ui/Button'
import { PageSection } from '../../ui/PageSection'
import { Progress } from '../../ui/Progress'
import { StatusIcon } from '../../ui/StatusIcon'

interface StepData { title: string; script: string; what: string; result: ReactNode; go?: [TabId, string]; running?: { done: number; total: number } }

const WATERS: Record<string, string> = { none: 'sem águas', near: 'águas próximas', all: 'todas as águas' }

/** What was done, in order, with what each step found. Each result is read from the project's result files. */
export function Journey({ f, onGo }: { f: Findings; onGo: (t: TabId) => void }) {
  const best = f.sweep.best, lib = f.enrichment
  const steps: StepData[] = [
    { title: 'Estrutura da proteína', script: '01_target.py', what: 'Baixamos a estrutura 1M17 (EGFR com erlotinibe, 2.60 Å), tiramos o ligante e as águas e marcamos uma caixa de busca de 22 Å em volta do ligante.', result: 'Proteína pronta e caixa de busca definida (provisória, ainda sem validação).' },
    { title: 'Dados de laboratório', script: '02_chembl.py', what: 'Buscamos no ChEMBL as medições de IC50 (a concentração que inibe metade da proteína). Quando há várias medições da mesma molécula, usamos a mediana.', result: '236 moléculas únicas. Limitação conhecida: só os primeiros 500 registros foram lidos, misturando EGFR selvagem e mutante.', go: ['chem', 'Ver o espaço químico'] },
    { title: 'Docking de 16 moléculas', script: '03_ligands.py · 04_docking.py', what: 'Escolhemos 16 moléculas, geramos a forma 3D de cada uma e o Vina deu uma nota (score) ao encaixe na proteína 1M17.', result: <>Correlação entre o score e a potência medida: ρ = <b>{f.compounds.spearman === null ? '–' : f2(f.compounds.spearman)}</b> ({f.compounds.n} moléculas). Fraca; por isso o passo seguinte era desconfiar das notas.</>, go: ['dock', 'Ver os 16 compostos'] },
    { title: 'Redocking do erlotinibe', script: '04b_redocking.py', what: 'O teste de sanidade: tirar o erlotinibe da proteína, pedir ao Vina para recolocá-lo sem dizer como, e medir a distância até a posição real.', result: f.erlotinib ? <>A pose 1 ficou a <b>{f2(f.erlotinib.top)} Å</b> do cristal. A pose mais próxima, a {f.erlotinib.bestPose}ª, estava a {f2(f.erlotinib.best)} Å: o Vina achou o encaixe certo, mas não o pôs em primeiro.</> : 'Ainda sem resultado.', go: ['valid', 'Ver a validação'] },
    { title: 'Varredura de parâmetros', script: '04c_redocking_sweep.py', what: 'Variamos o tamanho da caixa, o esforço de busca (exhaustiveness) e o tratamento das águas, sempre no erlotinibe.', result: best ? <>{f.sweep.runs} execuções. A melhor ({WATERS[best.waters] ?? best.waters}, caixa de {best.box} Å, exhaustiveness {best.exhaustiveness}) ainda teve RMSD médio de {f2(best.mean)} Å. Fixamos caixa de 20 Å e exhaustiveness 32 para os testes seguintes.</> : 'Em andamento.', go: ['valid', 'Ver a varredura'] },
    { title: 'Outros complexos clássicos', script: '04d_redock_multi.py', what: 'Com o protocolo fixado, repetimos o redocking no gefitinibe (4WKQ) e no lapatinibe (1XKK), cada um com 3 execuções (seeds).', result: <>Contando os {f.train.n} clássicos (1M17, 4WKQ, 1XKK), o Vina acertou <b>{f.train.vina} de {f.train.n}</b>.</>, go: ['cx', 'Abrir os complexos'] },
    { title: 'DiffDock', script: '06_diffdock.py', what: 'Um método diferente, de inteligência artificial (DiffDock-L). Não recebe o bolsão: procura na proteína inteira. Geramos 10 poses por complexo.', result: <>Pose de maior confiança certa em <b>{f.train.diffdock} de {f.train.n}</b> clássicos. Mas esses provavelmente fizeram parte do treino dele.</>, go: ['cx', 'Ver as poses'] },
    { title: 'Teste cego', script: '07_blind_select.py · 08_blind_run.py', what: 'Para tirar a dúvida da memória, escolhemos por regras fixadas antes estruturas de EGFR publicadas desde 2022, depois do treino do DiffDock, e rodamos os dois métodos nelas.', result: <>{f.blind.selected} complexos. DiffDock acertou <b>{f.blind.diffdock} de {f.blind.n}</b>; Vina, <b>{f.blind.vina} de {f.blind.n}</b>.</>, go: ['cx', 'Abrir os complexos'] },
  ]
  if (lib) steps.push({
    title: 'Teste de enriquecimento', script: '10_enrichment_data.py → 13_enrichment_analysis.py',
    what: 'A pergunta final: o score do Vina separa moléculas ativas de inativas? Montamos ativos e inativos medidos do ChEMBL, mais decoys, e docamos todos no mesmo receptor.',
    result: f.ranking ? <>{f.ranking.nActives} ativos contra {f.ranking.nDecoys} decoys: AUC <b>{f2(f.ranking.aucDecoys)}</b> (acaso = 0,50). Contra {f.ranking.nInactives} inativos medidos, contar átomos ({f2(f.ranking.sizeInactives)}) supera o Vina ({f2(f.ranking.vsInactives)}). O ranking pelo score não funciona neste protocolo.</> : lib.status === 'done' ? 'Docking concluído; falta a análise (ROC AUC, EF1%).' : lib.total ? <>Docking da biblioteca em andamento: <b>{lib.done} de {lib.total}</b> moléculas.</> : 'Biblioteca em preparação.',
    running: lib.status === 'running' && lib.total ? { done: lib.done, total: lib.total } : undefined, go: ['enrich', 'Ver o enriquecimento'],
  })
  return (
    <PageSection id="jornada" title="O que já foi feito, em ordem" intro="Cada passo nasceu do resultado do anterior. Os números vêm dos arquivos de resultado e se atualizam sozinhos.">
      <ol className="m-0 list-none rounded-lg border border-line bg-panel p-4 sm:p-5">
        {steps.map(s => (
          <li key={s.title} className="relative grid gap-1 pb-6 pl-9 before:absolute before:top-7 before:bottom-1 before:left-[8.5px] before:w-px before:bg-line last:pb-0 last:before:hidden">
            <span className="absolute top-0.5 left-0"><StatusIcon status={s.running ? 'running' : 'done'} /></span>
            <div className="flex flex-wrap items-baseline gap-x-3"><b className="font-semibold">{s.title}</b><span className="font-mono text-[11.5px] text-muted">{s.script}</span></div>
            <p className="m-0 max-w-[74ch] text-[13px] text-muted">{s.what}</p>
            <div className="mt-1 max-w-[78ch] rounded-md bg-docked/8 px-3 py-2 text-[13px] [&_b]:font-semibold">
              <span className="text-muted">Resultado: </span>{s.result}
              {s.running && <Progress value={100 * s.running.done / s.running.total} className="mt-2" label="Docking da biblioteca" />}
            </div>
            {s.go && <Button className="mt-0.5 -ml-2 w-fit" href={`#${s.go[0]}`} onNavigate={e => { e.preventDefault(); onGo(s.go![0]) }}>{s.go[1]}</Button>}
          </li>
        ))}
      </ol>
    </PageSection>
  )
}
