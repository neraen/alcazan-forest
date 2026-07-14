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
- Les 9 actions de quête ont leur endpoint dans `ActionController` (pattern DTO). Le référentiel
  `action_type` est aligné sur `App\Enum\ActionType` — ne JAMAIS les désynchroniser.
- Ids de contenu (spawn, classe par défaut, équipements de départ…) : `src/Config/GameContent.php`.
- Secrets : `JWT_PASSPHRASE` vit dans `.env.local` / `.env.test.local` (non committés),
  les clés `config/jwt/*.pem` ne sont plus suivies par git.
- `.env` du back pointe sur le port 3307 : ignoré, `DATABASE_URL` vient du docker-compose.
- L'URL de l'API du front vient de `REACT_APP_API_URL` (docker-compose), fallback 127.0.0.1:8080.

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
