#!/usr/bin/env bash
# Cria uma worktree + branch nova a partir da origin/main para uma tarefa.
# Uso: tools/git/new-task.sh <tipo> <assunto>     ex.: tools/git/new-task.sh feat enrichment-analysis
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Uso: $0 <feat|fix|docs|chore|refactor|test> <assunto-em-kebab-case>" >&2
  exit 2
fi
type="$1"; topic="$2"
main_dir="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
dest="$(dirname "$main_dir")/egfr_worktrees/${type}-${topic}"

git -C "$main_dir" fetch --prune origin
if git -C "$main_dir" rev-parse --verify -q "refs/heads/${type}/${topic}" >/dev/null; then
  echo "A branch ${type}/${topic} ja existe (outra sessao?). Escolha outro nome." >&2
  exit 1
fi
git -C "$main_dir" worktree add -b "${type}/${topic}" "$dest" origin/main
echo "Pronto. Trabalhe em: $dest"
