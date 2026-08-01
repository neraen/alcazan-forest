# 📘 Documentation de reprise — Alcazan Forest

> Générée par analyse du code (juillet 2026). Objectif : permettre à un développeur ou à un agent
> (Claude Code) de reprendre ce projet legacy et de développer de nouvelles fonctionnalités.

## 1. Vue d'ensemble

**Alcazan Forest** est un jeu de rôle multijoueur web (MMORPG 2D à cases, type Dofus/jeu par
navigateur) : déplacement case par case sur des cartes, combat par sortilèges (PvE monstres/boss
et PvP), quêtes dialoguées avec PNJ, inventaire/équipement, guildes, alignements, honneur.

### Les 4 sous-projets du repo `alcazan-docker`

| Dossier | Rôle | Stack | État |
|---|---|---|---|
| `alcazan-back-prod/` | API du jeu (sous-module git) | Symfony 7.0/7.1, PHP ≥ 8.2, Doctrine ORM 2.20, JWT (Lexik), MySQL | Actif, cœur du projet |
| `alcazan-front-prod/` | Client web (sous-module git) | React 18, CRA (react-scripts 4), Redux legacy + Context, axios, react-router v5, Sass | Actif, cœur du projet |
| `alcazan-app/` | App mobile | Expo 53 / React Native 0.79, expo-router | **Starter quasi vierge** (écrans map/profile/social/ladder/journal = template Expo) — intention à clarifier |
| `database/` | Vieux datadir MySQL brut versionné | — | **À ne pas utiliser** : les vraies données vivent dans le volume Docker `alcazan-docker_db_data` |

### Lancer le jeu en local

```bash
cd alcazan-docker
docker compose up -d
# Front : http://localhost:3000   (ou via nginx : http://localhost:80)
# API   : http://localhost:8080/api/
```

⚠️ Si les ports 3306/8080 sont pris par les conteneurs d'un autre projet (`symfony_db`,
`symfony_adminer`, en restart=always) : `docker stop symfony_db symfony_adminer` d'abord.

