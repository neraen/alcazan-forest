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
- Modèle : `Quete` → suite ordonnée de `Sequence` (la **position est l'unique source d'ordre**,
  fin de quête = pas de position suivante ; dialogue **inliné** : `dialogueTitre`/`dialogueContenu`),
  chaque séquence portant ses `Action` (via `SequenceAction`). Une séquence **sans quête** =
  dialogue autonome d'un PNJ type `action` (auberge). Contraintes uniques en base :
  `(quete_id, position)`, `(user_id, quete_id)`, `recompense.sequence_id`.
- Types d'action : `App\Enum\ActionType` **stocké directement** (`action.action_type`, plus de
  table `action_type` → plus de désynchronisation possible). `SCRIPTED_EFFECT` remplace l'ancien
  `JSON` : l'effet est une case de l'enum `QuestEffect` exécutée par `QuestEffectRegistry`
  (choisir_classe, choisir_alignement, entrer_auberge, recompense_boss) — **plus d'URL en base**.
  `BATTRE_MONSTRE`, `CHOIX`, `KILL_PVP` sont réservés : refusés bruyamment tant que non implémentés.
- **`QuestProgressionService`** est l'unique machine à états : démarrage explicite (prérequis
  niveau/alignement/quête/objet enforced), garde-fous (action ∈ séquence, séquence courante),
  vérification + consommation, récompense, avancement `position + 1`, complétion — le tout
  transactionnel. Consulter un PNJ (`/api/pnj/interaction`) est une **lecture pure** ;
  la quête ne démarre que sur `/api/quest/start`.
- Réponses **structurées sans HTML** : `{status: step|blocked|done|locked, quest, step:
  {sequenceId, dialogue: {title, paragraphs}, actions: [{actionId, type, label}]},
  blockedMessages, feedback: {rewards, messages}, needRefresh}`.
- QuestMaker : endpoints admin `/api/quest/editor/*` (ROLE_ADMIN, lectures comprises),
  sauvegarde transactionnelle par correspondance d'ids (`QuestEditorService`) — **les ids ne
  churnent plus**. Les champs du formulaire sont pilotés par `Config\QuestActionTypeConfig`
  (exposée par `/editor/config`), les tables `action_field*` ont été supprimées.

### PNJ, boutiques, social
- PNJ typés : `shop` (via `Shop`/`ShopEquipement`/`ShopObjet`), `quest`, `action`, `guilde`.
- Achat : `/joueur/buy/shop` (débit `prixAchat`, incrément inventaire). Vente : écran `ShopSell`
  côté front, endpoint back introuvable.
- Guildes : liées à un **alignement** (obligatoire), candidature grade `recrue`, chef « baron »
  (TODO notifications/limite de places). Amis (`Friend`), messagerie (`Message`), historique de
  combat (`Historique`, flag `isExternal` = événement subi).
- Classements (front) : xp, PvP, heal, alignement, guilde — endpoints back à vérifier.

### Outils d'administration (front `/administration`, flag admin côté front uniquement)
MapMaker (collisions, wraps, PNJ, monstres), création de cartes vierges 24×16, QuestMaker
(quêtes/séquences/dialogues/actions/récompenses), PnjMaker, MonsterMaker, ShopMaker, création
d'équipements. **Aucun contrôle de rôle côté back** (voir §6).

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
- **`shop`** (type equipement|objet|consommable) + `shop_equipement`, `shop_objet`.
- **Quêtes** : `quete` (name, minimalLevel, alignement→, objet→, quete→ auto-référence),
  `sequence` (position, is_last, next/lastSequence→, dialogue→, pnj→, has_action), `dialogue`
  (titre, contenu), `action` (name, api_link, params, quantity, message + FK optionnelles
  objet/equipement/consommable/boss/pnj/monstre/carte, actionType→), `sequence_action`
  (position), `action_type` (référentiel, isRecursive), `action_field`/`action_field_type`
  (méta du form builder QuestMaker), `recompense`.
- **`alignement`** : nom, couleur, icone, caracs principale/secondaire, carte 1–1, lié aux
  guildes et quêtes. **`guilde`** : nom, description, placeMax/nbJoueurMax (doublon), niveau,
  icone, banner, alignement→.

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
| `/api/joueur/buy/shop` | `{item}` (⚠️ lit aussi `idEquipement` dans une branche — bug) |
| `/api/user/recompense/boss` | `{bossId}` → message (⚠️ ne donne pas la récompense) |

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
`joueur_caracteristique_bonus` par ±delta).

### Référentiels & admin (⚠️ non protégés par rôle)
`/api/quests`, `/api/quest`, `/api/quest/infos`, `/api/quest/create`, `/api/quest/update`
(upsert complet), `/api/map/all`, `/api/map/create`, `/api/map/update`, `/api/map/cases/infos`,
`/api/pnj/infos`, `/api/pnj/create`, `/api/monstres`, `/api/monstre/create`, `/api/bosses`,
`/api/consommables`, `/api/objets`, `/api/sequences`, `/api/equipement/create`,
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
      contenu : cartes, classes, sorts, quêtes, PNJ, boss, équipements…). Réimport :
      `docker exec -i mysql mysql -uroot -ppassword chusei < seeds/content-seed.sql`
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

Le besoin : voir les autres joueurs bouger sur la carte sans recharger. Aujourd'hui le front ne
voit les autres joueurs qu'en rechargeant les cases (`/api/map/cases/data`).

**Recommandation : Mercure** — le bundle `symfony/mercure-bundle` est déjà installé et configuré
(`config/packages/mercure.yaml`, variables `MERCURE_*` dans `.env`) ; il ne manque **que le hub**.
C'est la solution la plus simple ici : pas de serveur WebSocket à maintenir (contrairement à
Ratchet, abandonné), le hub est un binaire Caddy prêt à l'emploi, et côté front c'est de
l'`EventSource` natif (pas de lib).

1. **Ajouter le hub au docker-compose** :
   ```yaml
   mercure:
     image: dunglas/mercure
     container_name: mercure-hub
     ports: ["5000:80"]
     environment:
       SERVER_NAME: ':80'
       MERCURE_PUBLISHER_JWT_KEY: '!ChangeThisMercureHubJWTSecretKey!'
       MERCURE_SUBSCRIBER_JWT_KEY: '!ChangeThisMercureHubJWTSecretKey!'
       MERCURE_EXTRA_DIRECTIVES: "cors_origins http://localhost:3000 http://localhost"
   ```
   (et aligner `MERCURE_URL=http://mercure/.well-known/mercure` +
   `MERCURE_PUBLIC_URL=http://localhost:5000/.well-known/mercure` + le secret JWT dans `.env`).
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
  docker exec mysql mysql -uroot -ppassword chusei_test -e "UPDATE carte_carreau SET joueur_id = NULL"
  ```

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
