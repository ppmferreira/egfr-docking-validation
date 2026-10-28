#!/usr/bin/env bash
# Atualiza a pasta principal (espelho da main) com a origin/main, sem sobrescrever nada.
# Rode de qualquer worktree ou da pasta principal.
set -euo pipefail

main_dir="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
git -C "$main_dir" fetch --prune origin
git -C "$main_dir" worktree prune

branch="$(git -C "$main_dir" rev-parse --abbrev-ref HEAD)"
if [ "$branch" != "main" ]; then
  echo "A pasta principal ($main_dir) esta na branch '$branch', nao na main. Avise o Pedro." >&2
  exit 1
fi
if [ -n "$(git -C "$main_dir" status --porcelain)" ]; then
  echo "A pasta principal tem alteracoes nao commitadas (provavelmente de outra sessao). Nao vou mexer." >&2
  echo "Mova esse trabalho para uma worktree/branch e rode este script de novo." >&2
  exit 1
fi
git -C "$main_dir" pull --ff-only origin main
echo "main local em $(git -C "$main_dir" rev-parse --short HEAD), igual a origin/main."
