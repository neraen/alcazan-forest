# Alcazan Forest — repères pour agent

Jeu MMORPG 2D à cases : backend Symfony 7 (`alcazan-back-prod/`, sous-module git), frontend
React 18 CRA (`alcazan-front-prod/`, sous-module git), MySQL 8, orchestré par Docker Compose.
**Lire `DOCUMENTATION.md` avant toute modification** : architecture, règles du jeu, modèle de
données, endpoints, dette technique et checklist y sont détaillés.

## Lancer / vérifier

```bash
docker stop symfony_db symfony_adminer 2>/dev/null  # autre projet, squattent 3306/8080
docker compose up -d                                 # pas de --build sauf changement de deps
# Front: http://localhost:3000 — API: http://localhost:8080/api/ — nginx: http://localhost:80
docker exec mysql mysql -uroot -ppassword chusei -e "SELECT COUNT(*) FROM user;"
```

Le code est bind-mounté dans les conteneurs ; `vendor/` et `node_modules/` vivent sur l'hôte.
La base `chusei` (schéma + contenu du jeu) n'existe QUE dans le volume `alcazan-docker_db_data` :
**aucune migration Doctrine** — sauvegarder avant toute manip (`mysqldump` ci-dessus).

## Partager / sauvegarder le contenu du jeu (OBLIGATOIRE)

Le contenu du jeu (classes, PNJ, quêtes, sorts, niveaux, cartes, carreaux, monstres, boss,
objets, consommables…) vit dans la base `chusei`, donc dans un volume Docker local — pas dans
git. La **source de vérité partagée entre machines** est `seeds/content-seed.sql`, versionné.
Deux scripts automatisent le va-et-vient (liste noire des tables joueur → tout nouveau contenu
est capturé automatiquement) :

```bash
./scripts/content-dump.sh --push   # après AVOIR MODIFIÉ du contenu : dump + git commit + push
./scripts/content-load.sh --pull   # sur l'autre machine / après recréation du volume : pull + import
```