Les images existantes suffisent (le code est bind-mounté, `vendor/` et `node_modules/` sont sur
l'hôte). `docker compose up -d --build` seulement si les Dockerfiles ou dépendances changent.

### Infrastructure Docker (`docker-compose.yaml`)

```
nginx (:80) ──► /api/* → symfony-backend (:8080→80, Apache + PHP 8.3, code bind-mounté)
           └──► /*     → react-frontend  (:3000, npm start, code bind-mounté)
mysql:8.0 (:3306, db "chusei", root/password, volume alcazan-docker_db_data)
```

Incohérences à connaître :
- Le front appelle **directement** `http://127.0.0.1:8080/api/` (codé en dur dans
  `alcazan-front-prod/src/config.js`), pas le proxy nginx. Le proxy `/api/` est décoratif.
- `.env` du back : `mysql://symfony:symfony@mysql:3307/chusei` (port erroné) — **écrasé** par
  `DATABASE_URL` du docker-compose (`root:password@mysql:3306`). Le compose fait foi.
- `docker-composer.prod.yml.yml` (nom typoté, double extension) = variante prod non maintenue.
- **Aucune migration Doctrine** (`migrations/` vide) : le schéma n'existe que dans le volume
  MySQL. Sa perte = perte du schéma ET du contenu du jeu (cartes, classes, sorts, niveaux…).

### Authentification
- `POST /api/login_check` (json_login → JWT Lexik, clés dans `config/jwt/`). Le JWT embarque
  `pseudo`, `id`, `is_active`, `description` (`src/Event/JwtCreatedSubscriber.php`).
- Le front stocke le token en `localStorage` et le passe en `Authorization: Bearer` (axios global,
  `src/services/authAPI.js`).
- ~~L'inscription est cassée~~ **Réparée le 13/07/2026** : `POST /api/users` est géré par
  `src/Controller/RegistrationController.php` (format d'erreur `violations` attendu par le
  front). La création des données de personnage se fait dans
  `src/Event/PostRegisterSubscriber.php` (listener Doctrine postPersist sur User).

---

## 2. Règles du jeu (déduites du code)

### Création de personnage (`PostRegisterSubscriber`)
- Stats initiales : 400 PV, 100 mana, **800 PM** (points de mouvement), **600 PA** (points
  d'action), 10 or, inventaire 100 slots, niveau 1 (0 xp), tutoriel actif.
- 6 caractéristiques initialisées à 1 point + 6 « bonus » (équipement) à 0. Référentiel
  `caracteristique` ids 1–6, dont `constitution` et `armure` cherchées **par nom**.
- Classe par défaut et spawn : carte 2, case (9,9) — ids centralisés dans
  `src/Config/GameContent.php` (l'incohérence carte 1/carte 2 a été corrigée le 13/07/2026).
- La vraie classe est choisie en jeu via la quête initiale (effet scripté `choisir_classe`,
  `QuestEffectRegistry`) : `archer`, `sorcier`, `guerrier`, `moine`, équipement de départ
  défini dans `GameContent`.

### Cartes & déplacement
- Une `Carte` = grille de `CarteCarreau` **24×16** (abscisse 0–23, ordonnée 0–15). Chaque case a
  `isUsable`, `isWrap`, et au plus : un joueur, un PNJ, un groupe de monstres (`MonstreCarreau`)
  ou un boss.
- Déplacement clavier **ZQSD**, 1 case = **1 PM** (`/joueur/case/update_position`).
  Régénération : **+10 PA / +20 PM par heure** (plafonds 600/800) via `app:regen-points`,
  lancée par le conteneur `alcazan-scheduler`.
- **Wraps** : cases de téléportation (`targetMapId`, `targetWrap`) avec condition optionnelle
  (`Wrap.mapCondition`) : `boss` (tué il y a < 3 h), `level`, `alignement`, `quest` (terminée).
  À l'arrivée, le joueur est posé sur une case libre adjacente (rayon 1 puis 2, sinon exception).
- Les cartes ont une position monde (abscisse/ordonnée) pour calculer « la plus proche »
  (distance euclidienne) — utilisée pour cimetières et auberges.

### Combat (`src/service/SpellService.php`)
- Dégâts d'un sort : `rand(degatBase + caracSecondaire×coefSecondaire, degatBase +
  caracPrincipale×coefPrincipal)` où carac = points investis + bonus équipement + buffs actifs.
  Chaque sort : coût PA, cooldown, portée, niveau minimum, lié à une classe.
- Réduction d'armure (PvP uniquement) : `réduction = (1 − 2.2^(−armure/400)) × 0.4` (plafond 40 %).
- Types de sorts : `attack`, `soin`, `buff` (max 3 buffs simultanés, un même buff non cumulable).
- **PvE monstre** : riposte automatique `rand(puissance, puissance×2.2) − armure×0.2` (armure
  réelle du joueur : points investis + bonus d'équipement). Mort du monstre : `quantity−1` sur la case, vie reset, loot
  par `MonstreObjet` (`rand(1, diviseurTauxDrop) ≤ tauxDrop`).
- **PvE boss** : riposte avec un sort choisi selon son % de vie (`BossSortilege.lifePercent`).
  Kill enregistré dans `UserBoss` (lastKill, numberKill) — sert aux conditions de wrap.
  Récompense via `BossRecompense` → `Recompense`. Drop d'équipement : TODO dans le code.
- **PvP** : gain/perte d'**honneur** par paliers de différence de niveaux
  (`computeHonnorGain/Loose` ; attaquer 50 niveaux plus bas = −5 d'honneur).
- Xp par action (aléatoire) : 180–240 (joueur/monstre), 235–340 (boss), 190–255 (soin).
  TODO dans le code : baser l'xp sur l'attaque max potentielle.

### Niveaux & caractéristiques
- Table `Niveau` : xp requise = `10000 × 1.01^n` (seed via `/insert/lvl`), **cap niveau 200**,
  xp excédentaire reportée (`LevelingService`).
- Points de caracs autorisés : `niveau × 5 + 6`.
- PV max recalculés quand la constitution monte : `400 + (constitution+bonus)×5 + niveau×8`.

### Mort
- Joueur : **−9 % de l'xp max du niveau**, téléportation au **cimetière** le plus proche (case
  fixe (11,10)), PV/mana restaurés, « summoning sickness » 30 s (`DeathService`).
- Auberge (`/api/auberge/entrer`) : téléportation à l'auberge la plus proche, `time_auberge`
  horodaté (régénération probablement prévue, non implémentée).

### Quêtes — REFONDU le 15/07/2026 (voir §11)
- Modèle : `Quete` → `Sequence` (position = ordre **linéaire par défaut** ; dialogue **inliné** :
  `dialogueTitre`/`dialogueContenu`), chaque séquence portant ses `Action` (via `SequenceAction`).
  Une séquence **sans quête** = dialogue autonome d'un PNJ type `action` (auberge). Contraintes
  uniques en base : `(quete_id, position)`, `(user_id, quete_id)`, `recompense.action_id`.
- **Branchement (quêtes à embranchement, ajouté le 21/07/2026)** : chaque `Action`/choix peut
  rediriger la suite via `action.next_sequence_id` (saut vers une séquence précise) ou
  `action.ends_quest` (terminer la quête) ; sinon, avancement linéaire `position + 1`. Une
  séquence portant plusieurs actions `CHOIX` (choix narratif pur, sans condition ni coût) devient
  un embranchement. Boucles autorisées (une branche peut viser une séquence antérieure). Une fois
  qu'on branche, poser une « suite » explicite sur les séquences de chaque branche (la position
  n'est plus qu'un ordre d'édition).
- **Récompense par branche** : la récompense est portée par l'`Action` jouée (`recompense.action_id`,
  une par choix), plus par la séquence. Donnée à la sortie du choix, quelle que soit la branche.
- Types d'action : `App\Enum\ActionType` **stocké directement** (`action.action_type`, plus de
  table `action_type` → plus de désynchronisation possible). `SCRIPTED_EFFECT` remplace l'ancien
  `JSON` : l'effet est une case de l'enum `QuestEffect` exécutée par `QuestEffectRegistry`
  (choisir_classe, choisir_alignement, entrer_auberge, recompense_boss) — **plus d'URL en base**.
  `CHOIX` est implémenté (branchement) ; `BATTRE_MONSTRE`, `KILL_PVP` restent réservés : refusés
  bruyamment tant que non implémentés.
- **`QuestProgressionService`** est l'unique machine à états : démarrage explicite (prérequis
  niveau/alignement/quête/objet enforced), garde-fous (action ∈ séquence, séquence courante),
  vérification + consommation, récompense (de l'action), branchement (`ends_quest` >
  `next_sequence` > `position + 1`), complétion — le tout transactionnel. Consulter un PNJ
  (`/api/pnj/interaction`) est une **lecture pure** ; la quête ne démarre que sur `/api/quest/start`.
- Réponses **structurées sans HTML** : `{status: step|blocked|done|locked, quest, step:
  {sequenceId, dialogue: {title, paragraphs}, actions: [{actionId, type, label}]},
  blockedMessages, feedback: {rewards, messages}, needRefresh}` — le serveur décide de la branche,
  le front rend simplement les boutons de l'étape renvoyée.
- QuestMaker : endpoints admin `/api/quest/editor/*` (ROLE_ADMIN, lectures comprises),
  sauvegarde transactionnelle par correspondance d'ids (`QuestEditorService`) — **les ids ne
  churnent plus**. Les champs du formulaire sont pilotés par `Config\QuestActionTypeConfig`
  (exposée par `/editor/config`), les tables `action_field*` ont été supprimées.
  Chaque action porte un sélecteur **« Suite de ce choix »** (`nextSequenceKey` : `''` linéaire,
  `'__END__'` fin de quête, sinon `clientKey` d'une séquence cible) et sa propre **récompense**.
  Les séquences neuves reçoivent un `clientKey` client (uuid) ; la sauvegarde résout les
  branchements en **deux passes** (upsert des séquences → câblage `next_sequence` par `clientKey`),
  ce qui autorise une cible créée plus loin dans le même payload.
- **UX QuestMaker (maître-détail, 22/07/2026)** : l'écran d'édition est un maître-détail —
  rail gauche = **carte de flux en lecture seule** (`QuestFlowMap`, nœuds = séquences, flèches =
  branchements, layout par plus court chemin depuis la séquence 1, arêtes retour en pointillés,
  nœud « 🏁 Fin ») **+** liste des séquences avec résumé des choix (« → cible »). Détail droit =
  le formulaire de la séquence sélectionnée (`SequenceForm`, une seule montée à la fois — les
  valeurs des séquences démontées sont conservées par react-hook-form). Cliquer un nœud de la
  carte **ou** un item du rail sélectionne la séquence. Aucune logique de jeu touchée.
- **Restyle admin (22/07/2026)** : le QuestMaker adopte les design tokens du jeu
  (`_tokens.scss` : or/vert sombre, Cinzel/Nunito) au lieu de l'ancienne palette codée en dur —
  panneaux `--panel`, cartes `--panel-inner`, bordures `--gold-soft`, bouton primaire or plein.
  Tout est **scopé sous `.quest-page-maker-container`** (pas de fuite vers les autres makers) et
  l'`@import` du module est fait **en fin d'`admin.scss`** pour gagner les égalités de spécificité
  contre les styles de champ/bouton de base. Le SVG de la carte est piloté par classes CSS
  tokenisées (fills en `var(--…)`). La **nav admin** (`administration-side-menu`) est passée de
  colonne latérale à **barre horizontale collante** (onglet actif souligné), libérant toute la
  largeur pour le maître-détail.

### Port d'équipement — SÉCURISÉ le 23/07/2026
Toute la mécanique équiper/retirer vit dans **`src/service/EquipementEquipeService.php`**
(`wear` / `unwear`), les contrôleurs ne font que traduire les `\DomainException` en 400.
Invariants tenus par le service : un objet est **soit dans le sac, soit porté** (jamais les
deux, jamais nulle part) ; **un seul équipement par position**, l'échange remettant l'**ancien**
objet au sac ; les bonus de `joueur_caracteristique_bonus` suivent exactement les objets portés
(ligne créée si elle manque, plancher à 0) ; **le tout dans une seule transaction**
(`wrapInTransaction`).

> **Bug corrigé** : équiper un objet sur une position déjà occupée remettait dans le sac le
> **nouvel** objet au lieu de l'ancien (`$data['idEquipement']` réutilisé dans la branche de
> retour au sac). Résultat : l'objet fraîchement équipé se retrouvait en double et **l'ancien
> disparaissait définitivement**. Deux autres crashs partaient avec : `unwear` lisait une
> variable `$equipementEntity` non définie quand l'objet était déjà en pile dans le sac, et
> `wear` fatalait sur un objet non possédé (aucun contrôle de possession). La suite de flush()
> successifs, sans transaction, laissait en plus l'inventaire à moitié écrit en cas d'erreur.
> Régression couverte par `tests/Service/EquipementEquipeServiceTest.php` (11 tests).

Garde-fous en base (migration `Version20260723110706`) : index uniques
`uniq_inventaire_equipement (inventaire_id, equipement_id)` — une seule ligne de pile par
couple sac/objet — et `uniq_user_equipement (user_id, equipement_id)`. La règle « un seul
équipement par position » n'est pas exprimable en index (la position vit sur `equipement`) :
c'est le service qui la tient.

### PNJ, boutiques, social
- PNJ typés : `shop` (via `Shop`/`ShopEquipement`/`ShopObjet`), `quest`, `action`, `guilde`.
- Achat : `/joueur/buy/shop` (débit du prix boutique, incrément inventaire).
  Vente : `/joueur/sell/shop` (`VenteService`, prix pris sur l'item, 0 si non renseigné) —
  implémentée le 23/07/2026, l'onglet `ShopSell` n'est plus un placeholder.
- **Hôtel des ventes** (30/07/2026, §20) : troisième mode de circulation des biens, entre
  l'échoppe (prix du contenu) et l'échange (synchrone). Marché **asynchrone** joueur-à-joueur,
  frais de dépôt de 5 % prélevés à la mise en vente et non remboursés, lot indivisible,
  48 h de mise en vente puis restitution de l'invendu. `HotelVenteService`.
- Guildes : liées à un **alignement** (obligatoire), candidature grade `recrue`, chef « baron »
  (TODO notifications/limite de places). Amis (`Friend`), messagerie (`Message`), historique de
  combat (`Historique`, flag `isExternal` = événement subi).
- Classements (front) : xp, PvP, heal, alignement, guilde — endpoints back à vérifier.

### Outils d'administration (front `/administration`, flag admin côté front uniquement)
MapMaker (collisions, wraps, PNJ, monstres), création de cartes vierges 24×16, QuestMaker
(quêtes/séquences/dialogues/actions/récompenses), PnjMaker, MonsterMaker, ShopMaker, création
d'équipements. **Aucun contrôle de rôle côté back** (voir §6).
- **Makers de contenu — liste + aperçu (22/07/2026)** : PnjMaker / MonsterMaker / EquipementPage
  partagent le composant réutilisable **`administration/components/AdminCatalog.jsx`** — rail
  gauche = recherche + liste visuelle (vignette + nom + méta), zone principale = **carte
  d'aperçu** (image + tags + tuiles de stats) puis le formulaire de création/édition de
  l'élément sélectionné (id existant → édition, `0` → création). Vignettes tolérantes aux
  images manquantes (repli ✦, reset sur changement de `src`). Résolution d'images :
  PNJ `/img/pnj/<skin|avatar>` (+.png si pas d'extension), monstre `/img/monstre/<skin>.png`,
  équipement `/img/equipement/<position>/<icone>`. L'édition d'un monstre est désormais possible
  (`MonstreController::createMonster` fait un upsert par `id`, comme les PNJ). Le form équipement
  (classe) est piloté par le catalogue via la prop `externalSelectedId`. Styles tokenisés
  (`.admin-catalog*` dans `admin.scss`).
- **Équipements multi-classes (23/07/2026)** : la relation `Equipement ↔ Classe` était **déjà
  N-N** (`ManyToMany`, table `equipement_classe`) — aucune migration n'a été nécessaire, seuls
  l'API et le formulaire la bridaient à une classe. Le maker propose désormais un **sélecteur
  multiple en pastilles** (`.classe-picker` dans `admin.scss`) : on coche autant de classes que
  voulu (archer + guerrier, moine + sorcier…), et la pastille **« Toutes les classes »** vide la
  sélection. **Convention : liste vide = aucune restriction**, plutôt que « toutes les classes
  liées une par une » — ainsi un objet toutes classes le reste quand une nouvelle classe est
  ajoutée au jeu. Payload : `equipement.classes` = tableau d'ids (l'ancien scalaire `classe`
  reste accepté pour un onglet d'admin resté ouvert). `EquipementController::synchroniserClasses`
  **resynchronise la collection** (ajouts *et* retraits, dédoublonnage, ids inconnus ignorés) —
  l'ancien code faisait un simple `addClasse()`, donc éditer un équipement empilait les classes
  sans jamais pouvoir en enlever une.
  > ⚠️ `getAllEquipementGroupedByPosition` ne joint **plus** `equipement.classe` : sur une
  > relation N-N ce `leftJoin` dans un `select` scalaire **dupliquait la ligne d'équipement**
  > autant de fois qu'il avait de classes. Les classes viennent maintenant de
  > `getClassesByEquipement()` (une requête, indexée par id) et sont attachées par
  > `/api/equipements/info` sous la clé `classes: [{id, nom}]`. Les champs `classeId`/`classeName`
  > n'existent plus dans cette réponse.
  >
  > La restriction reste **purement descriptive** : rien côté gameplay ne l'applique
  > (ni `EquipementEquipeService::wear`, ni l'étal, ni l'achat). Un joueur peut équiper un objet
  > d'une autre classe — à implémenter le jour où la règle doit mordre.
- **Upload des icônes d'équipement (23/07/2026)** : plus de copie manuelle de fichier ni de
  saisie du nom d'icône. Le formulaire de création/édition d'équipement expose un bouton
  « Choisir une image » ; à l'enregistrement, le front poste le fichier sur
  **`POST /api/equipement/upload-icone`** (multipart : `icone`, `name`, `positionEquipement`,
  `currentIcone`), puis enchaîne sur `/api/equipement/create` avec le nom de fichier renvoyé.
  Côté back, **`src/service/EquipementIconeUploader.php`** slugifie le nom de l'objet
  (`AsciiSlugger` + lowercase : « Bouclier du pleutre » → `bouclier-du-pleutre.png`), devine
  l'extension **d'après le contenu réel** (`guessExtension()`, whitelist png/jpg/webp/gif, 4 Mo
  max), range le fichier dans le dossier de la position (`bras-droit`, `tete`…, re-slugifié pour
  bloquer toute traversée de répertoire) et suffixe `-2`, `-3`… si un homonyme existe déjà —
  sauf quand la cible est l'icône actuelle de l'objet édité (on écrase alors volontairement).
  Le dossier cible vient du paramètre `app.images_dir` (`services.yaml`), pointé sur
  `public/img` du **back**, dont les sous-dossiers sont **bind-montés sur ceux de
  `alcazan-front-prod/public/img`** dans `docker-compose.yaml` : le back écrit, le
  front sert immédiatement. Route en ROLE_ADMIN via le motif `upload-icone` de `security.yaml`.
  Les anciennes icônes remplacées ne sont **pas** supprimées (fichiers orphelins possibles).
  > Depuis le 26/07/2026, toute la mécanique vit dans `src/service/ImageUploader.php`, partagée
  > avec les autres images de l'administration (§17) ; `EquipementIconeUploader` n'est plus que
  > l'accroche du sous-dossier de position, et reste le point d'entrée des équipements.
- **`POST /api/equipement/create` réparé (23/07/2026)** : la route 500-ait depuis le commit
  `3c80f09` (« Mise en place des DTO/mapRequestPayload »). `CreateEquipementDTO` était **autowiré
  comme un service vide**, jamais hydraté depuis la requête → `Typed property […]::$equipement
  must not be accessed before initialization`. Corrigé par `#[MapRequestPayload]` sur l'argument
  du contrôleur + `array $equipement` dans le DTO (le contrôleur consommait déjà un tableau).
  `DTO/Equipement/Object/{Equipement,Caracteristique}.php`, devenus inutilisés (et de forme
  fausse : ni `icone` ni `idEquipement`), ont été **supprimés**.
- **ShopMaker — développé de 0 (22/07/2026)** : éditeur de boutiques visuel. Une boutique = un
  nom, des **PNJ marchands** associés (cases à cocher ; `pnj.shop` synchronisé) et **trois
  sections** (équipements / consommables / objets), chaque ligne portant un **prix propre**
  (`prix` nullable = prix de base de l'item). Front : `ShopMakerPage` (AdminCatalog pour la liste)
  + `ShopEditorForm` (nom, PNJ, 3 panneaux de section avec picker d'article + input prix +
  vignette + retrait). Back : `/api/shop/editor/{list,get,referentiels,save,delete}`
  (`ShopEditorController` + `ShopEditorService`, ROLE_ADMIN via security.yaml). Sauvegarde =
  reconstruction intégrale des lignes (sans churn d'id) + `em->clear()` avant relecture (le côté
  inverse des collections n'est pas synchronisé après remove/recreate). Modèle : `prix` ajouté à
  `ShopEquipement`/`ShopObjet`, nouvelle entité `ShopConsommable` (shop+consommable+prix, lien
  unidirectionnel), collection `Shop.shopConsommables` ; `shop.type` passe à `'mixte'`.
- **Rendu joueur (branché le 22/07/2026)** : `PnjService::getPnjShop` renvoie **toujours** une
  forme valide `{items, typeShop, title}` pour tout type de boutique (y compris `mixte`) — plus
  de tableau nu qui faisait planter `ShopBuy` (`items.map` sur `undefined`, régression corrigée).
- **Achat — retour utilisateur (23/07/2026)** : `POST /joueur/buy/shop` renvoie désormais
  `{money, prix, nomEquipement, message}` en 200 et **400 `{money, error}`** en cas de refus
  (or insuffisant, objet inconnu) au lieu d'un 200 muet. Côté front, `ShopBuy` affiche un toast
  de confirmation (« X acheté pour N pièces d'or. »), neutralise les boutons pendant
  l'aller-retour (plus de double débit au double clic), libelle « Or insuffisant » sur les
  articles hors budget, et **recale l'or sur la réponse du serveur** (qui fait foi).
  `ShopView` affiche la **bourse du joueur** dans sa barre d'onglets, branchée sur
  `joueurState.money` : elle se décrémente en direct à chaque achat.
- **Vente — implémentée le 23/07/2026** : l'onglet Vendre montre le **sac du joueur** (les trois
  familles : équipements, consommables, objets) au **même format de carte que l'étal**, avec
  filtres par catégorie et pastille de quantité. Le prix affiché est le **prix de revente de
  l'item** (`equipement.prixRevente`, `consommable.prixRevente`, `objet.prix_vente`), **0 si le
  contenu n'en définit pas** — la carte le grise alors et le message de confirmation devient
  « X cédé — le marchand n'en donne rien. ». Endpoint **`POST /joueur/sell/shop`**
  (`{type, id, quantite}` où `type` = enum `TypeItem` : `equipement|consommable|objet`) → 200
  `{money, prix, prixUnitaire, quantite, nom, message}` ou **400 `{money, error}`**. Le
  **client n'envoie jamais de montant** : `src/service/VenteService.php` relit le prix sur
  l'item, contrôle la possession, décrémente la pile (ou supprime la ligne quand on cède les
  derniers exemplaires) et crédite l'or **dans une seule transaction** — un item ne peut donc
  pas disparaître sans être payé, ni l'inverse. Un objet **équipé n'est pas vendable** (il vit
  dans `user_equipement`, hors du sac) : il faut le retirer d'abord. Même UX que l'achat : toast
  de confirmation, bourse mise à jour en direct depuis la réponse serveur, boutons neutralisés
  pendant l'aller-retour, liste rafraîchie après la vente.
  **Vente par lot** : les piles portent un sélecteur `− [n] + Tout` ; la carte affiche alors le
  **prix total** et rappelle le prix unitaire (« 18 l'unité · 6 en stock »), le bouton devient
  « Vendre les N ». Le **stock est relu côté serveur dans la transaction** (`Vous n'en possédez
  que N.`) : une quantité périmée côté client ne peut pas sur-vendre, et le front resynchronise
  son inventaire sur cette erreur. Couvert par `tests/Service/VenteServiceTest.php` (9 tests).
- **Carte d'article partagée** : `components/pnj/shopView/itemCard/ItemCard.jsx` porte toute la
  présentation d'un article (rareté, vignette + quantité, caracs **ou** description, prix,
  sélecteur de quantité optionnel, bouton d'action avec états `pending`/`disabled`). Acheter et
  Vendre s'appuient dessus — ne pas redupliquer de markup de carte dans un onglet. Le bloc
  prix/quantité/bouton est collé en bas (`.cardMeta { margin-top: auto }`) pour que les boutons
  d'une même rangée s'alignent quel que soit le nombre de caractéristiques.
  La section **équipement** est affichée et le **prix par ligne est honoré** : `getEquipementsShop`
  fait `COALESCE(se.prix, equipement.prixAchat)` (affichage) et `/joueur/buy/shop` reçoit le
  `pnjId` pour débiter le prix boutique à l'achat (front défensif `items || []`).
  **Reste à faire : afficher les sections consommable / objet en jeu** (le front `ShopView`/
  `ShopBuy` ne rend que l'équipement).

---

## 3. Modèle de données (déduit des entités Doctrine — `alcazan-back-prod/src/Entity/`)

### Noyau joueur
- **`user`** : email (unique = login), password, pseudo, sexe, roles JSON, description, honneur,
  money, PV/mana courants+max, PA/PM, position (map→`carte` + caseAbscisse/caseOrdonnee),
  classe→, alignement→, guilde→, tutorialActive, summoningSickness, time_auberge,
  created/updated/lastConnexion, maxPointCarac/actualPointCarac/restePointCarac (semblent morts).
- **`niveau_joueur`** (1–1 user) : niveau→`niveau`, experience courante.
  **`niveau`** : référentiel niveau → xp max.
- **`joueur_caracteristique`** (user × caracteristique) : points investis.
  **`joueur_caracteristique_bonus`** : points issus de l'équipement porté (maintenus
  incrémentalement au wear/unwear — fragile). **`caracteristique`** : référentiel 6 lignes.
- **`user_equipement`** : équipement **porté** (pas d'unicité par position en base ; la position
  vient d'`equipement.position_equipement`).
- **`inventaire`** (1–1 user, tailleMax) + liaisons quantifiées : **`inventaire_equipement`**,
  **`inventaire_objet`**, **`inventaire_consommable`**.
- **`user_consommable`** : consommables en barre de raccourcis (position, quantity).
- **`user_sortilege`** : ordre personnalisé des sorts (partiellement implémenté).
- **`user_buff`** (dateDebut/dateFin), **`user_boss`** (lastKill, numberKill), **`user_quete`**
  (progression), **`friend`** (user1/user2), **`message`**, **`historique`**, **`joueur_guilde`**
  (grade string), **`joueur_grade`**/**`grade`** (système parallèle peu utilisé),
  **`joueur_dialogue`**, **`user_sequence`** (semblent morts).

### Monde
- **`carte`** : nom, position JSON + abscisse/ordonnee (position monde), isInstance,
  is_cimetiere, is_auberge.
- **`carte_carreau`** : la case — carte→, carreau→ (terrain), abscisse/ordonnee, joueur (1–1
  User), pnj→, monstreCarreau→, boss→, action→, isUsable, isWrap, wrap→, targetMapId, targetWrap.
  *Relations monstre en double (OneToOne `monstres` + ManyToOne/OneToMany) — à assainir.*
- **`carreau`** : référentiel terrain. **`wrap`** : mapCondition (boss/level/alignement/quest)
  + value.
- **`monstre`** (maxLife, puissance, skin, temps_repop) ; **`monstre_carreau`** = pack sur une
  case (quantity, quantity_base, current_life) ; **`monstre_objet`** = loot (taux_drop,
  diviseurTauxDrop, typeDrop objet|equipement).
- **`boss`** (maxLife, **actualLife globale/persistée**, puissance) + **`boss_sortilege`** (sort
  selon lifePercent → `non_player_sortillege`), **`boss_equipement`**/**`boss_objet`** (loot),
  **`boss_recompense`** → **`recompense`**.
- **`pnj`** : name, avatar, skin, description, type (shop|quest|action|guilde), shop→, quete→.

### Contenu / gameplay
- **`classe`** (4) ↔ **`equipement`** (ManyToMany). **`sortilege`** : classe→, degatBase,
  coefPrincipal/Secondaire, caracteristiqueDegat/Equilibre (**ids en integer nu, pas de FK**),
  type (attack|soin|buff), pointAction, cooldown, portee, niveau, buff→.
- **`buff`** (isCarac, isDispell, isBlocage, value, duree) + **`buff_caracteristique`**.
- **`equipement`** : nom, icone, prix achat/revente, level_min, positionEquipement→, rarity→,
  description + **`equipement_caracteristique`**. **`position_equipement`**, **`rarity`** ET
  **`rarete`** (doublon legacy, `rarete` orphelin).
- **`objet`** (quête/loot), **`consommable`** (type vie|mana, points, isBuff, cooldown, prix).
- **`shop`** (type equipement|objet|consommable|**mixte**) + `shop_equipement`, `shop_objet`,
  **`shop_consommable`** — chaque ligne porte un `prix` nullable (null = prix de base de l'item).
- **Quêtes** : `quete` (name, minimalLevel, alignement→, objet→, quete→ auto-référence),
  `sequence` (position, is_last, next/lastSequence→, dialogue→, pnj→, has_action), `dialogue`
  (titre, contenu), `action` (name, api_link, params, quantity, message + FK optionnelles
  objet/equipement/consommable/boss/pnj/monstre/carte, actionType→), `sequence_action`
  (position), `action_type` (référentiel, isRecursive), `action_field`/`action_field_type`
  (méta du form builder QuestMaker), `recompense`.
- **`alignement`** : nom, couleur, icone, caracs principale/secondaire, carte 1–1, lié aux
  guildes et quêtes. **`guilde`** : nom, description, placeMax/nbJoueurMax (doublon), niveau,
  icone, banner, alignement→.
- **`hotel_vente`** (RUNTIME joueur, §20) : vendeur→, `type` (enum `TypeItem`) + `item_id`
  (**entier nu, pas de FK** — comme `echange_ligne`), quantite, prix total, frais_depot figés,
  statut (enum `StatutHotelVente`), acheteur→ nullable, created/expires/closed_at. L'objet
  déposé est SORTI du sac : la ligne est le seul endroit où il existe jusqu'à sa sortie.

### ⚠️ Repositories orphelins (entités inexistantes → crash si injectés)
`ExperienceRepository`, `ExperienceJoueurRepository`, `ActionParamsRepository`.

---

## 4. Endpoints API

Tous appelés en POST avec body JSON par le front ; **aucune méthode HTTP restreinte** côté back ;
auth JWT obligatoire (`^/api`) sauf mention.

### Auth & joueur
| Endpoint | Rôle |
|---|---|
| `POST /api/login_check` | Login JWT (public) — body `{username, password}` (username = email) |
| `POST /api/users` | **MANQUANT** — attendu par le front pour l'inscription |
| `/api/joueur/data/minimal` | Stats du joueur connecté + niveau/xp |
| `/api/joueur/data/profil` | Profil public `{pseudo}` |
| `/api/joueur/experience` | Niveau + xp |
| `/api/joueur/caracteristiques` | Caracs + max autorisé |
| `/api/joueur/caracteristiques/update` | Répartition de points (⚠️ pas de vérif du plafond) |
| `/api/joueur/spells`, `/api/joueur/profil/spells` | Sorts par classe filtrés par niveau |
| `/api/joueur/consommables`, `/api/joueur/buffs` | Barre de consommables ; buffs actifs |
| `/api/joueur/disable/tutorial` | Coupe le tutoriel |
| `/api/joueur/isfriend`, `/api/joueur/add/friend`, `/api/joueur/remove/friend` | Amis |

### Déplacement & monde
| Endpoint | Rôle |
|---|---|
| `/api/joueur/case/update_position` | `{mapId, caseAbscisse, caseOrdonnee}` → cases + stats |
| `/api/joueur/map/update_position` | Wrap `{wrapId, targetMapId, targetWrap}` (conditions vérifiées) |
| `/api/map/cases/data` | `{mapId}` → toutes les cases |
| `/api/auberge/entrer` | Téléportation auberge la plus proche |
| `/api/target/player\|monstre\|boss` | `{targetId}` → infos cible |

### Combat & actions joueur
| Endpoint | Rôle |
|---|---|
| `/api/joueur/attack/joueur\|monster\|boss` | `{targetId, spellId}` → dégâts, riposte, xp, loot, mort |
| `/api/joueur/spell/self` | Soin/buff sur soi `{spellId}` |
| `/api/joueur/use/consommable` | `{consommableId}` (vie/mana) |
| `/api/joueur/buy/shop` | `{item, pnjId}` → `{money, prix, nomEquipement, message}` ; 400 `{money, error}` si or insuffisant |
| `/api/joueur/sell/shop` | `{type, id, quantite}` (`TypeItem`) → `{money, prix, prixUnitaire, quantite, nom, message}` ; 400 `{money, error}` si absent du sac ou stock insuffisant |
| `/api/user/recompense/boss` | `{bossId}` → message (⚠️ ne donne pas la récompense) |

### Hôtel des ventes (30/07/2026, §20)
| Endpoint | Rôle |
| --- | --- |
| `/api/hotel/catalogue` | `{type?, recherche?, tri?, page?}` → `{annonces, total, page, pages, curseurs, money}` — filtre et tri côté SERVEUR |
| `/api/hotel/mes-ventes` | → `{actives, historique, emplacementsUtilises, curseurs, money}` |
| `/api/hotel/vendre` | `{type, itemId, quantite, prix}` → `{annonce, money, message}` ; frais recalculés par le serveur, jamais transmis par le client |
| `/api/hotel/acheter` | `{annonceId, prixAttendu}` → `{annonce, money, message}` ; **409** `{code: 'hotel_vente_indisponible', error, annonce}` si vendu/retiré/expiré/prix changé |
| `/api/hotel/retirer` | `{annonceId}` → `{annonce, money, message}` ; rend l'objet, ne rembourse PAS les frais |

### Quêtes & PNJ (contrat refondu le 15/07/2026)
| Endpoint | Rôle |
|---|---|
| `/api/pnj/interaction` | `{pnjId}` → **lecture pure**, réponse discriminée par `view: quest\|dialogue\|shop\|guilde` |
| `/api/quest/start` | `{pnjId}` → démarre la quête (prérequis vérifiés, unique par joueur) |
| `/api/quest/action` | `{sequenceId, actionId}` → **l'unique endpoint d'action**, tous types confondus |
| `/api/map/action` | `{actionId}` → action de case (effet scripté, adjacence vérifiée) |
| `/api/quest/editor/list\|get\|referentiels\|config\|save\|delete` | QuestMaker (ROLE_ADMIN, lectures comprises) |
| `/api/joueur/guilde/join`, `/api/guildes/player`, `/api/guilde/infos`, `/api/guildes/player/check` | Guildes |
| `/api/historique/infos`, `/api/profil/joueur/equipement` | Historique ; équipement d'un profil |

Supprimés par la refonte : `/api/pnj` (démarrait la quête à la consultation !), `/api/pnj/sequence`,
`/api/pnj/action`, `/api/pnj/guildes`, les 9 `/api/action/*` par type, `/api/user/choice/classe|alignement`
(→ effets scriptés), `/api/user/recompense/boss`, `/api/joueur/quete/next`, `/api/quests`, `/api/quest`,
`/api/quest/infos`, `/api/quest/create`, `/api/quest/update`, `/api/sequences`, `/api/action/types`,
`/api/action/type/fields`.

### Inventaire & équipement
`/api/inventaire`, `/api/inventaire/equipement/equipe`, `/api/inventaire/equipement/wear`,
`/api/inventaire/equipement/unwear` (`{idEquipement}` ; maintiennent
`joueur_caracteristique_bonus` par ±delta). Depuis le 23/07/2026 wear/unwear délèguent tout à
`EquipementEquipeService` et renvoient **400 `{error}`** sur refus métier (objet absent du sac,
déjà porté, non équipé) — le front affiche le message en toast.

### Référentiels & admin (⚠️ non protégés par rôle)
`/api/quests`, `/api/quest`, `/api/quest/infos`, `/api/quest/create`, `/api/quest/update`
(upsert complet), `/api/map/all`, `/api/map/create`, `/api/map/update`, `/api/map/cases/infos`,
`/api/pnj/infos`, `/api/pnj/create`, `/api/monstres`, `/api/monstre/create`, `/api/bosses`,
`/api/consommables`, `/api/objets`, `/api/sequences`, `/api/equipement/create`,
`/api/equipement/upload-icone` (multipart, ROLE_ADMIN — upload + renommage de l'icône),
`/api/equipement/formelements`, `/api/equipements`, `/api/equipements/grouped`,
`/api/equipements/info`.
**Hors firewall API (sans auth !)** : `GET /insert/lvl`, `GET /insert/blankmap` (seeds), `GET /`.

### Appels front **sans endpoint back**
`POST /api/users` (register), `/api/joueur/fuite`, probablement classements et vente shop.

---

## 5. Frontend — organisation (`alcazan-front-prod/src/`)

- **Entrée** : `index.js` — `HashRouter` (URLs en `#/`), `PrivateRoute` (+`isAdmin` pour
  `/administration`), `AuthContext` + store Redux global.
- **State** : un **unique reducer** `playerStatsReducer` (`store/reducers.js`) mélangeant
  4 domaines : `target` (cible), `positionJoueur`, `joueurState` (PV/mana/PA/PM/xp/messages de
  combat/`needRefresh`), `mapMaker` et `questMaker` (état des outils admin). Actions dans
  `store/actions.js`. Un `moveSlice.js` (Redux Toolkit) isolé et **non branché**.
- **Services API** (`services/*.js`) : wrappers axios par domaine (UsersApi, MapApi, SpellApi,
  InventaireApi, pnjApi, GuildeApi, bossApi…). URL de base **codée en dur** dans `config.js`.
- **Composants clés** : `map/Map` + `Case` + `Player` (grille, clavier ZQSD, class component),
  `UserInterface/*` (HUD : SpellBar, StatBar, CharacterStateBlock), `pnj/PnjModal` + vues
  `QuestView/ShopView/GuildeView/ActionView` selon `typePnj`, `inventory/*`, `profil*`,
  `social/*` (chat/amis/classements, partiellement branchés).
- **Modales du rail** (`components/modals/*`, ouvertes par `useModal()` depuis `SideMenu`) :
  `inventoryModal`, `profilModal`, `spellsModal`, `atelierModal` (file de fabrication) et
  `hotelVenteModal` (hôtel des ventes, §20 — trois onglets, aucune slice Redux).
- **Admin** : `administration/` — pages + forms des makers (drag & drop
  react-beautiful-dnd/react-dnd, CKEditor pour les dialogues).
- Particularités : `npm start`/`build` avec `--openssl-legacy-provider` (CRA 4 sur Node 18),
  textes FR en dur souvent générés **côté back** en HTML dans les réponses JSON (couplage fort).

### Conventions pour développer (humain ou agent)
- Backend : logique métier dans `src/service/` (namespace minuscule à conserver tant que non
  refactoré), contrôleurs fins par domaine, requêtes custom dans les repositories, réponses JSON
  construites à la main (pas de serializer). Nouveau code : suivre le pattern DTO +
  `#[MapRequestPayload]` d'`ActionController` (cf. dernier commit).
- Frontend : 1 service axios par domaine dans `src/services/`, état de jeu via
  `updateJoueurState` (mettre `needRefresh: true` pour forcer le rechargement de la carte),
  modales PNJ par `type`.
- Tout texte joueur est en français, souvent avec du HTML `<br/>` fabriqué côté back — rester
  cohérent ou migrer vers des codes de message.

---

## 6. Dette technique & zones fragiles (par criticité)

> **Mise à jour 13/07/2026 (2e passe)** : TOUS les points 🔴 🟠 🟡 sont corrigés, ainsi que
> l'essentiel du 🔵 (détail aux §8 et §10). Restent volontairement ouverts (décisions produit
> ou migrations lourdes, voir §10) : le système de donjons/instances pour les boss (décidé mais
> à développer), le renommage du namespace `App\service`, la sortie des textes HTML du back,
> la généralisation des DTO aux anciens contrôleurs, et côté front la migration CRA 4 →
> Vite + react-router v6 et le passage à Redux Toolkit.

### 🔴 Bloquant / cassé
1. **Inscription impossible** : pas de contrôleur `POST /api/users` (vestige API Platform).
   À recréer (hash du mot de passe + `PostRegisterSubscriber` fera le seed du personnage).
2. **Endpoints d'actions de quête manquants** (`donner/or`, `donner/equipement`,
   `donner/consommable`, `battre/boss`, `parler/pnj`, `posseder/objet`) alors que le QuestMaker
   les écrit en base.
3. **`ChatService`** : dépend de Ratchet (absent de composer.json) et contient du **code
   exécutable en fin de fichier** (`new App(...)` + `run()`) → fatal au premier autoload.
   Mercure configuré mais aucun hub dans le compose. Le chat est mort.
4. **Aucune migration** : impossible de recréer la base depuis le code. Le volume Docker est un
   point de défaillance unique.

### 🟠 Bugs probables en jeu
5. `ActionController::actionPasserDialogue` : `$user`/`$nextSequence` utilisés hors du `if` →
   crash sur la dernière séquence ; `actionDonnerObjet` appelle `validateQuestAction` **deux
   fois** → double récompense + saut de 2 séquences.
6. `SpellService::playerCanBeBuffed` : logique inversée (`isPlayerBuffed && count < 3`) →
   aucun buff appliqué au premier cast, limite de 3 inopérante.
7. `WrapService::didPlayerKilledBoss` : déréférence `$userBossEntity` avant le null-check →
   crash si le joueur n'a jamais tué le boss.
8. `JoueurController::updateCaracteristiques` : `$user` défini seulement dans la branche
   `constitution` mais utilisé après la boucle ; **aucune vérif du plafond de points côté
   serveur** (triche possible).
9. `getIsFriend` : `$isFriend->getId() ?? 0` → fatal si pas amis. `attackPlayerVsPlayer` :
   `$message` indéfini pour un buff ; **PA/portée/cooldown jamais vérifiés côté serveur**
   (le décompte PA peut passer en négatif).
10. `playerBuyItem` : lit `$data['item']` puis `$data['idEquipement']` (clé différente) dans la
    branche « nouvel équipement » → crash ; renvoie `moneyAfterBuy` même si l'achat a échoué.
11. **`Boss.actualLife` est global** (pas par joueur/instance) ; `UserBoss` cherché par `boss`
    seul (sans `user`) dans `doDamageOnBoss` → kill potentiellement crédité au mauvais joueur.
12. Armure joueur **codée en dur à 30** dans `doDamageOnMonster` ; `getPlayerArmor` ignore les
    points investis (ne lit que le bonus d'équipement).

### 🟡 Sécurité
13. **Injection SQL** dans `HistoriqueService` (concaténation directe du message) → requête
    préparée. Auditer aussi les SQL natifs des repositories.
14. **Endpoints admin sans contrôle de rôle** ; `/insert/*` accessibles **sans authentification**.
    Le flag admin n'existe que côté front.
15. CORS `*` + headers dupliqués (nginx ET NelmioCors), JWT passphrase et `.env` committés.

### 🔵 Qualité / cohérence
16. Doublons/morts : `Rarete`/`Rarity`, `placeMax`/`nbJoueurMax`, relations monstre en double
    sur `CarteCarreau`, `Grade` vs `JoueurGuilde.grade`, contrôleurs invokables morts
    (`JoueurNiveauController`, `JoueurCaracteristiqueController`,
    `UpdateJoueurCaracteristiqueController` — restes API Platform), repositories orphelins
    (`Experience*`, `ActionParams`), route dupliquée `all_equipements_grouped`, `dump()` en prod
    (`PnjController`), fautes (`Controlleur`, `NonPlayerSortillege`, `remvove`),
    `new Response(json_encode(...))` sans `Content-Type` (préférer `JsonResponse`),
    ids de contenu codés en dur (équipements 2/22/23/24, cartes 1/2, carreau 1, wrap 1,
    classe 3, caracs 1–6).
17. Tout en POST sans contrainte de méthode ; DTO `MapRequestPayload` dans 2 contrôleurs
    seulement ; `Utils/DamageCalculator::compute()` ne calcule rien (semble inutilisé).
18. Front : CRA 4 + `--openssl-legacy-provider`, react-router v5, Redux legacy + slice RTK
    orphelin, URL API en dur, gros class components, `console.log`/code commenté.
19. Repo : `database/` (datadir MySQL) et `.idea/` versionnés ; `alcazan-back-prod`/
    `alcazan-front-prod` sont des **sous-modules git avec modifications locales non commitées**.

---

## 7. Checklist avant de retoucher le code — ✅ TRAITÉE (13/07/2026)

**Données & environnement**
- [x] **Volume `alcazan-docker_db_data` sauvegardé** → `backups/backup-chusei-20260713.sql`
      (complet) + `backups/schema-chusei.sql` (schéma seul). Le dossier `backups/` est ignoré
      par git. À refaire régulièrement : `docker exec mysql mysqldump -uroot -ppassword chusei > backups/backup-chusei-$(date +%Y%m%d).sql`
- [x] **Migration initiale créée** : `migrations/Version20260712224704.php` (schéma complet,
      marquée comme exécutée). Les ~11 mappings Doctrine incohérents ont été corrigés
      (inversedBy/mappedBy erronés) et le schéma BDD aligné : `doctrine:schema:validate` est
      **vert**. Les futures évolutions passent par `doctrine:migrations:diff` + `migrate`.
- [x] **Seed du contenu** : `seeds/content-seed.sql` (toutes les tables de référentiel et de
      contenu : cartes, classes, sorts, quêtes, PNJ, boss, équipements…), **versionné dans git =
      source de vérité partagée entre machines**. Deux scripts automatisent le va-et-vient
      (liste noire des tables joueur en tête de `scripts/content-dump.sh` → tout nouveau contenu
      est capturé automatiquement, aucune donnée de partie ne fuite dans le seed) :
      - `./scripts/content-dump.sh --push` — après toute modification de contenu : régénère le
        seed depuis `chusei`, puis `git commit` + `push`. **À lancer systématiquement**, sinon la
        modif n'existe que dans le volume Docker local et sera perdue.
      - `./scripts/content-load.sh --pull` — sur l'autre machine ou après recréation du volume :
        `git pull` puis import. **Écrase le contenu sans toucher aux comptes joueurs** (le seed
        exclut `user`, `inventaire*`, `user_quete`, progression…). Les données joueur ne sont donc
        pas synchronisées entre machines — filet local dans `backups/` (gitignoré).
- [x] `database/` et `.idea/` **retirés du suivi git** (fichiers conservés sur disque),
      `.gitignore` créé, `docker-composer.prod.yml.yml` renommé en `docker-compose.prod.yml`.
      ⚠️ Reste à toi : le workflow des sous-modules (commits locaux non poussés).

**Questions produit — réponses du 13/07/2026**
- [x] **Régénération PA/PM** : +10 PA et +20 PM par heure pour tous les joueurs → **implémenté**
      (`src/Command/RegenPointsCommand.php` + service `scheduler` du docker-compose, plafonds
      600 PA / 800 PM).
- [x] **Boss** : la vie sera **par instance** (tous les joueurs de l'instance la partagent).
      Le système de donjons/instances n'est pas encore développé — `Carte.isInstance` est le
      point d'accroche prévu.
- [x] **Temps réel (Mercure)** : objectif = voir les joueurs se déplacer en direct.
      → Proposition détaillée au §9.
- [x] **`alcazan-app/` (Expo)** : début d'un portage mobile (objectif réel), bloqué par la
      taille de la carte 24×16 qui ne rentre pas sur un écran de téléphone. Pistes : viewport
      scrollable/zoomable centré sur le joueur (rendu par chunks), ou carte mobile réduite.
- [x] **Xp et honneur** : les formules actuelles sont des **placeholders**, les vraies formules
      restent à définir (des tests unitaires encadrent désormais le comportement actuel).
- [x] **`maxPointCarac`/`restePointCarac`** : l'auteur ne sait plus — considérés morts, le
      plafond est recalculé (`niveau × 5 + 6`) et désormais vérifié côté serveur.

**Avant tout développement**
- [x] `POST /api/users` **recréé** (`src/Controller/RegistrationController.php`) — testé de bout
      en bout (création + login + données de jeu). Cause racine de la panne : DoctrineBundle
      n'enregistre plus les `EventSubscriber` Doctrine par interface → `PostRegisterSubscriber`
      converti en listener `#[AsDoctrineListener]`.
- [x] Crashs corrigés : `actionPasserDialogue` (dernière séquence), double récompense
      d'`actionDonnerObjet`, `didPlayerKilledBoss` (null), `getIsFriend` (null-safe),
      `giveRecompenseToUser` (séquence sans récompense), `updateCaracteristiques` (`$user`
      indéfini), `playerBuyItem` (mauvaise clé + achat sans fonds), buffs
      (`playerCanBeBuffed` inversé), code exécutable de `ChatService` retiré + classe exclue
      de l'autowiring.
- [x] Sécurité : routes `create/update` (quest/map/pnj/monstre/equipement) → `ROLE_ADMIN` ;
      `/insert/*` → `ROLE_ADMIN` ; `HistoriqueService` en requête préparée ;
      `IS_AUTHENTICATED_ANONYMOUSLY` (supprimé de Symfony 7) → `PUBLIC_ACCESS`.
      Vérifié : 403 joueur normal sur route admin, 200 gameplay, 401 anonyme sur `/insert`.
- [x] URL API du front : `REACT_APP_API_URL` (définie dans docker-compose, fallback
      `http://127.0.0.1:8080/api/`).
- [x] Tests : `tests/Service/SpellServiceTest.php` + `tests/Service/QuestServiceTest.php`
      (15 tests : formules d'armure/dégâts, barème d'honneur, règles de buff, actions
      conditionnelles, régression récompense nulle). Lancer :
      `docker exec symfony-backend php vendor/bin/phpunit tests/Service`

---

## 8. Travaux effectués le 13/07/2026 (récapitulatif des fichiers)

**Backend (`alcazan-back-prod/`)**
- `src/Controller/RegistrationController.php` — **nouveau** : inscription `POST /api/users`.
- `src/Command/RegenPointsCommand.php` — **nouveau** : `app:regen-points` (+10 PA/+20 PM, caps 600/800).
- `src/Event/PostRegisterSubscriber.php` — converti en `#[AsDoctrineListener(postPersist)]`.
- `src/Controller/ActionController.php` — fin de quête gérée, double récompense supprimée,
  garde-fous `$userQuete === null`.
- `src/Controller/JoueurController.php` — `getIsFriend` null-safe, `updateCaracteristiques`
  corrigé + plafond serveur.
- `src/Controller/PlayerActionController.php` — `$message`/`$valueReturned` initialisés,
  retour de `applyBuffEffect` exploité, `playerBuyItem` réécrit (fonds insuffisants gérés).
- `src/service/SpellService.php` — logique de buff corrigée (`playerCanBeBuffed`).
- `src/service/QuestService.php` — `giveRecompenseToUser` tolère l'absence de récompense.
- `src/service/WrapService.php` — `didPlayerKilledBoss` null-safe.
- `src/service/HistoriqueService.php` — requête préparée (fin de l'injection SQL) + format
  de date corrigé (`H:i:s` au lieu de `h:m:s`).
- `src/service/ChatService.php` — code serveur au chargement retiré ; exclu dans `services.yaml`.
- `config/packages/security.yaml` — `PUBLIC_ACCESS`, routes admin `ROLE_ADMIN`, `/insert` protégé.
- 9 entités corrigées (mappings inversedBy/mappedBy) → `doctrine:schema:validate` vert.
- `migrations/Version20260712224704.php` — baseline du schéma complet.
- `tests/Service/*` — 15 tests unitaires.

**Frontend (`alcazan-front-prod/`)**
- `src/config.js` — `REACT_APP_API_URL` avec fallback.

**Racine**
- `docker-compose.yaml` — service `scheduler` (régénération horaire), env `REACT_APP_API_URL`.
- `.gitignore` — nouveau ; `database/`, `.idea/`, `.DS_Store` sortis du suivi git.
- `backups/` (dump complet + schéma), `seeds/content-seed.sql`.
- `docker-composer.prod.yml.yml` → `docker-compose.prod.yml`.

**Donnée corrigée** : `carte.position` contenait des chaînes vides invalides pour une colonne
JSON → remplacées par `{}` (nécessaire à l'alignement du schéma).

---

## 9. Proposition : déplacement des joueurs en temps réel (Mercure)

> **Mise à jour 24/07/2026 — l'infra Mercure est EN PLACE** (livrée avec le système d'échange,
> voir §12) : hub `alcazan-mercure` dans le docker-compose (port hôte **5001**, macOS squatte
> 5000 avec AirPlay), env alignées (`MERCURE_URL=http://mercure/.well-known/mercure`,
> `MERCURE_JWT_SECRET` = la clé de signature du hub), JWT d'abonnement par joueur via
> `POST /api/mercure/token` (topics explicites, jamais de wildcard) passé en query param
> `authorization` de l'EventSource (hook front `src/hooks/useMercure.js`). Il ne reste pour le
> déplacement temps réel que les étapes 2 et 3 ci-dessous (publier depuis `JoueurController`,
> s'abonner dans `Map.jsx`).

Le besoin : voir les autres joueurs bouger sur la carte sans recharger. Aujourd'hui le front ne
voit les autres joueurs qu'en rechargeant les cases (`/api/map/cases/data`).

**Recommandation : Mercure** — le bundle `symfony/mercure-bundle` est déjà installé et configuré
(`config/packages/mercure.yaml`, variables `MERCURE_*` dans `.env`) ; le hub tourne désormais.
C'est la solution la plus simple ici : pas de serveur WebSocket à maintenir (contrairement à
Ratchet, abandonné), le hub est un binaire Caddy prêt à l'emploi, et côté front c'est de
l'`EventSource` natif (pas de lib).

1. ~~Ajouter le hub au docker-compose~~ — **fait** (service `mercure`, clé de dev partagée
   publisher/subscriber ; en production, générer une vraie clé hors compose).
2. **Publier côté back** : dans `updateCasePosition` et `updateMapPosition`
   (`JoueurController`), injecter `Symfony\Component\Mercure\HubInterface` et publier un
   `Update` sur le topic `map/{mapId}` avec `{userId, pseudo, abscisse, ordonnee, skin}`.
3. **S'abonner côté front** : dans `Map.jsx` (`componentDidMount`), ouvrir un
   `new EventSource(MERCURE_PUBLIC_URL + '?topic=map/' + mapId)` et mettre à jour la case du
   joueur concerné dans `state.cases` à chaque message ; fermer/réouvrir l'EventSource au
   changement de carte (`componentWillUnmount`/`fetchMapData`).
4. **Extensions naturelles ensuite** : topic `map/{mapId}` pour l'apparition/mort des monstres,
   topic `user/{id}` pour les notifications personnelles (attaque subie, message reçu, guilde),
   et le futur chat — le tout sans nouveau composant d'infra.

Alternative minimale si tu veux zéro infra : **polling** de `/api/map/cases/data` toutes les
2–3 s avec diff côté front. Simple mais ~30 requêtes/min/joueur et une latence visible ;
raisonnable pour tester, pas pour durer.

---

## 10. Travaux du 13/07/2026 — 2e passe (apurement complet du §6)

### Système de quêtes enfin complet
- **Découverte majeure** : le référentiel `action_type` en base n'était PAS aligné sur l'enum
  `App\Enum\ActionType` utilisé par le code (ex. id 1 = « donnerObjet » en base mais JSON dans
  l'enum). Le QuestMaker créait donc des actions incohérentes — c'est pourquoi toutes les
  actions existantes en base sont des liens libres sans type. **Réaligné** par la migration
  `Version20260713070356` (14 types, ids = valeurs de l'enum, meta `action_field_type` remappée).
- **6 endpoints d'actions créés** (pattern DTO, `ActionQueteDTO {actionId, sequenceId}`) :
  `action/donner/or`, `action/donner/equipement`, `action/donner/consommable`,
  `action/posseder/objet` (vérifie sans consommer), `action/battre/boss` (vérifie `UserBoss`),
  `action/parler/pnj` (vérifie que le joueur est **adjacent au PNJ cible**, rayon 1).
- `QuestService::isActionConditionMet()` centralise toutes les conditions (aussi utilisée par
  `verifySequenceCondition`, qui gérait mal les types inconnus) ; nouveaux checks BATTRE_BOSS,
  PARLER_PNJ, VISITER_CARTE, POSSEDER_OBJET. `ActionController` refactoré avec réponses
  mutualisées (`questStepResponse`/`questDoneResponse`).

### Combat
- `doDamageOnBoss` : le `UserBoss` est maintenant cherché par **user + boss** (avant : par boss
  seul → kill crédité à un joueur arbitraire).
- Armure réelle du joueur dans `doDamageOnMonster` (avant : codée en dur à 30) et
  `getPlayerArmor` = points investis + bonus d'équipement (avant : bonus seul).

### Sécurité
- **CORS** : plus de wildcard — `CORS_ALLOW_ORIGIN` (regex localhost/127.0.0.1 par défaut) dans
  nelmio ; headers CORS dupliqués **retirés de nginx** (Nelmio gère aussi le preflight).
- **JWT** : nouvelle paire de clés générée avec une passphrase stockée dans `.env.local`
  (non committé) ; `config/jwt/*.pem` sortis du suivi git ; ancienne passphrase neutralisée
  dans `.env`. ⚠️ Les joueurs devront se reconnecter (tokens invalidés).

### Nettoyage (item 16–17)
- Supprimés : entité `Rarete` + table (doublon de `Rarity`, vide), `guilde.nb_joueur_max`
  (doublon de `place_max`), repositories orphelins (`Experience*`, `ActionParams`,
  `RareteRepository`), contrôleurs morts (`JoueurNiveauController`,
  `JoueurCaracteristiqueController`, `UpdateJoueurCaracteristiqueController`),
  `Utils/DamageCalculator` (cassé et inutilisé), `dump()` de `PnjController`,
  `SpellService::egal1()`, dépendance front fantôme `introjs`.
- `QuestControlleur` → `QuestController` ; route dupliquée `all_equipements_grouped` renommée.
- **Ids de contenu centralisés dans `src/Config/GameContent.php`** (spawn, classe par défaut,
  équipements de départ, carreau/wrap par défaut) — et **bug de spawn corrigé** : le joueur
  était posé sur la carte 1 (10,10) alors que son `user.map` disait carte 2 (9,9).
- **`JsonResponse` partout** dans les contrôleurs (`new Response(json_encode(...))` converti,
  ~21 fichiers) + `methods: ["POST"]` sur toutes les routes API (`joueur/caracteristiques`
  accepte GET+POST, seul GET réel du front).
- Crash corrigé au passage : `guildes/player` et `guildes/player/check` plantaient pour un
  joueur **sans alignement**.

### Tests (28 tests, ~1270 assertions — tous verts)
- **Unitaires** (`tests/Service/`) : formules d'armure/dégâts/honneur, règles de buff,
  conditions d'action (boss tué, adjacence PNJ, carte visitée), régressions (récompense nulle).
- **Fonctionnels** (`tests/Functional/ApiFunctionalTest.php`, WebTestCase) : inscription
  (validation `violations`, doublon email, personnage jouable complet), 401 sans token,
  403 joueur normal sur route admin, 401 anonyme sur `/insert`, plafond de caracs serveur,
  guildes sans alignement, **déplacement sur la carte** (PM décrémenté).
- **Isolation** : base dédiée `chusei_test` (schéma = migrations, contenu = seed).
  `DATABASE_URL` est **forcée dans `phpunit.xml.dist`** (`<env force="true">` — indispensable
  car la variable réelle du docker-compose prime sur `.env.test`). La passphrase JWT de test
  vit dans `.env.test.local` (non committé).
- Lancer : `docker exec symfony-backend php vendor/bin/phpunit`
- Recréer la base de test :
  ```bash
  docker exec mysql mysql -uroot -ppassword -e "DROP DATABASE IF EXISTS chusei_test; CREATE DATABASE chusei_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  docker exec -e DATABASE_URL="mysql://root:password@mysql:3306/chusei_test" symfony-backend sh -c "echo y | php bin/console doctrine:migrations:migrate --env=test"
  docker exec -i mysql mysql -uroot -ppassword chusei_test < seeds/content-seed.sql
  ```
  (le seed est assaini depuis le 25/07/2026 — plus besoin de vider `carte_carreau.joueur_id`
  à la main, cf. §13.4)

### Écarts assumés (non traités, avec raison)
- **Namespace `App\service` minuscule** : renommage massif à faible valeur, risqué sur
  filesystem macOS insensible à la casse — à faire dans un IDE avec refactoring automatique.
- **Textes/HTML générés côté back** : design actuel du front (il injecte le HTML reçu) ;
  migrer vers des codes de message = chantier front+back coordonné.
- **DTO partout** : les nouveaux endpoints utilisent le pattern DTO ; convertir les ~70 routes
  legacy est mécanique mais volumineux — à faire au fil de l'eau quand on touche un contrôleur.
- **Front CRA 4 + react-router v5 + Redux legacy** : fonctionne ; la migration recommandée
  (Vite + react-router v6 + Redux Toolkit) est un chantier à part entière à planifier.
- **`NonPlayerSortillege`** (faute dans le nom d'entité/table) : renommage = migration de table
  pour un gain cosmétique.

---

## 11. Refonte du système de quêtes — 15/07/2026

Refonte complète back + front + QuestMaker (contrat API, modèle de données, orchestration
des modales). Motivée par : 3 algorithmes d'avancement divergents, démarrage silencieux des
quêtes au chargement de la carte (`POST /api/pnj` au mount de chaque tuile), un `updateQuest`
delete/recreate sans transaction (churn d'ids), prérequis jamais vérifiés, HTML généré en PHP,
URLs arbitraires en base (`api_link`), quest maker avec double système d'état (Redux mort +
react-hook-form) et bouton « Supprimer » cassé.

### Backend (`alcazan-back-prod`)
- **Modèle** : dialogue inliné dans `sequence` (`dialogue_titre`/`dialogue_contenu`),
  suppression de `is_last`/`has_action`/`last_sequence`/`next_sequence` (l'ordre = `position`,
  la fin = pas de position suivante). `action.action_type` = enum `App\Enum\ActionType` en dur
  (table `action_type` supprimée), `api_link`/`params` → `effect`/`effect_params`
  (enum `QuestEffect`, whitelist `QuestEffectRegistry`). Tables supprimées : `dialogue`,
  `joueur_dialogue`, `user_sequence`, `action_type`, `action_field`, `action_field_type`.
  Contraintes uniques : `sequence(quete_id, position)`, `user_quete(user_id, quete_id)`,
  `recompense(sequence_id)`. Migration `Version20260714225015` (schéma + données legacy
  retypées + bouton « Terminer » ajouté aux séquences sans action).
- **Services** : `QuestProgressionService` (l'unique machine à états — démarrage avec prérequis,
  garde-fous, conditions, consommation, récompenses [bug objet→consommable corrigé],
  avancement `position+1`, transactions), `QuestEffectRegistry` (effets scriptés),
  `PnjInteractionService` (vue par type de PNJ, lecture pure), `QuestEditorService`
  (upsert par correspondance d'ids, ids stables), `AubergeService` (extrait, réutilisé par
  le contrôleur et l'effet `entrer_auberge`).
- **Contrôleurs** : `QuestController` (`/api/pnj/interaction`, `/api/quest/start`,
  `/api/quest/action`, `/api/map/action` — DTO `#[MapRequestPayload]`, erreurs métier
  `QuestException` → 400 + message FR), `QuestEditorController` (`/api/quest/editor/*`,
  préfixe entier ROLE_ADMIN dans security.yaml). Supprimés : `ActionController`,
  `QuestActionControlleur`, `SequenceControlleur`, `QuestService`, `QuestSubscriber`/
  `NextQuestSequenceEvent` (event jamais dispatché), `choice/classe|alignement`,
  `recompense/boss`, `quete/next`, enums `ConditionalAction`/`UnconditionalAction`
  (→ `ActionType::isCondition()`).
- **Tests** (52, ~1380 assertions, verts) : `QuestProgressionServiceTest` (prérequis, conditions,
  consommation, récompenses, avancement, types réservés → exception, garde-fous),
  `QuestEffectRegistryTest`, `QuestApiFunctionalTest` (interaction **sans effet de bord**,
  parcours complet de la quête initiale, doublons, auberge avec proximité serveur, action de
  case, 403 éditeur, sauvegarde idempotente sans churn d'ids).

### Frontend (`alcazan-front-prod`)
- **In-game** : state global `pnjInteraction` (reducer) + `PnjInteractionHost` rendu une seule
  fois dans `MapPage` — fetch **au clic uniquement** (fin de la tempête de requêtes au
  chargement), fermeture par éloignement gérée à UN seul endroit. `Pnj.jsx` est devenu bête
  (sprite + dispatch). `QuestDialogue` (états available/locked/inProgress/done, rendu en
  paragraphes — **zéro HTML injecté**), `PnjActionDialogue`, `ActionMap` re-branché sur
  `/api/map/action`. `react-toastify@8` ajouté (feedback récompenses/messages).
  Fixes : interval fuité de `GuildeView`, listener clavier de `Map` jamais retiré,
  double fetch sur `needRefresh`. Supprimés : `PnjModal`, `QuestView`, `ActionView`,
  `UserActionApi.applyUserAction` (le `JSON.parse` de params backend), `sequenceApi`.
- **QuestMaker** : réécriture des 4 formulaires sur react-hook-form + `QuestEditorContext`
  (référentiels + config fetchés une fois — fin du N+1). Champs d'action 100 % pilotés par
  la config du back, ordre des séquences = position (boutons monter/descendre), suppression
  réparée, payload miroir du DTO back. Purge du bloc Redux questMaker mort (reducers/actions)
  et d'`actionTypeApi`.

### Reste à faire (hors périmètre, notes)
- `RECOMPENSE_BOSS` annonce la récompense sans la distribuer (comportement historique conservé).
- `BATTRE_MONSTRE`/`KILL_PVP` : nécessitent un tracking par joueur avant activation.
- Un utilisateur de test `test-refonte-quete@test.alcazan.fr` (ROLE_ADMIN) existe dans la base
  de dev suite à la vérification bout en bout — à supprimer ou déclasser si gênant.

---

## 12. Système d'échange joueur-à-joueur temps réel — 24/07/2026

Échange type Dofus entre deux joueurs adjacents : session à double confirmation, synchronisée en
temps réel via Mercure, finalisée dans une transaction SQL verrouillée. Conception issue de
`alcazan_systeme_echange_temps_reel.md` (adaptée : pas d'instance d'objet dans ce jeu, pas de
Wallet, pas d'état « en combat » — une ligne d'échange est un triplet `{type, itemId, quantité}`
et l'or vit sur `user.money`).

### Socle : SacService + réservations (refactoring transverse)
- **`src/service/SacService.php` est l'UNIQUE point de mutation des items et de l'or d'un
  joueur** (piles `inventaire_*` + `user.money`). Aucun flush interne : chaque méthode s'appelle
  depuis un `wrapInTransaction` chez l'appelant. Tous les anciens points de mutation ont été
  migrés dessus : `VenteService`, `EquipementEquipeService`, `InventaireService` (réduit à un
  adaptateur déprécié), `QuestProgressionService` (conditions, coûts et récompenses),
  `PlayerActionController` (consommation, achat), `DeathService` (loot).
- **Réservations** : table `reservation_ressource` (`user`, `type` = enum `TypeRessource`
  (equipement/consommable/objet/**or**), `item_id` (0 pour l'or), `quantite`, `origine`,
  `origine_id`). Le « disponible » = possédé − réservé est ce que contrôlent `retirerItem` /
  `debiterOr` : un item proposé dans un échange ne peut être ni vendu, ni consommé, ni équipé,
  ni donné à une quête ; l'or réservé n'est pas dépensable. Libération idempotente par origine.
- Index uniques ajoutés sur `inventaire_consommable` et `inventaire_objet` (même filet que
  `uniq_inventaire_equipement`).

### Domaine et API
- Entités `Echange` (participants, statut `StatutEchange` = en_attente/ouvert/complete/annule/
  expire, or proposé par joueur, deux booléens de confirmation, **version** entière, expiresAt
  glissant +5 min) et `EchangeLigne` (unique par (échange, joueur, type, item)). Les sessions
  terminées restent en base : audit minimal.
- `EchangeService` = l'unique machine à états (création/acceptation/refus/offre/confirmation/
  annulation/expiration lazy). Règles : joueur courant issu de l'authentification ; **verrou
  pessimiste sur la ligne `echange`** à chaque mutation (actions des deux joueurs sérialisées) ;
  `expectedVersion` sinon **409 + état frais** (`EchangeConflitException`) ; toute modification
  d'offre invalide LES DEUX confirmations et repousse l'expiration ; proximité vérifiée CÔTÉ
  SERVEUR (`ProximiteJoueurs`, Tchebychev : rayon 1 pour proposer, 2 pour accepter/finaliser).
- `EchangeFinalisationService` : à la double confirmation, dans LA MÊME transaction — verrous
  `PESSIMISTIC_WRITE` sur les deux users par id croissant, revalidation complète (statut,
  confirmations, expiration, proximité, possessions, or), libération des réservations puis
  transferts croisés via SacService (débits avant crédits pour l'or). La moindre erreur annule
  tout, y compris la confirmation déclenchante.
- Endpoints (POST, convention projet) : `/api/echange/create|accept|decline|current|item/add|
  item/remove|or|confirm|cancel` (`EchangeController`, DTO + `#[MapRequestPayload]`).
  `item/add` porte une quantité ABSOLUE (re-proposer le même item ajuste la ligne).
- Expiration : lazy à chaque accès + filet `app:echanges:expirer` toutes les minutes par le
  conteneur `alcazan-scheduler`.

### Temps réel (Mercure)
- Hub `dunglas/mercure` dans le compose (port hôte 5001). `EchangePublisher` publie l'ÉTAT
  COMPLET normalisé (`EchangeNormalizer`, format unique REST/Mercure) en updates **privés** sur
  `echange/{id}` + `user/{id}` (invitations). Un échec de publication ne casse jamais l'action
  (log ; le front resynchronise via `/api/echange/current`).
- Abonnement : `POST /api/mercure/token` (`MercureJwtFactory`, HS256 signé avec la clé du hub)
  délivre un JWT subscriber limité aux topics du joueur, passé en query param `authorization`
  (EventSource ne porte pas de header). Jamais de wildcard dans les claims.

### Front
- Branche Redux `echange` (`{etat, invitations}`) — l'état est TOUJOURS le payload normalisé du
  serveur ; le reducer ignore les versions plus anciennes (événements dans le désordre).
- `components/echange/EchangeHost.jsx`, rendu UNE fois dans MapPage (patron PnjInteractionHost) :
  resync `/echange/current` au montage et à la reconnexion SSE, abonnement `useMercure`
  (`user/{id}` + `echange/{id}`), bannière d'invitation Accepter/Refuser, bannière « en
  attente », et `EchangeModal` (GameModal/ModalShell) : clic sur un item du sac = +1 proposé,
  − / ✕ sur ses lignes, or validé à Entrée/blur, une requête à la fois, 409 → état frais adopté.
- Clic droit sur un joueur (`Player.jsx` → `PlayerContextMenu`) : « Proposer un échange »
  (grisé si distance > 1 — confort d'affichage, le serveur revérifie).
- Pendant qu'une modale de jeu est ouverte, les déplacements clavier sont gelés
  (`[data-game-modal]`) : on ne peut pas « s'enfuir » avec la fenêtre ouverte ; le serveur
  revérifie de toute façon la proximité à la finalisation.

### Tests
- `tests/Service/SacServiceTest.php` (piles, or, réservations, idempotence) ;
  `VenteServiceTest`/`EquipementEquipeServiceTest` réécrits sur un VRAI SacService (repos
  mockés) ; `tests/Functional/EchangeApiFunctionalTest.php` : cycle complet à deux comptes,
  invalidation des confirmations, 409, objet réservé invendable, libération à l'annulation,
  tiers rejeté, adjacence requise.

---

## 13. Donjons — conception et lot 0 (25/07/2026)

### 13.1 État des lieux avant travaux
Le « Donjon Scintillant » était du **contenu, pas un système** : aucune ligne de code ne
connaissait la notion de donjon.

- Salles = cartes 8 → 9 → 10 → 11 (boss carte 11 en 11,8), reliées par des `carte_carreau`
  `is_wrap` ordinaires ; salle au trésor = carte 15, gardée par le `wrap` 2
  (`map_condition = 'boss'`, `value = 1`, fenêtre de 3 h après la mise à mort).
- « Coffres » = **une seule** case action (id 7, `SCRIPTED_EFFECT` / `recompense_boss`).
- **Zéro monstre** sur les cartes 8–11 → aucune difficulté avant le boss.
- `Carte.isInstance` existe, vaut 0 partout et **n'est lu nulle part**.

Quatre défauts bloquants relevés le 25/07/2026 :
1. **Boss mort en permanence** — `boss.actual_life` est une colonne GLOBALE que rien ne
   remontait : descendue à 1/5000 le 19/07, Grimbald se one-shottait depuis.
2. **Coffre sans butin** — `recompenseBoss()` ne faisait qu'afficher des messages
   (ni or, ni objet, ni XP), ignorait la table de taux (70/30) et était **rejouable à
   l'infini** tant que la fenêtre de 3 h durait.
3. **Fuite de données de partie dans le seed** — `carte_carreau.joueur_id` et l'état de
   `monstre_carreau` étaient versionnés dans `seeds/content-seed.sql`.
4. Fenêtre de 3 h **codée en dur** (`10800`) dans `WrapService`.

### 13.2 Décisions de conception (arbitrées avec l'auteur le 25/07/2026)
- **Verrou quotidien** : reset à **heure fixe (5 h)**, **par joueur**, et **lié à l'instance**
  (modèle WoW) — le verrou se pose à la première entrée ; on peut revenir dans SA propre
  instance jusqu'au reset, mais pas en obtenir une neuve. Règle gratuitement les
  déconnexions et les wipes, qui sont ingérables avec un 24 h glissant strict.
- **Groupe éphémère** limité au donjon (pas de système de groupe global) : modale à
  l'entrée → partir seul, ou avec des joueurs inscrits. Il meurt avec l'instance.
- **Stratégie** : menace, phases, zones télégraphiées, adds, enrage et énigmes sont tous
  attendus au lot 3.
- **Instanciation : surcouche, jamais de clonage de `carte_carreau`.** Le décor reste
  unique et versionné ; l'occupation et l'état des monstres viennent de tables runtime
  quand le joueur est en instance. Cloner ~1 900 lignes de décor par groupe polluerait les
  tables de contenu, casserait le seed et exposerait les clones au MapMaker.

> ⚠️ Le verrou structurel n'est pas le compteur de 5 joueurs : c'est que **la position des
> joueurs et l'état des monstres vivent dans les tables de contenu**
> (`carte_carreau.joueur_id` est un **OneToOne** — une tuile = un joueur pour tout le
> serveur) et que `boss.actual_life` est partagée. Séparer décor et état de partie est le
> vrai chantier ; il touche le chargement de carte et le déplacement.

### 13.3 Découpage
| Lot | Contenu |
|---|---|
| 0 ✅ | Assainissement (ci-dessous) |
| 1 | Tables donjon + instances solo, `DonjonInstanceService`, `DonjonMapView`, verrou |
| 2 | Groupe éphémère de 5, modale d'entrée, sync Mercure (`donjon/{id}`) |
| 3 | Menace, phases, zones télégraphiées, adds, enrage, énigmes, tick de boss paresseux |
| 4 | DonjonMaker (panel admin, patron QuestMaker) |
| 5 | Front : lobby, HUD boss, retours de mécaniques |

### 13.4 Lot 0 — livré le 25/07/2026
- **`src/service/RecompenseService.php` — nouveau** : UNIQUE point de conversion
  « ligne `Recompense` → items + or + XP », partagé par les quêtes, le butin de boss et les
  futurs coffres de donjon. Ne flushe pas (l'appelant fournit la transaction, même contrat
  que `SacService`). Porte aussi `tirerDansTable()` : tirage pondéré par `taux`, total
  ramené à 100 minimum → **une table dont les taux somment à moins de 100 comporte une part
  de « rien »**, ce qui permet de doser la générosité sans table fictive.
- `QuestProgressionService::giveActionReward()` délègue désormais à ce service
  (la logique de distribution n'existe plus qu'à un seul endroit).
- **Coffre réellement lootable** (`QuestEffectRegistry::recompenseBoss`) : tirage dans la
  table de butin puis distribution effective. Trois garde-fous, car la case est cliquable à
  volonté — avoir tué le boss, kill de moins de `FENETRE_SALLE_TRESOR_SECONDES`, et **un
  seul ramassage par mise à mort** (`UserBoss::butinDisponible()` / colonne `last_loot`,
  migration `Version20260724223740`, qui marque les kills antérieurs comme déjà ramassés
  pour ne pas offrir de lot rétroactif).
- **Vie du boss** (`SpellService::doDamageOnBoss`) : remise à `maxLife` à la mise à mort
  (correctif d'attente — elle passera par instance au lot 1). Au passage : la phase du boss
  est calculée sur la vie RESTANTE et non sur la valeur d'avant le coup, un boss terrassé ne
  riposte plus, et `kill` est renvoyé explicitement (le `needRefresh` du contrôleur testait
  un `isset` sur une clé jamais posée).
- Fenêtre de la salle au trésor → `GameContent::FENETRE_SALLE_TRESOR_SECONDES`
  (portée par le donjon lui-même quand le DonjonMaker existera).
- **`scripts/content-dump.sh`** : `carte_carreau` et `monstre_carreau` sont désormais des
  tables « assainies » — **structure** exportée depuis `chusei` (indispensable :
  `CREATE TABLE ... LIKE` ne recopie PAS les clés étrangères), **données** exportées depuis
  une copie temporaire où `joueur_id` est nul et où les populations sont remises à
  `quantity_base` / `monstre.max_life`. Le seed ne transporte plus aucune donnée de partie
  et ne bouge plus quand les joueurs se déplacent.

### Tests
- `QuestEffectRegistryTest` : distribution + horodatage du ramassage, refus sans kill, refus
  du second ramassage sur le même kill, refus d'un kill trop ancien, coffre vide.
- `QuestApiFunctionalTest` : `testLeCoffreDuBossExigeUneMiseAMortRecente` et
  `testLeCoffreDuBossDistribueLeButinUneSeuleFoisParKill` (or réellement crédité, `last_loot`
  horodaté, second passage refusé sans re-créditer).
- `QuestProgressionServiceTest` est branché sur un **vrai** `RecompenseService` (repos
  mockés) : les assertions portent sur les effets finaux en inventaire, pas sur la délégation.

### 13.5 Lot 1 — instances, livré le 25/07/2026

**Modèle.** Deux familles de tables, séparées par la ligne « contenu / état de partie » :

| Contenu (seed) | Runtime (blacklisté du seed) |
|---|---|
| `donjon` — nom, niveau min, taille de groupe max, durée max, **heure de reset**, actif, carte+case de sortie | `donjon_instance` — donjon, leader, statut, **`boss_current_life`**, expiration |
| `donjon_salle` — carte, ordre, type (`entree`/`couloir`/`boss`/`tresor`) ; **une carte n'appartient qu'à un donjon** (index unique) | `donjon_instance_membre` — instance, user, `present` |
| | `donjon_verrou` — user, donjon, **`jour_reset`**, instance |

Aucune règle n'est codée en dur côté service : tout ce qui se règle vit dans `donjon`.
Le Donjon Scintillant est seedé (cartes 8→9→10→11→15, niveau 15, 5 joueurs, 180 min,
reset 5 h, sortie carte 6 en 10,3).

**Les deux invariants qui portent tout le système.**

1. **Le décor n'est jamais dupliqué.** Une salle reste UNE carte en base ; seule
   l'occupation est virtualisée. En instance, `carte_carreau.joueur_id` n'est ni lu ni
   écrit — cette colonne est un **OneToOne global** (une tuile = un joueur pour tout le
   serveur), donc structurellement incapable de porter plusieurs groupes.
   `DonjonMapView::casesPourJoueur()` retire les joueurs joints depuis le décor puis
   réinjecte les membres présents de l'instance, avec exactement les mêmes champs : le
   front ne voit aucune différence. **Ne jamais cloner `carte_carreau` pour instancier.**
2. **Le verrou est lié à l'instance**, pas au fait d'être entré. `jour_reset` est le
   « jour de donjon » (date décalée de `heure_reset`), pas la date civile : à 5 h, une
   session de 2 h du matin compte pour la veille. Tant que le jour n'a pas tourné, le
   joueur retrouve SON instance — déconnexion, mort, wipe et pause sont ainsi gratuits.

**Verrou consommé ≠ porte close.** `DonjonInstanceService::peutRejoindre()` est la seule
écriture de cette règle : TERMINEE et ABANDONNEE restent rejoignables (on revient chercher
le coffre, ou reprendre l'expédition quittée), seule l'EXPIRATION — durée max écoulée —
ferme la porte jusqu'au reset. Le test porte AUSSI sur `expireAt` et pas seulement sur le
statut, l'expiration étant paresseuse : une instance périmée peut encore être marquée
`en_cours` en base. `normalizePorte` descend le résultat dans `verrou.rejoignable`, et la
modale n'affiche « Retourner dans mon expédition » que dans ce cas ; sinon elle annonce le
prochain reset et ne propose plus AUCUNE entrée (ni solo, ni groupe, ni « Rejoindre » —
toutes échoueraient). Corrigé le 27/07/2026 : le bouton de retour était proposé même sur
une expédition refermée et répondait « revenez après 5 h », le message d'une NOUVELLE
expédition sur un bouton qui promettait le contraire.

**Position.** Elle n'est PAS dupliquée dans `donjon_instance_membre` : elle reste
`user.map_id/case_*` comme partout ailleurs. Seule l'écriture dans le décor est sautée.
La collision entre joueurs se juge alors entre membres de l'instance
(`DonjonMapView::positionOccupeeDansInstance`).

**Fichiers.**
- `src/service/DonjonInstanceService.php` — **LA machine à états** : entrée (verrou, niveau
  min, taille de groupe), sortie, rattachement, vie du boss d'instance, expiration
  **paresseuse** (patron d'`EchangeService`, pas de tâche planifiée). Aucun autre service
  ni contrôleur ne doit écrire dans `donjon_instance*` / `donjon_verrou`.
- `src/service/DonjonMapView.php` — LECTURE seule : la vue de carte instanciée.
- `src/service/DonjonSortieService.php` — repose dehors un joueur dont l'instance a expiré
  (isolé pour garder `DonjonInstanceService` libre de toute dépendance au décor).
- `JoueurController::updateMapPosition` — franchir une porte de donjon = entrer dans une
  instance ; un refus (`DonjonException`) se présente comme un wrap bloqué. Sortir vers le
  monde ouvert quitte l'instance (qui reste acquise jusqu'au reset).
- `SpellService::doDamageOnBoss` — la vie vient de l'instance quand il y en a une ;
  `boss.actual_life` ne sert plus qu'aux boss de plein air. À 0 → instance `TERMINEE`.
- `DeathService::diePlayer` — mourir renvoie au cimetière, donc hors de l'instance : le
  membre est marqué absent (sinon « présent » fantôme, et instance jamais refermée).

**Pièges rencontrés.**
- `instance` est un **mot réservé du DQL** : interdit comme alias (`inst` à la place).
- `CREATE TABLE ... LIKE` ne recopie pas les FK (cf. §13.4) — même piège, autre endroit.

### Tests
- `tests/Service/DonjonInstanceServiceTest.php` : le découpage du jour de donjon
  (bascule pile à l'heure de reset, session nocturne rattachée à la veille, deux sessions
  à cheval sur minuit partageant un verrou, heure configurable, prochain reset).
- `tests/Functional/DonjonApiFunctionalTest.php` : l'entrée crée une instance **sans
  marquer la case du décor**, le verrou rend la même instance et n'en crée pas de seconde,
  **deux groupes occupent la même salle sans se voir**, la vie du boss est propre à chaque
  instance (et `boss.actual_life` ne bouge plus), le niveau minimum refuse sans rien créer,
  la sortie rend la case du monde ouvert.

### 13.6 Lot 2 — groupe éphémère de 5, livré le 25/07/2026

**Le lobby est une table à part, pas un statut d'instance.** `donjon_groupe` /
`donjon_groupe_membre` (runtime, blacklistés du seed) portent le groupe formé DEVANT la
porte. Raison d'être de cette séparation : **un lobby ne consomme aucun verrou**. Composer,
hésiter, se disperser doit laisser la journée intacte — ce qui serait impossible si le
groupe était une instance « pas encore lancée ». Les verrous sont posés d'un coup au
lancement, par `DonjonInstanceService::entrer()`, pour tout le groupe.

Un lobby oublié expire au bout de 15 min (expiration **paresseuse**, comme les instances).

**Endpoints** (`DonjonController`, DTO + `MapRequestPayload`, erreurs métier en 400 FR) :
`porte` (tout l'état de la modale en une requête), `groupe/creer`, `groupe/rejoindre`,
`groupe/quitter`, `groupe/lancer`, `groupe/courant`. La porte exige la **proximité** :
le serveur ne se fie pas au clic du front.

> **L'entrée SOLO n'a volontairement pas d'endpoint** : elle reste un franchissement de
> wrap ordinaire (`/api/joueur/map/update_position`), qui crée l'instance au passage
> depuis le lot 1. Ne pas dupliquer cette logique dans `DonjonController`.

**Placement du groupe.** `DonjonTeleportService::placerDansLaSalleDEntree()` (ex-
`DonjonSortieService`, renommé : il fait maintenant l'entrée ET la sortie) pose chaque
membre sur SA case. Le point d'arrivée est **déduit du contenu** — la porte de retour de la
salle d'entrée, c'est-à-dire la case wrap qui vise `donjon.carte_sortie_id` : rien à
configurer en plus, et un donjon redécoupé dans le MapMaker reste cohérent.

**Temps réel.** `DonjonPublisher` (patron d'`EchangePublisher`) sur deux topics :
`donjon-groupe/{id}` (composition du lobby) et `user/{id}` (dissolution et **lancement**,
qui doit atteindre un joueur même modale fermée puisqu'il le téléporte).
`MercureController` inclut désormais le topic du groupe dans le JWT d'abonnement.

**Front.** `DonjonHost` rendu UNE fois dans MapPage (patron `EchangeHost`/
`PnjInteractionHost`) : état de la porte, actions, abonnement Mercure.
`DonjonEntreeModal` est purement présentationnel (`GameModal`/`ModalShell`/`GameButton`,
zéro couleur en dur). État Redux `donjon.porte` = la case cliquée ; la grille ne fait que
dispatch. `MapController` renvoie `portesDonjon` (carteCarreauId → donjonId) pour que
`Map.handleClick` ouvre la modale au lieu de franchir, **sans requête par clic**.

**Trois pièges corrigés en vérifiant dans le navigateur :**
- Après une action qui TÉLÉPORTE (entrée seule, lancement), il ne faut pas relire la porte :
  on n'est plus devant, le serveur répond « vous êtes trop loin » (`executer(..., false)`).
- Les compagnons doivent prendre le `mapId` dans le **payload Mercure** : celui du store est
  encore la carte du monde ouvert, et rafraîchir dessus recharge la mauvaise carte.
- Le meneur reçoit aussi son propre `donjon.groupe.lance` sur son topic personnel → double
  toast et double rechargement s'il n'est pas filtré sur `meneurId`.

`MapController::getMapAndCasesData` renvoie maintenant `abscisseJoueur`/`ordonneeJoueur`, et
`Map.fetchMapData` les réadopte : un `needRefresh` resynchronise donc TOUTE téléportation
décidée par le serveur (entrée en groupe, éjection d'instance expirée, mort).

### Tests
- `tests/Functional/DonjonGroupeApiFunctionalTest.php` : un lobby ne consomme aucun verrou
  (créer + quitter laisse la journée intacte), le lancement met tout le groupe dans UNE
  instance avec un verrou chacun et des cases distinctes, les membres se voient entre eux,
  seul le meneur lance, la taille max est respectée (5e refusé), **un inscrit déjà
  verrouillé empêche le lancement sans rien créer**, le départ du meneur dissout le groupe,
  la porte décrit le donjon et exige la proximité.
- ⚠️ La base de test n'est pas remise à zéro entre les tests : compter les instances par
  `donjon_instance_membre.user_id` des joueurs du test, jamais par `COUNT(*)` global.

### 13.7 Lot 3 — stratégie de combat, livré le 25/07/2026

**Prérequis d'abord : les garde-fous serveur.** `doDamageOnBoss` ne vérifiait ni les PA, ni
la carte, ni la portée — on pouvait frapper à travers le décor et passer ses PA en négatif.
Sans ces contrôles, « portée » et « déplacement » ne veulent rien dire, donc aucune mécanique
de positionnement n'est crédible. `DonjonCombatService::verifierAttaqueBoss()` les impose ;
un refus sort en 400 avec message FR.

**Le tick est PARESSEUX.** Le combat du jeu est asynchrone (pas de tour) : sans horloge,
« annoncer une zone qui frappe dans 10 s » n'a aucun sens. Plutôt qu'une tâche planifiée —
le scheduler tourne à la minute, beaucoup trop grossier — le tick est joué au fil des
requêtes des joueurs de l'instance (`jouerTick`, appelé par l'attaque du boss et par
`POST /api/donjon/combat`), sur la base du temps réellement écoulé. Deux conséquences
voulues : aucune dérive entre l'horloge serveur et l'affichage, et un groupe qui ne fait
rien ne fait rien avancer — le comportement attendu d'une rencontre mise en pause.

**Les phases ne sont pas une entité.** Une mécanique est bornée par une fenêtre de vie du
boss (`vieMax` → `vieMin` en %). « Renforts à 75 %, enrage à 25 % » = deux lignes de
`donjon_mecanique`, sans table de phases ni code dédié. Même découpage que `boss_sortilege`.

| Mécanique | Effet de jeu | Paramètres |
|---|---|---|
| `ZONE_TELEGRAPHIEE` | rend le DÉPLACEMENT décisif : cases annoncées, qui frappent au tick suivant | `rayon`, `degats`, `delaiSecondes` |
| `ADDS` | oblige à se répartir les cibles | `monstreId`, `quantite` |
| `ENRAGE` | impose un DPS minimum, donne un rythme | `apresSecondes`, `multiplicateur` |
| `ENIGME_LEVIERS` | force la répartition dans la salle : N leviers, joueurs DIFFÉRENTS, dans une fenêtre | `leviers`, `fenetreSecondes`, `degatsBoss` |

**La table de menace** (`donjon_instance_membre.menace`) est le seul choix qui fait exister
le rôle de tank : le boss frappe la plus GROSSE menace présente, pas le dernier attaquant.
Les dégâts alimentent la menace 1:1, les soins 0,5:1 (un soigneur monte sans passer devant).

**Le boss n'agit que dans SA salle** (27/07/2026). `cibleDuBoss($instance, $boss)` ne retient
que les membres présents sur la carte du boss ; sans `$boss`, la menace pure fait foi. Sans ce
filtre, un joueur mort et revenu en salle 1 continuait d'être frappé et de servir de centre aux
zones télégraphiées — annoncer une zone dans une autre salle est de toute façon injouable,
personne ne peut s'en écarter en la voyant.

**Une zone qui met à 0 TUE** (27/07/2026). `jouerTick` fait passer les victimes par
`DeathService::diePlayer` — **après son flush**, car `diePlayer` écrit en DQL puis
resynchronise l'entité : l'ordre inverse réécrirait l'état d'avant la mort. Ce n'était traité
nulle part : la victime restait en vie NÉGATIVE, sur la carte du donjon, libre de se déplacer
et toujours ciblée. Même correction pour la riposte du boss (`SpellService`), qui peut tuer un
autre joueur que l'attaquant. ⚠️ Après un `diePlayer`, la vie est déjà refaite : le contrôleur
ne peut plus déduire la mort de `lifeJoueur <= 0`, d'où le drapeau `mortJoueur` remonté par
`doDamageOnBoss`. Côté front, `DonjonCombatHost` détecte la perte d'instance (`instanceId` qui
tombe à null) et relit `/joueur/data/minimal` : rien d'autre n'apprend au client une mort
décidée par le tick d'un coéquipier.

**Les renforts ont leur propre table.** `monstre_carreau` est attachée au décor : comme
`carte_carreau.joueur_id`, elle ne peut pas porter plusieurs groupes. Les adds vivent donc
dans `donjon_instance_monstre`, et `DonjonMapView` les réinjecte (`renfortId`) exactement
comme les membres du groupe. Ils se combattent par `POST /api/donjon/renfort/attaquer`,
avec les mêmes garde-fous (PA, carte, portée).

**Un monstre d'instance est un monstre ORDINAIRE** (corrigé le 27/07/2026) : il n'est pas
dessiné sur la carte, il se cible tout seul quand on marche sur sa case, il rend de
l'expérience au coup et du butin à la mort (`DeathService::dieRenfort`, qui compte aussi
`MONSTRE_TUE`), et `/api/donjon/renfort/attaquer` renvoie la MÊME forme de réponse que
`/api/joueur/attack/monster`. La table diffère, le jeu non. L'ancienne version le dessinait
en sprite cliquable (type de cible `"renfort"` absent de `Spell.handleAttack`) : on voyait
trois monstres impossibles à cibler et impossibles à tuer, seuls du jeu à se comporter ainsi.

**Les leviers réutilisent la machinerie des quêtes** : ce sont des cases action ordinaires
(`SCRIPTED_EFFECT` / `actionner_levier`), pas un nouveau type de case. La proximité est déjà
vérifiée par `QuestProgressionService`, qui injecte désormais `carteCarreauId` dans les
params des effets de case — un levier a besoin de savoir LEQUEL il est.

**Contenu seedé pour Grimbald** : zone (rayon 1, 180 dégâts, 12 s, cooldown 45 s), renforts
à 75-40 %, énigme à 2 leviers (600 dégâts), enrage à 25 % après 10 min. Tout est éditable en
base — le DonjonMaker du lot 4 n'aura qu'à écrire ces lignes.

Les deux leviers sont posés sur la **salle 3** (carte 10), et pas sur la salle du boss : une
condition `LEVIERS` s'évalue sur la salle PRÉCÉDENTE, donc les leviers qui ouvrent la porte
du boss vivent dans la salle d'avant. Ils sont aux deux extrémités opposées des coursives —
(0,11) et (23,12), 23 cases d'écart (corrigé le 27/07/2026 : ils étaient sur des îlots
derrière l'eau, sans AUCUNE case atteignable adjacente, ce qui rendait le donjon
infranchissable). ⚠️ Vérifier l'ACCESSIBILITÉ, pas seulement `is_usable` : une case foulable
peut être enfermée dans une poche que le décor isole.

⚠️ Avec `leviers: 2`, l'énigme exige deux cases DISTINCTES actionnées par deux JOUEURS
différents : le Donjon Scintillant n'est donc pas franchissable en solo, par construction.
Mettre `leviers: 1` (DonjonMaker) le rend jouable seul.

**Tables runtime ajoutées** (blacklistées du seed) : `donjon_instance_zone`,
`donjon_instance_monstre`, `donjon_instance_levier` ; colonnes `donjon_instance.combat_debut_at`
/ `dernier_tick_at` / `mecaniques_jouees` (JSON portant les cooldowns) et
`donjon_instance_membre.menace`.

### Tests
- `tests/Service/DonjonCombatServiceTest.php` (14) : garde-fous d'attaque (PA, portée,
  mauvaise carte), table de menace (le tank garde l'aggro, un mort ou un sorti n'est plus
  ciblé, soin < dégâts), fenêtres de phase (bornes incluses), chronomètre d'enrage.
- `tests/Functional/DonjonCombatApiFunctionalTest.php` (12) : attaque hors de portée et sans
  PA refusées **sans entamer le boss ni passer les PA en négatif**, la menace s'alimente et
  engage le chrono, **le boss frappe le porteur de menace et pas l'attaquant**, la zone est
  annoncée avant de frapper et centrée sur sa cible, **sortir de la zone évite les dégâts /
  y rester coûte**, les renforts sont propres à l'instance (rien dans `monstre_carreau`) et
  se combattent, un levier seul ne résout rien, deux leviers par deux joueurs blessent le
  boss, un levier hors donjon est refusé.

> ⚠️ Piège de test : Grimbald frappe pour ~440 et un personnage de base a 400 PV — il meurt
> au premier coup, part au cimetière et QUITTE l'instance, si bien qu'il n'y a plus rien à
> observer. Les tests de mécaniques donnent 20 000 PV au joueur ; dans la vraie partie, c'est
> le rôle du groupe de 5.

### 13.8 Lot 4 — DonjonMaker, livré le 25/07/2026

Page admin `/administration/donjonmaker`, sur le patron du QuestMaker : liste + formulaire
unique pour créer et éditer, référentiels et config chargés une seule fois.

**Un donjon se sauvegarde en UN appel** (`/api/donjon/editor/save`) : fiche + plan des
salles + mécaniques, dans une transaction. La réponse est le donjon rechargé, ids définitifs.

> **Les ids sont STABLES** — les lignes envoyées avec un id sont mises à jour, celles sans id
> créées, celles absentes supprimées. Ce n'est pas du confort : `donjon_instance.mecaniques_jouees`
> référence des ids de mécanique, `donjon_verrou` et `donjon_instance` des ids de donjon. Une
> sauvegarde qui effacerait tout pour recréer casserait les expéditions en cours.

**Le front ne connaît aucun type de mécanique.** `Config\DonjonMecaniqueConfig` (patron de
`QuestActionTypeConfig`) décrit pour chaque type ses champs, ses valeurs par défaut et une
phrase d'aide qui explique l'effet EN JEU. Ajouter une mécanique = un case dans l'enum
`MecaniqueDonjon` + un case dans la config ; le formulaire suit sans être touché. Les champs
`type: "select"` tirent leurs options du `catalog` nommé dans les référentiels.

**Le plan est une liste ordonnée** : l'ordre de la liste EST l'ordre de traversée (boutons
↑/↓), le serveur renumérote — pas de champ « ordre » à saisir, donc pas de trous ni de
doublons possibles. Les cartes déjà prises par un autre donjon sont grisées (index unique
en base sur `donjon_salle.carte_id`).

**Validations serveur** (le formulaire n'en porte aucune) : nom obligatoire, au moins une
salle, pas de carte en double ni empruntée à un autre donjon, taille de groupe ≥ 1, heure de
reset 0-23, borne basse de vie ≤ borne haute, monstre des renforts existant, paramètres
inconnus écartés et manquants complétés par les défauts de l'enum — une mécanique
enregistrée est toujours exécutable.

**Suppression refusée** si le donjon a des expéditions (en cours ou passées) : la supprimer
effacerait des parties. Le message invite à le désactiver (`actif = false`), ce qui bloque
les nouvelles entrées sans interrompre les groupes à l'intérieur. L'éditeur affiche aussi un
avertissement quand des expéditions sont en cours.

`/api/donjon/editor` est ROLE_ADMIN dans `security.yaml` (lectures comprises), **placé avant**
la règle `^/api` — et sans collision avec les routes joueur `/api/donjon/*`.

### Tests
- `tests/Functional/DonjonEditorApiFunctionalTest.php` (9) : l'éditeur est fermé aux non-admins
  (403 même en lecture), lecture complète du plan et des mécaniques, la config décrit toutes
  les mécaniques de l'enum (champs + aide), **une sauvegarde identique ne change aucun id**,
  l'ordre des salles suit la liste envoyée, refus (sans rien modifier) d'un donjon sans salle,
  d'une carte en double et d'une fenêtre de vie inversée, refus de supprimer un donjon qui a
  des expéditions.

### 13.9 Lot 5 — front du donjon, livré le 25/07/2026

Avant ce lot, les mécaniques du lot 3 existaient côté serveur mais **rien ne les affichait** :
un joueur subissait les zones sans les voir venir, ce qui rendait la mécanique la plus
intéressante injouable. C'est ce que ce lot corrige.

**Le sondage EST le moteur de la rencontre.** `DonjonCombatHost` (rendu une fois dans
MapPage) appelle `POST /api/donjon/combat` toutes les 2 s en combat engagé, 8 s au repos.
Ce n'est pas un rafraîchissement d'affichage : le tick serveur est **paresseux**, donc les
zones annoncées ne frappent que lorsque quelqu'un demande l'état. **Supprimer ce sondage
fige le combat** — c'est écrit dans le docblock du service ET dans `DonjonApi.combat()`.

**Le front ne simule rien.** Le compte à rebours d'une zone est recalculé à chaque demi-
seconde depuis `resoudreAt` (horloge SERVEUR), jamais décompté localement : un onglet en
arrière-plan afficherait sinon un délai faux à son retour.

**Ce qui est affiché** (`DonjonCombatHud`, présentation pure) : jauge de vie et phase du
boss, badge ENRAGÉ clignotant, alerte de zone avec compte à rebours (battement accéléré
sous 3 s), nombre de renforts, et **table de menace** — le premier de la liste porte
l'aggro, c'est l'information qui décide du placement. Le HUD est en `pointer-events: none`
pour ne jamais voler un clic à la grille.

**Zone sur la grille** : classes `case-zone-donjon` / `-imminente` sur les cases couvertes
(`mapGrid.scss`, feuille globale assumée). Le contraste est **volontairement fort** —
hachures + bordure claire + battement. Constaté en jeu sur la salle 4 (dallage violet
sombre) : un rouge à 25 % d'opacité était totalement illisible, alors que c'est le seul
indice permettant de s'écarter à temps.

**Monstres d'instance** : rien n'est dessiné sur la case (27/07/2026). Comme les monstres du
monde ouvert — peints dans l'image de fond de la carte —, ils sont **invisibles** et se
ciblent AUTOMATIQUEMENT quand on marche sur leur case. Le ciblage est fait par
`Map.majCibleMonstreInstance()` (appelé après chaque fetch de carte, chaque déplacement et
chaque changement de carte) depuis le champ `renfortId` **de la case**, et pas depuis l'état
de combat : c'est la carte qui descend à chaque déplacement. Il est dans `Map` et non dans
`Player` — contrairement au patron `hasMonstre` du monde ouvert — parce que `Player` est
aussi rendu pour les autres membres du groupe, et que seule `Map` sait quelle case est la
MIENNE. Quitter la case décible (comme un monstre du monde ouvert), la carte de cible
(`Target`) réutilise le rendu « monstre » via `/api/target/renfort`, et `Spell.jsx` route le
type `"renfort"` vers `/api/donjon/renfort/attaquer`.

⚠️ Conséquence assumée : les adds invoqués par un boss (mécanique `ADDS`) sont invisibles
eux aussi. Les redessiner voudrait dire distinguer « population de salle » et « add » dans
`donjon_instance_monstre` (une colonne d'origine), pas ressusciter un sprite pour les deux.

**État Redux** `donjon.combat` = toujours le payload du serveur (patron `echange`).

### 13.10 Correctif — les passages internes n'étaient pas distingués (25/07/2026)

**Symptôme** : depuis la salle 1, cliquer sur le passage vers la salle 2 rouvrait la modale
d'entrée avec « Vous avez déjà ouvert le Donjon Scintillant aujourd'hui ». Impossible de
circuler dans son propre donjon.

**Cause** : `DonjonMapView::portesDeDonjon()` marquait comme porte d'entrée TOUTE case wrap
visant une carte de donjon — y compris les passages INTERNES entre salles, et le passage de
retour vers le monde. Le front ouvrait donc la modale au lieu de traverser.

**Correctif** : une porte n'en est une que si elle mène vers un donjon **autre** que celui
où l'on se trouve déjà (`portesDeDonjon($cases, $carteId)`). Symétriquement,
`JoueurController::updateMapPosition` ne rappelle plus `entrer()` quand le joueur reste dans
SON donjon : c'était une entrée complète (transaction, verrou, rattachement) à chaque porte
franchie — et, plus grave, une instance expirée jetait alors une exception qui **bloquait le
joueur à l'intérieur**, incapable même de rejoindre la sortie.

Deux régressions ajoutées à `DonjonApiFunctionalTest` : vue du monde ouvert la porte est bien
signalée / vue de l'intérieur `portesDonjon` est vide, et changer de salle ne recrée ni
instance ni verrou.

### 13.11 Conditions de passage entre salles (25/07/2026)

Le donjon n'était qu'une enfilade de cartes qu'on traversait librement. Une salle peut
désormais exiger quelque chose de la salle PRÉCÉDENTE.

**Contenu** — `donjon_salle` gagne `condition` (enum `ConditionSalleDonjon`),
`condition_params` (JSON), `monstre_id` et `nombre_monstres` :

| Condition | Effet |
|---|---|
| `AUCUNE` | passage libre (défaut) |
| `SALLE_NETTOYEE` | tous les monstres de la salle précédente doivent être tombés |
| `LEVIERS` | N leviers de la salle précédente actionnés par des joueurs DIFFÉRENTS dans la même fenêtre |
| `BOSS_VAINCU` | réservé à la salle au trésor |

**La population des salles est PAR INSTANCE.** `monstre_carreau` est attachée au décor,
donc partagée : deux groupes se nettoieraient mutuellement les salles (même défaut que
`carte_carreau.joueur_id`). La population va donc dans `donjon_instance_monstre`, la table
des renforts du lot 3, et `DonjonMapView` l'affiche déjà.

**Le refus de passage se voit.** `verifierPassage()` jette une `DonjonException` que
`/api/joueur/map/update_position` renvoie en `{"message"}`, et le front la présente en toast
(`Map.changeMap`) — le message compte les créatures restantes (« Il en reste 3. »). Idem pour
l'annonce de population (`{"annonce"}`) à l'arrivée dans la salle : les monstres n'étant pas
dessinés, c'est le seul signal qu'il y a quelque chose à nettoyer ici. Ces deux toasts étaient
commentés dans `Map.jsx` : un clic sur la porte ne produisait RIEN de visible, ce qui se lit
comme un bug de la carte et non comme une règle du donjon.

**Runtime** — `donjon_instance_salle` (blacklistée du seed) porte deux drapeaux, chacun
pour une raison précise :
- `peuplee` : une salle ne se peuple qu'UNE fois par expédition. Sans ça, un aller-retour
  referait naître les monstres — ferme à XP à volonté.
- `ouverte` : **une porte franchie le reste**. On ne refait pas l'énigme à chaque passage,
  et surtout un joueur qui revient sur ses pas n'est jamais enfermé derrière une condition
  qu'il ne peut plus remplir (monstres déjà tués, leviers refroidis).

`DonjonSalleService` est l'UNIQUE machine à états de cette progression.

**Les leviers servent DEUX maîtres.** Un même levier peut commander une porte de salle et
l'énigme de combat du boss. L'ORDRE compte, et c'est le piège : l'énigme de combat
**consomme** les leviers en se résolvant. Le registre enregistre donc le geste
(`enregistrerLevier`), regarde d'ABORD la porte, puis l'énigme de combat — l'inverse
laissait la porte fermée alors que le joueur avait bien résolu l'énigme.

**Deux bugs trouvés en jouant la scène :**
- Résoudre l'énigme AVANT d'engager le boss le tuait sur-le-champ : `bossCurrentLife` vaut
  null tant qu'il n'a pas été touché, et on retranchait les dégâts à 0. La vie de départ
  vient maintenant de `vieBoss()`, via `DonjonInstanceService::bossDeLInstance()` (qui
  remplace au passage le balayage de tous les boss que faisait `DonjonController`).
- La migration ajoutait `condition` en NOT NULL sans valeur par défaut : les salles
  existantes recevaient `''`, que l'enum refuse — tout donjon déjà créé devenait illisible.
  Un backfill a été ajouté à la migration.

### Tests
- `tests/Functional/DonjonSalleApiFunctionalTest.php` : une salle se peuple à l'arrivée et
  **une seule fois** (aller-retour sans repeuplement), la condition de nettoyage bloque
  puis libère sans déplacer le joueur en cas de refus, **une porte franchie reste ouverte**
  même si la condition redevient fausse, et la salle d'entrée ne peut pas exiger d'avoir
  nettoyé la précédente.

---

## 14. Cases interactives et métiers — 25/07/2026

### 14.1 Pourquoi une entité séparée d'`Action`
`Action` est un **bouton de séquence de quête** : elle porte `nextSequence`, `endsQuest`,
`sequenceActions` et six relations de contenu. Y brancher ressources, coffres, cooldowns
partagés et métiers en aurait fait une entité fourre-tout, où un caillou de forêt aurait
traîné des colonnes de branchement de dialogue. `Interaction` est donc un système à part ;
`Action` reste ce qu'elle est.

Les 4 cases action existantes (coffre de Grimbald, 2 leviers) ont été **migrées** vers des
interactions ; `carte_carreau.action_id` n'est plus utilisé par aucune case. L'auberge
n'était pas une case mais un dialogue de PNJ : rien à migrer.

### 14.2 Modèle
**Contenu** (versionné) : `interaction` (nom, type, skin, coût en PA, récompense, effet
scripté, métier + niveau requis + XP donnée, cooldown, portée, usage unique) et
`interaction_condition` (N conditions : niveau, classe, quête terminée, possède un objet,
alignement). `carte_carreau.interaction_id` la pose sur une case.

**Runtime** (blacklisté) : `interaction_recharge`, `joueur_metier`.

**La PORTÉE du cooldown est la clé de voûte** — un seul mécanisme couvre des besoins très
différents :

| Portée | Comportement | Usage |
|---|---|---|
| `JOUEUR` | chacun son cooldown | herbe, filon : chacun récolte de son côté |
| `MONDE` | un seul cooldown pour tout le serveur | coffre que le premier arrivé vide pour les autres |
| `INSTANCE` | par expédition de donjon | levier, coffre de boss |

> ⚠️ `interaction_recharge.cle` est une CHAÎNE (`monde`, `user:38`, `instance:12`) et non
> deux colonnes nullables : en MySQL, un index UNIQUE laisse passer les doublons dès qu'une
> colonne vaut NULL — deux joueurs auraient pu créer deux recharges « monde » concurrentes
> sur la même case. Un verrou pessimiste sur la case complète la protection.

**Rien n'est redistribué dans `InteractionService`** : les items et l'or passent par
`RecompenseService`, l'XP de métier par `MetierService`, les effets scriptés par
`QuestEffectRegistry`. Il orchestre, il ne duplique pas.

### 14.3 Métiers (minimal)
`metier` (contenu) + `joueur_metier` (niveau, expérience). **Pas de ligne = niveau 0** :
c'est ce qui permet d'exiger « Herboriste niveau 1 » pour la toute première cueillette sans
créer une ligne par métier à l'inscription. `MetierService` est l'unique point de mutation ;
il fait monter de plusieurs niveaux d'un coup si le gain le justifie. La courbe
(`experiencePourNiveau`) est un **placeholder** assumé, comme les formules d'XP et d'honneur.

Pas de craft : hors sujet ici, ce sera un chantier à part.

> ⚠️ **Périmé depuis le 26/07/2026.** L'invariant « pas de ligne = niveau 0 » est devenu
> « pas de ligne = métier NON APPRIS », et `gagnerExperience()` ne crée plus la ligne.
> Voir **§16 Artisanat, lot 0**.

### 14.4 Points d'extension prévus
Types d'interaction et types de condition sont des enums adossés à une config serveur (même
patron que `QuestActionTypeConfig` et `DonjonMecaniqueConfig`) : ajouter « pêcher » ou une
condition d'alignement = un case dans l'enum + un case dans la config. Le front suit sans
être touché.

### Tests
- `tests/Service/MetierServiceTest.php` : niveau 0 sans ligne, courbe croissante, montée de
  plusieurs niveaux sur un gros gain, plafond `niveauMax`.
- `tests/Functional/InteractionApiFunctionalTest.php` : butin + XP de métier + coût en PA,
  refus sans le métier / au mauvais niveau / sans PA (**et un refus ne consomme pas de PA**),
  **portée JOUEUR vs MONDE** (une seule recharge `monde` quel que soit le nombre de joueurs),
  proximité requise, usage unique jamais rechargé.

### Reste à faire
- **InteractionMaker** (page admin pour définir les interactions) et **outil « Interaction »
  du MapMaker** pour les poser : aujourd'hui, poser une case interactive passe encore par du
  SQL. `MapController::updateMap` ne gère ni `action_id` ni `interaction_id`.
- Affichage du cooldown restant et de l'indisponibilité côté joueur (`InteractionService::decrire`
  existe et renvoie déjà tout, mais n'est exposé par aucun endpoint).

### 14.5 InteractionMaker et outil MapMaker — 25/07/2026

**Deux écrans, deux rôles.** L'onglet **Interactions** définit CE QU'EST une interaction
(type, coût en PA, récompense, cooldown + portée, conditions, métier). L'outil **« Poser une
interaction »** du Map Maker la POSE sur des cases. Poser une case interactive ne passe donc
plus par du SQL.

`MapController::updateMap` gère maintenant `interaction_id`, **retrait compris** :
l'option « ✕ Retirer l'interaction de la case » arme l'outil avec un id nul. Sans ce cas
explicite, une case interactive n'aurait jamais pu être défaite depuis l'interface.

**Le front ne connaît aucun type en dur** : types, portées de recharge et conditions
viennent de `Config\InteractionConfig` (patron de `QuestActionTypeConfig` et
`DonjonMecaniqueConfig`). Les champs `type: "select"` tirent leurs options du `catalog`
nommé dans les référentiels.

**Ids stables** comme partout : les conditions envoyées avec un id sont mises à jour, celles
sans id créées, celles absentes supprimées. La récompense est mise à jour en place plutôt
que recréée.

**Suppression refusée** si l'interaction est encore posée sur des cases — ça laisserait des
cases orphelines. Le message dit quoi faire (la retirer des cartes, ou la désactiver).

> ⚠️ Piège Doctrine rencontré : `pourEditeur()` lisait les conditions depuis
> `$interaction->getConditions()`. Après une sauvegarde, cette collection avait été chargée
> AVANT l'insertion et rendait un état périmé (zéro condition). Conditions et cases posées
> sont désormais **relues depuis leur repository**, jamais depuis la collection de l'entité.

**Correctif de robustesse au passage** : `MapService::getPositionAfterMapChange()` jetait une
exception (500) quand toutes les cases autour d'un passage étaient occupées, laissant le
joueur bloqué de l'autre côté. Elle se rabat maintenant sur n'importe quelle case libre de
la carte — atterrir un peu plus loin vaut mieux que ne pas pouvoir passer.

### Tests
- `tests/Functional/InteractionEditorApiFunctionalTest.php` (8) : éditeur fermé aux
  non-admins (403) **alors que `/api/interaction/executer` reste joueur**, la config décrit
  types/portées/conditions, création + relecture complète, **ids de condition stables**,
  retrait d'une condition, JSON d'effet invalide refusé, suppression refusée tant que
  l'interaction est posée.

### 14.6 Front des cases interactives — 25/07/2026

`MapController::getMapAndCasesData` renvoie désormais `interactions` : l'état de chaque case
interactive (`disponible`, `raison`, `disponibleAt`, `epuisee`, `coutPa`), calculé par
`InteractionService::decrireCases()`.

**Ce n'est qu'un confort d'affichage.** Cliquer une case indisponible reste possible ; c'est
le serveur qui refuse, avec la vraie raison. Le front n'évalue aucune condition.

`decrireCases()` calcule la clé de portée « instance » UNE fois : chaque case aurait sinon
relancé la recherche d'instance courante (et son expiration paresseuse) à chaque chargement
de carte.

**Le compte à rebours vient de `disponibleAt`** (date serveur) et est recalculé chaque
seconde, jamais décompté localement — même règle que les zones télégraphiées du donjon.

**Une case indisponible s'efface sans disparaître** : repère gris, image désaturée, badge de
temps restant, infobulle expliquant le blocage. La faire disparaître serait pire que de
l'afficher : le joueur doit continuer à voir qu'il y a quelque chose ici.

**`executer()` renvoie l'état frais de la case** (`etat`) : le front met à jour le repère
sans recharger toute la carte. Un rechargement de carte reprend la main sur cet état local.

---

## 15. EquipementMaker : icône perdue et import CSV — 25/07/2026

### 15.1 Le bug de l'icône « qui ne s'enregistre jamais »
**Symptôme rapporté** : un équipement créé sans image restait sans image pour toujours ; on
pouvait le rééditer et choisir un fichier, la base ne bougeait pas.

**Preuve** relevée avant correction : `alcazan-front-prod/public/img/equipement/tete/`
contenait `chapeau-du-rodeur-verdoyant.png` (368 Ko, 23/07) alors que
`equipement.icone` de la ligne 18 était vide, et `capuche-des-sables-ocres.png` n'avait même
aucune ligne en base. **L'upload passait, l'enregistrement non.**

**Cause** : `CreateEquipementForm` câblait `onSubmit={() => this.handleSubmit()}` — sans
l'event, donc **sans `preventDefault()`**. Seul le `onClick` du bouton annulait la soumission.
Toute soumission implicite (Entrée dans l'un des 16 champs du formulaire) déclenchait donc le
GET natif du `<form>` : la page se rechargeait (`localhost:3000/?name=…&icone=…`) pendant que
`handleSubmit` attendait la réponse de l'upload, et l'appel `/api/equipement/create` — qui
n'arrive qu'APRÈS cette réponse — ne partait jamais. Reproduit à l'identique via
`form.requestSubmit()`, corrigé et revérifié.

**Correctifs** (`CreateEquipementForm.jsx`, `EquipementController.php`, `EquipementPage.jsx`) :
- l'event est transmis au handler ; le `onClick` redondant du bouton a été retiré.
- `/api/equipement/create` renvoie `{"id": …}` et le formulaire **adopte cet id** : il restait
  sinon en mode « création » après un premier enregistrement, et le clic suivant (typiquement
  pour ajouter l'image) fabriquait un doublon au lieu de compléter l'objet. `EquipementPage`
  suit la sélection pour que le catalogue reste aligné.
- `createEquipement()` **flushe en fin d'action** : les `remove()` d'une caractéristique
  remise à 0 n'étaient persistés que si une caractéristique suivante portait une valeur.
- `setCurrentEquipement()` recharge la liste locale quand l'id demandé n'y est pas
  (import CSV, autre onglet) au lieu de vider le formulaire en silence.

### 15.2 Import CSV en masse
`POST /api/equipement/import-csv` (ROLE_ADMIN, multipart `csv` + `mettreAJour`) →
`src/service/EquipementCsvImporter.php`. Pensé pour créer une centaine d'objets d'un coup
**puis** leur accrocher les images une par une dans l'EquipementMaker.

- **Rapport ligne par ligne**, pas un OK/KO : sur 100 objets, l'utile est de savoir lesquels
  ont échoué et pourquoi. Chaque ligne réussie renvoie le **chemin d'image attendu**
  (`img/equipement/<position>/<slug>.png`), calculé avec le slug de `EquipementIconeUploader`.
- **Référentiels résolus par nom contre la base** (positions, raretés, classes,
  caractéristiques) : ajouter une caractéristique au jeu la rend importable sans toucher au
  code. Colonne `classes` séparée par `|`, `/` ou `,` — **vide = toutes classes**, convention
  du jeu. Colonne `icone` facultative ; sur une mise à jour, une cellule vide **conserve**
  l'image en place.
- **Pièges d'export tableur traités** : BOM UTF-8, encodage Windows-1252, séparateur deviné
  (`;` / `,` / tabulation) sur la ligne d'en-tête, alias de colonnes, colonnes inconnues
  rapportées et ignorées.
- Une ligne fautive est **rapportée et sautée**, les autres passent ; l'ensemble est dans UNE
  transaction (rollback global uniquement si la base casse ou si le fichier dépasse
  `MAX_LIGNES` = 1000). `mettreAJour` (défaut : oui) complète un équipement homonyme, ce qui
  rend un CSV rejouable après correction sans semer de doublons.
- Front : `administration/components/forms/ImportEquipementCsv/`, replié par défaut au-dessus
  du catalogue, avec génération du **modèle CSV** à partir du référentiel réel.

---

## 16. Artisanat — 26/07/2026

Plan complet et arbitrages : **`docs/ARTISANAT_PLAN.md`** (critique du document de game
design, découpage en 6 lots, points de vigilance). Cette section documente ce qui est livré.

### 16.1 Lot 0 — socle des métiers (livré le 26/07/2026)

**Le changement structurant : apprendre est un ACTE.** Jusqu'ici, une ligne `joueur_metier`
naissait toute seule au premier gain d'expérience, et « pas de ligne » voulait dire « jamais
pratiqué ». Le game design impose un plafond de **2 métiers de récolte et 3 de fabrication** —
or on ne plafonne pas ce qui s'auto-crée : on aurait compté des métiers que le joueur n'a
jamais choisis, et le premier caillou récolté par erreur aurait brûlé une de ses deux places.

L'invariant devient donc **« pas de ligne = métier NON APPRIS »**, et
`MetierService::gagnerExperience()` **lève une `MetierException`** au lieu de créer la ligne.
Ce refus est le garde-fou qui rend le plafond réel : sans lui, une case de récolte mal
configurée contournerait toute la règle.

| Élément | Rôle |
|---|---|
| `Enum\FamilleMetier` (`RECOLTE`/`CRAFT`) | rend le plafond calculable — sa seule raison d'être |
| `Config\ArtisanatConfig` | les plafonds et leurs libellés, en UN endroit |
| `metier.famille`, `metier.niveau_max` (200) | contenu |
| `joueur_metier.appris_at` | trace de l'acte d'apprentissage |
| `pnj_metier` (N-N) | ce qu'un maître enseigne |
| `Exception\MetierException` | refus destiné au joueur, sorti en 400 |

**`MetierService` reste l'unique point de mutation** et ne flushe toujours pas (contrat de
`SacService` / `RecompenseService`) : `apprendre`, `oublier`, `gagnerExperience`, `niveau`,
`estAppris`, `placesRestantes`, `progressionDe`, `vueMaitre`.

**Oublier perd la progression**, volontairement : sans oubli, une erreur de choix enfermerait
le personnage à vie. La confirmation est côté front, la règle côté serveur.

**Endpoints joueur** — `POST /api/metier/{progression,apprendre,oublier}`. Le contrôleur ouvre
la transaction. (`POST /api/joueur/metiers` a été déplacé ici et n'existe plus ;
`InteractionApi.metiers()` côté front est devenu `MetierApi`, il n'avait aucun appelant.)

**Maître de métier** : `pnj.type = 'metier'` → `PnjInteractionService` renvoie `view: 'metier'`,
sur le patron exact de la vue guilde (dialogue de la séquence sans quête + liste). Le front rend
`components/pnj/metierView/MetierView` depuis `PnjInteractionHost` — **une seule modale PNJ**,
jamais une par tuile. Après un apprentissage ou un oubli, la vue est **relue depuis le serveur**
plutôt que recalculée : dupliquer la règle des plafonds — et son libellé — des deux côtés était
le vrai risque, un aller-retour sur une action aussi rare ne coûte rien.

**Fiche de personnage** : panneau « Métiers » (progression + places restantes). La barre d'XP
est bornée **entre le palier du niveau courant et le suivant** ; calculée sur `0 → prochain
palier`, elle reculerait à chaque montée de niveau. Les libellés de famille viennent du serveur
(`famillesLabels`) : aucune famille en dur dans le front.

**Contenu posé** (en SQL, en attendant l'ArtisanatMaker du lot 4) : les 11 métiers du game
design et « Eolan, maître des métiers » sur la carte 2 en (11,9), qui les enseigne tous.

#### Pièges rencontrés
- **`ALTER TABLE ... ADD col DATETIME NOT NULL` échoue en mode strict** dès que la table a des
  lignes (MySQL n'a rien à y écrire). La base locale était vide, `chusei_test` non : la
  migration a cassé là. Corrigé en ajoutant la colonne **avec un défaut** (qui remplit les
  lignes existantes) puis en retirant ce défaut. Même traitement pour `metier.famille`.
- Le littéral `'0000-00-00 00:00:00'` dans un `WHERE` est **refusé** en mode strict.
- Le panneau Métiers a fait déborder la colonne gauche du profil : `.equipCard` était en
  `flex: 1`, donc **rétrécissable sous la hauteur de son contenu**, qui se peignait alors
  par-dessus le panneau suivant. `flex: 1 0 auto` + défilement de la colonne.
- Le cadre de modale est en `overflow: hidden` : une vue de maître enseignant onze métiers se
  faisait couper net. Le défilement est sur le **corps entier** de la vue, pas par famille —
  deux ascenseurs imbriqués se disputent la molette.

### Tests
- `tests/Service/MetierServiceTest.php` (13) : niveau 0 sans apprentissage, refus du 3ᵉ métier
  de récolte, **indépendance des familles**, places restantes, refus d'expérience sur un métier
  non appris, courbe croissante, montée multi-niveaux, plafond `niveauMax`, progression
  atteignable jusqu'au niveau 200.
- `tests/Functional/MetierApiFunctionalTest.php` (10) : apprentissage, double apprentissage
  refusé, **plafond de famille qui n'écrit rien**, familles séparées, oubli qui libère une place
  et perd la progression, oubli d'un métier non appris, vue du maître avec ses raisons de refus,
  métier inexistant, authentification exigée.
- Suite complète : **220 tests verts**.

### 16.2 Lot 1 — ressources et karma (livré le 26/07/2026)

**Une ressource est un `objet` marqué, pas une entité.** `objet.metier_id` (nullable) +
`objet.niveau_ressource` suffisent : une ressource se ramasse, s'empile, s'échange et se vend
exactement comme un objet. Une entité `Ressource` parallèle aurait obligé à réoutiller
l'inventaire, l'échange, la boutique, le butin et les récompenses — pour aucun gain.
`Objet::estRessource()` n'est rien d'autre que « a un métier ».

**Karma** : `user.karma` (int borné ±1000), muté **uniquement** par `KarmaService`, qui ne
flushe pas (contrat de `SacService` / `RecompenseService` / `MetierService`). Les bornes et les
paliers vivent dans `Config\ArtisanatConfig` ; le libellé est calculé **côté serveur** et
descendu dans le payload joueur, pour que les seuils n'existent qu'à un seul endroit.

| Palier | Bande |
|---|---|
| Pillard | −1000 → −601 |
| Rapace | −600 → −201 |
| **Mesuré** | **−200 → 199** (bande neutre, centrée sur 0) |
| Prévoyant | 200 → 599 |
| Gardien | 600 → 1000 |

`ajuster()` renvoie le **delta réellement appliqué** : il vaut 0 quand la borne était déjà
atteinte, ce qui évite d'annoncer au joueur un gain qui n'a pas eu lieu. Le compteur est borné
volontairement : sans plafond, un joueur irréprochable pendant un mois se mettrait à l'abri
définitif de toute conséquence, et le curseur cesserait d'être un choix pour devenir un acquis.

> ⚠️ **Le karma n'a AUCUN effet de jeu à ce stade** — arbitrage explicite du 26/07/2026
> (`docs/ARTISANAT_PLAN.md` §2) : il est stocké et affiché, rien de plus. **Conséquence à
> connaître** : tant que le lot 6 n'existe pas, la récolte intensive du lot 2 sera strictement
> plus rentable que la récolte éthique, et le dilemme restera décoratif. `KarmaService` existe
> dès maintenant pour que ce lot 6 n'ait qu'à brancher des effets sur un point de mutation déjà
> unique, sans refactoring.

**Distinct d'`honneur` et d'`alignement`**, volontairement : `honneur` est la conduite en PvP,
`alignement` le camp choisi, `karma` la manière de prendre au monde. Les fusionner ferait qu'un
pillard de gisements perdrait sa réputation de duelliste.

**Front** : le karma apparaît dans la carte d'identité du profil (« Pillard (−720) »), sous
l'alignement, en pleine page comme en modale — les deux passent par `/joueur/data/minimal`.

**Contenu posé** (SQL, en attendant l'ArtisanatMaker) : une ressource par métier de récolte,
plus un minerai d'argent au niveau 20 pour que `niveau_ressource` ne reste pas théorique. Les
objets existants ne sont pas touchés : ils servent déjà de butin et d'articles de boutique.

### Tests
- `tests/Service/KarmaServiceTest.php` (10) : neutre à la création, ajustement dans les deux
  sens, bornes haute et basse, **delta nul à la borne**, absence de flush, paliers et leurs
  seuils, bande neutre centrée sur 0, valeur hors bornes toujours qualifiable.
- Suite complète : **230 tests verts**.

### 16.3 Lot 2 — récolte éthique vs intensive (livré le 26/07/2026)

**Le problème à résoudre.** Le game design demande qu'une récolte non éthique ait « un impact
négatif sur les autres joueurs ». C'était **mécaniquement impossible** en l'état : la portée
`JOUEUR` donne à chacun son propre cooldown, donc par construction ce que fait A ne peut pas
atteindre B. Il fallait un second verrou, partagé.

**La solution : une SECONDE recharge sur la même case.** `interaction_recharge` accueille
désormais, sur les seules cases qui proposent le choix, une ligne d'**épuisement** lue *en
plus* du cooldown personnel. Clé `monde:epuisement` — jamais `monde` nue, qui sert déjà aux
interactions de portée MONDE (coffres) — ou `instance:<id>:epuisement` en donjon, pour que
deux expéditions ne se saignent pas mutuellement leurs filons.

| | Butin | Cooldown personnel | Épuisement partagé | Karma |
|---|---|---|---|---|
| Récolte mesurée | ×1 | ×0,5 | aucun | +1 |
| Récolte intensive | ×3 | ×2 | 3 × le délai de la case | −2 |

Tout vient de `Config\RecolteConfig` et **descend au front avec la carte** : aucun chiffre
n'est écrit en dur côté client, sans quoi retoucher l'équilibrage mentirait à l'écran.

**`interaction.recolte_choix`** (défaut `false`) dit si une case propose le choix. Un `mode`
envoyé sur une case qui ne le propose pas est **refusé** : le client exprime une intention, il
ne décide de rien. À l'inverse, une case à choix sollicitée **sans** mode (vieux client, appel
direct) est traitée en récolte **mesurée** — dans le doute, on ne suppose jamais que le joueur
voulait raser le gisement.

**Deux blocages, un seul affichage.** `decrire()` retient celui qui se lève **en dernier** :
prendre le premier venu annoncerait un compte à rebours plus court que la réalité. Le payload
distingue `gisementEpuise` du simple cooldown, parce que « j'ai récolté trop tôt » et
« quelqu'un est passé avant moi et a tout pris » n'appellent ni le même repère ni la même
réaction — le second est en rouge tireté, le premier en gris.

**`RecompenseService::distribuer()` prend un `$multiplicateur`** (défaut 1) qui démultiplie ce
qui se compte — quantités d'items et or — mais **ni l'expérience de personnage ni les
équipements** : on ne gagne pas trois niveaux ni trois épées parce qu'on a raclé un buisson.
Le service reste ainsi l'unique point de distribution, sans que l'appelant empile des appels.

**L'XP de métier ne dépend PAS du mode** : elle vient du geste, pas du butin. La faire suivre
le rendement ferait de l'intensif un choix doublement gagnant, alors qu'il est censé être un
arbitrage.

> ⚠️ **L'arbitrage n'en est pas encore un.** Le karma restant sans effet (§16.2), l'intensif
> donne 3× le butin pour le même coût en PA — et les PA sont la vraie ressource rare du jeu.
> **Tant que le lot 6 n'existe pas, l'intensif est strictement dominant** pour un joueur qui
> optimise. Le seul contre-poids actuel est social : un gisement saigné l'est pour tout le
> monde, y compris pour celui qui l'a saigné.

**Front** : le clic sur un gisement disponible ouvre `ChoixRecolte` (`GameModal` +
`ModalShell`). Une vraie modale plutôt qu'un menu ancré sur la case — un enfant en
`position:absolute` dans une `.case` déborde sur la grille et intercepte les clics de
déplacement (piège documenté de `mapGrid.scss`). Sur une case indisponible, rien ne s'ouvre :
la requête part et c'est le serveur qui donne la vraie raison.

**InteractionMaker** : case à cocher « Propose le choix de récolte », avec le rappel des
curseurs — affichés, pas réglables : ils sont globaux, pas par case.

**Contenu** : les deux gisements existants (Champignon bleu, Filon de cuivre) proposent
désormais le choix, le filon rend du **Minerai de fer** au lieu d'une « Coquille bleu » qui
n'avait rien à faire dans une mine, et un « Chêne du sentier » a été ajouté pour le bûcheron.
Les trois sont posés à portée du point d'apparition (carte 2).

### Tests
- `tests/Functional/InteractionApiFunctionalTest.php` (+7, 15 au total) : **l'intensif d'un
  joueur épuise le gisement pour un AUTRE**, l'éthique n'épuise rien, rendement ×3, cooldowns
  personnels 0,5× et 2×, karma opposé selon le mode, mode refusé sur une case sans choix,
  et **sans mode = récolte mesurée** (non-régression).
- Suite complète : **237 tests verts**.

### 16.4 Lot 3 — recettes et atelier (livré le 26/07/2026)

**Modèle.** Contenu : `recette` (nom, métier, niveau requis, difficulté, temps, récompense,
XP) + `recette_ingredient` (trois relations nullables, même forme que `Recompense` — la base
garantit ainsi que l'ingrédient existe). Runtime : `craft_commande`, **ajoutée à la liste
noire de `content-dump.sh`** — sans quoi les fabrications en cours partiraient dans le seed.

**La sortie d'une recette est une `Recompense`**, et c'est délibéré : `RecompenseService` est
l'unique point de conversion « ligne de récompense → items + or + XP » du projet. Écrire une
distribution propre au craft aurait dupliqué exactement ce que l'invariant interdit.

**`CraftService` est l'UNIQUE machine à états.** Quatre principes :

1. **Résolution PARESSEUSE.** Rien ne « termine » une commande : `pretAt` est posé au
   lancement, et l'état se déduit de l'horloge serveur au retour du joueur. Aucune tâche
   périodique — le scheduler tourne à la minute et travaillerait pour des joueurs
   déconnectés, ce qu'on évite déjà pour le tick de donjon. **« Prête » n'est donc PAS un
   statut** : `StatutCraft` ne connaît que EN_COURS / RETIREE / ANNULEE.
2. **Les ingrédients sont CONSOMMÉS au lancement**, pas réservés. Une réservation les
   laisserait dans le sac pendant la cuisson, donc échangeables ou vendables selon les
   chemins. Le débit passe par `SacService`, qui contrôle le DISPONIBLE — une ressource
   engagée dans un échange n'est pas craftable.
3. **Le recyclage rend depuis un INSTANTANÉ** figé au lancement (`craft_commande.ingredients`),
   jamais depuis la recette : celle-ci peut être éditée pendant la cuisson, et rendre autre
   chose que ce qui a été pris serait une porte ouverte à la duplication d'items.
4. **Rien n'est distribué ici** : sortie par `RecompenseService`, rendus par `SacService`, XP
   par `MetierService`, karma par `KarmaService`.

| | Temps | Ingrédients rendus | Karma |
|---|---|---|---|
| Fabrication soignée | ×1 | 30 % | +1 |
| Fabrication expéditive | ×0,25 | aucun | −1 |

> ⚠️ **Le recyclage est arrondi à l'INFÉRIEUR** — on ne rend jamais plus que le taux annoncé.
> Conséquence pour l'auteur de contenu : à 30 %, il faut **au moins 4 exemplaires** d'un
> ingrédient pour qu'il en revienne un seul. Sur une recette à 2 et 1 ingrédients, la
> fabrication soignée ne rend RIEN et n'est donc que plus lente. Écrire les recettes avec des
> quantités significatives, ou le mode soigné n'aura aucun intérêt.

**Garde-fous.** Verrou pessimiste sur le joueur au lancement (deux requêtes simultanées
passeraient sinon toutes deux sous le plafond et débiteraient deux fois), verrou sur la
commande au retrait (idempotence stricte : un double retrait ne distribue pas deux fois),
plafond de `CraftConfig::COMMANDES_SIMULTANEES_MAX` = 3 fabrications de front — sans lui, la
résolution paresseuse laisserait empiler mille commandes et revenir tout ramasser, ce qui
annulerait le temps de production comme contrainte.

**Annulation** : autorisée avant `pretAt` seulement, et rend les ingrédients **à 100 %**.
Après, refusée : l'objet est fait. Autoriser l'annulation tardive donnerait le choix, à la
fin, entre l'objet et ses matériaux — ce qui reviendrait à n'engager jamais rien.

**Métier oublié pendant la cuisson** : le joueur ramasse son objet — il l'a payé — mais ne
gagne pas d'XP dans un métier qu'il n'exerce plus. Lui faire perdre l'objet serait
disproportionné.

**Front** : modale **Atelier** dans le rail de gauche (`GameModal` + `ModalShell`), file
d'attente et recettes en un seul appel. Le compte à rebours est recalculé chaque seconde
depuis `pretAt` (date serveur), jamais décompté localement. Les ingrédients manquants sont en
rouge — c'est la seule information qui décide si le bouton part. Les chiffres des modes
viennent de `CraftConfig`, aucun n'est écrit côté client.

> ⚠️ **Remplacé le 27/07/2026 (§16.7)** : la modale a été réduite à la seule file de
> fabrication (« Établi »), le catalogue de recettes et la progression des métiers vivent
> désormais sur la page `/artisanat`.

**Contenu** : trois recettes de départ (potion d'alchimiste, cuir de tanneur, arc de forgeron
au niveau 10 pour éprouver le refus par niveau), plus l'objet « Cuir travaillé » qui est
lui-même une ressource de tanneur — la chaîne dépeceur → tanneur du document de design.

### Tests
- `tests/Functional/CraftApiFunctionalTest.php` (15) : cycle complet, retrait avant terme
  refusé, **double retrait refusé**, **le recyclage rend l'instantané et non la recette
  réécrite entre-temps**, mode expéditif sans rendu, temps ×1 / ×0,25, ingrédients manquants
  nommés dans le refus, **ressource réservée par un échange non craftable**, niveau et métier
  insuffisants, plafond de 3 commandes, annulation qui rend tout, annulation tardive refusée,
  atelier limité aux métiers appris, commande d'autrui introuvable.
- Suite complète : **252 tests verts**.

### 16.5 Lot 4 — ArtisanatMaker (livré le 26/07/2026)

**Un seul écran, trois onglets** — `/administration/artisanat`. Métiers, ressources et
recettes se répondent (une recette exige un métier, une ressource appartient à un métier) :
les séparer obligerait à naviguer entre trois pages pour écrire une seule chaîne de
production.

| Onglet | Ce qu'il édite |
|---|---|
| Métiers | fiche, famille, niveau max, **PNJ maîtres** qui l'enseignent |
| Ressources | les `objet`, avec leur métier et leur niveau — **premier éditeur d'`Objet` du projet**, la création d'objets passait jusqu'ici par du SQL |
| Recettes | fiche, sortie, ingrédients |

API sous `/api/artisanat/editor/*`, règle `ROLE_ADMIN` placée **avant** `^/api` dans
`security.yaml` — `/api/craft/*` et `/api/metier/*` restent des routes joueur.

**`ArtisanatEditorService`** suit le patron des trois éditeurs existants : une transaction,
des **ids stables** (envoyé avec un id = mise à jour, sans id = création, absent =
suppression). `craft_commande` référence les recettes : tout recréer casserait les
fabrications en cours.

> ⚠️ Piège Doctrine déjà payé au §14.5 et respecté ici : ingrédients et recettes sont relus
> depuis **leur repository**, jamais depuis la collection de l'entité — après une sauvegarde,
> celle-ci a été chargée AVANT l'insertion et rend un état périmé (zéro ingrédient).

**La liste des maîtres est RESYNCHRONISÉE**, retraits compris : décocher un PNJ le détache
réellement. Même règle que les classes d'un équipement (§ « pièges connus »), pour la même
raison — un simple `add` rendrait le retrait impossible depuis l'interface.

**Suppressions refusées tant que c'est référencé**, avec un message qui dit quoi faire :
une recette qu'un joueur a lancée (« désactivez-la plutôt »), un métier encore porté par des
recettes, des ressources ou des cases de récolte. Détacher le métier d'un objet le déclasse
en objet ordinaire **sans le supprimer** — c'est le seul moyen de défaire un rattachement.

**L'XP de métier est SUGGÉRÉE, pas imposée** (`niveau × 2,5 × difficulté`, plancher 5), avec
un bouton « appliquer ». Enfermer l'équilibrage dans une formule obligerait à redéployer pour
retoucher un chiffre.

**Le front ne connaît rien en dur** : familles, plafonds et modes de fabrication viennent de
`/config` (patron de `InteractionConfig`). Le sélecteur de métier d'une recette ne propose que
la famille `craft`. Tous les formulaires ont `onSubmit={(event) => handleSubmit(event)}` +
`preventDefault()` — sans quoi une touche Entrée recharge la page et la sauvegarde ne part
jamais (§15.1).

### Tests
- `tests/Functional/ArtisanatEditorApiFunctionalTest.php` (11) : éditeur fermé aux non-admins
  **lectures comprises** alors que `/api/craft/atelier` reste joueur, config décrivant
  familles/plafonds/modes, création + relecture d'un métier, famille inconnue refusée,
  **ids d'ingrédients stables**, ingrédient retiré supprimé, ingrédient sans item refusé,
  suppression d'une recette avec commandes refusée, suppression d'un métier employé refusée,
  détachement d'une ressource qui la rend ordinaire sans la supprimer.
- Suite complète : **263 tests verts**.

### 16.6 Lot 5 — dépeceur et assainissement de DeathService (livré le 26/07/2026)

**Le butin peut exiger un métier.** `monstre_objet` gagne `metier_id` (nullable),
`niveau_metier_min` et `experience_metier`. Une ligne liée à un métier n'est tirée que pour
un joueur qui l'exerce au niveau requis, et lui crédite de l'expérience. **Les lignes sans
métier tombent pour tout le monde**, exactement comme avant : c'est le cas de toutes les
lignes existantes.

C'est tout ce qu'il fallait pour le dépeceur. Le tanneur, lui, ne demande **aucun code** :
c'est une recette du lot 3 qui consomme les peaux — la chaîne dépeceur → tanneur du document
de design est du pur contenu.

**Assainissement de `DeathService::dieMonster()`** (dette relevée dans le plan) :

- l'ancien code **flushait dans la boucle de butin**, à chaque objet tiré, sans transaction :
  un échec sur la ligne suivante laissait un butin à moitié distribué. Tout se joue désormais
  dans **une transaction, avec un seul flush** ;
- la branche « drop d'équipement » était un `else` contenant uniquement du code commenté :
  l'objet était **annoncé au joueur dans `droppedItems` sans jamais lui être donné**. La ligne
  est maintenant ignorée franchement, en attendant que `SacService` la porte.

### Tests
- `tests/Service/DeathServiceButinTest.php` (6) : butin sans métier pour tous (non-régression),
  **butin de métier refusé sans le métier**, obtenu avec + XP créditée, niveau insuffisant,
  cohabitation des deux familles de lignes sur un même monstre, ligne d'équipement ignorée
  **et non annoncée**.
- Suite complète : **269 tests verts**.

> 🔎 Relevé en passant, hors périmètre : `Entity\Monstre` initialise et expose une collection
> `$quantite` **non déclarée** (propriété dynamique, dépréciée en PHP 8.2), tandis que sa vraie
> collection mappée `$case` n'est jamais initialisée. Rien de cassé en jeu, mais ça bloquera
> une montée de version de PHP.

### 16.7 Page Artisanat — 27/07/2026

L'artisanat tenait entièrement dans une modale : une liste dense de recettes, sans image, sans
recherche, et la progression des métiers reléguée à un bloc du Profil. Trois choses y sont
devenues fausses à mesure que le contenu grossissait — on ne voit pas ce qu'on fabrique, on ne
retrouve pas une recette, et le métier qu'on fait monter n'est visible nulle part à côté de ce
qu'il permet.

**Découpage retenu : deux écrans, une seule liste de commandes.**

- **Page `/artisanat`** (`pages/artisanatPage/`) — l'écran complet : rail des métiers à gauche
  (récolte ET fabrication, barre d'XP, places restantes), établi et catalogue à droite.
- **Modale « Établi »** (`components/modals/atelierModal/`) — réduite au **suivi des
  commandes**, pour ne pas quitter la carte, avec un lien vers la page.
- `components/artisanat/fileFabrication/FileFabrication.jsx` est rendu par les deux : une file
  de fabrication, un seul markup. Dupliquer la liste aurait garanti la divergence.

**Ce que le serveur a dû apprendre à dire.** `CraftService::decrireItem()` renvoie désormais,
pour le produit comme pour chaque ingrédient, `type` / `itemId` / `nom` / `description` /
`image` / `position`. Le nom de fichier est **brut** : les conventions de dossier
(`/img/objet/<image>`, `/img/consommables/<icone>`, `/img/equipement/<position>/<icone>`)
restent côté front, dans `itemUtils.itemImage()` — seul endroit du projet qui les connaisse,
et que les normaliseurs d'inventaire utilisent aussi. Les recopier dans le back en aurait fait
une seconde source de vérité, celle qui divergerait le jour où un dossier change. La position
d'équipement voyage parce que le front ne peut pas la deviner.

`decrireCommande()` renvoie en plus `lanceeAt` : sans l'origine, le front ne connaît pas la
durée totale (le mode l'a multipliée) et ne peut pas tracer d'avancement. `progressionDe()`
renvoie la `description` du métier — une fiche de métier sans description n'a rien à dire.

**Recherche et filtres, côté client seulement.** Le catalogue est petit par construction (les
recettes des métiers appris) : filtrer sur le serveur coûterait un aller-retour par frappe. La
recherche est insensible aux accents et porte sur le nom, la description, le métier, le produit
**et les ingrédients** — « que puis-je faire avec du cuir ? » est la question la plus fréquente.
S'y ajoutent des puces par métier (cliquer une carte de métier filtre aussi) et une bascule
« réalisables seulement ».

**Ce qui n'a pas changé, et ne doit pas.** Le catalogue ne montre que les recettes des métiers
APPRIS — c'est le filtrage de `CraftService::atelier()`, pas une décision d'affichage. Les
cartes grisées et l'empêchement affiché sous le bouton sont un confort de lecture : `realisable`
vient du serveur, qui revérifie métier, niveau et matériaux **disponibles** au lancement. Les
durées se recalculent depuis les dates serveur (`components/artisanat/craftUtils.js`), jamais
en décomptant des secondes.

> ⚠️ Les icônes de métier n'existent pas encore sur le disque (`public/img/metier` est vide) et
> un objet peut n'avoir aucune image : `components/artisanat/vignette/Vignette.jsx` se replie
> sur l'initiale. Sans ce repli, la carte affiche l'icône « image cassée » du navigateur et la
> grille se déforme. Le repli se réarme à chaque changement de source.

### Tests
- `CraftApiFunctionalTest::testLAtelierDecritLImageDuProduitEtDesIngredients` : identité
  visuelle du produit et des ingrédients, `position` nulle pour un objet, `lanceeAt` présente.
- Suite complète : **296 tests verts**.

### 16.8 Fiche d'un métier : cliquer sur une carte du rail — 28/07/2026

Le rail affichait la progression des cinq métiers d'un joueur, mais une carte n'était cliquable
que si le métier avait des recettes — et elle ne savait faire qu'une chose, filtrer le
catalogue. Un bûcheron, un herboriste, un armurier sans recette : trois cartes qui ne
répondaient pas au clic, ce qui se lit comme un bug plutôt que comme une absence de contenu.

**Une carte, ce que le métier a à montrer.** La FAMILLE suffit à décider — un métier de récolte
n'a pas de recette, un métier de fabrication n'a pas de ressource :

- **récolte** → le catalogue de ce qu'il permet de ramasser, palier par palier ;
- **fabrication** → ses recettes, ou « Aucune recette disponible pour ce métier. »

Les deux occupent la **même colonne**, d'où un seul état côté page (`selection = {id, famille}`)
et non deux : deux états laisseraient une fiche de récolte ouverte sous un filtre de recettes.
Recliquer la carte referme. Toute carte est cliquable, même sans rien à montrer — c'est la
colonne qui l'annonce, jamais un clic muet.

**D'où viennent les ressources.** De `objet.metier` + `objet.niveau_ressource`, la classification
de l'onglet *Ressources* de l'ArtisanatMaker (§16.5) — pas d'une table nouvelle. `MetierService`
les joint à la progression, sur les métiers de RÉCOLTE seulement, sous
`metiers[].ressources[] = {id, nom, description, type: "objet", image, niveauRequis, accessible}`.
Le nom de fichier reste **brut** (`itemUtils.itemImage()` côté front, §16.7).

`progressionDe(User, bool $avecRessources = false)` : le catalogue est une OPTION, activée par
`POST /api/metier/progression` seul. `CraftService::atelier()` appelle la même méthode pour
connaître les seuls NIVEAUX du joueur — lui facturer une requête par métier de récolte pour un
catalogue qu'il ne renvoie pas serait du travail pur perdu.

**Les paliers hors de portée restent affichés**, grisés, avec « Niveau N requis pour la
récolter ». Les masquer priverait le joueur de la seule chose qu'il vient lire sur la fiche d'un
métier : ce que le prochain niveau lui ouvrira. `accessible` vient du serveur et **n'autorise
rien** — la récolte reste arbitrée sur la case par `InteractionService` (§14, §16.3).

> ⚠️ Trois vides distincts dans le catalogue, à ne pas confondre : aucun métier de fabrication
> appris, un métier appris **sans aucune recette**, et une recherche qui ne donne rien. Les
> fusionner reviendrait à conseiller au joueur de chercher autrement là où il n'y a rien. D'où
> `recettesDuMetier` (filtre métier seul) à côté de `recettesFiltrees` (recherche comprise).
> Corollaire : la barre de puces liste TOUS les métiers de fabrication du joueur, y compris ceux
> sans recette — un métier appris qui disparaîtrait de la barre se lirait comme un bug.

### Tests
- `MetierApiFunctionalTest::testLaProgressionListeLesRessourcesDUnMetierDeRecolte` : les deux
  paliers renvoyés (dont un hors de portée, `accessible: false`), nom de fichier brut, et
  `ressources: []` sur un métier de fabrication.
- ⚠️ `MetierServiceTest` monte le service **à la main** : tout nouveau paramètre de constructeur
  y casse les 13 tests d'un coup (c'est arrivé avec `ObjetRepository`). Le penser en même temps
  que l'injection.
- Suite complète : **305 tests verts**.

---

## 17. Upload d'images pour toute l'administration — 26/07/2026

Depuis le 23/07/2026, seul l'EquipementMaker savait recevoir une image (§15). Partout ailleurs
— métiers, objets/ressources, PNJ, monstres, cases interactives — le formulaire n'offrait qu'un
champ texte doublé d'une consigne (« Fichier dans `public/img/metier`, sans extension ») : il
fallait déposer le fichier à la main dans le bon dossier, deviner la convention de nommage, et
recopier le nom sans se tromper. C'est désormais un bouton **« Choisir une image »** dans les
cinq makers, avec aperçu.

### 17.1 Le vrai problème : deux conventions de nommage cohabitent

Ce n'est pas un simple « déplacer un fichier ». Selon le champ, la base stocke le nom **avec**
ou **sans** extension, parce que le front recolle `.png` dans un cas et pas dans l'autre :

| Champ | URL construite par le jeu | Stocké en base |
|---|---|---|
| `objet.image` | `/img/objet/<image>` | `bois.png` |
| `pnj.avatar` | `img/pnj/<avatar>` | `maitreGuildeAvatar.png` |
| `pnj.skin` | `/img/pnj/<skin>.png` | `dezelleSkin` |
| `monstre.skin` | `/img/monstre/<skin>.png` | `loup` |
| `interaction.skin` | `/img/interaction/<skin>.png` | `champignon_bleu` |
| `metier.icone` | (pas encore affichée) | sans extension |

D'où l'enum **`App\Enum\CollectionImage`** : une collection = un dossier + une règle
d'extension (+ un suffixe pour les PNJ, voir plus bas). Conséquence directe et **volontaire** :
une collection qui ne stocke pas l'extension **n'accepte que des PNG**, sinon on rangerait un
JPEG impeccable que le jeu n'irait jamais chercher (il demanderait `<nom>.png`).

Avatar et sprite d'un PNJ partagent le dossier `img/pnj` : sans suffixe, le second upload d'un
même PNJ se ferait renommer `dezelle-2` par l'anti-collision. `CollectionImage::suffixe()`
produit donc `dezelle-avatar.png` / `dezelle-skin.png`, ce qui est déjà la convention manuelle
du dossier (`maitreEolanAvatar.png`, `maitreEolanSkin.png`).

### 17.2 Back

- **`src/service/ImageUploader.php`** — UNIQUE point d'écriture d'image de l'admin. Slug du nom
  (`AsciiSlugger` + lowercase), extension **devinée du contenu réel** (`guessExtension()`,
  whitelist png/jpg/webp/gif, 4 Mo), dossier re-slugifié (anti-traversée), suffixe `-2`, `-3`…
  sur homonyme sauf quand la cible est l'image actuelle de l'élément édité. Renvoie **la valeur
  à stocker** (avec ou sans extension selon la collection) ; `url()` donne celle à afficher.
- **`EquipementIconeUploader`** ne fait plus qu'accrocher le sous-dossier de position et délègue
  tout le reste. Son API publique est inchangée (l'import CSV s'appuie sur `slugify()`).
- **`POST /api/admin/image/upload`** (multipart : `image`, `collection`, `nom`,
  `valeurActuelle`) → `{fichier, url}`. Les équipements gardent leur route dédiée : eux seuls
  ont un sous-dossier résolu depuis la base.
- `security.yaml` : règle `^/api/admin/` en ROLE_ADMIN, placée **avant** `^/api`.
- `services.yaml` : `app.equipement_images_dir` devient `app.images_dir`
  (`%kernel.project_dir%/public/img`), lié par `string $imagesDir`.
- `docker-compose.yaml` : un bind-mount par dossier (`metier`, `objet`, `pnj`, `monstre`,
  `interaction`, en plus d'`equipement`) de `alcazan-front-prod/public/img/*` vers le back.
  **Ajouter une collection implique d'ajouter la ligne**, sinon l'image atterrit dans le
  conteneur et reste invisible du front.

### 17.3 Front

- `administration/services/adminImageApi.js` : `COLLECTIONS_IMAGE` (**miroir de l'enum back**),
  `urlImage()`, `formatsAcceptes()` (l'`accept` du picker se restreint au PNG quand il le faut).
- `administration/components/forms/imageUpload/ImageUploadField.jsx` : aperçu + bouton + champ
  texte conservé (seul moyen de réutiliser une image déjà présente, ou d'en retirer une).
  L'envoi part **dès la sélection du fichier**, pas au submit comme dans l'EquipementMaker :
  le nom de fichier est calculé par le serveur, l'aperçu montre donc la vraie image telle que
  le jeu la servira, et les formulaires hôtes n'ont pas à intercaler un `await` dans leur
  sauvegarde. Contrepartie assumée : une image envoyée puis un formulaire abandonné laisse un
  fichier orphelin (comme pour les équipements).
- Câblé dans `MetierForm`, `RessourceForm`, `CreatePnjForm` (deux champs), `CreateMonsterForm`,
  `InteractionForm`. Styles génériques `.image-upload*` dans `admin.scss`.
- L'aperçu **recolle l'extension quand la valeur n'en porte pas**, quelle que soit la
  collection : les valeurs saisies avant l'upload sont hétérogènes. Un fichier absent affiche
  un `⚠` (avec le chemin attendu en `title`) plutôt qu'une icône d'image cassée.

### 17.4 Bug corrigé au passage — l'ArtisanatMaker effaçait image et description

`ArtisanatEditorService::lister()` **est** la source du formulaire Ressource : le front reprend
la fiche listée et la renvoie à `sauvegarderRessource`. Or la liste ne portait ni `description`
ni `image` → rouvrir puis enregistrer un objet existant écrasait les deux en base. Les deux
champs sont ajoutés au payload. La leçon vaut pour tous les éditeurs : **tout champ omis d'une
liste qui alimente un formulaire est un champ effacé au premier enregistrement.**

### Tests

- `tests/Service/ImageUploaderTest.php` (10 tests) : les deux conventions de stockage, le
  suffixe avatar/skin, l'anti-collision, le ré-upload qui écrase, le refus du JPEG sur une
  collection sans extension, le nom vide, un nom traversant (`../../etc/passwd` → `etc-passwd`).
- Vérifié en jeu (compte admin local) : upload réel depuis le formulaire PNJ, fichier écrit
  dans `alcazan-front-prod/public/img/pnj` et servi par le front dans la foulée ; les cinq
  formulaires affichent l'aperçu des images existantes.

---

## Reste à faire — artisanat

Le **lot 6** du plan (`docs/ARTISANAT_PLAN.md`) n'est pas fait, et c'est un choix explicite :
- donner des **effets au karma** (`TypeConditionInteraction::KARMA_MIN/MAX`, modificateur de
  prix marchand) — tant qu'il n'en a pas, la récolte intensive et la fabrication expéditive
  sont strictement dominantes pour un joueur qui optimise ;
- **paliers de bonus passifs** de métier (`metier_palier` + enum whitelistée `BonusMetier` +
  registre, sur le patron de `QuestEffect`) ;
- impact environnemental des zones.

Points de contenu à reprendre, sans code :
- les recettes livrées ont des quantités d'ingrédients trop faibles pour que le recyclage à
  30 % rende quoi que ce soit (arrondi à l'inférieur, cf. §16.4) ;
- aucune icône de métier n'existe dans `public/img/metier` (le dossier et l'upload existent
  depuis le 26/07/2026, §17 — il ne manque que les images) ; depuis la page Artisanat
  (§16.7), `metier.icone` est affichée et se replie sur l'initiale du métier tant qu'aucun
  fichier n'est déposé ;
- les recettes n'ont pas d'image propre : la carte du catalogue montre celle de l'objet
  **produit**. Une recette dont la récompense n'est pas renseignée n'a donc pas de photo.

---

## 18. Karma des choix de quête et objectifs comptés — 26/07/2026

Trois demandes en une, et elles se répondent : donner un poids moral aux **choix** de
quête, mesurer des objectifs **de métier** (fabriquer, récolter) et faire enfin marcher
`BATTRE_MONSTRE`, réservé depuis l'origine faute d'un compteur de mises à mort. Le seul
point commun des trois derniers est qu'ils demandent tous de savoir **combien de fois** un
joueur a fait quelque chose — c'est ce constat qui a dicté le modèle.

### 18.1 Une table de compteurs, pas trois

`joueur_compteur` (entité `CompteurJoueur`) est générique : `(user, type, cible_id, valeur)`
avec un index UNIQUE sur le triplet. `TypeCompteur` dit ce qu'on compte **et donc** ce
qu'est la cible :

| Type | Cible | Incrémenté par |
|---|---|---|
| `MONSTRE_TUE` | `monstre.id` | `DeathService::dieMonster()` |
| `OBJET_FABRIQUE` | `recette.id` | `CraftService::retirer()` |
| `RESSOURCE_RECOLTEE` | `objet.id` | `InteractionService::executer()`, cases `RECOLTER` seulement |

Pourquoi **une** table plutôt qu'un `user_monstre` sur le patron de `user_boss` : les trois
compteurs se lisent et s'écrivent exactement pareil, et le prochain (« visiter 5 donjons »)
n'aura besoin d'aucune migration. La cible est un **entier nu, sans clé étrangère** : le
type dit déjà vers quelle table elle pointe, et une FK par type ramènerait les colonnes
nullables qu'on évite déjà ailleurs (`interaction_recharge.cle`). Contrepartie assumée :
supprimer un monstre laisse des lignes orphelines, jamais relues puisque plus aucune action
de quête ne peut le cibler.

`CompteurJoueurService` est l'**UNIQUE point de mutation** et ne flushe pas — même contrat
que `SacService`, `RecompenseService`, `MetierService` et `KarmaService`.

L'incrément passe par un `INSERT … ON DUPLICATE KEY UPDATE valeur = valeur + :pas` en SQL
natif (`CompteurJoueurRepository::incrementer()`) et **pas** par un read-modify-write sur
l'entité. Un compteur est exactement le cas où lire-additionner-écrire perd des
incréments : deux monstres tués dans la même seconde par deux requêtes concurrentes
liraient la même valeur de départ et n'en compteraient qu'un. C'est l'index unique qui rend
l'upsert possible — le retirer casserait silencieusement le comptage, pas seulement
l'intégrité.

Trois précisions de branchement :
- la mise à mort est comptée **dans `DeathService`**, pas dans le contrôleur : c'est là que
  « le monstre meurt » est vrai, donc tout futur chemin de mise à mort suivra sans qu'on y
  pense ;
- la fabrication est comptée **au retrait**, pas au lancement : sinon « lancer puis
  annuler » ferait progresser une quête d'artisan gratuitement ;
- la récolte est comptée **sur les seules interactions de type `RECOLTER`**, à la quantité
  réellement tombée dans le sac (déjà multipliée par le mode : l'intensif compte triple,
  comme il rapporte triple). Un coffre livre lui aussi des objets, mais l'ouvrir n'est pas
  récolter. `RecompenseService::distribuer()` renvoie désormais l'`id` de chaque item
  distribué, pour que l'appelant sache ce qu'il a donné sans redériver la quantité.

### 18.2 Le compteur est cumulatif, l'objectif ne l'est pas

Un compteur est un fait de partie : cumulatif à vie, jamais remis à zéro. Lu tel quel, il
rendrait toute quête de chasse absurde — « tuez 5 loups » serait déjà remplie pour qui en a
tué cinquante avant même d'avoir entendu la demande, exactement le défaut que traîne
`BATTRE_BOSS` (laissé tel quel : changer sa sémantique casserait le contenu existant).

D'où `user_quete.compteurs_depart`, un JSON `{"monstre_tue:12": 47}` : l'état des compteurs
visés **à l'entrée dans l'étape**. La condition lit `valeur − départ`. L'instantané est
reposé au démarrage de la quête et **à chaque changement de séquence**, et à ce
moment-là seulement : le reposer à chaque tentative remettrait la progression à zéro dès
que le joueur reclique sur un bouton pas encore satisfait. Clé absente (étape entamée avant
la migration, action rebranchée depuis) = départ 0, donc lecture cumulative : une
dégradation lisible, jamais un blocage.

Le joueur voit son avancement sans cliquer : chaque bouton d'objectif compté porte
`progress: {current, target, unit}` dans le payload d'étape, et le message de blocage par
défaut donne le chiffre (« 2 / 3 vaincu(s) ») au lieu de « Condition non remplie ».
L'unité vient du serveur (`TypeCompteur::unite()`) — le front ne connaît aucun type de
compteur en dur.

### 18.3 Karma porté par l'action

`action.karma` est un entier **signé et nullable** : un choix peut coûter de la réputation,
et 0/null veut dire « ce choix n'engage rien ». Il est porté par l'**action** et non par la
séquence, parce que c'est le choix du joueur qui a un poids moral, pas le fait d'avoir lu
un dialogue : deux boutons d'une même séquence — « je tiens parole » / « je garde l'or » —
sont exactement le dispositif que cette colonne sert à rendre possible.

L'ajustement est appliqué par `QuestProgressionService` **après** que la condition est
remplie et le coût payé : une action bloquée n'engage ni ressource ni réputation, le joueur
n'a pas fait le choix, il a essayé de le faire. Il passe par `KarmaService`, seul point de
mutation, qui borne la valeur — le contenu ne peut donc pas fabriquer un saint définitif.
La réponse porte `karma: {karma, palier, delta}`, **null quand rien n'a bougé** (borne déjà
atteinte) : annoncer « karma +5 » à un joueur au maximum serait un mensonge que le `delta`
de `KarmaService` permet précisément d'éviter.

Une `Action` posée sur une case de carte est la même entité qu'un bouton de quête :
`executeMapAction()` applique donc le karma lui aussi, sans quoi la même fiche se
comporterait différemment selon l'endroit où elle est branchée.

Le karma reste **sans effet de jeu** (arbitrage du 26/07/2026, `ARTISANAT_PLAN.md` §2,
lot 6 différé) : il est stocké, affiché, et maintenant gagné ou perdu par trois chemins
— récolte, fabrication, choix de quête.

### 18.4 QuestMaker et front

- Trois types d'action sortent de la réserve : `BATTRE_MONSTRE` (cible `monstres`),
  `FABRIQUER_OBJET` (cible `recettes`) et `RECOLTER_RESSOURCE` (cible `ressources` = les
  objets rattachés à un métier, lot 1 de l'artisanat). Seul `KILL_PVP` reste réservé.
  Les champs viennent de `QuestActionTypeConfig`, les catalogues de
  `QuestEditorService::getReferentiels()` — le front n'a rien en dur.
- Les trois exigent **cible ET quantité** à la sauvegarde : sans quantité, la condition
  serait « au moins un » sans que l'auteur l'ait demandé.
- Le champ **Karma** est rendu en dur dans `ActionForm`, comme le libellé et le
  branchement, et pas via la config du type : il ne dépend d'aucun type d'action — c'est
  même sur un `CHOIX` narratif qu'il a le plus de sens.
- ⚠️ Piège déjà connu (§17.4) : `SequenceForm` doit déclarer `karma`, `monstreId` et
  `recetteId` dans l'action neuve, sinon le champ est absent du payload et **effacé en
  base** au premier enregistrement.

Côté jeu, la fiche de personnage affiche une **jauge** de karma (`GaugeBar variant="karma"`)
et non plus une ligne de texte : l'échelle est signée et bornée, et ce qui compte pour le
joueur est de voir de quel côté de la neutralité il se trouve et quelle marge il lui reste
— un « Mesuré (-40) » ne dit ni l'un ni l'autre. C'est la seule jauge **bipolaire** du jeu :
son dégradé est découpé par `clip-path` et non par la largeur, pour que la teinte se lise
sur la piste entière (sinon un pillard et un gardien finiraient sur la même couleur de bout
de barre), et un repère marque le zéro. Les bornes et le libellé de palier viennent du
serveur : les seuils n'existent qu'à un seul endroit (`ArtisanatConfig`).

### 18.5 Bug corrigé au passage — créer une quête renvoyait une coquille vide

`QuestEditorService::saveQuest()` relisait la quête via `getQuestForEditor()` juste après
la transaction, mais depuis les entités en mémoire. Pour une quête **neuve**, les
séquences et actions venaient d'être persistées sans jamais être ajoutées aux collections
inverses : la relecture renvoyait `sequences: []`. Le front fait `reset(saved)` — il
vidait donc à l'écran le travail qu'il venait d'enregistrer, et le clic suivant
re-sauvegardait une quête sans séquence.

C'est exactement le piège déjà noté au §14.5 (« relire depuis LEUR REPOSITORY, pas depuis
la collection de l'entité »). Corrigé par un `entityManager->clear()` entre la transaction
et la relecture : tout est rechargé depuis la base. Le bug ne se voyait pas jusqu'ici
parce que tous les tests éditeur partaient d'une quête **existante**, dont les collections
étaient chargées depuis la base.

### Tests

- `QuestProgressionServiceTest` : un objectif de chasse ne compte que depuis le début de
  l'étape malgré 50 kills antérieurs, blocage chiffré puis déblocage, départ absent lu en
  cumulé, instantané reposé à l'avancement, un choix qui coûte du karma, une action bloquée
  qui n'engage pas le karma.
- `CompteurJoueurServiceTest` : pas nul/négatif ignoré, progression bornée à zéro.
- `QuestApiFunctionalTest` : quête de chasse écrite par l'éditeur puis jouée (les kills
  antérieurs ne comptent pas, blocage chiffré, karma appliqué), mise à mort réelle qui
  incrémente le compteur, upsert qui ne crée qu'une ligne.
- `InteractionApiFunctionalTest` : la récolte alimente `joueur_compteur` à la quantité
  ramassée (intensif compris) ; ouvrir un coffre rendant le MÊME objet ne compte pas.

### Reste à faire

- `KILL_PVP` reste le dernier type réservé (il demande un compteur de kills joueur, dont la
  cible n'est pas un id de contenu mais une classe/un alignement — à arbitrer).
- Les compteurs ne sont exposés nulle part au joueur en dehors des quêtes ; un onglet
  « faits d'armes » serait quasi gratuit à partir de `valeursParCible()`.

## 19. Reprendre le projet sur une autre machine — 27/07/2026

Tout ce qui est nécessaire est dans git **sauf trois choses, volontairement absentes** : les
clés JWT, les fichiers d'environnement locaux, et les données de partie. Voici la procédure
complète, dans l'ordre.

```bash
# 1. Cloner AVEC les sous-modules (back et front en sont)
git clone --recurse-submodules git@github.com:neraen/alcazan-forest.git
cd alcazan-forest
# si le clone a été fait sans l'option :  git submodule update --init --recursive
```

**2. Secrets et environnement du back** (jamais committés — cf. `.gitignore`) :

```bash
cd alcazan-back-prod
printf "JWT_PASSPHRASE=<phrase-de-passe-au-choix>\n" > .env.local
printf "JWT_PASSPHRASE=<la-MÊME-phrase>\n"            > .env.test.local
```

Puis les clés `config/jwt/*.pem`, deux possibilités :
- **les recopier** depuis l'ancienne machine (hors git : clé USB, gestionnaire de mots de
  passe) — les JWT déjà émis restent alors valides ;
- **les régénérer** avec la passphrase ci-dessus : `docker exec symfony-backend php bin/console
  lexik:jwt:generate-keypair` (à faire après l'étape 4). Les jetons existants deviennent
  invalides — sans conséquence, les joueurs se reconnectent.

`.env` du back n'est pas committé non plus, et n'est **pas nécessaire** : `DATABASE_URL` et
`REACT_APP_API_URL` viennent du docker-compose, `.env.test` (committé) suffit aux tests.

**3. Dépendances** — `vendor/` et `node_modules/` vivent sur l'hôte, pas dans les images :

```bash
cd alcazan-back-prod  && composer install
cd ../alcazan-front-prod && npm install
```

**4. Conteneurs**

```bash
docker stop symfony_db symfony_adminer 2>/dev/null   # autre projet, squattent 3306/8080
docker compose up -d --build
```

**5. Base de données.** Le volume Docker est local à la machine : la base `chusei` est donc
VIDE au premier démarrage. Deux étapes, dans cet ordre :

```bash
# 5a. le schéma : la première migration est le schéma complet (64 tables), les suivantes
#     l'ont fait évoluer — sur une base neuve on les joue toutes.
docker exec symfony-backend php bin/console doctrine:database:create --if-not-exists
docker exec symfony-backend php bin/console doctrine:migrations:migrate --no-interaction

# 5b. le contenu du jeu (cartes, classes, sorts, quêtes, PNJ, boss, donjons, recettes…)
./scripts/content-load.sh
```

⚠️ **Les comptes joueurs ne sont PAS dans git** (le seed exclut `user`, `inventaire*`,
`user_quete`, `donjon_*` de runtime…). Sur la nouvelle machine il n'y a donc aucun personnage :
en créer un par l'inscription, ou reporter un `mysqldump` de `backups/` (gitignoré) si l'on veut
retrouver ses personnages.

**6. Vérifier**

```bash
docker exec mysql mysql -uroot -ppassword chusei -e "SELECT COUNT(*) FROM carte;"
docker exec symfony-backend php bin/console doctrine:schema:validate   # doit être VERT
docker exec symfony-backend php vendor/bin/phpunit                     # base isolée chusei_test
```

Le front écoute sur http://localhost:3000, l'API sur http://localhost:8080/api/, nginx sur :80,
le hub Mercure sur :5001 (macOS squatte 5000 avec AirPlay).

**Les trois dépôts et leurs branches** — les sous-modules ne sont PAS sur la même branche que
le dépôt parent, c'est le piège classique quand on reprend le projet :

| Dépôt | Branche | Contenu |
|---|---|---|
| `alcazan-forest` (racine) | `main` | docker-compose, scripts, seeds, docs, pointeurs de sous-modules |
| `alcazan-forest-back-prod` | `master` | API Symfony, migrations, tests |
| `alcazan-forest-front-prod` | `migration-typescript` | client React, images du jeu (`public/img/`) |

Après un `git pull` dans la racine, faire `git submodule update --recursive` : le parent ne
référence que des **commits** de sous-modules, pas leurs branches.

---

## 20. Hôtel des ventes — 30/07/2026

Marché **asynchrone** entre joueurs : on dépose un lot et on repart, un autre l'achète pendant
qu'on est déconnecté. Le jeu n'avait jusque-là que l'échoppe PNJ (prix fixé par le contenu, or
créé et détruit par le jeu) et l'échange joueur-à-joueur (`EchangeService`, synchrone, deux
joueurs adjacents et connectés en même temps). Il manquait ce troisième mode de circulation
des biens, celui qui fait émerger des prix.

Le modèle économique retenu est celui des **frais de dépôt** : le vendeur paie un pourcentage
du prix demandé à la mise en vente, et n'est jamais remboursé. C'est un puits monétaire (l'or
prélevé disparaît du jeu) et le seul frein qui rende coûteux l'affichage d'un prix délirant —
une commission prélevée à la vente ne coûte rien à qui encombre le catalogue sans vendre.

### 20.1 Décisions de conception (arbitrées avec l'auteur le 30/07/2026)

| Question | Choix | Pourquoi |
|---|---|---|
| Point d'accès | Bouton du rail `SideMenu` | Patron `AtelierModal` + `useModal()` : aucune slice Redux, aucun PNJ à créer |
| Commission | **Frais de dépôt** à la mise en vente | Puits monétaire ; renchérit le spam d'annonces |
| Objet mis en vente | **Retiré du sac** (séquestre) | Voir l'invariant §20.2 |
| Encaissement | Or crédité direct, invendu rendu au sac | Pas de courrier à écrire ; rend la commande d'expiration structurante |
| Achat partiel | Non : le **lot est indivisible** | Muter `quantite` sous concurrence et gérer le reliquat pour rien ; vendre à l'unité = plusieurs annonces, ce que borne le plafond |

### 20.2 Invariants

- **`HotelVenteService` est l'UNIQUE machine à états** de `hotel_vente` : aucun autre service
  ni contrôleur n'y écrit. Comme `SacService`, il n'invente aucun montant à partir du client.
- **Le séquestre n'est PAS une réservation.** L'objet quitte le sac par
  `SacService::retirerItem` et n'existe plus que dans la ligne d'annonce. On n'emploie
  volontairement pas `reservation_ressource` : son seul usage (l'échange) dure cinq minutes,
  une annonce vit deux jours, et le joueur verrait dans son sac un objet qu'il ne peut ni
  vendre, ni équiper, ni échanger sans comprendre pourquoi. Corollaire vérifié par les tests :
  un lot en vente n'est plus vendable au marchand PNJ, parce qu'il n'est plus là.
- **Pas de colonne `version`** contrairement à `Echange` : une annonce n'est pas co-éditée,
  seul son statut bascule. La course entre deux acheteurs se règle par **verrou pessimiste**
  (`find($id, PESSIMISTIC_WRITE)` puis `refresh()`, patron `EchangeService::echangeVerrouille`)
  plus test du statut → `HotelVenteIndisponibleException` → **409** avec l'annonce fraîche.
  Le `prixAttendu` envoyé par le client est la garde d'écran périmé, jamais ce qui est débité.
- **Le vendeur touche 100 % du prix**, la commission ayant déjà été prise au dépôt. Le transfert
  reprend `EchangeFinalisationService` à la lettre : verrous des deux joueurs par **id
  croissant** (ordre déterministe anti-deadlock), puis débit de l'acheteur **avant** crédit du
  vendeur — chacun paie avec l'or qu'il possède, jamais avec celui qu'il reçoit.
- **`hotel_vente` est du RUNTIME joueur** : liste noire de `scripts/content-dump.sh`.
- **`item_id` n'a pas de clé étrangère**, comme `echange_ligne` : le jeu n'a pas d'instance
  d'objet, et la colonne pointe vers l'une des trois tables selon `type`. Une annonce orpheline
  (item supprimé du contenu) doit rester lisible — le normalizer rend « Objet inconnu » et son
  vendeur peut encore la retirer.

> ⚠️ **La commande d'expiration n'est PAS un filet** comme `app:echanges:expirer` : c'est le
> SEUL chemin par lequel un invendu revient dans un sac. L'expiration paresseuse ne couvre que
> les annonces que quelqu'un consulte ; un lot que plus personne ne regarde ne serait jamais
> restitué. La désactiver, c'est confisquer des objets.

### 20.3 Domaine et API

| Élément | Rôle |
|---|---|
| `src/Entity/HotelVente.php` | Le lot : vendeur, `(type, itemId, quantite)`, prix total, frais figés, statut, acheteur, dates. Trois index de service (catalogue, mes ventes, expiration) |
| `src/Enum/StatutHotelVente.php` | `EN_VENTE → (VENDUE \| RETIREE \| EXPIREE)`, `estTerminal()`, `label()` |
| `src/Enum/TriHotelVente.php` | Ordres de tri du catalogue. Une enum et non une chaîne libre : la valeur finit dans un `ORDER BY` |
| `src/Config/HotelVenteConfig.php` | Tous les curseurs : taux 5 %, plancher 1 po, 48 h, 10 lots/joueur, bornes de prix, 50/page. `fraisDepot()` et `curseurs()` |
| `src/service/HotelVenteService.php` | La machine à états |
| `src/service/HotelVenteNormalizer.php` | Format unique servi tel quel par l'API |
| `src/Repository/HotelVenteRepository.php` | Catalogue paginé, comptage du plafond, historique, périmées |
| `src/Exception/HotelVenteIndisponibleException.php` | Portée en 409 avec l'état frais |
| `src/Command/ExpirerVentesHotelCommand.php` | `app:hdv:expirer`, à la minute dans le `scheduler` |

Routes (toutes en POST, sous `^/api` → `IS_AUTHENTICATED_FULLY` : **aucune ligne à ajouter dans
`security.yaml`**, il n'y a pas de back-office) : `/hotel/catalogue`, `/hotel/mes-ventes`,
`/hotel/vendre`, `/hotel/acheter`, `/hotel/retirer`. DTO dans `src/DTO/HotelVente/`.

**Recherche sans clé étrangère** : on ne peut pas joindre le nom de l'item en SQL. Le terme est
d'abord résolu en ids par famille (`SacService::rechercherItemsParNom`, qui délègue à
`findIdsParNom()` ajouté aux trois repositories de contenu), puis les annonces sont filtrées sur
`(type, item_id)`. **Ne pas dénormaliser le nom sur l'annonce** : on lit déjà l'item en direct
pour l'image, la rareté et la description, un second nom figé dériverait.

`SacService::decrireItem()` a été **enrichi** de `position`, `rarete` et `description` (ajout
additif, aucun appelant cassé) : c'est le seul endroit qui connaît les divergences de champs
entre les trois familles, et un quatrième `match` ailleurs aurait été une duplication.

### 20.4 Front

`components/modals/hotelVenteModal/` : `HotelVenteModal` (coquille, onglets, `agir()`),
`HotelAcheter`, `HotelVendre`, `HotelMesVentes`, `tempsRestant.js`. Ouvert depuis
`SideMenu` par un `useModal()` — copie du branchement d'`AtelierModal`. **Aucune slice Redux** :
personne d'autre que la modale n'a besoin de cet état, et le patron `Host` de MapPage ne se
justifie que pour ce qui est piloté par la carte ou par le serveur.

- Chrome : `GameModal size="fill"` + `ModalShell`, onglets reprenant `.tabs/.tab/.tabActive` de
  `ShopView.module.scss`. La carte d'annonce **réutilise `ItemCard`** de l'échoppe, étendue
  d'une prop `subline` (chaîne libre : la carte reste ignorante du domaine et des horloges) et
  d'un repli sur l'initiale quand l'item n'a pas d'icône.
- **Aucun chiffre en dur** : les frais s'affichent en direct depuis `curseurs.tauxFrais` et
  `curseurs.fraisMinimum` renvoyés par le serveur, qui recalcule de toute façon au dépôt.
- Recherche, filtre et tri sont envoyés au **serveur** (contrairement au catalogue de recettes,
  filtré côté client) : l'hôtel est alimenté par les joueurs, il n'a pas de taille bornée.
- Le temps restant est recalculé depuis `expiresAt` (horloge serveur), jamais décompté
  localement — même règle que la file de fabrication.
- **Pas de Mercure, et c'est un choix** : un catalogue asynchrone n'a pas besoin de temps réel,
  et le 409 couvre proprement la course entre deux acheteurs. Le topic `user/{id}` reste
  disponible si l'on veut plus tard notifier « votre lot est vendu ».
- Après chaque action : `updateJoueurState({money})` (le serveur fait foi sur l'or) et
  `updateJoueurState({needRefresh: true})` (le sac a bougé).

#### Pièges rencontrés

- **Un `{/* … */}` au milieu d'une liste d'attributs JSX ne compile pas** (« Unexpected token,
  expected "…" »). Le commentaire doit précéder l'élément.
- **Ne jamais dimensionner une modale de jeu en `vw`.** L'overlay de `GameModal` est ancré sur
  `.main` de MapPage (la zone de carte, ~880 px), pas sur la fenêtre : un `min(1120px, 96vw)`
  dépassait de 138 px de chaque côté et se faisait rogner. `width: 100%` + `max-width` ne peut
  jamais excéder ce que l'hôte accorde. Le commentaire de `ShopView.module.scss` décrit ce
  piège mais son `96vw` ne le résout pas.
- **`MapPage .main` est passé de `overflow: hidden` à `overflow: clip`.** `hidden` crée un
  conteneur de défilement ; la SpellBar étant plus large que la zone sur une fenêtre étroite
  (`scrollWidth` 1058 pour 878), le navigateur scrollait `main` de ~180 px pour « amener dans la
  vue » le bouton cliqué à l'intérieur d'une modale — entraînant tout le contenu, dont
  `#game-modal-root`, et rognant la modale sur son bord gauche, titre compris. `clip` rogne
  pareil mais interdit le défilement. **Ne pas revenir à `hidden`** : le bug touche toutes les
  modales de jeu, pas seulement l'hôtel des ventes.
- **Recliquer un filtre déjà actif ne déclenche aucune requête** (l'état ne change pas, donc le
  `useCallback` non plus) : sur un marché où les lots apparaissent en continu, il fallait un
  bouton **Rafraîchir** explicite. Sans lui, la seule façon de recharger était de changer
  d'onglet et de revenir.

### 20.5 Tests

- `tests/Service/HotelVenteServiceTest.php` (12 tests, vrai `SacService`, repositories mockés) :
  frais en pourcentage arrondi au supérieur et plancher, prélèvement au dépôt, séquestre par
  retrait, **aucune réservation posée**, refus hors bornes / plafond atteint / stock insuffisant
  / or insuffisant, retrait sans remboursement, pas d'auto-achat.
- `tests/Functional/HotelVenteApiFunctionalTest.php` (13 tests contre `chusei_test`) :
  `testLeCycleCompletTransfereOrEtObjet`, `testUnObjetMisEnVenteNEstPlusVendableAuMarchand`,
  `testUnLotDejaVenduRepond409`, `testUnPrixPerimeRepond409`,
  `testUnAchatSansOrEstRefuseSansRienDeplacer`, `testLeRetraitRendLObjetSansRembourserLesFrais`,
  `testLePlafondDAnnoncesEstOpposeAuVendeur`, `testLExpirationRendLObjetAuVendeur`,
  `testUnLotPerimeNApparaitPlusAuCatalogue`, `testLaRechercheFiltreSurLeNomDeLItem`,
  `testMesVentesNeMontreQueLesSiennes`.
  ⚠️ Les comptes neufs démarrent avec **10 pièces d'or** : un test qui dépose un lot cher doit
  d'abord doter le vendeur, sinon c'est le dépôt qui échoue et non ce qu'on voulait éprouver.

Suite complète : **330 tests verts**.

Vérifié en jeu à deux joueurs (origines `:3000` et `:80`) : dépôt avec prélèvement des frais,
achat avec transfert croisé de l'or et de l'objet, écran périmé → 409 sans débit, retrait sans
remboursement, expiration forcée puis `app:hdv:expirer` rendant l'invendu.

### 20.6 Reste à faire (hors lot, volontairement)

- Notification Mercure « votre lot est vendu » sur `user/{id}`.
- Indicateur de prix moyen constaté — à concevoir quand il y aura du volume.
- Back-office de modération (`^/api/hotel/editor`) : inutile tant que le jeu n'a pas de
  population.
- Achat partiel d'un lot, si le dépôt d'annonces multiples se révèle trop pénible à l'usage.

---

## 21. Journal d'événements et statistiques — 01/08/2026

Premier lot d'un chantier d'observabilité en deux volets : un **monitoring d'administration**
(échanges, objets, monstres tués, joueurs) et un volet **joueur** (statistiques sur le profil,
classements publics). Ce lot livre le socle — la table d'événements, le service qui l'écrit,
l'écran d'observation et la purge. Le plan complet est dans `docs/STATISTIQUES_PLAN.md`.

Avant ce lot, le jeu ne savait pas dire ce qui s'y passait : la seule trace était `historique`
(`message` VARCHAR(255) libre, `date`, `is_external`), écrite depuis six endroits tous situés
dans `PlayerActionController`, sans type ni payload. Aucun agrégat, aucun classement, aucun
tableau de bord.

### 21.1 Décisions arbitrées

| Question | Choix | Pourquoi |
|---|---|---|
| Journal d'événements ou compteurs agrégés ? | **Les deux, rôles disjoints** | Le journal répond à « que s'est-il passé » (enquête), `joueur_compteur` à « combien de fois, par cible ». Deux tables, deux questions — jamais deux vérités sur la même |
| Où écrire ? | **Chez les appelants, jamais dans `SacService`** | Une ligne par **fait**, pas par mutation : un échange conclu est un fait, mais six à dix appels à `SacService` |
| `JournalService` flushe-t-il ? | **Non — INSERT natif, exceptions avalées** | Voir 21.2 : c'est l'arbitrage central du lot |
| Sort de `historique` | **Coexistence, aucun backfill** | Les lignes existantes sont des phrases interpolées ; les re-typer par expressions régulières produirait de la *fausse donnée structurée dans la table qui sert d'enquête* |
| Préfixe d'API | **`^/api/admin/stats/*`** | La règle `^/api/admin/` existe déjà et est déjà placée avant le `^/api` fourre-tout → **zéro ligne touchée dans `security.yaml`**. `/editor` désigne les *makers*, qui éditent du contenu ; un tableau de bord n'édite rien |
| Rétention | **90 jours, purge livrée avec le socle** | Quarante lignes maintenant, ou une opération d'urgence sur une table de plusieurs giga-octets plus tard |
| Graphiques front | **Aucune dépendance** | CRA 4 / webpack 4 : `recharts` et `chart.js` tirent des `d3-*` ESM-only. Le besoin de ce lot est un tableau |

### 21.2 Invariants

- **`JournalService` est l'UNIQUE point d'écriture de `evenement_jeu`.** Il n'ouvre pas de
  transaction et ne flushe pas : il écrit en SQL natif, immédiatement.
- **« Hors unité de travail » ≠ « hors transaction ».** L'INSERT emprunte la MÊME connexion
  DBAL : il PARTICIPE à la transaction de l'appelant. C'est délibéré et c'est tout l'arbitrage :
  > *Le journal ne doit jamais faire échouer une action, et ne doit jamais mentir sur une action
  > qui n'a pas eu lieu.* Les deux se règlent avec la même décision — même transaction,
  > exceptions avalées vers Monolog. Un rollback efface le log (souhaitable : un journal qui
  > garde la trace d'un échange annulé envoie l'enquête sur une fausse piste) ; une écriture en
  > échec ne remonte jamais (on perd une ligne de journal, jamais une action de jeu).
  >
  > ⚠️ Écartée pour cette raison exacte : la variante « bufferiser en mémoire, écrire après le
  > commit ». Elle survit au rollback, c'est-à-dire qu'elle **journalise des faits qui n'ont pas
  > eu lieu**.
- **UN type = UN FAIT.** Pas de `OR_GAGNE`/`ITEM_OBTENU` génériques : un achat à l'hôtel des
  ventes produirait alors quatre lignes qu'aucune colonne ne relie, et le journal cesserait de
  raconter une histoire pour redevenir un log d'inventaire — que `SacService` garantit déjà.
  Un achat, c'est **une** ligne `HDV_ACHAT` (acteur = acheteur, cible = vendeur).
- **`MORT_JOUEUR` couvre TOUTES les morts**, plutôt qu'un couple `JOUEUR_TUE`/`MORT` :
  `acteur_id` = le tueur (NULL si environnement), `cible_user_id` = le mort. Grâce aux deux
  index, la même ligne se lit dans les deux sens. Dupliquer doublerait le volume et créerait
  deux vérités à réconcilier.
- **`cible_user_id` est une COLONNE, pas une clé du contexte JSON.** La requête n°1 de
  l'administration est « la fiche du joueur X », c'est-à-dire tout ce qu'il a fait ET subi. En
  JSON, elle deviendrait un scan complet avec `JSON_EXTRACT` sur précisément la table qu'on ne
  peut pas scanner.
- **Le nom des items est FIGÉ dans `contexte.items` au moment du fait**
  (`JournalService::figerItems()`, qui passe par `SacService::decrireItem()`). Ce n'est pas un
  confort : `echange_ligne.item_id` et `hotel_vente.item_id` n'ont pas de clé étrangère (§20),
  donc aucune requête ne pourra jamais joindre le nom a posteriori. Bénéfice collatéral :
  l'événement reste lisible après suppression du contenu.
- **Le journal n'est pas un grand livre comptable.** La vérité sur ce que possède un joueur
  reste son inventaire. Le journal peut donc manquer un mouvement d'or sans que ce soit un
  défaut.
- **La catégorie n'existe pas en base** : elle est dérivée par `TypeEvenement::categorie()`.
  Filtrer par catégorie revient à élargir la liste des types côté DTO. C'est ce qui permet à un
  événement de changer de rayon sans réécrire une seule ligne.
- **Le front ne connaît AUCUN type en dur** : il lit `/api/admin/stats/referentiels`. Ajouter un
  type reste une modification back seulement.

### 21.3 Les pièces

| Élément | Rôle |
|---|---|
| `Entity/EvenementJeu.php` | Mapping de `evenement_jeu`. **Jamais persistée par l'ORM** : elle existe pour que `migrations:diff` connaisse la table et que `schema:validate` reste vert |
| `Enum/TypeEvenement.php` | 16 faits, avec `label()`, `categorie()` et `phrase()` — la phrase française est rendue CÔTÉ SERVEUR |
| `Enum/CategorieEvenement.php` | `COMBAT`, `ECONOMIE`, `PROGRESSION`, `SOCIAL`, `SYSTEME` |
| `Enum/TypeCible.php` | Ce que désigne `cible_id` (entier nu, sans FK). Ses trois premières valeurs sont CELLES de `TypeItem` |
| `service/JournalService.php` | **UNIQUE** point d'écriture (+ `figerItems()`) |
| `service/JournalNormalizer.php` | Résout pseudos et noms de cible par lectures GROUPÉES (une requête par type de cible, pas une par ligne) |
| `Repository/EvenementJeuRepository.php` | SQL natif : `inserer`, `insererPlusieurs`, `rechercher`, `compterParJour`, `supprimerAvant` |
| `Config/JournalConfig.php` | Rétention, taille de lot, pagination |
| `Controller/AdminStatsController.php` | `POST /api/admin/stats/journal` et `/referentiels` |
| `Command/PurgerJournalCommand.php` | `app:journal:purger`, dans la boucle horaire du scheduler |
| `Event/ConnexionSubscriber.php` | `last_connexion` + événement `CONNEXION`, une fois par jour civil |
| `administration/pages/JournalPage.jsx` | L'écran, styles `journal-*` dans `admin.scss` |

Points de production branchés : `DeathService` (×3), `SpellService::doDamageOnBoss`,
`LevelingService`, `EchangeFinalisationService`, `HotelVenteService` (×4), `VenteService`,
`PlayerActionController::playerBuyItem`, `CraftService::retirer`, `InteractionService`,
`QuestProgressionService`, `ConnexionSubscriber`.

### 21.4 Les quatre index, et pourquoi aucun ne peut être fusionné

`(acteur_id, cree_le)` sert la fiche joueur ; `(cible_user_id, cree_le)` sert « ce qu'il a
subi » — autre colonne de tête, donc autre index ; `(type, cree_le)` sert le flux filtré et les
agrégats par jour ; `(cree_le)` seul sert la purge, qu'un index composite ne couvrirait pas.

**Pas d'index sur `cible_id`** : aucune requête du périmètre ne demande « tous les événements
sur le monstre 12 ». Il coûterait 100 % des écritures pour 0 % des lectures — et cette
question-là se répond mieux via `joueur_compteur`.

### 21.5 Pièges rencontrés

- **`or` est un mot réservé MySQL** : la colonne s'appelle `montant_or`. Même famille de piège
  que `donjon_salle.condition`, mais évitée par le NOMMAGE plutôt que par des backticks — un nom
  qui doit être échappé finit toujours par casser un INSERT quelque part.
- **`user.last_connexion` n'était écrite NULLE PART.** La colonne existait depuis l'origine et
  valait NULL pour tout le monde ; sans elle, « qui a joué cette semaine » n'a aucune source.
  `ConnexionSubscriber` la renseigne enfin, en SQL natif — un flush complet de l'entité `User` à
  chaque authentification réécrirait des champs de partie (vie, PA, position) avec l'état qu'ils
  avaient au chargement du jeton.
- **`ShopService` est une coquille vide** : l'achat en échoppe vit inline dans
  `PlayerActionController::playerBuyItem`. C'est le seul événement consigné depuis un
  contrôleur, et c'est assumé — le sortir dans un service est un refactoring sans rapport.
- **Bug corrigé au passage** : `HistoriqueRepository::getAllRowsForPlayer` concaténait
  l'identifiant dans le DQL (`->where('historique.user = '.$userId)`) et renvoyait **tout**
  l'historique, sans `ORDER BY` ni limite. Paramètre lié, tri décroissant, `LIMIT 200`.
  `insertHistoryForPlayer` a été supprimée : elle utilisait un `INSERT` en DQL, ce qui n'existe
  pas — la méthode était cassée et inutilisée. `HistoriqueService` est marqué `@deprecated`.
- **Tests unitaires et paramètres de constructeur** : insérer une dépendance au milieu d'un
  constructeur casse tous les tests qui passent des mocks POSITIONNELS (cinq fichiers ici). Le
  symptôme est un `TypeError` sur un argument sans rapport.
- **Migrer `chusei_test` demande la `DATABASE_URL` explicite** : `--env=test` ne suffit pas, la
  variable injectée par docker-compose l'emporte et la commande migre la base de DEV en
  annonçant « already at the latest version ».
  `docker exec -e DATABASE_URL="mysql://root:password@mysql:3306/chusei_test" symfony-backend php bin/console doctrine:migrations:migrate`

### 21.6 Mise au point sur l'arbitrage §20.6

§20.6 affirme : « Back-office de modération (`^/api/hotel/editor`) : inutile tant que le jeu n'a
pas de population. » Ce lot ne l'infirme pas, il le **précise**. Un back-office de *modération*
— annuler une vente, sanctionner un joueur — reste inutile. Un back-office d'*observation* est
utile **précisément parce qu'il n'y a pas encore de population** : c'est l'outil qui dit si
l'économie et le gameplay tiennent avant d'inviter des joueurs.

### Tests

- `tests/Service/JournalServiceTest.php` (9 tests) : écriture nominale et relecture du contexte
  JSON ; **un rollback de la transaction englobante efface l'événement** ; **une écriture en
  échec ne remonte pas d'exception** (unitaire et par lot) ; `consignerPlusieurs` ne fait qu'un
  INSERT ; un contexte vide s'écrit NULL ; figeage du nom d'item et repli « Objet inconnu (#id) ».
- `tests/Functional/AdminStatsApiFunctionalTest.php` (10 tests) : 403 pour un joueur ordinaire
  et 401 pour un anonyme (la règle `^/api/admin/`) ; **`testUneConnexionProduitUnEvenement`
  parcourt la chaîne complète sans SQL de fixture** — s'inscrire, se connecter, lire le journal
  par l'API ; une seule ligne par jour malgré trois jetons ; le filtre par joueur ramène ce
  qu'il a fait ET subi ; la catégorie élargit aux types du rayon ; une catégorie inconnue ne
  filtre pas ; pagination et plafond de `parPage` ; purge (ancien supprimé, récent conservé).

Suite complète : **349 tests verts**, `doctrine:schema:validate` vert.

Vérifié en jeu : connexion, achat et vente en échoppe produisent trois lignes lisibles dans
`/administration/journal`, avec pseudo résolu, nom d'objet figé et phrase française correcte
(« pour 1 pièce d'or » au singulier) ; le filtre par catégorie affiche le bon état vide. La
suite de tests, elle, a produit **13 des 16 types** d'événements — preuve que les branchements
tiennent hors du chemin nominal.

### 21.7 Cumuls de partie et faits d'armes — lot 2

Deuxième lot : les TOTAUX qui alimenteront la fiche de personnage et, au lot suivant, les
classements.

#### Pourquoi une table de plus

`joueur_compteur` répond à « combien de fois, PAR CIBLE » ; ces totaux-là n'ont pas de cible.
Et on ne pouvait pas leur en inventer une : **`CompteurJoueurService::incrementer` refuse
`$cibleId <= 0`**, il n'existe donc aucune « cible 0 » disponible. Forcer une fausse cible
aurait cassé l'invariant que `CLAUDE.md` décrit comme la clé de voûte des compteurs.

C'est aussi la réponse à la question laissée ouverte en §18 à propos de `KILL_PVP` (« la cible
n'est pas un id de contenu mais une classe ou un alignement — à arbitrer ») : **il n'y a pas de
cible**, donc pas de compteur à cible. Le détail « qui, quand » vit dans le journal.

Trois tables, trois questions, jamais trois vérités sur la même :
`joueur_compteur` = par cible · `joueur_cumul` = total · `evenement_jeu` = qui/quoi/quand.

#### Invariants

- **`CumulJoueurService` est l'UNIQUE point de mutation de `joueur_cumul`**, ne flushe pas, et
  ignore tout pas ≤ 0 — un cumul ne redescend jamais. Le cas n'est pas théorique :
  `giveExpMalusAfterDeath` fait passer une valeur NÉGATIVE par le point de passage de l'XP, et
  un malus de mort n'est pas de l'XP « dé-gagnée ».
- **L'index UNIQUE `(user_id, cle)` est ce qui rend l'upsert possible** ; le retirer ferait
  perdre des incréments concurrents en silence, pas seulement l'intégrité. Même invariant que
  `joueur_compteur`.
- **`user.money` et `user.honneur` NE SONT PAS des cumuls** mais des états courants. Les
  recopier créerait une seconde vérité sur l'or. L'API les rend dans une liste `etats` séparée.
- **Deux cumuls sont des dénormalisations assumées** — `MONSTRES_TUES` (depuis
  `joueur_compteur`) et `BOSS_VAINCUS` (depuis `user_boss`, qui reste la source :
  `ActionType::BATTRE_BOSS` en dépend). Ce qui les rend légitimes est qu'elles sont
  **recalculables** : `app:cumuls:reparer` les reconstruit, `--verifier` signale sans écrire.
  La règle : *une dénormalisation n'est acceptable que si on sait la reconstruire.*
- **`ajouterParId()` existe pour `LevelingService`**, qui ne reçoit qu'un identifiant : charger
  l'entité pour relire son id serait un aller-retour base sur un chemin appelé à chaque coup.
- **`POST /api/joueur/stats` est un endpoint DÉDIÉ**, pas un ajout à `/joueur/data/minimal` —
  celui-ci est le chemin CHAUD, rappelé à chaque rafraîchissement de carte.
- **Aucun libellé côté client** : `label`, `unite` et `format` descendent du serveur.

#### Les backfills : deux exacts, un approché

`MONSTRES_TUES` et `BOSS_VAINCUS` sont reconstruits exactement depuis leurs sources.

⚠️ **`XP_TOTALE` est une BORNE INFÉRIEURE et le restera.** On reconstruit « somme des paliers
franchis + XP courante », ce qui ignore l'XP gagnée puis reperdue (−9 % du palier à chaque
mort). On le fait quand même plutôt que de partir de zéro : à zéro, un personnage de niveau 49
serait classé DERRIÈRE un nouveau venu qui tue un loup le lendemain du déploiement. Un
classement visiblement faux le premier jour ne se rattrape pas ; une borne inférieure
documentée, si.

`user.hors_classement` est une COLONNE et non un test sur `roles` : filtrer avec
`JSON_CONTAINS` détruirait l'index qui sert justement à trier. Mise à 1 pour les comptes
ROLE_ADMIN existants, sans quoi le compte de développement trusterait tous les podiums.

#### Tests

- `tests/Service/CumulJoueurServiceTest.php` (10 tests) : délégation, pas négatif et pas nul
  ignorés, joueur sans identifiant, `ajouterParId`, clés jamais alimentées rendues à 0,
  libellé/format, exclusion des flux d'or des faits d'armes.
- `tests/Functional/JoueurStatsApiFunctionalTest.php` (7 tests) : 401 anonyme, personnage neuf
  tout à zéro, richesse et honneur, honneur NULL rendu 0, **chaîne complète « gagner de l'XP →
  cumul → API »**, **« un malus de mort ne décrémente pas l'XP totale »**, recalcul d'un cumul
  dérivé.

Suite complète : **366 tests verts**, `doctrine:schema:validate` vert.

Vérifié en jeu : le panneau « Faits d'armes » s'affiche sur `/personnage` avec l'XP héritée du
backfill (4 123 pour le compte de test), séparateur de milliers français, et « 959 po » rendu
selon le `format` servi par l'API. La suite de tests a alimenté **6 des 7 cumuls** — seul
`JOUEURS_TUES` reste à zéro, ce qui est attendu : il demande de connaître le tueur.

### 21.8 Classements publics — lot 3

Troisième lot : la page `/classement`, qui occupe enfin le lien mort du rail (`SideMenu.jsx`
pointait sur `"#"` depuis 2023).

#### Décisions

| Question | Choix | Pourquoi |
|---|---|---|
| Où vivent les catégories ? | Enum `CategorieClassement`, SÉPARÉE de `TypeCumul` | Deux des cinq ne sont pas des cumuls (`user.money`, `user.honneur`), et tous les cumuls ne méritent pas un podium (« morts », « or dépensé »). Les fusionner obligerait à un drapeau « classable » d'un côté et à de faux cumuls de l'autre |
| Calcul | **À la volée, aucune table de snapshot** | Volumétrie de quelques comptes ; `WHERE cle = ? ORDER BY valeur DESC LIMIT 50` sur `(cle, valeur)` est un parcours d'index borné. Matérialiser ajouterait une table, un cron, une fenêtre de fraîcheur et un mode de panne pour un gain non mesurable |
| Pagination | **Aucune** | Le rang personnel est servi à part, donc un joueur classé 312ᵉ le sait sans parcourir six pages. C'est ce qui rend la pagination inutile plutôt qu'oubliée |
| Composants front | **UN tableau générique** | Les colonnes ne changent pas d'une catégorie à l'autre ; seul l'intitulé bouge, et il vient du serveur. C'est ce que le découpage abandonné de 2023 (un composant par classement) rendait impossible |

#### Invariants

- **Toutes les lectures passent par `ClassementService::top()` et `rangDe()`.** Ce n'est pas
  de la cérémonie : c'est ce qui rend le choix « à la volée » RÉVERSIBLE. Matérialiser un jour
  reviendra à créer une table, écrire une commande, et changer le corps de deux méthodes —
  zéro impact sur le contrôleur et le front.
- **Le rang est calculé par le SERVEUR**, jamais déduit de l'index du tableau : deux joueurs à
  égalité partagent le même rang et le suivant saute d'autant, ce qu'un `index + 1` ne sait pas
  exprimer.
- **`user.hors_classement` filtre en TÊTE des deux index** (`(hors_classement, money)` et
  `(hors_classement, honneur)`) : la requête filtre avant de trier, donc la colonne filtrante
  doit précéder, sinon MySQL retombe sur un tri complet.
- **Un compte exclu reçoit `rang: null`**, pas un rang calculé : il n'apparaît dans aucune
  liste, lui en afficher un serait mentir.
- **`COALESCE(honneur, 0)`** dans les requêtes d'état : la colonne est nullable jusqu'au lot
  PvP, et sans ça les comptes jamais engagés en duel disparaîtraient du classement au lieu d'y
  figurer à zéro.
- **Le front ne connaît aucune catégorie en dur** : libellé, intitulé de colonne et format
  descendent de `ClassementService::categories()`. Ajouter le classement des guildes au lot 5
  sera une modification back seulement.

#### Pièges rencontrés

- ⚠️ **Un champ de DTO typé ENUM répond 500, pas 422, sur une valeur inconnue.**
  `BackedEnumNormalizer` lève une `InvalidArgumentException` que `#[MapRequestPayload]` ne
  convertit pas. Le DTO prend donc une CHAÎNE et résout par `tryFrom()`, ce qui laisse l'enum
  gardienne de la valeur (elle finit dans un `ORDER BY`) tout en permettant un 400 propre.
  **Le travers est GÉNÉRAL au projet** : `POST /api/hotel/catalogue` avec un `type` inconnu
  répond 500 pour exactement la même raison. À traiter globalement un jour, pas au cas par cas.
- ⚠️ **La base de test n'est pas réinitialisée entre les exécutions.** Un test qui fabrique un
  joueur très riche en laisse un derrière lui ; deux exécutions plus tard, deux millionnaires
  ex æquo faisaient échouer une assertion « il doit être premier » sans que rien ne soit cassé.
  L'assertion porte donc sur la CONCORDANCE entre `/liste` et `/moi`, qui reste vraie quel que
  soit le contenu déjà en base. Règle générale pour ce dépôt : ne jamais asserter une position
  absolue dans un classement fonctionnel.

#### Bug corrigé au passage

`UserRepository::getDataForProfil` concaténait le pseudo dans le DQL
(`->where("user.pseudo = '$pseudo'")`), et ce pseudo vient du corps de la requête cliente
(`POST /joueur/data/profil`) — donc d'une entrée non maîtrisée. Paramètre lié. Même patron que
le bug déjà corrigé dans `HistoriqueRepository::getAllRowsForPlayer` au lot 1 ; il n'en restait
apparemment que celui-là.

#### Tests

`tests/Functional/ClassementApiFunctionalTest.php` (10 tests) : 401 anonyme mais **accès ouvert
à tout joueur** (un classement est public), catégorie inconnue → 400, catégorie absente → la
première, ordre décroissant et taille bornée, **un compte `hors_classement` n'apparaît pas**,
**les ex æquo partagent le rang**, concordance `/liste` ↔ `/moi`, compte exclu sans rang,
et chaque catégorie déclarée répond réellement.

Suite complète : **376 tests verts**, `doctrine:schema:validate` vert.

Vérifié en jeu : les cinq catégories s'affichent, le passage à « Richesse » applique le format
or (« 145 523 po »), les ex æquo à 3 010 po partagent bien le rang 2 et le suivant est 4ᵉ, et
« Mon rang » annonce « Ce compte est exclu des classements » pour le compte d'administration.

### 21.9 Tableau de bord d'administration — lot 4

Quatrième lot : la vue d'ensemble du jeu et la fiche d'enquête d'un joueur. Cet écran occupe
le `NavLink to="/administration/joueurs"` qui était déclaré dans le menu **sans route
correspondante** depuis l'origine du projet.

#### Ce que le tableau de bord répond

Activité (joueurs actifs 24 h / 7 j, courbe par catégorie sur 30 jours), **masse monétaire**,
objets les plus échangés, plus gros vendeurs. La fiche joueur ajoute identité, cumuls et les
cent derniers événements — **faits ET subis**, ce pour quoi `cible_user_id` est une colonne
indexée et non une clé du contexte JSON.

#### La masse monétaire, seule règle de domaine de l'écran

C'est la partie qui peut être fausse sans que rien ne plante, d'où `TypeEvenement::fluxMonetaire()` :

| Flux | Types | Sens |
|---|---|---|
| `creation` | `VENTE_PNJ`, `QUETE_TERMINEE` | de l'or apparaît (un marchand paie, une quête récompense) |
| `destruction` | `ACHAT_PNJ`, `HDV_DEPOT` | de l'or disparaît (un marchand encaisse, des frais sont prélevés) |
| `transfert` | `ECHANGE_CONCLU`, `HDV_ACHAT` | l'or change de mains, le total ne bouge pas |

> **Le SQL sait sommer `montant_or` ; il ne sait pas qu'un marchand est extérieur à l'économie
> des joueurs.** Sans cette classification, un tableau de bord additionnerait les transferts
> entre joueurs à la création monétaire et conclurait à une inflation qui n'existe pas. Les
> transferts sont donc affichés À PART, jamais agrégés au solde.

> ⚠️ **`HDV_DEPOT` est le cas tordu** : son `montant_or` porte le PRIX demandé, qui n'est ni
> créé ni détruit. Ce qui disparaît, ce sont les FRAIS, rangés dans `contexte.fraisDepot` —
> d'où une requête dédiée (`sommeFraisDepot()`, `JSON_EXTRACT` sur un ensemble déjà restreint
> par l'index `(type, cree_le)`). Sommer `montant_or` pour ce type gonflerait « or détruit »
> du prix de chaque annonce déposée. Un test le verrouille.

Le **solde** (création − destruction) est LA question d'équilibrage d'un MMO : durablement
positif, l'or s'accumule et les prix dérivent. L'écran le colore donc en ALERTE quand il est
positif — l'inverse de l'intuition, et c'est voulu.

#### Deux lacunes de lots précédents corrigées ici

Construire la métrique « or créé » a révélé que l'or des RÉCOMPENSES n'était compté nulle part :

1. **`OR_GAGNE` ignorait les quêtes, le butin de boss, les coffres et la sortie d'atelier.**
   Le cumul n'était alimenté que par la vente, l'échange et l'hôtel des ventes, et annonçait
   donc un total faux à tout joueur ayant fait une quête. Il est désormais compté dans
   `RecompenseService::distribuer()` — l'unique point de conversion d'une récompense. Pas de
   double comptage : la vente et l'hôtel créditent par `SacService` directement, jamais via une
   `Recompense`.
2. **`QUETE_TERMINEE` ne portait pas son or.** Sans lui, « or créé » n'aurait compté que les
   ventes aux marchands. L'événement porte maintenant `montantOr`.

#### Pièges rencontrés

- **`AdminCatalog` imposait un bouton « + Nouveau »**, absurde sur un écran d'observation : on
  ne crée pas un joueur. Ajout d'un `allowNew` (défaut `true`, donc tous les makers existants
  sont inchangés) plutôt qu'un second composant à maintenir.
- ⚠️ **Un SVG en `preserveAspectRatio="none"` avec `height: auto` suit le ratio du `viewBox`** :
  une courbe déclarée 100×48 dans un bloc de 500 px s'affichait sur 240 px de haut. La hauteur
  est posée EN LIGNE depuis la prop, pas en CSS.
- L'agrégation des objets échangés se fait **en PHP et non en SQL** : `echange_ligne.item_id`
  et `hotel_vente.item_id` n'ayant pas de clé étrangère, aucune jointure ne ramène le nom —
  c'est précisément pourquoi le journal le fige dans son contexte, et la contrepartie est
  qu'on ne peut pas `GROUP BY` en base.

#### Tests

`tests/Functional/TableauDeBordApiFunctionalTest.php` (11 tests) : 403 pour un joueur ordinaire
sur les deux endpoints ; **chaque type porteur d'or est classé une seule fois** (un type ajouté
sans classification disparaîtrait en silence du tableau de bord) ; **un échange n'est ni
création ni destruction** ; **seuls les frais de dépôt sont détruits, pas le prix demandé** ;
le solde est bien l'écart ; la série couvre chaque jour de la fenêtre ; une connexion compte
comme joueur actif ; la fiche remonte ce qui a été fait ET subi ; joueur inconnu → 404 ; la
liste porte de quoi distinguer les comptes.

