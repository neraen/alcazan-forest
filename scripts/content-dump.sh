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
echange echange_ligne reservation_ressource
niveau_joueur
joueur_caracteristique joueur_caracteristique_bonus joueur_dialogue joueur_guilde
guilde
user_boss user_buff user_consommable user_equipement user_quete user_sequence user_sortilege
donjon_instance donjon_instance_membre donjon_verrou donjon_groupe donjon_groupe_membre
donjon_instance_zone donjon_instance_monstre donjon_instance_levier donjon_instance_salle
interaction_recharge joueur_metier
craft_commande joueur_compteur joueur_cumul
hotel_vente
evenement_jeu
doctrine_migration_versions
"

# --- Tables de CONTENU portant aussi des colonnes de RUNTIME ----------------
# `carte_carreau.joueur_id` = position courante des joueurs, `monstre_carreau.quantity`
# /`current_life` = état des populations : ces colonnes n'ont rien à faire dans un seed
# partagé (fuite de données de partie + diff git à chaque déplacement). On exporte donc
# la STRUCTURE depuis `chusei` mais les DONNÉES depuis une copie assainie.
SANITIZED="carte_carreau monstre_carreau"
TMPDB="${DB}_seed_tmp"

is_excluded() {
  case " $(echo "$EXCLUDE" | tr '\n' ' ') " in
    *" $1 "*) return 0 ;;
  esac
  return 1
}

is_sanitized() {
  case " $SANITIZED " in
    *" $1 "*) return 0 ;;
  esac
  return 1
}

# --- Construit la liste des tables de contenu (toutes moins la blacklist) ----
TABLES=""
SANITIZED_PRESENT=""
while IFS= read -r t; do
  [ -z "$t" ] && continue
  is_excluded "$t" && continue
  if is_sanitized "$t"; then
    SANITIZED_PRESENT="$SANITIZED_PRESENT $t"
    continue
  fi
  TABLES="$TABLES $t"
done < <(docker exec "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" -N -e "SHOW TABLES" "$DB" 2>/dev/null | sort)

if [ -z "$TABLES" ]; then
  echo "ERREUR : aucune table trouvée. Le conteneur '$CONTAINER' est-il démarré ? (docker compose up -d)" >&2
  exit 1
fi

COUNT=$(echo $TABLES $SANITIZED_PRESENT | wc -w | tr -d ' ')
echo "Export de $COUNT tables de contenu -> seeds/content-seed.sql"

DUMP_OPTS="--no-tablespaces --single-transaction --skip-dump-date"  # skip-dump-date : pas de bruit de diff git

docker exec "$CONTAINER" mysqldump -u"$DB_USER" -p"$DB_PASS" \
  $DUMP_OPTS "$DB" $TABLES > "$SEED"

# --- Tables assainies : structure réelle + données neutralisées -------------
if [ -n "$SANITIZED_PRESENT" ]; then
  echo "Assainissement de :$SANITIZED_PRESENT"

  # CREATE TABLE ... LIKE ne recopie PAS les clés étrangères : la structure doit
  # impérativement venir de `chusei`, seules les données viennent de la copie.
  docker exec "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" -e "
    DROP DATABASE IF EXISTS \`$TMPDB\`;
    CREATE DATABASE \`$TMPDB\`;
    CREATE TABLE \`$TMPDB\`.carte_carreau LIKE \`$DB\`.carte_carreau;
    INSERT INTO \`$TMPDB\`.carte_carreau SELECT * FROM \`$DB\`.carte_carreau;
    UPDATE \`$TMPDB\`.carte_carreau SET joueur_id = NULL;
    CREATE TABLE \`$TMPDB\`.monstre_carreau LIKE \`$DB\`.monstre_carreau;
    INSERT INTO \`$TMPDB\`.monstre_carreau SELECT * FROM \`$DB\`.monstre_carreau;
    UPDATE \`$TMPDB\`.monstre_carreau mc
      JOIN \`$DB\`.monstre m ON m.id = mc.monstre_id
      SET mc.quantity = mc.quantity_base, mc.current_life = m.max_life;
  " 2>/dev/null

  docker exec "$CONTAINER" mysqldump -u"$DB_USER" -p"$DB_PASS" \
    $DUMP_OPTS --no-data "$DB" $SANITIZED_PRESENT >> "$SEED"
  docker exec "$CONTAINER" mysqldump -u"$DB_USER" -p"$DB_PASS" \
    $DUMP_OPTS --no-create-info "$TMPDB" $SANITIZED_PRESENT >> "$SEED"

  docker exec "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" \
    -e "DROP DATABASE \`$TMPDB\`;" 2>/dev/null
fi

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
