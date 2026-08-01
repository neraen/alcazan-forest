# Alcazan Forest — repères pour agent

Jeu MMORPG 2D à cases : backend Symfony 7 (`alcazan-back-prod/`, sous-module git), frontend
React 18 CRA (`alcazan-front-prod/`, sous-module git), MySQL 8, orchestré par Docker Compose.
**Lire `DOCUMENTATION.md` avant toute modification** : architecture, règles du jeu, modèle de
données, endpoints, dette technique et checklist y sont détaillés.

## Reprendre sur une autre machine

Procédure complète en §19 de `DOCUMENTATION.md`. Les trois pièges : cloner avec
`--recurse-submodules` (les sous-modules sont sur d'AUTRES branches — back `master`, front
`migration-typescript`, racine `main`) ; recréer `.env.local` + `.env.test.local`
(`JWT_PASSPHRASE`) et les clés `config/jwt/*.pem`, jamais committées ; la base est vide au
premier démarrage → `doctrine:migrations:migrate` (la 1re migration EST le schéma complet)
puis `./scripts/content-load.sh`. Les comptes joueurs ne sont pas partagés.

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
- Deux tables sont du **contenu portant aussi du runtime** : `carte_carreau` (`joueur_id`) et
  `monstre_carreau` (`quantity`/`current_life`). Elles sont dans la liste `SANITIZED` du script :
  structure dumpée depuis `chusei`, données depuis une copie neutralisée. Ne jamais les
  basculer dans `EXCLUDE` (on perdrait le décor) ni les sortir de `SANITIZED`.

## Pièges connus (ne pas découvrir deux fois)