Suite complète : **387 tests verts**, `doctrine:schema:validate` vert.

Vérifié en jeu : le tableau de bord affiche les six tuiles, cinq courbes colorées par
catégorie, le détail des trois flux et les objets/vendeurs en tête — avec des chiffres qui
correspondent exactement aux achats et ventes effectués à la main (acheté 2 po, vendu 1 po →
solde négatif). La fiche d'un joueur s'ouvre depuis le rail, cumuls et journal compris.

### 21.10 Guildes réelles — lot 5

Cinquième lot, et le seul qui touche au GAMEPLAY existant : les guildes deviennent
utilisables, et le bug qui les rendait inertes disparaît.

#### Le bug, précisément

`user.guilde_id` et `joueur_guilde` coexistaient. L'adhésion (`POST /joueur/guilde/join`)
écrivait dans la SECONDE, tout l'affichage lisait la PREMIÈRE, et **aucun code n'écrivait
jamais la première** : rejoindre une guilde n'avait donc strictement aucun effet visible.

⚠️ La colonne n'était pas morte pour autant — elle portait des données saisies à la main, et
QUATRE jointures la lisaient : `UserRepository:41` et `:139`, `CarteCarreauRepository:74`,
`DonjonInstanceMembreRepository:40`. La supprimer sans plus la remplacer aurait effacé le nom
de guilde sur le profil, sur la carte et dans la liste des membres d'instance de donjon.
L'ordre du lot est donc : **récrire les quatre jointures → remonter les données → seulement
ensuite supprimer**.

