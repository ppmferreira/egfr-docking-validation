import { Box } from '../../ui/Box'
import { PageSection } from '../../ui/PageSection'
import { TableWrap } from '../../ui/TableWrap'

const ROWS: [string, string, string][] = [
  ['O que é', 'AutoDock Vina: busca muitas posições da molécula e dá a cada uma uma nota calculada por uma função empírica, que aproxima a energia do encaixe.', 'DiffDock-L: modelo de inteligência artificial (difusão) treinado com estruturas conhecidas. Parte de uma posição aleatória e a move, passo a passo, até um encaixe.'],
  ['Precisa saber onde é o bolsão?', 'Sim. Damos uma caixa de 20 Å centrada no ligante do cristal, uma dica forte.', 'Não. Procura na proteína inteira.'],
  ['Como escolhe a pose 1', 'Pelo menor score (em kcal/mol). Mais negativo é melhor. Não é afinidade medida.', 'Pela maior confiança, um número do próprio modelo. Não é energia.'],
  ['Aleatoriedade', 'Cada execução (seed) pode dar um resultado diferente. Rodamos 3 seeds.', 'Gera 10 amostras por complexo e as ordena pela confiança.'],
  ['Risco de viés', 'Receber a posição do bolsão facilita o teste.', 'Pode ter visto estruturas parecidas no treino, que usa PDB até agosto de 2021 segundo o repositório. Por isso o teste cego usa estruturas de 2022 em diante.'],
  ['Hardware', 'Processador (CPU).', 'Placa de vídeo (GPU).'],
]

export function Methods() {
  return (
    <PageSection id="metodos" title="Os dois métodos lado a lado" intro="Eles respondem à mesma pergunta de formas diferentes, e isso importa para comparar os resultados com justiça.">
      <Box>
        <TableWrap>
          <table className="data-table prose-cells min-w-[560px]">
            <thead><tr>
              <th className="w-[22%]" />
              <th><span className="rounded-full border border-vina px-2.5 py-0.5 text-xs font-medium text-vina">Vina</span></th>
              <th><span className="rounded-full border border-docked px-2.5 py-0.5 text-xs font-medium text-docked">DiffDock</span></th>
            </tr></thead>
            <tbody>{ROWS.map(([k, a, b]) => <tr key={k}><td>{k}</td><td>{a}</td><td>{b}</td></tr>)}</tbody>
          </table>
        </TableWrap>
      </Box>
    </PageSection>
  )
}
