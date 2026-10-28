import type { ReactNode } from 'react'
import type { Findings } from '../../../domain/findings'
import { f2 } from '../../format'
import { Accordion, AccordionItem } from '../../ui/Accordion'
import { PageSection } from '../../ui/PageSection'

export function Faq({ f }: { f: Findings }) {
  const seeds = f.seedSpread ? <>Em <b>{f.seedSpread.pdb}</b>, por exemplo, deram {f.seedSpread.seeds.map(f2).join(', ')} Å. </> : null
  const items: { q: string; a: ReactNode }[] = [
    { q: 'Por que o limite é 2 Å?', a: 'É uma convenção da literatura de docking: abaixo de uns 2 Å a molécula está praticamente no mesmo lugar e com a mesma orientação que no cristal. Não é uma lei da natureza, e perto do limite (1.8 ou 2.2 Å) a diferença é pequena.' },
    { q: 'O que é a pose 1?', a: <>Os dois métodos devolvem várias poses, ordenadas pelo próprio critério (score no Vina, confiança no DiffDock). A <b>pose 1</b> é a que o programa escolheria se você não olhasse as outras, então é ela que vale para dizer se o método acertou. A <b>melhor pose</b> é a mais próxima do cristal em qualquer posição do ranking; só dá para saber porque já conhecemos a resposta.</> },
    { q: 'O que é uma seed e por que 3?', a: <>O Vina tem um componente aleatório. A seed é o número que inicia o sorteio: seeds diferentes podem dar encaixes diferentes. {seeds}Rodar 3 e contar quantas acertam é mais honesto do que escolher a melhor.</> },
    { q: 'O score do Vina é afinidade?', a: 'Não. É uma estimativa, em kcal/mol, usada para ordenar posições de uma mesma molécula. Comparar scores de moléculas diferentes e tratá-los como potência é um erro comum; por isso os scores dos 16 compostos aparecem com aviso na aba "Docking dos 16".' },
    { q: 'Por que um teste cego, e por que 2022?', a: 'Se o DiffDock viu uma estrutura no treino, acertá-la não prova que ele generaliza. As estruturas de 2022 em diante foram publicadas depois do material de treino do DiffDock-L (o repositório cita PDB até agosto de 2021). Os critérios de seleção foram escritos antes de rodar qualquer docking, para não escolhermos os casos que nos favorecem.' },
    { q: 'Por que o Vina errou nos clássicos e acertou nos novos?', a: 'Ainda não sabemos. São hipóteses, não testadas: a preparação do receptor, o estado da proteína em cada estrutura, a flexibilidade de moléculas grandes como o lapatinibe, ou simples diferenças entre os complexos.' },
    { q: 'O que é o teste de enriquecimento?', a: 'Pega muitas moléculas ativas, inativas medidas e decoys (moléculas parecidas, mas presumidamente inativas), roda o docking em todas e vê se o score põe as ativas no topo. A métrica é a ROC AUC: 0.5 é o acaso; 1.0 é perfeito. O fator de enriquecimento EF1% diz quantas vezes mais ativas há no 1% melhor do ranking do que ao acaso.' },
    { q: 'Posso confiar nos scores dos 16 compostos?', a: f.ranking ? <>Não. O encaixe funciona em boa parte dos casos novos, mas o teste de enriquecimento mostrou que o score não separa ativos de decoys (AUC <b>{f2(f.ranking.aucDecoys)}</b>). Os 16 compostos também foram escolhidos pela potência, sem inativos para comparar.</> : 'Ainda não. O encaixe parece funcionar em boa parte dos casos novos, mas o score não acompanha a potência medida. O teste de enriquecimento serve para responder isso.' },
    { q: 'O que é um decoy?', a: 'Uma molécula parecida com as ativas em tamanho, polaridade e flexibilidade, mas com estrutura diferente, que presumimos inativa. Se o programa não distingue uma ativa de um decoy, ele não está reconhecendo o que faz a molécula ligar, só propriedades gerais. Aqui os decoys vêm do ChEMBL e não foram testados em laboratório.' },
    { q: 'Por que contar átomos é um controle?', a: 'Moléculas maiores costumam ter scores melhores só por terem mais contatos. Se um método simples, que apenas conta átomos pesados, ordena tão bem quanto o docking, o docking não acrescentou nada. Por isso comparamos sempre o Vina com esse controle.' },
  ]
  return (
    <PageSection id="faq" title="Perguntas frequentes">
      <Accordion>
        {items.map(({ q, a }) => <AccordionItem key={q} value={q} title={q}><div className="max-w-[78ch] [&_b]:font-semibold [&_b]:text-ink">{a}</div></AccordionItem>)}
      </Accordion>
    </PageSection>
  )
}