- L'inscription `POST /api/users` vit dans `src/Controller/RegistrationController.php` ;
  la création du personnage se fait dans `src/Event/PostRegisterSubscriber.php`
  (`#[AsDoctrineListener(postPersist)]` — DoctrineBundle n'enregistre PLUS les
  `EventSubscriber` Doctrine par interface, toujours utiliser l'attribut).
- Les PA/PM se régénèrent via le conteneur `alcazan-scheduler` (docker-compose) : boucle à la
  minute qui lance `app:echanges:expirer` (filet d'expiration des échanges) et, toutes les
  60 itérations, `app:regen-points` (+10 PA/+20 PM, caps 600/800).
- `src/service/ChatService.php` dépend de Ratchet (absent de composer.json) : classe exclue
  de l'autowiring dans `services.yaml`, ne pas la charger. Temps réel → Mercure : le hub
  `alcazan-mercure` tourne dans le compose (port hôte 5001, macOS squatte 5000 avec AirPlay).
  Abonnement front : `POST /api/mercure/token` (JWT subscriber aux topics du joueur, JAMAIS de
  wildcard) + query param `authorization` de l'EventSource (`src/hooks/useMercure.js`).
- **Items/or du joueur : `src/service/SacService.php` est l'UNIQUE point de mutation** (piles
  d'inventaire + `user.money`), sans flush interne — l'appelant fournit la transaction. Il porte
  aussi les réservations (`reservation_ressource`) : le « disponible » = possédé − réservé, et
  vendre/consommer/équiper/payer une quête contrôle ce disponible. Ne jamais retoucher
  `setQuantity`/`setMoney` ailleurs.
- Échanges joueur-à-joueur (24/07/2026, doc §12) : `EchangeService` est l'UNIQUE machine à
  états (verrou pessimiste par session, `expectedVersion` → 409 avec état frais, toute
  modification invalide LES DEUX confirmations, expiration lazy) ;
  `EchangeFinalisationService` fait le transfert atomique sous verrous users ordonnés (id
  croissant). Front : `EchangeHost` rendu UNE fois dans MapPage (patron PnjInteractionHost),
  état Redux `echange` = toujours le payload normalisé du serveur. Les tables `echange`,
  `echange_ligne`, `reservation_ressource` sont dans la liste noire de `content-dump.sh`.
- **Hôtel des ventes (30/07/2026, doc §20)** : marché ASYNCHRONE ; `HotelVenteService` est
  l'UNIQUE machine à états de `hotel_vente` (liste noire du dump). **Le séquestre n'est PAS une
  réservation** : l'objet déposé SORT du sac (`retirerItem`) et n'existe plus que dans l'annonce
  — `reservation_ressource` ne sert qu'à l'échange (5 min), une annonce vit 48 h, et le joueur
  verrait un objet inutilisable dans son sac. Modèle économique = **frais de dépôt** prélevés à
  la mise en vente et JAMAIS remboursés (puits monétaire) ; le vendeur touche donc 100 % du prix
  à la vente. Le lot est INDIVISIBLE. Pas de colonne `version` (une annonce n'est pas co-éditée)
  : verrou pessimiste + test du statut → 409 `hotel_vente_indisponible` avec l'annonce fraîche,
  et `prixAttendu` n'est qu'une garde d'écran périmé. ⚠️ `app:hdv:expirer` n'est PAS un filet
  comme `app:echanges:expirer` : c'est le SEUL chemin par lequel un invendu revient dans un sac
  (le paresseux ne couvre que les annonces consultées) — la désactiver confisque des objets.
  Recherche : `item_id` n'a pas de FK, le terme est résolu en ids par
  `SacService::rechercherItemsParNom` puis les annonces filtrées — ne jamais figer le nom sur
  l'annonce. Front : modale ouverte depuis `SideMenu` par `useModal()` (patron `AtelierModal`),
  AUCUNE slice Redux, `ItemCard` de l'échoppe réutilisée via une prop `subline`.
- **Journal d'événements (01/08/2026, doc §21, plan `docs/STATISTIQUES_PLAN.md`)** :
  `JournalService` est l'UNIQUE point d'écriture de `evenement_jeu` (liste noire du dump). Il
  écrit en **INSERT natif hors unité de travail — mais sur la MÊME connexion, donc DANS la
  transaction de l'appelant**, et avale ses exceptions vers Monolog. Les deux moitiés de
  l'invariant : *ne jamais faire échouer une action, ne jamais mentir sur une action qui n'a
  pas eu lieu* — d'où le rollback qui efface le log (souhaitable) et l'échec d'écriture qui ne
  remonte pas. Ne JAMAIS bufferiser pour écrire après le commit : ça journaliserait des faits
  annulés. **UN type = UN FAIT** : pas de `OR_GAGNE`/`ITEM_OBTENU` génériques (un achat HDV
  ferait 4 lignes déliées), et `MORT_JOUEUR` couvre toutes les morts (`acteur` = tueur,
  `cible_user` = mort). Le journal s'écrit chez les APPELANTS, jamais dans `SacService` qui n'a
  aucune notion de cause. `cible_user_id` est une COLONNE et pas du JSON (sinon la fiche joueur
  devient un scan complet). Le nom des items est FIGÉ dans `contexte.items` via
  `figerItems()` : `echange_ligne.item_id`/`hotel_vente.item_id` n'ont pas de FK, aucune
  jointure ne les retrouvera. La catégorie n'est PAS en base (dérivée de `TypeEvenement`), et
  le front ne connaît aucun type en dur (`/api/admin/stats/referentiels`). ⚠️ La colonne
  s'appelle `montant_or` : **`or` est un mot réservé MySQL**. Rétention 90 j via
  `app:journal:purger` dans le scheduler — elle ne devra jamais descendre sous la future
  fenêtre anti-farm du PvP, qui lira le journal.
- **Cumuls de partie (01/08/2026, doc §21.7)** : `CumulJoueurService` est l'UNIQUE point de
  mutation de `joueur_cumul` (liste noire du dump), ne flushe pas, et **ignore tout pas ≤ 0** —
  un cumul ne redescend jamais (`giveExpMalusAfterDeath` passe du NÉGATIF par le point de
  passage de l'XP : un malus de mort n'est pas de l'XP dé-gagnée). Table SŒUR de
  `joueur_compteur`, pas concurrente : l'une répond « combien PAR CIBLE », l'autre « combien au
  TOTAL » — et le total ne pouvait PAS tenir dans un compteur, puisque
  `CompteurJoueurService::incrementer` refuse `$cibleId <= 0` (pas de « cible 0 » disponible).
  Ça règle au passage la cible de `KILL_PVP` restée ouverte en §18 : il n'y a pas de cible.
  C'est l'index UNIQUE `(user_id, cle)` qui rend l'upsert possible. **`user.money` et
  `user.honneur` NE SONT PAS des cumuls** mais des états courants — les recopier créerait une
  seconde vérité sur l'or. `MONSTRES_TUES`/`BOSS_VAINCUS` sont des dénormalisations assumées,
  légitimes UNIQUEMENT parce que `app:cumuls:reparer` les reconstruit depuis `joueur_compteur`
  et `user_boss` (qui reste la source, `ActionType::BATTRE_BOSS` en dépend). L'XP backfillée
  est une BORNE INFÉRIEURE (elle ignore l'XP reperdue à chaque mort), assumée : partir de 0
  classerait un niveau 49 derrière un débutant. `POST /api/joueur/stats` est un endpoint DÉDIÉ
  — jamais enrichir `/joueur/data/minimal`, chemin chaud rappelé à chaque déplacement.
- **Classements publics (01/08/2026, doc §21.8)** : `ClassementService` est le point d'entrée
  UNIQUE (`categories`/`top`/`rangDe`) — et c'est ce qui rend le calcul À LA VOLÉE réversible :
  matérialiser un jour = une table + une commande + le corps de deux méthodes, zéro impact
  front. `CategorieClassement` est SÉPARÉE de `TypeCumul` : deux catégories sont des états
  (`user.money`, `user.honneur`) et tous les cumuls ne méritent pas un podium. Le **rang est
  calculé serveur** (les ex æquo le partagent, `index + 1` ne saurait pas le dire) et
  `hors_classement` est en TÊTE des index `(hors_classement, money|honneur)` : la requête
  filtre avant de trier. Pas de pagination — le rang personnel est servi à part.
  ⚠️ **Un champ de DTO typé enum répond 500 et non 422 sur une valeur inconnue**
  (`BackedEnumNormalizer` lève une exception que `#[MapRequestPayload]` ne convertit pas) :
  prendre une chaîne et résoudre par `tryFrom()`. Le travers est GÉNÉRAL — `/api/hotel/catalogue`
  a le même. ⚠️ **La base de test n'est pas réinitialisée entre exécutions** : ne jamais
  asserter une position absolue dans un classement (deux ex æquo laissés par une exécution
  précédente cassent le test sans que rien ne soit cassé) — asserter une concordance.
- **Tableau de bord admin (01/08/2026, doc §21.9)** : `TableauDeBordService` compose les
  agrégats et applique la SEULE règle de domaine de l'écran — `TypeEvenement::fluxMonetaire()`
  classe chaque type en `creation`/`destruction`/`transfert`. **Le SQL sait sommer
  `montant_or`, il ne sait pas qu'un marchand est extérieur à l'économie** : sans cette
  classification, les transferts entre joueurs s'ajouteraient à la création et feraient
  conclure à une inflation inexistante. ⚠️ **`HDV_DEPOT` : l'or détruit ce sont les FRAIS
  (`contexte.fraisDepot`), jamais `montant_or`** qui porte le prix demandé — d'où
  `sommeFraisDepot()`. Un solde positif est une ALERTE (l'or s'accumule), pas une bonne
  nouvelle. `/administration/joueurs` et `/administration/statistiques` existent enfin ;
  `AdminCatalog` a gagné `allowNew={false}` pour les écrans d'observation. ⚠️ Un SVG en
  `preserveAspectRatio="none"` avec `height: auto` suit le ratio du `viewBox` (une courbe
  100×48 dans 500 px faisait 240 px de haut) : poser la hauteur en ligne.
- **Guildes (01/08/2026, doc §21.10)** : `GuildeService` est l'UNIQUE machine à états de
  `guilde`/`joueur_guilde` et OUVRE ses transactions (règle « ne flushe pas » = services de
  VALEUR, pas machines à états). **`joueur_guilde` est la SEULE vérité** : `user.guilde_id` est
  supprimée — elle n'avait aucun écrivain alors que tout l'affichage la lisait, d'où le bug
  « rejoindre une guilde ne fait rien ». **Un joueur = AU PLUS une ligne** (index UNIQUE), donc
  candidat OU membre, jamais dans deux guildes. Les permissions vivent dans `GradeGuilde` et
  nulle part ailleurs : `exclure` exige un grade STRICTEMENT supérieur (sinon deux officiers
  s'excluent à la course), et la transmission de baronnie est une opération À PART de la
  promotion (deux lignes ; jamais deux barons ni zéro). `placeMax` est testé à l'ACCEPTATION,
  pas à la candidature. Un baron ne quitte pas s'il reste des membres ; seul, il emporte la
  guilde. Chaque transition renvoie l'ÉTAT FRAIS complet (patron `EchangeService`). ⚠️ `guilde`
  est passée dans `EXCLUDE` du dump : sinon les guildes des joueurs partiraient dans git.
- **PvP (01/08/2026, doc §21.11)** : `PvpService` est l'UNIQUE point d'entrée du duel (il ouvre
  sa transaction) et `HonneurService` l'UNIQUE point de mutation de l'honneur (ne flushe pas,
  borne). **`SpellService` n'est pas assaini, il est CANTONNÉ** au calcul de dégâts — le
  mélange calcul + règles est ce qui avait laissé passer les trous. Corrigés ici : le PvP **ne
  décomptait JAMAIS les PA** (contrairement à `doDamageOnBoss`), aucun contrôle de carte,
  portée, `summoningSickness` ni feu ami, et la formule d'honneur avait des TROUS (écart de
  niveaux entre 30 et 50, ou égal à 9/18/30 → +50, le maximum, pour avoir tué très en dessous
  de soi). *Une chaîne de branches sur des entiers aura toujours des trous* → droite bornée
  dans `PvpConfig`. `user.honneur` est passée NOT NULL. `diePlayer(User, ?CauseMort = null)` :
  paramètre OPTIONNEL, donc les appels qui ignorent la cause compilent et journalisent
  « inconnue » ; `JOUEURS_TUES` n'est compté que si la mort a un tueur.
  ⚠️ **Anti-farm : MESURER TÔT, APPLIQUER TARD.** Il lit `evenement_jeu` (seul endroit où le
  journal est une entrée de GAMEPLAY, d'où `RETENTION_JOURS` ≫ `FENETRE_ANTI_FARM_HEURES`).
  Mesuré après `diePlayer`, il voit le kill courant et déclare farm dès la 1re victoire ;
  appliqué avant, le `refresh()` de `diePlayer` efface l'honneur de la victime. D'où le
  paramètre `bool $farm` passé par l'appelant — `appliquerVictoire` ne doit JAMAIS refaire
  le test. Le cooldown des sorts reste hors périmètre (trou GÉNÉRAL aux trois endpoints).
- ⚠️ **Les trois endpoints d'attaque partagent UN CONTRAT DE RÉPONSE** (doc §21.13 bis) :
  `Spell.jsx` consomme `/joueur/attack/{joueur,monster,boss}` de la même façon et lit
  `damage, experience, newExperience, level, lifeJoueur, damageReturns, droppedItems,
  killMessage, message, pa, needRefresh`. **Une clé manquante ne dégrade pas l'affichage,
  elle casse l'écran** : le front fait `droppedItems[0]`, le `TypeError` empêche
  `updateJoueurState`, et le ciblage + les survols meurent jusqu'au F5. `killMessage` est ce
  qui fait DÉCIBLER après une mise à mort. Changer la forme d'une de ces réponses est un
  changement de CONTRAT, pas un nettoyage — et les tests d'effets en base ne l'attrapent pas
  (ajouter un test de forme). Corollaire : toute branche d'attaque doit avoir son `try/catch`
  + toast, les refus serveur étant des 400 ; la garde de distance CÔTÉ CLIENT les rend rares,
  donc invisibles à l'essai rapide.
- **Journal du joueur (01/08/2026, doc §21.12)** : `HistoriqueService` a changé de métier — il
  n'ÉCRIT plus dans `historique`, il LIT `evenement_jeu`. **Plus rien n'écrit dans
  `historique`** (les deux derniers appels, morts monstre/boss, sont supprimés : `MORT_JOUEUR`
  les couvre), donc l'union des deux sources ne peut pas produire de doublon. Les lignes
  héritées sortent en catégorie **« Archives »** — jamais re-typées : ce sont des phrases
  interpolées, les analyser par regex produirait de la FAUSSE donnée structurée. ⚠️ Une partie
  d'entre elles est **doublement encodée** (« infligÃ© ») : réparé à l'AFFICHAGE, avec un test
  qui n'accepte la conversion que si le résultat est de l'UTF-8 valide — une ligne saine
  reste donc intacte.
- ⚠️ **Migrer `chusei_test` EN MÊME TEMPS que la base de dev, jamais après coup** : MySQL ne
  sait pas annuler du DDL, donc une migration qui échoue à mi-parcours laisse un schéma
  partiel (colonnes posées, contraintes absentes) qu'il faut réparer à la main. Au passage,
  `chusei_test` a 34 FK de MOINS que `chusei` (117 vs 151, dette préexistante) :
  `schema:validate` y est rouge, les tests n'éprouvent donc pas l'intégrité référentielle.
- ⚠️ **Insérer une dépendance au MILIEU d'un constructeur casse les tests à mocks positionnels**
  (`DeathServiceButinTest`, `SpellServiceTest`, `VenteServiceTest`, `HotelVenteServiceTest`,
  `QuestProgressionServiceTest`). Le symptôme est un `TypeError` sur un argument sans rapport
  avec ce qu'on vient de changer.
- **Migrer la base de test demande la `DATABASE_URL` explicite** : `--env=test` ne suffit pas
  (docker-compose l'emporte) et la commande migre la base de DEV en annonçant « already at the
  latest version ». Utiliser
  `docker exec -e DATABASE_URL="mysql://root:password@mysql:3306/chusei_test" symfony-backend php bin/console doctrine:migrations:migrate`.
- **Ne jamais dimensionner une modale de jeu en `vw`** (doc §20.4) : l'overlay de `GameModal` est
  ancré sur `.main` de MapPage (~880 px), pas sur la fenêtre — utiliser `width: 100%` +
  `max-width`. Et `.main` est en **`overflow: clip`, pas `hidden`** : `hidden` crée un conteneur
  de défilement, et comme la SpellBar est plus large que la zone, le navigateur scrollait `main`
  au premier clic dans une modale, décalant TOUT le contenu (dont `#game-modal-root`) et
  rognant la modale sur son bord gauche. Ne pas revenir à `hidden`.
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
  seul `KILL_PVP` reste réservé (le dispatcher jette). QuestMaker sous
  `/api/quest/editor/*` (ROLE_ADMIN), champs pilotés par `Config\QuestActionTypeConfig`.
- **Compteurs de progression (26/07/2026, doc §18)** : `CompteurJoueurService` est l'UNIQUE
  point de mutation de `joueur_compteur` (table de RUNTIME joueur, dans la liste noire du
  dump). UNE table générique `(user, type, cible_id, valeur)` pour les trois compteurs de
  `TypeCompteur` — le type dit ce qu'est la cible : `MONSTRE_TUE` → `monstre.id`
  (`DeathService::dieMonster`), `OBJET_FABRIQUE` → `recette.id` (`CraftService::retirer`,
  au RETRAIT pour que « lancer puis annuler » ne compte pas), `RESSOURCE_RECOLTEE` →
  `objet.id` (`InteractionService`, cases `RECOLTER` uniquement, quantité réellement
  ramassée). L'incrément est un `INSERT … ON DUPLICATE KEY UPDATE` en SQL natif et non un
  read-modify-write : **c'est l'index UNIQUE (user, type, cible) qui le rend possible**, le
  retirer ferait perdre des incréments concurrents en silence, pas seulement l'intégrité.
- **Objectifs comptés de quête** : un compteur est CUMULATIF à vie ; ce qui rend l'objectif
  demandable est `user_quete.compteurs_depart` (JSON `{"monstre_tue:12": 47}`), la photo des
  compteurs prise à l'ENTRÉE dans l'étape — reposée au démarrage et à chaque changement de
  séquence, **jamais** quand le joueur reclique sur une étape non franchie (sinon sa
  progression repart de zéro à chaque tentative). Sans ça, « tuez 5 loups » serait déjà
  remplie pour un vétéran. Clé absente = départ 0 = lecture cumulative (dégradation voulue).
  `BATTRE_BOSS` reste volontairement cumulatif : changer sa sémantique casserait le contenu.
- **Karma des choix (doc §18.3)** : `action.karma` est SIGNÉ et nullable, porté par l'ACTION
  (donc par branche) et pas par la séquence. Appliqué APRÈS la condition et le coût — une
  action bloquée n'engage rien — via `KarmaService`, seul point de mutation, qui borne. La
  réponse porte `karma` seulement si la valeur a RÉELLEMENT bougé (`delta` ≠ 0). Le champ est
  rendu en dur dans `ActionForm` (il ne dépend d'aucun type d'action), et `SequenceForm` doit
  déclarer `karma`/`monstreId`/`recetteId` dans l'action neuve — un champ absent du payload
  est effacé en base au premier enregistrement (piège §17.4). Le karma n'a toujours AUCUN
  effet de jeu (lot 6 différé) : il est stocké, affiché en jauge dans le Profil, et gagné ou
  perdu par la récolte, la fabrication et les choix de quête.
- Front quêtes : la modale PNJ est rendue UNE fois (`PnjInteractionHost` dans MapPage), pilotée
  par le state Redux `pnjInteraction` — ne jamais remettre de modale par tuile ni de fetch au
  mount des PNJ. Les dialogues sont des paragraphes texte (pas de HTML injecté).
- Échoppe : achat `POST /joueur/buy/shop`, vente `POST /joueur/sell/shop` (`VenteService`,
  `{type, id, quantite}` avec l'enum `TypeItem`). Le client n'envoie JAMAIS de montant ni ne
  décide du stock : le serveur relit le prix sur l'item (0 si non renseigné), revérifie la
  quantité possédée dans la transaction, et fait foi sur l'or. Côté front, la carte d'article
  est mutualisée dans `components/pnj/shopView/itemCard/ItemCard.jsx` (Acheter et Vendre) —
  ne pas redupliquer de markup de carte.
- Équiper/retirer : `src/service/EquipementEquipeService.php` est l'UNIQUE point d'entrée
  (transaction unique, contrôle de possession, échange remettant l'ANCIEN objet au sac, bonus de
  caracs symétriques). Ne jamais refaire de va-et-vient sac/équipement dans un contrôleur — c'est
  ce qui avait dupliqué l'objet équipé et fait disparaître l'ancien (corrigé le 23/07/2026).
  Index uniques en base sur `inventaire_equipement` et `user_equipement` en filet.
- Donjons (lots 0-1 du 25/07/2026, doc §13) : `DonjonInstanceService` est l'UNIQUE machine à
  états (entrée/sortie/verrou/vie du boss d'instance, expiration paresseuse) — aucun autre
  service ni contrôleur n'écrit dans `donjon_instance*`/`donjon_verrou`. Deux invariants :
  **(1)** en instance, `carte_carreau.joueur_id` n'est ni lu ni écrit (colonne OneToOne
  GLOBALE) — l'occupation est reconstruite par `DonjonMapView` depuis les membres présents,
  et la position reste `user.map_id/case_*`. **Ne JAMAIS cloner `carte_carreau` pour
  instancier une salle.** **(2)** le verrou quotidien est lié à l'INSTANCE (`donjon_verrou`,
  clé `jour_reset` = jour décalé de `donjon.heure_reset`, 5 h) : revenir dans la journée rend
  la même instance, jamais une neuve. Tout ce qui se règle vit dans la table `donjon`
  (niveau min, taille de groupe, durée, heure de reset, sortie) — rien en dur dans le code.
  `instance` est un mot réservé du DQL : ne pas l'utiliser comme alias.
- **Verrou consommé ≠ porte close** : `DonjonInstanceService::peutRejoindre()` est LA règle
  (TERMINEE/ABANDONNEE restent rejoignables, seule l'expiration ferme). Elle teste aussi
  `expireAt`, pas seulement le statut, parce que l'expiration est PARESSEUSE — une instance
  périmée peut encore être marquée `en_cours`. `rejoindre()` s'en sert pour refuser et
  `normalizePorte` pour descendre `verrou.rejoignable` : la modale n'affiche « Retourner dans
  mon expédition » que si c'est vrai, sinon elle annonce le prochain reset et ne propose
  AUCUNE entrée. Sans ça le bouton de retour répondait « revenez après 5 h », soit le message
  d'une nouvelle expédition sur un bouton qui promettait l'inverse.
- Groupe de donjon (lot 2) : `DonjonGroupeService` est l'UNIQUE machine à états du lobby.
  `donjon_groupe` est une table à PART (pas un statut d'instance) parce qu'un lobby ne doit
  consommer AUCUN verrou : les verrous sont posés d'un coup au lancement. L'entrée SOLO n'a
  volontairement pas d'endpoint — c'est un franchissement de wrap ordinaire. Front :
  `DonjonHost` rendu UNE fois dans MapPage (patron `EchangeHost`), état Redux `donjon.porte`,
  `MapController` renvoie `portesDonjon` pour éviter une requête par clic sur un passage.
- Combat de donjon (lot 3, doc §13.7) : `DonjonCombatService` est l'UNIQUE machine de combat
  (garde-fous PA/portée, menace, tick, mécaniques) — personne d'autre n'écrit dans
  `donjon_instance_zone`/`_monstre`/`_levier`. **Le tick est PARESSEUX** : joué au fil des
  requêtes des joueurs (attaque du boss, `POST /api/donjon/combat`), jamais par le scheduler
  (trop grossier à la minute). **Les phases ne sont pas une entité** : une mécanique est
  bornée par une fenêtre de vie du boss (`vieMax`→`vieMin` en %). Les renforts vivent dans
  `donjon_instance_monstre` et NON dans `monstre_carreau` (table du décor, donc partagée).
  Les leviers sont des cases action `SCRIPTED_EFFECT`/`actionner_levier` — pas un type de
  case nouveau ; `QuestProgressionService` injecte `carteCarreauId` dans les params.
- DonjonMaker (lot 4) : `/administration/donjonmaker`, API `/api/donjon/editor/*` (ROLE_ADMIN,
  règle placée AVANT `^/api` dans security.yaml). `DonjonEditorService` sauvegarde fiche +
  salles + mécaniques en UNE transaction avec des **ids stables** — `mecaniques_jouees` et
  `donjon_verrou` les référencent, tout recréer casserait les expéditions en cours. Les champs
  du formulaire viennent de `Config\DonjonMecaniqueConfig` : ajouter une mécanique = un case
  dans l'enum + un case dans la config, le front suit sans être touché.
- **`donjon_salle.condition` est un MOT RÉSERVÉ MySQL** : la colonne est déclarée
  `#[ORM\Column(name: '`condition`')]` dans `DonjonSalle`, sans quoi tout INSERT/UPDATE de
  l'ORM part en erreur de syntaxe 1064 (les SELECT passent, un nom qualifié étant toléré) —
  le DonjonMaker ne pouvait alors RIEN enregistrer. Piège de test associé : Doctrine n'écrit
  que les champs devenus SALES, donc une sauvegarde qui ne change pas la condition ne prouve
  rien ; un test doit modifier la condition (cf. `testChangerLaConditionDUneSalle...`).
- **Consulter une carte ≠ y être** : `/api/map/cases/data` n'éjecte d'une salle de donjon sans
  instance que si le joueur est RÉELLEMENT sur cette carte. Le MapMaker charge n'importe quelle
  carte par cet endpoint : sans ce garde-fou, ouvrir une salle de donjon dans l'éditeur
  téléportait l'admin à la sortie du donjon et renvoyait les cases de la carte de SORTIE sous
  l'id demandé — collisions d'une autre carte par-dessus le décor de la salle. `/map/update`
  ignore par ailleurs tout `carteCarreauId` étranger à la carte éditée (filet : ne jamais
  repeindre une carte du monde ouvert en silence).
- Front donjon (lot 5) : `DonjonCombatHost` (rendu UNE fois dans MapPage) sonde
  `POST /api/donjon/combat` toutes les 2 s en combat. **Ce sondage n'est pas cosmétique :
  le tick serveur est paresseux, c'est lui qui fait avancer la rencontre — le retirer fige
  le combat.** Le compte à rebours des zones est recalculé depuis `resoudreAt` (horloge
  serveur), jamais décompté localement. Le surlignage des zones (`case-zone-donjon` dans
  `mapGrid.scss`) est volontairement très contrasté : testé en jeu, une teinte discrète
  disparaît sur les sols sombres. Cibler un renfort = type `"renfort"` → endpoint dédié.
- **Un monstre d'instance est un monstre ORDINAIRE (27/07/2026, doc §13.7)** : jamais dessiné
  sur la carte (comme tous les monstres du jeu, peints dans l'image de fond), ciblé
  AUTOMATIQUEMENT quand on marche sur sa case, déciblé en la quittant, et il rend XP + butin
  (`DeathService::dieRenfort`, qui compte aussi `MONSTRE_TUE`). Le ciblage vit dans
  `Map.majCibleMonstreInstance()` et lit `renfortId` **de la case** (donc de la carte, qui
  descend à chaque déplacement) — PAS l'état de combat, qui ne se rafraîchit qu'au sondage.
  Il est dans `Map` et non dans `Player` (patron `hasMonstre`) parce que `Player` est aussi
  rendu pour les autres membres du groupe. `/api/target/renfort` renvoie les clés de
  `/api/target/monstre` et `/api/donjon/renfort/attaquer` la forme de
  `/api/joueur/attack/monster` : le front n'a rien à normaliser, et `Spell.handleAttack` DOIT
  lister `"renfort"` (son absence rendait les monstres de salle inattaquables en silence).
- **`DeathService::diePlayer` écrit en DQL, donc HORS de l'unité de travail** : il finit par
  `entityManager->refresh($user)`, sans quoi l'entité en mémoire garde la vie négative et la
  carte d'avant la mort — la réponse annonçait « -35/765 » et le moindre flush ultérieur
  ressuscitait le joueur sur place (il se déplaçait au lieu d'être au cimetière). Corollaire :
  après un `diePlayer`, ne JAMAIS tester `lifeJoueur <= 0` pour savoir s'il y a eu mort (la vie
  est déjà refaite) — c'est ce que fait `mortJoueur` dans le retour de `doDamageOnBoss`.
- **Le boss n'agit que dans SA salle** : `DonjonCombatService::cibleDuBoss($instance, $boss)`
  restreint les candidats aux membres présents sur la carte du boss (sans `$boss`, menace pure).
  Sans ce filtre il frappait — et télégraphiait ses zones sur — un joueur mort reparti en
  salle 1. Et **une zone qui met à 0 TUE** : `jouerTick` joue `diePlayer` APRÈS son flush
  (l'inverse réécrirait l'état d'avant la mort). Avant, la victime restait en vie négative,
  mobile et toujours ciblée. Côté front, `DonjonCombatHost` détecte la perte d'instance
  (`instanceId` qui passe à null) et relit `/joueur/data/minimal` : c'est le seul signal qu'a
  le client d'une mort décidée par le tick.
- **Un refus de passage doit se voir** : `/api/joueur/map/update_position` renvoie
  `{"message"}` en cas de refus (condition de salle, verrou, wrap) et `{"annonce"}` quand une
  salle vient de se peupler ; `Map.changeMap` les toaste. Ces toasts étaient commentés : un
  clic sur la porte ne faisait RIEN de visible, ce qui se lit comme un bug de la carte.
- **`.case` DOIT rester `position: relative`** (`mapGrid.scss`). Tout enfant en
  `position:absolute; inset:0` (renfort de donjon, surlignage de zone) s'ancre sinon sur un
  ancêtre lointain et déborde sur la grille entière, interceptant les clics de déplacement —
  le clavier continuant de marcher, le symptôme trompeur est « je ne peux plus me déplacer
  qu'au clavier ». Images de monstre : convention `/img/monstre/<skin>.png` (l'extension est
  dans le code, pas en base).
- Conditions de salle (25/07/2026, doc §13.11) : `DonjonSalleService` est l'UNIQUE machine à
  états de la progression salle par salle. La population d'une salle va dans
  `donjon_instance_monstre` (par instance), JAMAIS dans `monstre_carreau` (décor partagé).
  `donjon_instance_salle` porte `peuplee` (une salle ne se peuple qu'une fois : sinon ferme
  à XP) et `ouverte` (**une porte franchie le reste** : sinon un retour en arrière enferme
  le joueur). Un levier peut commander une porte ET l'énigme du boss — ORDRE OBLIGATOIRE :
  enregistrer, puis la porte, puis l'énigme de combat, qui CONSOMME les leviers.
- `RecompenseService` est l'UNIQUE point de conversion « ligne `Recompense` → items + or + XP »
  (quêtes, butin de boss, coffres) — ne jamais redistribuer de récompense ailleurs. Le coffre
  de la salle au trésor (`QuestEffectRegistry::recompenseBoss`) exige un kill récent et n'est
  ramassable QU'UNE FOIS par mise à mort (`UserBoss.last_loot`). `boss.actual_life` ne sert
  plus qu'aux boss de PLEIN AIR ; en donjon la vie vit dans `donjon_instance.boss_current_life`.
- Cases interactives (25/07/2026, doc §14) : `InteractionService` est l'UNIQUE machine à états
  (conditions, PA, récompense, effet, métier, rechargement) — personne d'autre n'écrit dans
  `interaction_recharge`. `Interaction` est VOLONTAIREMENT distincte d'`Action` (bouton de
  quête) : ne pas les fusionner. La **portée du cooldown** (`JOUEUR`/`MONDE`/`INSTANCE`) est
  la clé de voûte ; `interaction_recharge.cle` est une CHAÎNE et non des colonnes nullables,
  parce qu'un index UNIQUE MySQL laisse passer les doublons sur NULL.
  L'onglet **Interactions** du panel définit les interactions, l'outil « Poser une interaction »
  du MapMaker les pose (retrait compris via l'option « ✕ Retirer »). ⚠️ Dans les services
  d'édition, relire conditions et cases posées depuis LEUR REPOSITORY et non depuis la
  collection de l'entité : après une sauvegarde, la collection est périmée. Le payload de
  carte porte `interactions` (état par case) — purement informatif, le serveur revérifie ;
  le compte à rebours se recalcule depuis `disponibleAt`, jamais décompté côté client.
- **Métiers (artisanat lot 0, 26/07/2026, doc §16)** : `MetierService` est l'UNIQUE point de
  mutation (apprendre / oublier / expérience) et ne flushe pas. ⚠️ **L'invariant a changé** :
  une ligne `joueur_metier` ne veut plus dire « déjà pratiqué » mais « APPRIS », et
  `gagnerExperience()` **refuse** de la créer (`MetierException`). Sans ce refus, le plafond
  « 2 métiers de récolte / 3 de fabrication » (`Config\ArtisanatConfig`, `FamilleMetier`) ne
  serait pas applicable : on plafonnerait des métiers que le joueur n'a jamais choisis.
  L'apprentissage passe par un PNJ `type = 'metier'` → `view: 'metier'` (patron `guildeView`,
  `MetierView` branché dans `PnjInteractionHost`) ; oublier PERD la progression.
  Le plan complet de l'artisanat est dans `docs/ARTISANAT_PLAN.md`.
- **Récolte éthique/intensive (lot 2, doc §16.3)** : sur les cases `interaction.recolte_choix`,
  une SECONDE recharge partagée (`monde:epuisement`, ou `instance:<id>:epuisement` en donjon)
  est lue EN PLUS du cooldown personnel — c'est le seul moyen qu'une récolte intensive lèse
  autrui, la portée JOUEUR donnant par construction à chacun son propre délai. Ne jamais
  réutiliser la clé `monde` nue : elle sert aux coffres de portée MONDE. Les curseurs sont dans
  `Config\RecolteConfig` et descendent au front avec la carte (aucun chiffre en dur côté
  client). Un `mode` envoyé sur une case sans choix est REFUSÉ ; une case à choix sollicitée
  sans mode est traitée en récolte MESURÉE (défaut prudent). `decrire()` retient le blocage qui
  se lève EN DERNIER, sinon le compte à rebours ment.
- **Fabrication (lot 3, doc §16.4)** : `CraftService` est l'UNIQUE machine à états ; personne
  d'autre n'écrit dans `craft_commande` (table RUNTIME, dans la liste noire du dump). **Le tick
  est PARESSEUX** : `pretAt` est posé au lancement et l'état se déduit de l'horloge serveur —
  jamais de commande de scheduler. « Prête » n'est donc PAS un statut. Les ingrédients sont
  CONSOMMÉS au lancement (pas réservés), et le recyclage rend depuis
  `craft_commande.ingredients`, un **instantané figé** — jamais depuis la recette, qui a pu
  être éditée entre-temps. La sortie d'une recette est une `Recompense`, distribuée par
  `RecompenseService`. Curseurs dans `Config\CraftConfig`.
- **Page Artisanat (27/07/2026, doc §16.7)** : `/artisanat` (`pages/artisanatPage/`) porte les
  métiers (progression des DEUX familles), l'établi et le catalogue de recettes illustré avec
  recherche ; la modale du rail est réduite à la file de fabrication. `FileFabrication` est
  rendu par les deux — une file, un seul markup. **Les chemins d'images vivent UNIQUEMENT
  côté front**, dans `itemUtils.itemImage()` (`/img/objet/<image>`,
  `/img/consommables/<icone>`, `/img/equipement/<position>/<icone>`) : le back renvoie le nom
  de fichier BRUT + la position, jamais un chemin. `Vignette` se replie sur l'initiale quand
  l'image manque (les icônes de métier n'existent pas encore sur le disque). Recherche et
  filtres sont 100 % client (corpus = les recettes des métiers appris, déjà chargées) ;
  `realisable` reste une info serveur, revérifiée au lancement.
- **Fiche d'un métier du rail (28/07/2026, doc §16.8)** : cliquer une carte ouvre ce que le
  métier a à montrer, et c'est la FAMILLE qui décide — récolte → ses ressources
  (`objet.metier` + `objet.niveau_ressource`, joints par `MetierService::progressionDe($user,
  avecRessources: true)`, option activée par `/api/metier/progression` SEUL : `CraftService`
  appelle la même méthode pour les seuls niveaux) ; fabrication → ses recettes, ou « Aucune
  recette disponible pour ce métier ». Les deux occupent la MÊME colonne, d'où un seul état
  (`selection`). Toute carte est cliquable même sans rien à montrer (un clic muet se lit comme
  un bug), et les paliers hors de portée restent affichés, grisés : c'est ce qui dit au joueur
  ce que son prochain niveau ouvrira. Ne jamais confondre les trois vides du catalogue (aucun
  métier de fabrication / métier sans recette / recherche infructueuse) — d'où
  `recettesDuMetier` à côté de `recettesFiltrees`.
- **ArtisanatMaker (lot 4, doc §16.5)** : `/administration/artisanat`, API
  `/api/artisanat/editor/*` (ROLE_ADMIN, règle placée AVANT `^/api`). Trois onglets — Métiers,
  Ressources (= premier éditeur d'`Objet`), Recettes. `ArtisanatEditorService` : une
  transaction, ids stables, relecture depuis LES REPOSITORIES. La liste des maîtres d'un
  métier est RESYNCHRONISÉE (retraits compris). Suppressions refusées tant que c'est
  référencé ; détacher le métier d'un objet le déclasse sans le supprimer.
- **Butin conditionné par un métier (lot 5, doc §16.6)** : `monstre_objet.metier_id` +
  `niveau_metier_min` + `experience_metier` — c'est le dépeceur. Ligne sans métier = butin
  ordinaire pour tous. Le tanneur ne demande AUCUN code : c'est une recette.
- Ids de contenu (spawn, classe par défaut, équipements de départ…) : `src/Config/GameContent.php`.
- Classes d'un équipement : relation N-N (`equipement_classe`), **liste vide = toutes classes**.
  Le payload de `/api/equipement/create` porte `classes: [ids]` et le contrôleur RESYNCHRONISE
  la collection (retraits compris) — ne jamais revenir à un simple `addClasse()`. Ne jamais
  joindre `equipement.classe` dans un `select` scalaire : ça duplique les lignes d'équipement
  (utiliser `EquipementRepository::getClassesByEquipement()`). La restriction n'est appliquée
  nulle part côté gameplay pour l'instant : elle n'est que descriptive.
- **Formulaires d'admin : toujours `onSubmit={(event) => this.handleSubmit(event)}`** et un
  `preventDefault()` dans le handler (doc §15.1). L'EquipementMaker passait l'event à la trappe :
  une simple touche Entrée déclenchait le GET natif du `<form>`, la page se rechargeait pendant
  l'upload de l'image et le `POST /equipement/create` — envoyé APRÈS la réponse de l'upload —
  ne partait jamais. Symptôme : l'image sur le disque, `equipement.icone` vide en base.
  `/api/equipement/create` renvoie `{"id"}` et le formulaire l'adopte : sans ça il restait en
  mode « création » et le clic suivant dupliquait l'objet.
- Import CSV d'équipements (25/07/2026, doc §15.2) : `POST /api/equipement/import-csv`
  (ROLE_ADMIN) → `EquipementCsvImporter`. Positions/raretés/classes/caractéristiques sont
  résolues **par nom contre la base** (ajouter une caractéristique la rend importable sans
  toucher au code), le rapport est ligne par ligne et donne le chemin d'image attendu. Une
  ligne fautive est sautée et rapportée, pas jetée — sur 100 objets, un nom mal orthographié
  ne doit pas faire perdre les 99 autres.
- **Images de l'admin (26/07/2026, doc §17)** : `src/service/ImageUploader.php` est l'UNIQUE
  point d'écriture d'image de l'administration (métiers, objets, PNJ, monstres, interactions
  via `POST /api/admin/image/upload` ; équipements via `EquipementIconeUploader`, qui n'ajoute
  que le sous-dossier de position). Le fichier est renommé d'après le nom de l'élément édité.
  La clé de voûte est l'enum `App\Enum\CollectionImage` : elle dit, PAR CHAMP, si la base
  stocke le nom **avec** ou **sans** extension — quand elle ne la stocke pas, le jeu recolle
  `.png` et l'upload **refuse donc tout sauf du PNG** (sinon on range un JPEG que rien n'ira
  chercher). `pnj.avatar` (avec extension) et `pnj.skin` (sans) partagent le dossier `img/pnj`,
  d'où le suffixe `-avatar`/`-skin`. Côté front, `COLLECTIONS_IMAGE` (`adminImageApi.js`) est
  le MIROIR de l'enum, et `ImageUploadField` le champ réutilisable — ne pas refaire d'input
  fichier ailleurs. Le back écrit dans son `public/img/<dossier>`, **bind-monté sur
  `alcazan-front-prod/public/img/<dossier>`** (docker-compose, une ligne par collection) :
  après un `git pull` touchant docker-compose.yaml, refaire `docker compose up -d` sinon
  l'upload atterrira dans le conteneur back et sera invisible du front.
- ⚠️ Une liste d'admin qui alimente un formulaire d'édition doit porter TOUS les champs du
  formulaire : le front renvoie la fiche telle qu'il l'a reçue, donc un champ absent de la
  liste est **effacé en base** au premier enregistrement (c'est ce que faisait
  `ArtisanatEditorService::lister()` sur `description` et `image` d'un objet).
- Secrets : `JWT_PASSPHRASE` vit dans `.env.local` / `.env.test.local` (non committés),
  les clés `config/jwt/*.pem` ne sont plus suivies par git.
- `.env` du back pointe sur le port 3307 : ignoré, `DATABASE_URL` vient du docker-compose.
- L'URL de l'API du front vient de `REACT_APP_API_URL` (docker-compose), fallback 127.0.0.1:8080.

## Refonte graphique (TERMINÉE le 20/07/2026 — voir `docs/REFONTE_PLAN.md`)

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
  (`src/styles/app.scss` = `_tokens` + `_base`, rien d'autre). Trois feuilles
  globales assumées, chargées par leur consommateur : `components/map/mapGrid.scss`
  (grille de jeu + hooks), `administration/admin.scss` (outillage interne),
  `pages/homePage/home.scss` (parallax publique scopée `.homepage`). Kit UI
  réutilisable dans `src/components/ui/` (`Panel`, `GaugeBar`, `Slot`,
  `GameButton`, `SectionTitle`, `Glyph`, `GameModal`/`ModalShell`) — le
  réutiliser avant de créer du neuf. **Bootstrap a été retiré** (plus de CDN ni
  `react-bootstrap`) : ne jamais réintroduire de classes utilitaires Bootstrap.
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
