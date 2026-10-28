# Metodologia

O pipeline é uma sequência de scripts numerados em `scripts/`. Cada um lê o que o anterior gerou em `data/` e `results/`.

| Etapa | Script | O que faz |
|---|---|---|
| 1 | `01_target.py` | Baixa o PDB 1M17, remove ligante e HETATM para gerar uma proteína provisória e calcula a caixa de docking a partir do erlotinib cristalográfico (AQ4). |
| 2 | `02_chembl.py` | Consulta atividades do ChEMBL (CHEMBL203), filtra IC50 exato em nM, resume medidas repetidas pela mediana, calcula descritores com RDKit (MW, logP, HBD, HBA, ligações rotáveis) e gera o gráfico do espaço químico. |
| 3 | `03_ligands.py` | Gera conformeros 3D iniciais (ETKDGv3, semente fixa, otimização MMFF). |
| 4 | `04_docking.py` | Prepara os ligantes com Meeko, roda o Vina com semente fixa e salva a tabela de scores. |
| 4b | `04b_redocking.py` | Redocking do erlotinib em 1M17: o ligante é reconstruído do SMILES, docado de um conformero novo e comparado à pose cristalográfica. |
| 4c | `04c_redocking_sweep.py` | Varre tamanho da caixa, exhaustiveness e águas cristalográficas, com 3 sementes por configuração. |
| 4d | `04d_redock_multi.py` | Repete o redocking em 1M17, 4WKQ e 1XKK, com parâmetros fixados antes de ver os resultados. |
| 5 | `05_analysis.py` | Compara scores do Vina com pIC50 (exploratório). |
| 6 | `06_diffdock.py` | Redocking com DiffDock nos mesmos três complexos, em docking cego, com o mesmo RMSD. |
| 7 | `07_blind_select.py` | Seleciona complexos para o teste cego com regras fixas (veja abaixo). |
| 8 | `08_blind_run.py` | Roda Vina e DiffDock nos complexos selecionados. |

## Métrica de validação

RMSD de átomos pesados entre a pose prevista e a cristalográfica, com mapeamento que respeita a simetria da molécula e sem realinhamento (mesmo referencial do receptor). O critério de trabalho é RMSD ≤ 2,0 Å para a pose de melhor score (a "top pose"). Também registramos o melhor RMSD entre todas as poses e o ranking dessa pose.

## Seleção do teste cego

Complexos do UniProt P00533, difração de raios X, lançados a partir de 2022-01-01 e com resolução ≤ 2,8 Å, depois filtrados por regras aplicadas igualmente a todos os candidatos:

1. A cadeia A tem o motivo de hinge Gln-Leu-Met-Pro-Phe-Gly-Cys (sítio do ATP).
2. Há um ligante não polimérico com 18 a 70 átomos pesados e sem fósforo.
3. O ligante faz ligação de hidrogênio com o hinge (N ou O a até 3,5 Å da Met).
4. O ligante não é covalente.
5. Um complexo por componente de ligante (melhor resolução).

## Parâmetros dos protocolos

- **Vina:** caixa de 20 Å centrada no ligante cristalográfico, exhaustiveness 32, sementes 1 a 3. Isso dá ao Vina a localização do bolso.
- **DiffDock:** docking cego (só proteína e SMILES), 10 amostras, configuração padrão.
