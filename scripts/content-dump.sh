#!/usr/bin/env bash
#
# Exporte le CONTENU du jeu (référentiel) depuis la base locale `chusei`
# vers seeds/content-seed.sql, puis (option --push) commit + push dans git.
#
# Tout est exporté SAUF les tables joueur/runtime listées ci-dessous.
# => toute NOUVELLE table de contenu est capturée automatiquement.
#
# Usage :
#   ./scripts/content-dump.sh           # dump seul
#   ./scripts/content-dump.sh --push    # dump + git add/commit/push du seed
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEED="$ROOT/seeds/content-seed.sql"
CONTAINER=mysql
DB=chusei
DB_USER=root
DB_PASS=password

# --- Tables joueur / runtime à NE PAS exporter (le reste = contenu) ---------
EXCLUDE="
user friend historique message
inventaire inventaire_consommable inventaire_equipement inventaire_objet
niveau_joueur
joueur_caracteristique joueur_caracteristique_bonus joueur_dialogue joueur_grade joueur_guilde
user_boss user_buff user_consommable user_equipement user_quete user_sequence user_sortilege
doctrine_migration_versions
"

# --- Construit la liste des tables de contenu (toutes moins la blacklist) ----
TABLES=""
while IFS= read -r t; do
  [ -z "$t" ] && continue
  case " $(echo "$EXCLUDE" | tr '\n' ' ') " in
    *" $t "*) continue ;;
  esac
  TABLES="$TABLES $t"
done < <(docker exec "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" -N -e "SHOW TABLES" "$DB" 2>/dev/null | sort)

if [ -z "$TABLES" ]; then
  echo "ERREUR : aucune table trouvée. Le conteneur '$CONTAINER' est-il démarré ? (docker compose up -d)" >&2
  exit 1
fi

COUNT=$(echo $TABLES | wc -w | tr -d ' ')
echo "Export de $COUNT tables de contenu -> seeds/content-seed.sql"

# --skip-dump-date : évite le bruit de diff git (ligne 'Dump completed on ...')
docker exec "$CONTAINER" mysqldump -u"$DB_USER" -p"$DB_PASS" \
  --no-tablespaces --single-transaction --skip-dump-date \
  "$DB" $TABLES > "$SEED"

echo "OK : $SEED ($(du -h "$SEED" | cut -f1))"

if [ "${1:-}" = "--push" ]; then
  cd "$ROOT"
  git add seeds/content-seed.sql
  if git diff --cached --quiet; then
    echo "Aucun changement de contenu à committer."
  else
    git commit -m "Contenu du jeu : maj du seed ($(date +%Y-%m-%d\ %H:%M))"
    git push
    echo "Poussé sur git."
  fi
else
  echo "Pense à : git add seeds/content-seed.sql && git commit && git push  (ou relance avec --push)"
fi