- **Toute modification de contenu par un agent DOIT se terminer par `./scripts/content-dump.sh`**
  (avec `--push` si l'utilisateur veut synchroniser) — sinon la modif n'existe que dans le
  volume Docker local et sera perdue.
- Le seed **exclut volontairement** les tables joueur (`user`, `inventaire*`, `user_quete`,
  progression…) : `content-load.sh` écrase le contenu **sans toucher aux comptes joueurs**. Les
  données joueur ne sont donc PAS synchronisées entre machines (filet de sécurité local :
  `backups/`, gitignoré).
- La liste noire est en tête de `scripts/content-dump.sh` ; ajouter toute nouvelle table
  joueur/runtime avant de dumper, pour ne jamais fuiter de données de partie dans le seed.

## Pièges connus (ne pas découvrir deux fois)

- L'inscription `POST /api/users` vit dans `src/Controller/RegistrationController.php` ;
  la création du personnage se fait dans `src/Event/PostRegisterSubscriber.php`
  (`#[AsDoctrineListener(postPersist)]` — DoctrineBundle n'enregistre PLUS les
  `EventSubscriber` Doctrine par interface, toujours utiliser l'attribut).
- Les PA/PM se régénèrent via le conteneur `alcazan-scheduler` (docker-compose) qui lance
  `php bin/console app:regen-points` toutes les heures (+10 PA/+20 PM, caps 600/800).
- `src/service/ChatService.php` dépend de Ratchet (absent de composer.json) : classe exclue
  de l'autowiring dans `services.yaml`, ne pas la charger. Temps réel → proposition Mercure
  dans DOCUMENTATION.md §9.
- Repositories orphelins (entités supprimées) : `ExperienceRepository`,
  `ExperienceJoueurRepository`, `ActionParamsRepository`.
- Le schéma BDD est baseliné par des migrations (marquées exécutées) : toute évolution passe
  par `doctrine:migrations:diff` puis `migrate`. `doctrine:schema:validate` doit rester vert.
- Tests : `docker exec symfony-backend php vendor/bin/phpunit` (unitaires + fonctionnels sur la
  base isolée `chusei_test` — DATABASE_URL forcée dans phpunit.xml.dist, recréation §10 de la doc).
- Quêtes (refondu 15/07/2026, doc §11) : `QuestProgressionService` est l'UNIQUE machine à états
  (démarrage/conditions/récompenses/avancement par `position + 1`). Un seul endpoint d'action
  `POST /api/quest/action` ; les effets scriptés passent par l'enum `QuestEffect` +
  `QuestEffectRegistry` (JAMAIS d'URL en base). `action.action_type` = enum `ActionType` en dur ;
  `BATTRE_MONSTRE`/`CHOIX`/`KILL_PVP` sont réservés (le dispatcher jette). QuestMaker sous
  `/api/quest/editor/*` (ROLE_ADMIN), champs pilotés par `Config\QuestActionTypeConfig`.
- Front quêtes : la modale PNJ est rendue UNE fois (`PnjInteractionHost` dans MapPage), pilotée
  par le state Redux `pnjInteraction` — ne jamais remettre de modale par tuile ni de fetch au
  mount des PNJ. Les dialogues sont des paragraphes texte (pas de HTML injecté).
- Ids de contenu (spawn, classe par défaut, équipements de départ…) : `src/Config/GameContent.php`.
- Secrets : `JWT_PASSPHRASE` vit dans `.env.local` / `.env.test.local` (non committés),
  les clés `config/jwt/*.pem` ne sont plus suivies par git.
- `.env` du back pointe sur le port 3307 : ignoré, `DATABASE_URL` vient du docker-compose.
- L'URL de l'API du front vient de `REACT_APP_API_URL` (docker-compose), fallback 127.0.0.1:8080.

## Refonte graphique (en cours — voir `docs/REFONTE_PLAN.md`)

- **Maquettes de référence** : `design/` (un bundle par écran, README + `.jsx` de
  référence haute fidélité ; `design/react/` = bundle général + modale Profil).
  Fidélité pixel perfect exigée. Les `.jsx` des bundles ne sont JAMAIS copiés tels
  quels : on les recrée selon les conventions ci-dessous.
- **Règle absolue : ne pas toucher à la logique de jeu** (state Redux, appels API,
  gameplay). Refonte = markup + styles uniquement, en rebranchant les vraies données
  là où les maquettes ont des valeurs en dur. Les assets du jeu sont conservés.
- **Design tokens** : custom properties CSS dans `src/styles/_tokens.scss` (source
  unique — aucun hex en dur ailleurs). Palette : or `#e3b64f` (hover `#f2d488`) sur
  fonds vert sombre `#06303b → #041e26`, panneaux `rgba(8,40,50,.85)` bordés
  `rgba(227,182,79,.3)`, texte `#eef6f6/#b7d2d6/#9fc3c9/#7fa8ae`, PV `#a91f1c→#e04a39`,
  PM `#1d5fa8→#3f8fdd`, XP `#b8892e→#e3b64f`, PA `#f0a95c`. Rayons 6/10/12/16,
  transitions `.15s`. Polices : **Cinzel** (titres) + **Nunito Sans** (corps),
  chargées dans `public/index.html`.
- **Conventions CSS** : vrais CSS Modules colocalisés (`import styles from
  './X.module.scss'`, classes camelCase) + couche globale minimale
  (`src/styles/app.scss` = `_tokens` + `_base` + `_legacy`). Kit UI réutilisable dans
  `src/components/ui/` (`Panel`, `GaugeBar`, `Slot`, `GameButton`) — le réutiliser
  avant de créer du neuf. `_legacy.scss` est transitoire : tout style legacy remplacé
  par une phase de refonte est supprimé dans la même passe. Bootstrap interdit dans le
  code refondu (retiré en phase finale).
- **Hooks fonctionnels à préserver** : les classes `lifeBar`, `manaBar`, `pa`, `pm`,
  `spell-bar`, `spell-container`, `spell-filter-<id>`, `consommable-filter-<id>`,
  `pnj` sont utilisées par intro.js et des `querySelector` (cooldowns) — les garder
  dans le markup même sans style.
- **Modales de jeu** : TOUJOURS `ui/gameModal/GameModal` (comportement : superpose la
  zone de carte via le portal `#game-modal-root` rendu par MapPage, repli plein écran
  ailleurs, backdrop flouté + Échap) + `ui/gameModal/ModalShell` (cadre standard :
  header icône/titre Cinzel/sous-titre/zone droite/✕, corps flexible, pied optionnel).
  Inventaire et Profil les utilisent déjà ; les modales PNJ / quêtes / échoppes
  (encore sur le vieux `components/modal/Modal`) devront migrer dessus lors de leur
  phase. Ne jamais recréer d'overlay ad hoc.

## Conventions du code existant

- Back : logique métier dans `src/service/` (namespace minuscule `App\service`), contrôleurs
  fins, requêtes custom dans `src/Repository/`, réponses en `new Response(json_encode(...))`.
  Pour du code neuf : pattern DTO + `#[MapRequestPayload]` comme dans `ActionController`.
- Front : un service axios par domaine dans `src/services/`, état global de jeu dans
  `playerStatsReducer` (`store/reducers.js`) ; `updateJoueurState({needRefresh: true})` force le
  rechargement de la carte. Router = react-router v5, `HashRouter`.
- Textes joueur en français, souvent générés côté back avec du HTML (`<br/>`).
- Tests quasi inexistants (`tests/SpellTest.php` seul) — en ajouter sur `SpellService`/
  `QuestService` avant de refactorer.
