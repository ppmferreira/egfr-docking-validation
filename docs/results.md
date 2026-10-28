# Resultados

Todos os números abaixo vêm de `results/*.csv`. Cada linha dos resumos usa 3 sementes (Vina) ou 10 amostras (DiffDock).

## Redocking em 1M17 (varredura de protocolo)

`results/redocking_sweep_summary.csv`. A melhor configuração do Vina foi caixa de 20 Å, exhaustiveness 32 (ou 64): a pose de melhor score ficou dentro de 2 Å em 2 de 3 sementes (RMSD médio 3,9 Å). Caixas de 16, 22 e 26 Å tiveram 0 de 3, com RMSD médio entre 6,8 e 8,0 Å. Em quase todas as configurações o Vina gerou uma pose correta (melhor RMSD em torno de 1,3 a 1,8 Å), mas **nem sempre a colocou em primeiro lugar**.

Essa varredura foi feita em um único complexo. Ela ajusta o protocolo e não prova generalização.

## Redocking em três complexos

| Complexo | Ligante | Vina (caixa 20 Å): RMSD médio da top pose, aprovações | DiffDock: RMSD da top pose |
|---|---|---|---|
| 1M17 | erlotinib | 3,92 Å, 2 de 3 | 1,24 Å |
| 4WKQ | gefitinib | 2,51 Å, 0 de 3 | 0,94 Å |
| 1XKK | lapatinib | 2,91 Å, 0 de 3 | 0,74 Å |

Fontes: `redocking_multi_summary.csv` e `diffdock_results.csv`. Esses três complexos podem estar no conjunto de treino do DiffDock, então o resultado dele aqui é otimista.

## Teste cego (9 complexos publicados depois do treino do DiffDock)

`results/blind_results.csv`, aprovação = RMSD da top pose ≤ 2,0 Å.

| Método | Top pose aprovada | Observação |
|---|---|---|
| Vina (caixa dada) | 22 de 27 execuções (3 sementes × 9 complexos) | Falhou em 8SC7 (RMSD médio 7,9 Å) e parcialmente em 8TO3 (2 de 3) |
| DiffDock (cego) | 6 de 9 complexos | Falhou em 7U99 (3,03 Å), 8SC7 (2,92 Å) e 9BY4 (3,35 Å) |

Por complexo (RMSD médio da top pose, Å):

| PDB | Ligante | Vina | DiffDock |
|---|---|---|---|
| 7KXZ | XA4 | 1,02 | 1,77 |
| 7U99 | M0R | 0,74 | 3,03 |
| 7ZYQ | V58 | 0,82 | 0,99 |
| 8D73 | QCR | 2,27 | 1,33 |
| 8D76 | QFO | 1,82 | 1,57 |
| 8F1Z | X9B | 0,64 | 1,04 |
| 8SC7 | D0D | 7,90 | 2,92 |
| 8TO3 | IXC | 4,96 | 1,51 |
| 9BY4 | Q6K | 1,05 | 3,35 |

### Como ler isso

- O Vina recebeu o bolso, o DiffDock não. A comparação não é entre métodos em pé de igualdade: o DiffDock fez uma tarefa mais difícil.
- O DiffDock tem uma amostra por complexo aqui; o Vina, três sementes. Poucas observações por complexo.
- 8SC7 falhou nos dois métodos, e vale investigar a estrutura (ligante, águas, conformação da proteína).

## Docking de compostos do ChEMBL

`results/vina_scores.csv` tem 16 compostos com score do Vina, escolhidos pelo pIC50 (`docking_shortlist.csv`). Não há compostos inativos nem decoys, então **não é possível medir se o docking separa ativos de inativos**. Os scores desse conjunto não devem ser interpretados como capacidade preditiva.

## Figuras

- `figures/egfr_chemical_space.png`: espaço químico (descritores) dos compostos curados.
- `figures/vina_vs_ic50.png`: score do Vina contra pIC50 (exploratório).
- `figures/redocking_viewer.html`: visualização interativa do redocking.
