# Limitações e roteiro

## Limitações

- **Preparação do receptor:** a proteína provisória só remove ligante e HETATM. Resíduos ausentes, alt-locs, protonação e águas conservadas não foram revisados a fundo.
- **Pontuação:** o score do Vina é aproximado e não equivale a afinidade medida.
- **Dados do ChEMBL:** IC50 vêm de ensaios diferentes, não são diretamente comparáveis. A coleta atual pega os primeiros 500 registros sem ordenação e mistura EGFR selvagem e mutante.
- **Conjunto de compostos:** 16 compostos escolhidos pelo pIC50, sem inativos ou decoys.
- **Validação:** o protocolo do Vina foi ajustado em 1M17 e funciona de forma desigual em outros complexos. Poucos replicados por complexo.
- **DiffDock:** os três primeiros complexos podem estar no treino do modelo; só o teste cego é independente.
- **Rigidez:** o receptor é rígido.

## Roteiro

1. Validar o protocolo em mais de um complexo (em andamento).
2. Montar um conjunto balanceado de ativos, inativos e decoys.
3. Medir desempenho: curva ROC, AUC e EF1%, comparando com um controle simples (por exemplo, peso molecular).
4. Corrigir a coleta do ChEMBL (paginação, ordenação, separar selvagem de mutante).
5. Melhorar o docking se a validação pedir (preparação do receptor, protonação, águas, outro programa ou receptor flexível).
6. Fechar o projeto: README final e relatório com números verificados.

O roteiro também aparece na aba *Roadmap* do dashboard.
