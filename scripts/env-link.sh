#!/usr/bin/env bash
# env-link.sh — symlinks apps/web/.env.local e apps/api/.env para o
# .env.local da raiz. Idempotente. Renomeia .env existentes pra .bak
# se forem arquivos regulares.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROOT_ENV="${ROOT}/.env.local"

if [ ! -f "${ROOT_ENV}" ]; then
  echo "❌ ${ROOT_ENV} não existe. Rode: cp .env.example .env.local"
  echo "   e preencha os secrets antes de rodar este script."
  exit 1
fi

link_to_root() {
  local target="$1"        # ex.: apps/web/.env.local
  local rel_to_root="$2"   # ex.: ../../.env.local
  local abs="${ROOT}/${target}"

  if [ -L "${abs}" ]; then
    local current
    current="$(readlink "${abs}")"
    if [ "${current}" = "${rel_to_root}" ]; then
      echo "✓ ${target} já é symlink correto"
      return
    fi
    echo "↻ ${target} é symlink mas aponta pra ${current}; refazendo"
    rm -f "${abs}"
  elif [ -e "${abs}" ]; then
    local backup="${abs}.bak.$(date +%s)"
    echo "⚠ ${target} é arquivo regular — renomeando pra ${backup##*/}"
    mv "${abs}" "${backup}"
  fi

  mkdir -p "$(dirname "${abs}")"
  ln -s "${rel_to_root}" "${abs}"
  echo "✓ ${target} → ${rel_to_root}"
}

link_to_root "apps/web/.env.local" "../../.env.local"
link_to_root "apps/api/.env" "../../.env.local"

echo ""
echo "Pronto. .env.local na raiz é a única fonte de verdade."
