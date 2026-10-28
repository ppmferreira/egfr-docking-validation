export interface Term { term: string; definition: string }

export const GLOSSARY: Term[] = [
  { term: 'EGFR e erlotinibe', definition: 'A EGFR é uma proteína da superfície das células. Quando fica hiperativa, pode estimular a multiplicação de tumores. O erlotinibe é um fármaco que se encaixa num bolsão dela e a desliga.' },
  { term: 'Docking e score', definition: 'Docking é o programa (aqui, AutoDock Vina) que tenta encaixar uma molécula no bolsão da proteína. O score, em kcal/mol, é a nota do encaixe: quanto mais negativo, melhor o encaixe previsto. Não é afinidade medida.' },
  { term: 'IC50 e pIC50', definition: 'IC50 é a concentração de uma molécula que inibe metade da proteína em laboratório. pIC50 é uma escala mais fácil de ler: quanto maior, mais potente. Acima de 7 é potente.' },
  { term: 'RMSD', definition: 'Distância média, em Ångströms (Å), entre os átomos da pose prevista e os da pose real no cristal. Até 2 Å conta como acerto. Um Å é cerca do tamanho de um átomo.' },
  { term: 'Redocking', definition: 'Teste de sanidade: tirar o fármaco da proteína, pedir ao programa para recolocá-lo sem dizer onde, e comparar com a posição real. Se ele não acerta o caso conhecido, não dá para confiar nos casos desconhecidos.' },
  { term: 'Pose 1 e melhor pose', definition: 'Os métodos devolvem várias poses ordenadas pelo próprio critério. A pose 1 é a que o programa escolheria, e é a que vale para a validação. A melhor pose é a mais próxima do cristal, em qualquer posição do ranking.' },
  { term: 'Seed', definition: 'Número que inicia o sorteio de um método com componente aleatório. Seeds diferentes podem dar resultados diferentes; por isso rodamos 3.' },
  { term: 'Decoy', definition: 'Molécula parecida com as ativas em tamanho e propriedades, mas de estrutura diferente, presumida inativa. Serve de controle negativo no teste de enriquecimento.' },
  { term: 'ROC AUC e EF1%', definition: 'ROC AUC mede se o ranking põe as ativas acima das inativas: 0.5 é acaso, 1.0 é perfeito. EF1% diz quantas vezes mais ativas há no 1% melhor do ranking do que se esperaria ao acaso.' },
]