#### Décisions

| Question | Choix | Pourquoi |
|---|---|---|
| Source de vérité | **`joueur_guilde`**, `user.guilde_id` supprimée | C'est là qu'écrivaient déjà les adhésions ; la colonne n'avait aucun écrivain |
| Une ou plusieurs appartenances ? | **Une seule**, index UNIQUE `(user_id)` | La multi-candidature obligerait à trancher « les autres sont-elles auto-refusées ? » — de la machine à états pour zéro gameplay |
| Grades | **Enum `GradeGuilde`**, tables `grade`/`joueur_grade` supprimées | Elles étaient VIDES (zéro ligne) et ne portaient aucune permission ; des permissions en base sont de toute façon interprétées par le code |
| `placeMax` | Vérifié à l'**acceptation**, pas à la candidature | Une guilde pleine peut recevoir des candidatures, qui attendront ; bloquer en amont obligerait le candidat à surveiller la guilde |
| Baron qui part | **Refusé** s'il reste des membres ; **dissout** s'il est seul | Sinon la guilde reste avec des candidatures que plus personne ne peut ni accepter ni dissoudre — ou vide et inaccessible à jamais |
| Transmission de baronnie | **Opération à part** de la promotion | Elle touche DEUX lignes ; il ne doit jamais y avoir deux barons, ni zéro |

