#!/usr/bin/env bash
# Liga, dentro da worktree atual, os dados pesados que ficam FORA do git e so existem na pasta
# principal (data/blind, results/blind, PDBs baixados, node_modules...). Sao symlinks:
# nada e copiado e nada disso entra em commit (o .gitignore cobre data/*, results/* e node_modules).
# Atencao: arquivos gerados dentro desses caminhos pela worktree vao parar na pasta principal.
set -euo pipefail

main_dir="$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')"
here="$(git rev-parse --show-toplevel)"
if [ "$here" = "$main_dir" ]; then
  echo "Voce ja esta na pasta principal; nada a ligar." >&2
  exit 0
fi

link() {  # $1 = caminho relativo
  local src="$main_dir/$1" dst="$here/$1"
  [ -e "$src" ] || return 0
  [ -e "$dst" ] || [ -L "$dst" ] && return 0   # ja existe (versionado ou link): nao sobrescreve
  mkdir -p "$(dirname "$dst")"
  ln -s "$src" "$dst"
  echo "ligado: $1"
}

# Entradas de primeiro nivel em data/ e results/ ignoradas pelo git na pasta principal.
for dir in data results; do
  [ -d "$main_dir/$dir" ] || continue
  git -C "$main_dir" ls-files --others --ignored --exclude-standard --directory -- "$dir" |
    while IFS= read -r p; do case "$p" in *:Zone.Identifier) continue;; esac; link "${p%/}"; done
done
link dashboard/frontend/node_modules
