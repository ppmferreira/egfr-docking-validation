# Instruções para agentes (Claude Code, Codex e outros)

Este repositório é o projeto de portfólio de Pedro sobre EGFR (virtual screening, docking e validação). Várias sessões de agentes diferentes trabalham nele, às vezes ao mesmo tempo. Estas regras existem para ninguém sobrescrever o trabalho do outro.

## Regra principal: tudo passa pelo git, em worktree

1. **Nunca edite arquivos direto na pasta principal** (`~/Bioinformatics/egfr_virtual_screening_starter`). Ela pode ter alterações de outra sessão ou do Pedro.
2. **Cada tarefa tem uma worktree e uma branch próprias**, criadas a partir da `origin/main` atualizada:

   ```bash
   git fetch origin
   git worktree add -b <tipo>/<assunto> ../egfr_worktrees/<tipo>-<assunto> origin/main
   cd ../egfr_worktrees/<tipo>-<assunto>
   ```

   Atalho: `tools/git/new-task.sh <tipo> <assunto>` faz isso (e `tools/git/finish-task.sh <tipo>/<assunto>` limpa tudo depois do merge). `tools/git/sync-main.sh` atualiza a `main` local sem sobrescrever nada. Uma vez por clone, rode `tools/git/setup.sh` para ativar os hooks que bloqueiam commit e push direto na `main`.
   Tipos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`. Antes de criar, rode `git worktree list` para ver o que já está em andamento e não reutilize a branch de outra sessão.
3. **Commite com frequência**, em commits pequenos e com uma mudança lógica cada. Mensagens no formato Conventional Commits (`feat: ...`, `fix: ...`), no imperativo, explicando o porquê quando não for óbvio.
4. **Suba para o GitHub sempre**: ao terminar uma etapa (e no fim da sessão), `git push -u origin <branch>` e abra um pull request para a `main` com `gh pr create`. Não deixe trabalho só no disco.
5. **A `main` só recebe mudanças por pull request.** Não faça merge nem push direto na `main`, a não ser que o Pedro peça. Depois do merge, remova a worktree (`git worktree remove <caminho>`) e apague a branch.

## O que nunca fazer

- `git push --force`, `git reset --hard`, `git clean -fd`, `git checkout .` ou qualquer comando que descarte trabalho que você não criou.
- Mexer em outra worktree ou em alterações não commitadas que não sejam suas. Se achar alterações inesperadas, pare e avise o Pedro.
- Commitar segredos (tokens, chaves, `.env`) ou dados pesados. O `.gitignore` já exclui os PDBs baixados, poses, saídas do DiffDock/teste cego e logs; esses arquivos são regenerados pelos scripts em `scripts/`.

## Antes de abrir o PR

- Rode `pytest tests/` (ambiente `egfr-vs`, veja `environment.yml`).
- Se o frontend mudou: `cd dashboard/frontend && npm run build`.
- Atualize o README se o comportamento ou os resultados mudaram. Só afirme números que foram gerados e conferidos.
- Se a `main` avançou, atualize a branch com `git rebase origin/main` (ou merge) e resolva conflitos sem descartar o trabalho dos outros.

## Convenções do projeto

- O que é versionado: código, tabelas pequenas (`data/*.csv`, `results/*.csv`) e `figures/`. Detalhes em `CONTRIBUTING.md`.
- Escopo científico: docking não mede afinidade nem eficácia. Não escreva afirmações de descoberta de fármaco; veja o README.
- `gh` está instalado em `~/.local/bin/gh` e já autenticado como `ppmferreira`.
- Commits feitos pelo Claude terminam com a linha `Co-Authored-By` indicada pela ferramenta; commits do Codex não precisam de atribuição extra.