#### Invariants

- **`GuildeService` est l'UNIQUE machine à états** de `guilde` et `joueur_guilde`, et il OUVRE
  ses transactions — la règle « ne flushe pas » vise les services de VALEUR (Sac, Karma,
  Cumul), pas les machines à états (patron `EchangeService`, `HotelVenteService`).
- **Un joueur = au plus une ligne** : candidat quelque part OU membre quelque part.
- **Les permissions vivent dans `GradeGuilde`**, jamais réécrites dans le service : `exclure`
  demande un grade STRICTEMENT supérieur (« supérieur ou égal » laisserait deux officiers
  s'exclure mutuellement — ce n'est pas une règle, c'est une course).
- **`decideurEtCible()` est le garde-fou que chaque transition doit poser** : sans lui, un
  baron agirait sur les membres d'une autre guilde.
- **Les candidatures ne sont visibles que de qui peut les traiter** : un candidat n'a pas à
  connaître ses concurrents.
- **Chaque transition renvoie l'état FRAIS et complet** : le front ne recharge jamais derrière
  une action et ne devine aucun état (patron `EchangeService`).
- L'alignement doit correspondre — **c'est la seule règle qui donne aujourd'hui une
  conséquence de jeu à `user.alignement`**.

#### La migration, et pourquoi son ORDRE compte

Le diff généré par Doctrine posait l'index UNIQUE avant tout dédoublonnage et supprimait
`user.guilde_id` avant d'en remonter le contenu — deux façons de perdre des données. La
séquence écrite à la main est : colonnes tolérantes → normalisation → remontée →
dédoublonnage → contraintes → suppressions.

⚠️ **La casse des grades a dû être normalisée** : la base contenait `'Baron'` et `'Recrue'`
capitalisés là où l'enum attend des minuscules. Sans ce `LOWER()`, toute lecture d'une ligne
existante aurait levé une erreur d'hydratation d'enum. Le plan initial annonçait « zéro
backfill de grade » : c'était faux, la vérification en base l'a montré.

⚠️ **`candidate_le` est ajoutée NULLABLE puis passée NOT NULL** : une colonne NOT NULL sans
défaut casse sur des lignes existantes.

#### Infra

`EXCLUDE` de `content-dump.sh` : **+ `guilde`** (dès que les joueurs en créent, c'est du
runtime, et le dump aurait poussé leurs guildes dans git puis `content-load.sh` les aurait
écrasées en laissant `joueur_guilde` orpheline), **− `joueur_grade`** (table supprimée). La
table `grade` disparaissant du seed, ce lot impose un `./scripts/content-dump.sh --push`.

#### Pièges rencontrés

- **`User::$niveauJoueur` n'avait aucun getter** depuis l'origine : tout passait par
  `NiveauJoueurRepository`. Ajouté, pour éviter une requête quand l'entité est déjà jointe.
- ⚠️ **La migration a échoué à mi-parcours sur `chusei_test`** en laissant un schéma partiel
  (colonnes ajoutées, contraintes non posées) — MySQL ne sait pas annuler du DDL. Réparé à la
  main puis version enregistrée. **Leçon** : migrer `chusei_test` en même temps que la base de
  dev, pas après coup, pour que l'échec se voie tout de suite.
- **Découvert au passage, sans rapport avec ce lot** : `chusei_test` a **34 clés étrangères de
  moins** que `chusei` (117 contre 151), sur des tables non touchées ici (`friend`,
  `historique`, `inventaire*`…). `doctrine:schema:validate` est donc rouge sur la base de test
  alors qu'il est vert sur celle de dev. À traiter séparément — les tests passent, mais ils
  n'éprouvent pas l'intégrité référentielle.

#### Tests

`tests/Functional/GuildeApiFunctionalTest.php` (14 tests). Celui qui justifie le lot est
**`testRejoindreUneGuildeSeVoitVraiment`** : il vérifie les DEUX surfaces, l'état de guilde et
`data/minimal` — c'est cette seconde qui restait vide. Les autres couvrent la fondation et son
coût, la visibilité des candidatures, et chaque refus : deux guildes, baron qui quitte, officier
qui exclut un baron, baron attribué par promotion, grade inconnu, guilde complète, alignement
étranger. Plus deux invariants : **au plus une appartenance par joueur après une suite de
transitions**, et la dissolution qui emporte toutes les lignes.

`ApiFunctionalTest::testGuildesPlayerIsEmptyWithoutAlignement` est remplacé par
`testAnnuaireEstVideSansAlignement` : l'annuaire DIT désormais pourquoi il est vide, au lieu de
renvoyer un tableau qu'on pouvait confondre avec « aucune guilde n'existe ».

Suite complète : **401 tests verts**, `doctrine:schema:validate` vert sur la base de dev.

Vérifié à deux joueurs de bout en bout : A fonde (et paie), B voit la guilde à l'annuaire,
candidate, A voit la candidature et accepte, **B voit alors sa guilde dans `guilde/etat` ET
dans `data/minimal`**, A promeut B officier, les quatre refus attendus tombent avec leur
message, A exclut B puis dissout. Zéro doublon en base. Le classement des guildes s'allume
(ex æquo à égalité de cumul, comptes `hors_classement` exclus de la somme de leur guilde).

### 21.11 PvP réel — lot 6

Sixième lot : le duel entre joueurs devient **correct**. Pas « fini » au sens gameplay — voir
la fin de section — mais correct : gardé côté serveur, payé en points d'action, attribué, et
adossé à une formule d'honneur qui n'a plus de trous.

#### Ce que le PvP ne faisait pas

- **Il ne décomptait JAMAIS les points d'action.** `doDamageOnBoss` le faisait explicitement
  (`SpellService.php:163`), `doDamage` — le chemin PvP — ne le faisait pas : attaquer un
  joueur était **gratuit et illimité**.
- Ni carte, ni portée, ni état de la cible, ni `summoningSickness` : on pouvait frapper à
  travers le monde, et achever en boucle quelqu'un qui venait de réapparaître au cimetière.
- **La formule d'honneur avait des trous.** Une différence de niveaux **entre 30 et 50**, ou
  **égale à 9, 18 ou 30**, tombait dans le `else` final et rapportait **+50** — le maximum,
  pour avoir tué quelqu'un quarante niveaux en dessous de soi. L'exact inverse de l'intention
  documentée en §2.
- `user.honneur` était **nullable**, et `getHonneur() + $gain` opérait donc sur NULL.
- L'XP de duel était un `mt_rand(180, 240)` en dur, avec un `/* todo */`.

#### Décisions

| Question | Choix | Pourquoi |
|---|---|---|
| Où vivent les règles ? | **`PvpService`**, nouveau | `SpellService` reste le CALCULATEUR de dégâts (partagé PvE/boss/donjon) ; le PvP est un JEU DE RÈGLES. Les mélanger est ce qui a produit un contrôleur de 70 lignes construisant du HTML — et laissé passer les trous ci-dessus |
| Forme de la formule | **Droite bornée**, plus de branches | *Une chaîne de branches sur des entiers aura toujours des trous.* Ce n'est pas un rééquilibrage : les valeurs restent des placeholders assumés (§7) |
| `computeHonnorGain/Loose` | **Sortis de `SpellService`** | L'honneur était la seule valeur de progression sans point de mutation unique |
| Cooldown des sorts | **Hors périmètre**, assumé | C'est un trou GÉNÉRAL (`attack/monster` et `attack/boss` l'ont aussi) ; le boucher côté PvP seul créerait une asymétrie plus déroutante. Le PA redevenu obligatoire fait office de cooldown |

