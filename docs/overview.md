# Visão geral

## Alvo

O EGFR (receptor do fator de crescimento epidérmico) é uma quinase com papel central em vários cânceres e alvo de fármacos como erlotinib, gefitinib e lapatinib. Este projeto usa o domínio quinase da proteína humana, em estruturas cristalográficas do PDB.

## Pergunta de pesquisa

Um fluxo transparente de filtragem cheminformática e docking consegue priorizar inibidores do EGFR com atividade experimental conhecida, e quais são suas limitações?

## O que o projeto é

- Uma demonstração **retrospectiva**: os compostos já têm atividade medida.
- Uma **validação de protocolo**: antes de interpretar rankings de docking, testamos se o protocolo reproduz poses cristalográficas conhecidas (redocking) e se generaliza para estruturas novas (teste cego).
- Uma comparação entre dois métodos: AutoDock Vina (docking clássico, com a caixa centrada no ligante) e DiffDock (docking cego baseado em difusão).

## O que o projeto não é

- Não descobre nem valida um fármaco novo.
- Scores de docking (kcal/mol) não são ΔG medidos, não se convertem em IC50 e não dizem nada sobre eficácia clínica, seletividade ou segurança.

## Fontes de dados

- Estrutura: [RCSB PDB 1M17](https://www.rcsb.org/structure/1M17), EGFR com erlotinib, 2,60 Å.
- Atividades: [ChEMBL](https://www.ebi.ac.uk/chembl/), alvo CHEMBL203, IC50 exato em nM.
- Complexos adicionais: 4WKQ (gefitinib) e 1XKK (lapatinib), mais 9 estruturas publicadas a partir de 2022 para o teste cego.
