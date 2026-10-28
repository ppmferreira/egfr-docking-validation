#!/usr/bin/env bash
# Configuracao unica por clone: ativa os hooks versionados e o pull so com fast-forward.
set -euo pipefail
main_dir="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
git -C "$main_dir" config core.hooksPath .githooks
git -C "$main_dir" config pull.ff only
git -C "$main_dir" config fetch.prune true
echo "Hooks ativados (.githooks) e pull.ff=only configurados."