#### Invariants

- **`PvpService` est l'unique point d'entrée du duel** et ouvre sa transaction.
- **`HonneurService` est l'UNIQUE point de mutation de l'honneur**, ne flushe pas, et borne la
  valeur (contrat de `KarmaService`).
- **Tous les gardes sont serveur**, copiés sur `DonjonCombatService::verifierAttaqueBoss` :
  même carte, distance de **Chebyshev** ≤ portée, PA suffisants **et décomptés**, cible vivante
  et ≠ soi, `summoningSickness` des deux côtés, feu ami selon `PvpConfig::FEU_AMI_AUTORISE` —
  **la seule règle qui donne aujourd'hui une conséquence de jeu à `user.alignement`** en dehors
  des guildes.
- **`diePlayer` connaît enfin son tueur** : `?CauseMort $cause = null`, paramètre OPTIONNEL —
  les sites d'appel qui ne savent pas compilent inchangés et journalisent « inconnue » plutôt
  qu'une cause inventée. `JOUEURS_TUES` n'est incrémenté que si la mort a un tueur : mourir sur
  une zone de donjon ne fait le score de personne.
- **Se soigner soi-même ne rapporte aucune XP** : sinon le classement mesurerait la capacité à
  se taper dessus pour se recoudre.

#### Le piège de l'anti-farm (bug rencontré, corrigé)

