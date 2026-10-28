#!/usr/bin/env bash
# Depois do merge do PR: remove a worktree e a branch, e atualiza a main local.
# Uso: tools/git/finish-task.sh <tipo>/<assunto>     ex.: tools/git/finish-task.sh feat/enrichment-analysis
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: $0 <tipo>/<assunto>" >&2
  exit 2
fi
branch="$1"
main_dir="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
dest="$(dirname "$main_dir")/egfr_worktrees/${branch//\//-}"

git -C "$main_dir" fetch --prune origin
if ! git -C "$main_dir" merge-base --is-ancestor "$branch" origin/main 2>/dev/null \
   && [ -n "$(git -C "$main_dir" log origin/main.."$branch" --oneline)" ] \
   && [ "$(gh pr view "$branch" --json state --jq .state 2>/dev/null || echo NONE)" != "MERGED" ]; then
  echo "A branch $branch tem commits que ainda nao entraram na main (PR nao mergeado). Nao vou apagar." >&2
  exit 1
fi
[ -d "$dest" ] && git -C "$main_dir" worktree remove "$dest"
git -C "$main_dir" branch -D "$branch"
git -C "$main_dir" push origin --delete "$branch" 2>/dev/null || true
"$(dirname "$0")/sync-main.sh"
