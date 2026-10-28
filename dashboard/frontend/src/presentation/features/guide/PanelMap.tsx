import { BarChart3, FlaskConical, Flag, LayoutDashboard, ListChecks, Orbit, Radio } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TabId } from '../../../application/routes'
import { PageSection } from '../../ui/PageSection'

const MAP: { id: TabId; icon: ReactNode; name: string; what: string }[] = [
  { id: 'cx', icon: <Orbit />, name: 'Complexos', what: 'Cada estrutura em 3D, com o cristal, o DiffDock e o Vina, e o mapa com todos.' },
  { id: 'valid', icon: <ListChecks />, name: 'Validação', what: 'As tabelas do redocking e a varredura de parâmetros.' },
  { id: 'dock', icon: <FlaskConical />, name: 'Docking dos 16', what: 'As notas dos 16 compostos, ainda sem confiança.' },
  { id: 'chem', icon: <BarChart3 />, name: 'Espaço químico', what: 'Como as moléculas do ChEMBL se distribuem por tamanho e lipofilicidade.' },
  { id: 'resumo', icon: <LayoutDashboard />, name: 'Resumo', what: 'O projeto em números, o gráfico de acertos e as etapas.' },
  { id: 'next', icon: <Flag />, name: 'Próximos passos', what: 'O que falta fazer, em que estado está cada item e como rodar.' },
  { id: 'live', icon: <Radio />, name: 'Ao vivo', what: 'O que o computador está rodando agora, GPU e logs.' },
]

export function PanelMap({ onGo }: { onGo: (t: TabId) => void }) {
  return (
    <PageSection id="mapa" title="Mapa do painel">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {MAP.map(m => (
          <a key={m.id} href={`#${m.id}`} onClick={e => { e.preventDefault(); onGo(m.id) }}
            className="grid gap-1.5 rounded-lg border border-line bg-panel p-4 text-ink no-underline transition-colors hover:border-docked">
            <span className="flex items-center gap-2 font-semibold [&_svg]:size-[18px] [&_svg]:text-docked"><span aria-hidden>{m.icon}</span>{m.name}</span>
            <span className="text-[13px] text-muted">{m.what}</span>
          </a>
        ))}
      </div>
    </PageSection>
  )
}