L'anti-farm lit `evenement_jeu` : « ai-je déjà tué CETTE victime depuis
`FENETRE_ANTI_FARM_HEURES` ? ». **C'est le seul endroit où le journal est une entrée de
gameplay et non un log**, d'où la contrainte : `JournalConfig::RETENTION_JOURS` ne doit jamais
descendre sous cette fenêtre, sinon la purge rouvre le farm.

> ⚠️ **Il faut MESURER TÔT et APPLIQUER TARD, et les deux contraintes tirent en sens opposés.**
>
> Mesurer après `diePlayer`, c'est voir l'événement `MORT_JOUEUR` que le kill courant vient
> d'écrire : la PREMIÈRE victoire se déclare alors farm et ne rapporte rien. C'est exactement
> ce qui s'est produit en jeu pendant ce lot, parce que `appliquerVictoire()` refaisait le test
> lui-même.
>
> Mais appliquer avant `diePlayer` est impossible : celui-ci finit par un
> `entityManager->refresh()` de la victime, qui **effacerait** un honneur posé avant lui.
>
> D'où `appliquerVictoire(..., bool $farm)` : le paramètre est passé par l'appelant, seul à
> pouvoir mesurer au bon moment. Deux tests le verrouillent, dont un qui asserte que
> `appliquerVictoire` **n'interroge jamais le journal**.

