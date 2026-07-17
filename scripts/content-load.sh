#!/usr/bin/env bash
#
# Importe le CONTENU du jeu (seeds/content-seed.sql) dans la base locale `chusei`.
# Les données JOUEUR (user, inventaire, progression...) ne sont PAS touchées :
# le seed ne contient que les tables de contenu.
#
# Usage :
#   ./scripts/content-load.sh           # load du seed local
#   ./scripts/content-load.sh --pull    # git pull d'abord, puis load
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEED="$ROOT/seeds/content-seed.sql"
CONTAINER=mysql
DB=chusei
DB_USER=root
DB_PASS=password

if [ "${1:-}" = "--pull" ]; then
  echo "git pull..."
  (cd "$ROOT" && git pull)
fi

if [ ! -f "$SEED" ]; then
  echo "ERREUR : $SEED introuvable." >&2
  exit 1
fi

echo "Import de seeds/content-seed.sql dans '$DB'..."
docker exec -i "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$DB" < "$SEED"
echo "OK : contenu importé (données joueur préservées)."
