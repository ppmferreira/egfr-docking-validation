import { Crosshair, Download, Gauge, Keyboard, List, Orbit, PlayCircle, ScatterChart } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TabId } from '../../../application/routes'
import { Box } from '../../ui/Box'
import { Button } from '../../ui/Button'
import { PageSection } from '../../ui/PageSection'

const ITEMS: { icon: ReactNode; name: string; text: ReactNode }[] = [
  { icon: <List />, name: 'Lista', text: <>Cada linha é um complexo, com o RMSD do DiffDock (pose de maior confiança) e o do Vina (média das 3 seeds). <b>Verde</b> até 2 Å, <b>âmbar</b> até 3 Å, <b>vermelho</b> acima. &quot;Aguardando&quot; é um complexo ainda rodando.</> },
  { icon: <ScatterChart />, name: 'Mapa', text: <>Um ponto por complexo: DiffDock na horizontal, Vina na vertical. A área verde é onde os dois acertam. Clique num ponto para abrir o complexo.</> },
  { icon: <Orbit />, name: 'Cena 3D', text: <>Laranja é a <b>posição real</b> (cristal), ciano o <b>DiffDock</b> e rosa o <b>Vina</b>. Quanto mais as cores se sobrepõem, mais certo o encaixe. Arraste para girar, role para aproximar, passe o mouse sobre um átomo para ver o nome.</> },
  { icon: <Keyboard />, name: 'Poses do DiffDock', text: <>Cada quadrado é uma das 10 poses, ordenadas pela confiança, com o RMSD embaixo. As setas <b>← →</b> do teclado passam de uma para outra. Olhe além da pose 1: às vezes a certa está em 5º ou 9º lugar.</> },
  { icon: <Gauge />, name: 'Vina: seed e pose', text: <>Escolha a execução (seed); o número ao lado é o RMSD da pose 1 dela. Depois escolha a pose entre as 9. Quando as seeds divergem, a média esconde isso, e aqui dá para ver.</> },
  { icon: <PlayCircle />, name: 'Ver o encaixe', text: <>Nos complexos clássicos há uma animação: o ligante em ciano parte de uma posição aleatória e vai até o encaixe. É assim que o DiffDock &quot;pensa&quot;. Nos cegos essa trajetória não foi salva.</> },
  { icon: <Download />, name: 'Salvar PNG', text: <>Baixa a imagem da cena 3D como está, para usar em figuras.</> },
]

export function ScreenTour({ onGo }: { onGo: (t: TabId) => void }) {
  return (
    <PageSection id="tela" title="Como usar a tela Complexos" intro="É a tela principal do painel. Cada parte dela responde a uma pergunta.">
      <Box>
        <ul className="m-0 list-none p-0">
          {ITEMS.map(i => (
            <li key={i.name} className="flex gap-3 border-b border-line px-4 py-3">
              <span className="pt-0.5 text-docked [&_svg]:size-5" aria-hidden>{i.icon}</span>
              <div><b className="font-semibold">{i.name}</b><p className="m-0 max-w-[78ch] text-[13px] text-muted [&_b]:font-semibold [&_b]:text-ink">{i.text}</p></div>
            </li>
          ))}
        </ul>
        <div className="p-2.5"><Button href="#cx" onNavigate={e => { e.preventDefault(); onGo('cx') }}><Crosshair className="size-4" aria-hidden />Abrir a tela Complexos</Button></div>
      </Box>
    </PageSection>
  )
}