#### Tests

- `tests/Service/HonneurServiceTest.php` (12 tests, ~5 900 assertions) :
  **`testLaFormuleNaAucunTrou`** balaie l'intervalle `[-200, +200]` et vérifie monotonie et
  bornes — c'est le test qui aurait attrapé le bug. Les trois anciens tests de barème de
  `SpellServiceTest` **passaient tous** alors que la formule était trouée : ils éprouvaient
  trois POINTS, pas l'intervalle. Plus : perte jamais positive, écraser un faible coûte,
  bornes, honneur NULL traité comme zéro, et les deux tests d'ordre de l'anti-farm.
- `tests/Functional/PvpApiFunctionalTest.php` (11 tests) :
  **`testLesPointsDActionSontReellementDecomptes`** (le trou principal), PA insuffisants, hors
  portée, autre carte, cible qui vient de réapparaître, feu ami, soi-même ; mise à mort
  attribuée (`acteur_id`, `cause: pvp`, cumuls `JOUEURS_TUES`/`MORTS`) ; **retuer la même
  victime ne rapporte plus rien** ; soin sur autrui et sur soi.

Suite complète : **421 tests verts**, `doctrine:schema:validate` vert.

Vérifié à deux joueurs adjacents de camps opposés : PA décomptés à l'écran, les six refus
tombent avec leur message, la première mise à mort donne +20 / −20 d'honneur et 200 d'XP, la
seconde dans la fenêtre ne donne rien, et le journal porte `acteur_id` = tueur avec
`cause: pvp`.

#### Ce lot ne rend PAS le PvP « fini »

Il le rend correct. Restent hors périmètre, et volontairement : les zones PvP (on peut
attaquer partout), un flag de consentement, le butin PvP, les sanctions, et le **cooldown
serveur des sorts** — ce dernier étant un chantier à part couvrant les trois endpoints
d'attaque.

### 21.12 Journal du joueur refondu — lot 7

Dernier lot : `POST /api/historique/infos` est servi depuis `evenement_jeu`.

#### Ce que ça débloque

`docs/REFONTE_PLAN.md` (phase 6) écrivait, en refusant les huit catégories de la maquette :

> « La table `historique` ne porte que message/date/is_external → deux catégories réelles
> « Mes actions » et « Subis ». Les 8 catégories de la maquette **nécessiteraient un typage
> des événements côté back — à faire si le gameplay l'ajoute**. »

C'est fait. L'écran filtre désormais par catégorie RÉELLE (combat, économie, progression,
social, système), en plus de l'axe « Mes actions / Subis » qui reste pertinent — les deux sont
orthogonaux et vrais.

#### Une union, aucun backfill

Les lignes de `historique` sont servies telles quelles dans une catégorie **« Archives »**,
qui dit ce qu'elles sont : un héritage, pas une classification. Les re-typer demanderait des
expressions régulières sur du texte interpolé par du code qui a changé plusieurs fois — le
résultat serait de la **fausse donnée structurée**, le pire résultat possible.

**Aucun risque de doublon** : plus rien n'écrit dans `historique`. Les deux derniers appels à
`recordInHistoryPlayer` (morts face à un monstre et face à un boss) sont supprimés, l'événement
`MORT_JOUEUR` les couvrant intégralement, cause comprise.

`HistoriqueService` a donc changé de métier : il n'écrit plus, il LIT — et c'est le même nom
pour un travail devenu correct.

#### Ce que le lot a révélé

⚠️ **Une partie des archives est doublement encodée.** « infligé » y est stocké « infligÃ© » —
de l'UTF-8 réinterprété en Latin-1 à l'écriture. Le défaut est **dans les données** (les
lignes récentes sont saines, il a donc été corrigé à un moment) et ne se voyait pas tant que
l'écran n'affichait rien de lisible.

Réparé à l'AFFICHAGE et non par une migration : ce sont des archives figées, et réécrire en
masse du texte déjà abîmé se tenterait sans filet. Le test de réparation ne peut pas abîmer
une ligne saine : on réinterprète la chaîne en Latin-1 pour retrouver les octets d'origine, et
on n'accepte le résultat QUE s'il est de l'UTF-8 valide — « assoiffé » (bien encodé) donnerait
un octet isolé invalide et reste intact, « infligÃ© » redonne « infligé ». Un test couvre les
deux cas.

#### Tests

`tests/Functional/HistoriqueApiFunctionalTest.php` (8 tests) : catégories servies par le
serveur, union des deux sources, tri décroissant toutes sources confondues, **une même ligne
`MORT_JOUEUR` est « action » pour le tueur et « subie » pour la victime avec la MÊME phrase**
(le journal ne duplique pas la mort), cloisonnement entre joueurs, retrait du HTML des
archives, et réparation d'encodage sans dégât collatéral.

Suite complète : **429 tests verts**, `doctrine:schema:validate` vert.

Vérifié en jeu : la chronologie affiche les phrases typées avec leur badge de catégorie et de
type, le filtre « Archives » isole les six lignes héritées, et le mojibake a disparu.

### 21.13 Reste à faire (hors lot, volontairement)

Les sept lots du plan (`docs/STATISTIQUES_PLAN.md`) sont livrés : §21.1-21.6 (socle),
§21.7 (cumuls), §21.8 (classements), §21.9 (tableau de bord), §21.10 (guildes),
§21.11 (PvP), §21.12 (journal du joueur). Ce qui reste est délibérément dehors :

- **Cooldown serveur des sorts** — trou GÉNÉRAL aux trois endpoints d'attaque
  (`joueur`, `monstre`, `boss`). Le boucher sur un seul créerait une asymétrie plus
  déroutante que le trou ; chantier à part, couvrant les trois.
- **`diePlayer` sans transaction propre** — lui en ajouter une mélangerait DQL hors unité de
  travail, `refresh()` et `donjonInstanceService->sortir()`. Refactoring à risque sans rapport.
- **`chusei_test` a 34 clés étrangères de moins que `chusei`** (117 contre 151), sur des
  tables non touchées par ce chantier. `schema:validate` y est rouge : les tests passent mais
  n'éprouvent pas l'intégrité référentielle.
- **Un champ de DTO typé enum répond 500 et non 422** sur une valeur inconnue
  (`BackedEnumNormalizer`). Contourné au cas par cas ici ; à traiter globalement.
- **`guilde.niveau` reste décoratif** — le brancher sur la somme des XP des membres serait
  facile et faux tant qu'on n'a pas décidé ce qu'un niveau de guilde débloque.
- **Classements « heal » et « alignement »** — rien ne compte les soins ; l'alignement n'a de
  conséquence que depuis le feu ami du lot 6, ce qui rend le second envisageable désormais.
- **Suppression de la table `historique`** — possible le jour où plus personne n'a de ligne
  antérieure qui compte. Rien ne l'écrit plus.

### 21.13 bis Régression corrigée : le contrat de réponse des attaques (02/08/2026)

Signalée en jeu après le lot 6 : « quand je fais un sort sur un joueur, je n'arrive plus à en
cibler un autre, ni à le décibler, et je ne vois plus les noms au survol. Je dois faire F5. »

**C'était bien une régression du lot 6**, et elle tenait à une chose : la refonte du PvP a
livré une réponse plus propre, mais DIFFÉRENTE.

#### Pourquoi ça bloquait tout l'écran

`Spell.jsx` consomme les TROIS endpoints d'attaque (joueur, monstre, boss) de la même façon,
et fait notamment :

```js
droppedItems: (attackStats.droppedItems[0] !== undefined) ? attackStats.droppedItems[0] : "",
```

La nouvelle réponse PvP ne portait plus `droppedItems` (un duel ne rapporte pas de butin).
L'accès `[0]` sur `undefined` levait donc un `TypeError` — **pendant la construction de
l'objet passé à `updateJoueurState`**, qui n'était donc jamais appelé. L'exception remontait
en rejet non intercepté, l'état Redux restait figé, et le ciblage comme les survols mouraient
jusqu'au rechargement. Manquaient aussi `newExperience`, `level`, `lifeJoueur`,
`damageReturns` et `killMessage` — ce dernier étant ce qui fait DÉCIBLER après une mise à mort.

#### Le second bug, dans le même geste

La branche joueur de `launchAttack` n'avait **aucun `try/catch`**, alors que le lot 6 venait
d'introduire des refus en HTTP 400 (portée, PA, carte, feu ami, réapparition). Chaque refus
parfaitement légitime cassait donc l'écran de la même façon — et le docblock de `PvpException`
disait pourtant « ⚠️ un refus DOIT se voir ». La règle était écrite, le `catch` jamais branché.

#### Correction

- **Back** : `PvpService` respecte à nouveau le CONTRAT PARTAGÉ des endpoints d'attaque. Les
  champs sans objet en duel sont présents et neutres (`droppedItems: []`, `damageReturns: 0`),
  les enrichissements propres au duel (`kill`, `honneur`, `lifeCible`) s'y ajoutent sans le
  remplacer.
- **Front** : `attackStats.droppedItems?.[0] ?? ""` — un endpoint sans butin ne doit plus
  pouvoir faire tomber le rendu ; et `try/catch` + toast sur la branche joueur, comme le fait
  déjà la branche « renfort ».

#### La leçon

> **Changer la FORME d'une réponse consommée par un écran partagé est un changement de
> contrat, pas un nettoyage.** Trois endpoints alimentent `Spell.jsx` ; en rendre un « plus
> propre » l'a rendu incompatible. Les 421 tests étaient verts : aucun ne vérifiait la forme
> de la réponse, seulement ses effets en base.

Trois tests ajoutés à `PvpApiFunctionalTest` pour que ça ne repasse plus :
`testLaReponseRespecteLeContratPartageDesAttaques` (toutes les clés attendues par `Spell.jsx`),
`testUneMiseAMortRenseigneKillMessage` (le déciblage), et
`testUnRefusPorteUnMessageExploitableParLeFront` (400 + message toastable).

Suite complète : **432 tests verts**.

Vérifié en jeu à deux joueurs adjacents : le sort passe, le message s'affiche, on peut
re-cibler un autre joueur, décibler, et survoler — sans F5. Et un refus (cible qui vient de
réapparaître) affiche son toast en laissant l'écran intact.

⚠️ À noter pour la suite : la garde de distance CÔTÉ CLIENT (`distanceCalculator` dans
`handleAttack`) intercepte l'attaque hors de portée avant l'appel réseau. Les refus serveur
sont donc rares en jeu normal — ce qui explique qu'ils soient passés inaperçus, et pourquoi
le `catch` reste indispensable pour les cas de désynchronisation.

### 21.14 Bilan du chantier

Sept lots livrés. Ce qui existe maintenant et n'existait pas :

| Brique | Ce qu'elle répond |
|---|---|
| `evenement_jeu` + `JournalService` | « qu'est-ce qui s'est passé » |
| `joueur_cumul` + `CumulJoueurService` | « combien au total » |
| `ClassementService` | « qui domine » |
| Tableau de bord admin | « le jeu tient-il ? » (masse monétaire comprise) |
| `GuildeService` | les guildes, réellement |
| `PvpService` + `HonneurService` | le duel, gardé et attribué |
| Journal du joueur | les catégories réelles, enfin |

**Bugs préexistants corrigés au passage** : injection DQL dans `HistoriqueRepository` puis dans
`UserRepository::getDataForProfil` ; endpoint d'historique sans tri ni limite ; `user.guilde_id`
jamais écrite alors que tout l'affichage la lisait ; `user.last_connexion` jamais écrite ; PvP
gratuit en points d'action ; formule d'honneur trouée ; `user.honneur` nullable ; `OR_GAGNE`
ignorant les récompenses ; double encodage des archives.

**Dettes ouvertes, assumées et documentées** : le cooldown serveur des sorts (trou général aux
trois endpoints d'attaque) ; `diePlayer` sans transaction propre ; `chusei_test` avec 34 clés
étrangères de moins que `chusei` ; un champ de DTO typé enum qui répond 500 au lieu de 422
(travers général du projet) ; `guilde.niveau` décoratif.
