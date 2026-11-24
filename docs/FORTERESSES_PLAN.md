# Sièges de forteresse — conception (24/11/2026)

> Statut : **CONCEPTION, rien n'est codé.** Ce document propose une conception métier et un
> plan technique ancrés dans le code existant. Les points marqués **[À ARBITRER]** demandent
> une décision de l'auteur avant le lot concerné (récapitulés en §7).

## 0. L'idée en une phrase

Deux fois par semaine, des forteresses habituellement fermées s'ouvrent pendant **1 h 30** :
les trois camps s'y affrontent pour **lever l'étendard du Cœur**, et le camp qui le tient
quand le temps s'achève **possède la forteresse jusqu'au siège suivant**. Au milieu du siège
apparaît un **Gardien** qui lâche à coup sûr un objet légendaire — **une seule fois par siège**.

---

## 1. Ce que le code offre déjà, et ce qui manque

Ce qui sert directement :

| Brique existante | Usage pour le siège |
|---|---|
| `WrapService::canPlayerChangeMap` : un `switch` sur `wrap.map_condition` (`boss`, `level`, `alignement`, `quest`) | La porte de la forteresse = un passage de condition **`forteresse`** (un `case` de plus) |
| `PvpService` (§21.11) : PA décomptés, portée, `summoningSickness`, feu ami payant, anti-farm | Le combat du siège EST le PvP existant, sans règle parallèle |
| 3 alignements en base : **Exilés**, **Cartel de Brumebois**, **Royalistes** ; guildes **mono-alignement** (§21.10) | Unité de combat naturelle : le camp |
| Patron « tick paresseux » (`CraftService`, `DonjonCombatService`) | L'état du siège se déduit de l'horloge serveur, sans dépendre de la minute du scheduler |
| Patron « machine à états unique + verrou pessimiste + état frais renvoyé » (`EchangeService`, `HotelVenteService`, `GuildeService`) | `ForteresseService` |
| Décrément SQL atomique `quantity > 0` de `MonstreRepopService::tuer` | Garantie « le Gardien ne meurt qu'une fois » |
| `JournalService` / `evenement_jeu`, `CumulJoueurService`, `ClassementService` | Traçabilité, faits d'armes, classement des sièges |
| Mercure (`DonjonPublisher`, `EchangePublisher`) + scheduler (boucles 60 s et 5 s) | Annonces, état du siège en direct, déclenchements |

Ce qui **manque ou bloque** (vérifié dans le code) :

1. **Les positions ne sont pas diffusées en temps réel** (§9, étapes 2-3 jamais faites) : « on
   ne voit bouger les autres qu'en rechargeant sa carte ». Pour un événement PvP de masse
   c'est **rédhibitoire** : on ne voit ni l'assaut arriver ni qui canalise le Cœur.
   → **Prérequis, lot 0.**
2. **Un boss de plein air ne peut pas porter un butin « une fois, à 100 % »** :
   `SpellService::doDamageOnBoss` lit `boss.actual_life` (colonne GLOBALE), soustrait, et
   réécrit **sans verrou** — deux coups simultanés produisent deux mises à mort. Et à la mort,
   la vie est **remise au maximum aussitôt** (`updateBossLife(maxLife)`) : le boss « repop »
   instantanément. Enfin, un boss de plein air ne distribue **aucun butin** (le seul butin de
   boss est le coffre `recompense_boss` du donjon). → La vie du Gardien doit vivre dans la
   **session de siège**, avec un décrément atomique.
3. **Mourir renvoie au cimetière le plus proche** (`DeathService::diePlayer`, case 11,10) :
   pendant un siège, il faut réapparaître au **camp de siège** de son alignement, sinon le
   siège se joue à qui habite le plus près.
4. **La perte d'XP à la mort** (`giveExpMalusAfterDeath`) pénaliserait chaque participant
   plusieurs fois par siège : personne ne viendrait. → la neutraliser pour les morts en siège.
5. **Pas d'objet « lié »** : rien n'empêche aujourd'hui d'échanger, vendre ou mettre à l'HDV
   un objet. Nécessaire si l'objet légendaire doit rester à celui qui l'a gagné **[À ARBITRER]**.
6. **Cooldown serveur des sorts absent** (trou général §21.13) : en mêlée de 30 joueurs, ce
   sont les PA qui bornent la cadence. Acceptable, mais à garder en tête pour l'équilibrage.

---

## 2. Conception métier

### 2.1 Le cycle d'un siège

```
 Tenure (jours) ─► Annonce (T−30 min) ─► OUVERTURE T0 ─► Gardien (T+30) ─► Fin T+90
                                                                            │
                                    Prolongation si le Cœur est en cours de levée (≤ +3 min)
                                                                            ▼
                                     RÉSOLUTION : possession figée, récompenses, expulsion
                                                                            ▼
                                                                 Nouvelle tenure
```

| Phase | Ce qui se passe |
|---|---|
| **Tenure** | La porte ne s'ouvre qu'au camp possesseur ; il profite de la forteresse (§2.7) |
| **Annonce** (T−30 min, T−5 min) | Bandeau global + compte à rebours. Les glacis (hors les murs) restent accessibles : on s'y rassemble |
| **Ouverture** (T0) | La porte s'ouvre à tous les camps éligibles. Le camp possesseur part **défenseur** : le Cœur est déjà à lui, il faut le lui arracher |
| **Gardien** (T+30, réglable) | Le Gardien apparaît dans la salle du trône : second point chaud au milieu du siège |
| **Fin** (T+90) | Le camp qui tient le Cœur gagne. **Prolongation** : si une levée du Cœur est en cours à l'échéance, on attend son issue (plafond 3 min) — sinon une levée lancée à T+89 s'interromprait par l'horloge et le défenseur gagnerait sans avoir défendu |
| **Résolution** | Possession figée, guilde intendante désignée, récompenses versées, joueurs des autres camps reconduits à leur camp de siège, porte refermée |

**Calendrier** : deux créneaux par semaine, **en base** (règle du projet : « tout ce qui se
règle vit dans la table », cf. `donjon`), en heure de jeu Europe/Paris — proposition :
**mercredi 21 h** et **samedi 17 h** **[À ARBITRER]**. Le passage à l'heure d'été/hiver est
absorbé parce que les créneaux sont en heure LOCALE (même calcul que
`DonjonInstanceService::fuseauDeJeu`).

### 2.2 Qui possède ? Le camp conquiert, une guilde gouverne

C'est la décision structurante.

| Option | Problème |
|---|---|
| La **guilde** possède | Les guildes sont mono-alignement et le feu ami coûte honneur + karma (§21.13 ter) : deux guildes Royalistes rivales devraient s'entre-tuer **en payant la trahison**. Le siège punirait ceux qui y participent |
| L'**alignement** seul possède | Fonctionne, mais l'effort des guildes ne se voit nulle part, et rien ne donne envie d'organiser |
| **Recommandé : le camp conquiert, la guilde la plus méritante du camp devient intendante** | Le camp est l'unité de COMBAT (cohérent avec le feu ami), la guilde l'unité de GOUVERNANCE (elle porte le blason, reçoit la part d'honneur, gère les avantages). Un joueur sans guilde participe et touche la part du camp |

Conséquences :
- **Un joueur sans alignement ne peut pas entrer.** « Un alignement NULL n'allie personne »
  (`PvpService::sontDuMemeCamp`) : il ne pourrait rien posséder et serait l'ennemi de tous.
- Niveau minimum d'entrée réglable par forteresse (proposition : 20) **[À ARBITRER]**.
- Trois camps = dynamique saine : le camp dominant se fait souvent prendre à deux contre un.

### 2.3 Géographie d'une forteresse

Une forteresse est **du contenu** : quelques cartes du monde ouvert, dessinées au MapMaker.
**Ce n'est PAS une instance** : tout le serveur se bat sur les mêmes cases, l'occupation
`carte_carreau.joueur_id` fonctionne telle quelle (contrairement au donjon).

```
 [Glacis]  ── porte (wrap `forteresse`) ──►  [Cour / remparts]  ──►  [Salle du trône]
 3 camps de siège,                            (lot 6 : étendards        Cœur (étendard)
 un par alignement = point de                  de rempart)              + Gardien
 réapparition pendant le siège
```

- **Glacis** : toujours accessible. Porte trois **camps de siège** (une case de
  réapparition par alignement).
- **Porte** : un `wrap` de condition `forteresse` dont la valeur est l'id de la forteresse.
  Pendant le siège → ouverte aux camps éligibles ; en tenure → ouverte au seul possesseur.
- **Salle du trône** : la case du **Cœur** et la case du **Gardien**.

### 2.4 Prendre le Cœur : la levée d'étendard

Le jeu fonctionne à PA/PM, sans temps réel fin : une capture « par présence » serait
illisible. On retient une **levée canalisée** :

1. Un joueur sur la case du Cœur (ou adjacente) déclenche **« Lever l'étendard »** : coût en PA
   (proposition 20), durée de canalisation (proposition **20 s**, réglable).
2. **La levée est interrompue** si le porteur **subit un coup d'un autre camp**, **bouge** ou
   **meurt**. Une seule levée à la fois sur le Cœur : un second joueur doit d'abord
   interrompre le premier.
3. À terme, le Cœur passe à son camp. Annonce globale (« Les Royalistes ont levé l'étendard
   de Fort-Brume — par Untel »).
4. Le camp qui tient déjà le Cœur ne peut pas le « relever » (pas de levée inutile pour gonfler
   sa contribution).

Pourquoi c'est un bon geste de jeu : il faut **protéger** son porteur pendant 20 s, et la
riposte naturelle est de **le frapper** — tout le PvP du siège converge vers une case.

### 2.5 Le Gardien et l'objet légendaire

- **Apparition** à T+30 min (réglable) sur sa case de la salle du trône. Avant, et hors
  siège, il est absent (non ciblable, non dessiné).
- **Une seule vie par siège** : il ne réapparaît pas. S'il n'est pas tué avant la fin, il
  disparaît **sans rien lâcher** — la rareté est réelle.
- Il frappe en retour comme un boss de plein air (phases par % de vie : `boss_sortilege`
  existant). Tous les camps peuvent le frapper — le combat contre lui est aussi un combat
  contre les autres camps.
- **Butin : 100 % de l'objet légendaire, à celui qui porte le coup fatal**, directement dans le
  sac (via `SacService`, jamais au sol), avec annonce globale **[À ARBITRER]**.
  - *Pourquoi le coup fatal* : c'est la règle existante des boss (`user_boss` va au tueur),
    et dans un événement PvP, **voler le kill fait partie du jeu** — il faut tenir la salle
    pour achever le Gardien en paix.
  - *Alternatives* : au meilleur contributeur en dégâts (favorise les joueurs les plus
    équipés), ou déposé au **trésor de la forteresse** et attribué au camp vainqueur à la
    résolution (lie le Gardien à la victoire, mais retarde la récompense).
- **« Une fois »** — trois lectures possibles **[À ARBITRER]** ; recommandé : **une fois par
  siège**, objet **lié** au personnage (ni échangeable, ni vendable, ni HDV) et **un
  exemplaire maximum par joueur** — un vainqueur qui le possède déjà reçoit à la place une
  compensation (insignes, §2.6). Sans ces deux règles, le meilleur joueur du serveur
  accumulerait les exemplaires, ou les achèterait.
- Entité : un **`Boss`** (icône, phases, puissance existent), **pas un `Monstre`** : un monstre
  est une pile `monstre_carreau` que `app:monstres:repop` **repeuple obligatoirement**, et son
  butin est une table de chances, pas une garantie.

### 2.6 Contribution et récompenses

Tout le monde ne lève pas l'étendard : la contribution mesure le reste, pour que le soigneur
et le défenseur de porte soient payés aussi.

**Contribution par joueur et par siège** : dégâts infligés aux autres camps, mises à mort
(anti-farm existant appliqué), soins portés à son camp, levées réussies et interrompues,
dégâts au Gardien. Score pondéré, curseurs dans `ForteresseConfig`.

| Récompense | Qui | Pourquoi |
|---|---|---|
| **Insignes de siège** (nouvelle monnaie/objet) | Tout participant au-dessus d'un seuil ; barème plus haut pour le camp vainqueur | Les perdants doivent gagner quelque chose, sinon le camp faible ne revient jamais |
| **Honneur** | Camp vainqueur, au prorata de la contribution | L'honneur mesure la conduite au combat : c'est sa place |
| **Intendance** | La guilde du camp vainqueur dont les membres totalisent la plus forte contribution | Donne une raison de s'organiser en guilde |
| **Objet légendaire** | Le tueur du Gardien | §2.5 |
| **Faits d'armes** | Cumuls `SIEGES_GAGNES`, `ETENDARDS_LEVES` + classement | Visibilité durable |

⚠️ **Ne jamais financer la tenure par une taxe sur les frais de l'hôtel des ventes** : ces frais
sont le **puits monétaire** du jeu (§20, §21.9). Les reverser au possesseur transformerait une
destruction en transfert et ferait monter l'inflation. Un revenu de tenure se paie en
**ressources ou insignes créés**, pas en or prélevé.

### 2.7 Ce que rapporte la possession pendant la tenure

Proposition, par ordre de coût :
1. **Accès exclusif** à la forteresse : la porte ne s'ouvre qu'au camp possesseur.
2. **Contenu réservé** à l'intérieur : cases de récolte rares (cases interactives existantes,
   §14), marchand d'insignes, établi — tout ça est du contenu, zéro code.
3. **Blason et nom de la guilde intendante** sur la porte, l'atlas et le classement.
4. **Coffre de tenure** hebdomadaire pour la guilde intendante (ressources) — lot 6.

Ne pas donner de bonus de puissance (XP, dégâts) au camp possesseur : sinon le gagnant gagne
plus facilement le siège suivant, et le serveur se fige.

### 2.8 Mourir pendant le siège

- Réapparition au **camp de siège de son alignement** (glacis), pas au cimetière.
- `summoningSickness` existant (30 s) inchangé : protège du « spawn kill » au camp.
- **Pas de malus d'XP** pour une mort en siège (cause de mort marquée).
- L'honneur et l'anti-farm PvP s'appliquent normalement.

### 2.9 Communication au joueur

- **Annonces globales** : T−30, T−5, ouverture, apparition du Gardien, chaque levée d'étendard,
  mise à mort du Gardien (+ objet), T−5 de la fin, résultat.
- **Bandeau de siège** (forteresse sur laquelle on se trouve, ou en cours) : compte à rebours
  calculé depuis `fermeAt` serveur (jamais décompté localement — règle du projet), camp qui
  tient le Cœur, levée en cours (qui, temps restant), vie du Gardien en %.
- **Journal du joueur** : les nouveaux types (§3.5) y apparaissent automatiquement.

---

## 3. Conception technique

### 3.1 Modèle de données

**Contenu** (dans `seeds/content-seed.sql`) :

| Table | Colonnes principales |
|---|---|
| `forteresse` | `id`, `nom`, `description`, `niveau_min`, `duree_minutes` (90), `prolongation_max_secondes` (180), `annonce_minutes` (30), `levee_secondes` (20), `levee_pa`, `coeur_carte_carreau_id`, `gardien_boss_id`, `gardien_apparition_minutes` (30), `tresor_type` + `tresor_id` (l'objet légendaire, `TypeItem`) |
| `forteresse_creneau` | `forteresse_id`, `jour_semaine` (1-7), `heure`, `minute` — deux lignes par forteresse |
| `forteresse_camp` | `forteresse_id`, `alignement_id`, `carte_carreau_id` (case de réapparition) — UNIQUE `(forteresse_id, alignement_id)` |
| `forteresse_carte` | `forteresse_id`, `carte_id` — les cartes « intra-muros » (expulsion, réapparition, contribution) |
| `wrap` | existant : `map_condition = 'forteresse'`, `value = forteresse.id` |

**Runtime** (liste noire de `scripts/content-dump.sh`) :

| Table | Rôle |
|---|---|
| `forteresse_possession` | UNE ligne par forteresse : `alignement_id`, `guilde_id` (intendante, nullable), `depuis`, `session_id` |
| `forteresse_session` | Un siège : `forteresse_id`, `ouvre_at`, `ferme_at`, `resolue_at` (null tant que non résolue), `coeur_alignement_id`, `coeur_user_id`, `coeur_leve_at`, `levee_user_id`, `levee_alignement_id`, `levee_debut_at`, `levee_fin_at`, `levee_carte_carreau_id`, `gardien_vie`, `gardien_vaincu_at`, `gardien_tueur_id`, `annonces_faites` (JSON). UNIQUE `(forteresse_id, ouvre_at)` |
| `forteresse_contribution` | `session_id`, `user_id`, `alignement_id`, `guilde_id` (figée au premier apport), les compteurs, `score`. UNIQUE `(session_id, user_id)` → upsert natif |

> ⚠️ **La possession n'est JAMAIS une colonne de `forteresse`.** C'est exactement le piège de
> `carte_carreau.joueur_id` et `monstre_carreau.quantity` (contenu portant du runtime) : le
> dump pousserait la possession de la machine de dev dans git, et `content-load.sh`
> rendrait la forteresse à un camp sur une autre machine. Table à part, dans `EXCLUDE`.

> **« Ouverte » n'est pas un statut** (patron `CraftService` : « prête » n'en est pas un) :
> une session est ouverte si `ouvre_at ≤ maintenant < ferme_at` (+ prolongation), et résolue
> si `resolue_at` est renseignée. Aucun statut à tenir à jour, donc aucun statut qui ment.

> ⚠️ Mots réservés MySQL : ne nommer aucune colonne `condition`, `or`, `rank` (pièges
> rencontrés : `donjon_salle.condition`, `montant_or`).

### 3.2 Services

| Pièce | Rôle | Patron suivi |
|---|---|---|
| `ForteresseCalendrier` | Calcul PUR : créneau courant/prochain, `ouvreAt`/`fermeAt` en heure locale. Testé à plat | `MondeLayout`, `EffetService::motifDeRefus` |
| `ForteresseService` | **UNIQUE machine à états** de `forteresse_session` et `forteresse_possession`. Ouvre ses transactions, verrou pessimiste sur la session. `sessionCourante()` (création PARESSEUSE par `INSERT IGNORE` sur l'index UNIQUE : deux requêtes simultanées ne créent pas deux sièges), `etat()`, `leverEtendard()`, `interrompreLevee()`, `resoudre()` (idempotent), `peutFranchir()`. Chaque transition renvoie l'état FRAIS complet | `EchangeService`, `GuildeService` |
| `ForteresseGardienService` | Vie du Gardien en session. Réutilisé par `/joueur/attack/boss` quand le boss est un gardien | `DonjonInstanceService::vieBoss` |
| `ContributionSiegeService` | UNIQUE point de mutation de `forteresse_contribution`, upsert SQL natif, ne flushe pas | `CompteurJoueurService` |
| `ForteressePublisher` | Publications Mercure APRÈS commit : topic `forteresse/{id}` + topic `annonces` | `DonjonPublisher` |
| `app:forteresses:cycle` | Boucle minute du scheduler : annonces (idempotentes via `annonces_faites`), création des sessions, **résolution même sans joueur connecté** | `app:hdv:expirer` |

**La résolution est paresseuse ET planifiée** : toute lecture d'état après `ferme_at` résout
(précision à la requête près, alors que le scheduler est à la minute) ; la commande garantit
qu'elle a lieu même si personne ne joue. `resoudre()` est idempotent sous verrou
(`resolue_at IS NULL`), donc les deux chemins ne peuvent pas résoudre deux fois.

### 3.3 La garantie « le Gardien ne meurt qu'une fois »

Deux requêtes SQL, sur la connexion de l'appelant, dans sa transaction :

```sql
-- 1. Le coup : décrément atomique, refusé si déjà mort
UPDATE forteresse_session
   SET gardien_vie = GREATEST(gardien_vie - :degats, 0)
 WHERE id = :session AND gardien_vie > 0;          -- 0 ligne → « le Gardien est déjà tombé »

-- 2. La mise à mort : SEUL le coup qui fait passer à 0 la réclame
UPDATE forteresse_session
   SET gardien_vaincu_at = NOW(), gardien_tueur_id = :user
 WHERE id = :session AND gardien_vie = 0 AND gardien_vaincu_at IS NULL;
                                                   -- 1 ligne → ce coup distribue le trésor
```

Seul le coup pour lequel la seconde requête affecte **une** ligne appelle `SacService` et
journalise : deux coups simultanés ne peuvent pas produire deux objets. Même raisonnement que
`MonstreRepopService::tuer` (« un monstre ne meurt qu'une fois »).

⚠️ **Contrat de réponse des attaques (§21.13 bis)** : la branche gardien de
`/joueur/attack/boss` doit renvoyer EXACTEMENT les clés de l'endpoint
(`damage, experience, newExperience, level, lifeJoueur, damageReturns, droppedItems,
killMessage, message, pa, needRefresh`) — `droppedItems` porte l'objet légendaire. Une clé
manquante casse l'écran jusqu'au F5. Ajouter un test de FORME, pas seulement d'effet en base.
Un gardien absent (hors siège, avant apparition, déjà tombé) répond 400 `{"message"}`.

### 3.4 La levée d'étendard : où brancher les interruptions

| Interruption | Où | Comment |
|---|---|---|
| Le porteur **subit un coup** d'un autre camp | `PvpService::attaquer` (seul endroit où un joueur blesse un joueur) | Appel à `ForteresseService::interrompreLevee($cible)` dans la transaction du coup |
| Le porteur **bouge** | Vérifié PARESSEUSEMENT à l'achèvement | La levée mémorise la case de départ ; si `user` n'y est plus → échec |
| Le porteur **meurt** | Vérifié PARESSEUSEMENT | `summoningSickness` postérieure à `levee_debut_at`, ou position changée → échec |

Une seule accroche dans un service existant (PvP) au lieu de trois : déplacement et mort se
déduisent à l'achèvement. L'achèvement lui-même est paresseux (à la première lecture d'état
après `levee_fin_at`) et sondé côté client pendant une levée, comme le donjon (§13.9 : « ce
sondage n'est pas cosmétique »).

### 3.5 Branchements dans l'existant

- **`WrapService`** : `case 'forteresse' → ForteresseService::peutFranchir($user, $forteresseId)`.
  Message de refus explicite (« La porte de Fort-Brume est close jusqu'au siège de samedi
  17 h »), toasté — un refus muet se lit comme un bug (CLAUDE.md).
- **`DeathService::diePlayer`** : si la carte de la mort est intra-muros d'une forteresse
  dont la session est ouverte → réapparition à la case du camp de son alignement, cause de mort
  marquée `siege`, pas de malus d'XP. ⚠️ `diePlayer` écrit en DQL puis `refresh()` : le
  changement de destination se fait AVANT les écritures DQL, jamais par un flush ultérieur.
- **`PvpService`** : interruption de levée + contribution (dégâts, mise à mort) quand les deux
  joueurs sont intra-muros pendant une session ouverte.
- **Expulsion à la résolution** : les joueurs d'un autre camp présents intra-muros sont
  reconduits à leur camp (patron `DonjonTeleportService` : DQL + `carte_carreau`).
- **Journal** (`TypeEvenement`, « UN type = UN FAIT ») : `ETENDARD_LEVE` (acteur = porteur),
  `FORTERESSE_RESOLUE` (sans acteur ; contexte : camp vainqueur, guilde intendante, ancien
  possesseur, conquise/conservée). La mort du Gardien est un `BOSS_VAINCU` avec
  `contexte.forteresseSessionId` et l'objet **figé** dans `contexte.items` (`figerItems()`).
  `fluxMonetaire()` : `null` pour les trois.
- **Cumuls / classements** : `TypeCumul::ETENDARDS_LEVES`, `SIEGES_GAGNES` ; une catégorie de
  classement si l'on veut un podium (§21.8 : tous les cumuls n'en méritent pas un).
- **Mercure** : `POST /api/mercure/token` ajoute les topics `annonces` et
  `forteresse/{id}` (ids EXPLICITES, jamais de joker — règle du projet). Sondage REST de
  repli de `/api/forteresse/etat` (10 s en siège) : « temps réel : jamais sans filet ».

### 3.6 API

| Endpoint | Rôle |
|---|---|
| `POST /api/forteresse/liste` | Forteresses, possesseur, prochain siège (pour l'atlas et un écran « Sièges ») |
| `POST /api/forteresse/etat` `{forteresseId}` | État frais complet (résout / achève la levée paresseusement) |
| `POST /api/forteresse/lever` `{forteresseId}` | Lancer la levée ; 400 `{"message"}` en cas de refus |
| `/joueur/attack/boss` | Existant ; branche gardien (§3.3) |
| `/api/admin/forteresse/*` | ForteresseMaker (lot 6) — en attendant, contenu saisi par SQL puis `content-dump.sh` |

DTO : les champs énumérés sont des **chaînes** résolues par `tryFrom()` (un champ typé enum
répond 500 au lieu de 422 — piège §21.8).

### 3.7 Front

- **Web** : `ForteresseHost` rendu UNE fois dans `MapPage` (patron `DonjonHost` /
  `EchangeHost`) : abonnement, sondage de repli, bandeau. Surlignage de la case du Cœur
  (`.case` reste `position: relative` !). Barre de levée recalculée depuis `leveeFinAt`
  serveur. Le Gardien est un boss ciblable ordinaire (HUD boss existant). Écran « Sièges »
  dans le `SideMenu` (modale `GameModal` + `ModalShell`, largeur en `max-width`, jamais en `vw`).
- **Mobile** : port fidèle (mêmes payloads), bandeau en haut, toasts des refus.
- **Admin** : possession visible dans l'atlas (§24) ; ForteresseMaker au lot 6.

---

## 4. Découpage en lots

| Lot | Contenu | Vérifiable par |
|---|---|---|
| **0 — Prérequis** | Positions en temps réel (§9 étapes 2-3) sur topic `carte/{id}`, web + mobile ; topic `annonces` | Deux navigateurs : on voit l'autre bouger sans F5 |
| **1 — Socle** | Tables + migrations (dev ET `chusei_test`), liste noire du dump, `ForteresseCalendrier`, `ForteresseService` (session paresseuse, porte, résolution, expulsion), commande, journal | Tests fonctionnels API, sans front |
| **2 — Le Cœur** | Levée canalisée, interruptions, prolongation, annonces | Test « deux camps, une levée interrompue, une réussie, fin pendant une levée » |
| **3 — Le Gardien** | Vie de session, décrément atomique, butin unique, contrat de réponse | Test de concurrence (deux coups fatals → un seul objet) + test de forme |
| **4 — Siège vivant** | Réapparition au camp, pas de malus d'XP, contribution, récompenses, guilde intendante, cumuls | Siège complet simulé à 3 joueurs |
| **5 — Front** | Web puis mobile : bandeau, levée, écran « Sièges », atlas | Siège joué de bout en bout au navigateur |
| **6 — Améliorations** | §5, au choix | — |

Contenu à produire en parallèle (MapMaker) : glacis + cour + salle du trône, trois cases de
camp, la porte, le Gardien (`boss` + `boss_sortilege`), l'objet légendaire. Terminer par
`./scripts/content-dump.sh`.

---

## 5. Améliorations proposées (au-delà de la demande)

1. **Étendards de rempart** : 2-3 étendards secondaires dans la cour, plus rapides à lever ;
   il faut en tenir au moins un pour lever le Cœur. Oblige à répartir ses forces et empêche
   un commando de contourner toute la défense.
2. **Porte destructible** : la porte a des points de structure, le défenseur la répare (coût
   en ressources d'artisanat → débouché pour les métiers). La « fermeture » devient du jeu.
3. **Bannière du Gardien** : le camp qui tue le Gardien lève le Cœur deux fois plus vite
   pendant 10 min. Relie le Gardien à la victoire sans en faire une obligation.
4. **Ferveur de l'outsider** : un camp en infériorité numérique intra-muros (mesurée par la
   présence, `derniere_activite`) gagne plus d'insignes, voire une levée plus courte. À trois
   camps, c'est ce qui évite qu'un camp écrase durablement le serveur.
5. **Plusieurs forteresses** aux créneaux simultanés : il faut CHOISIR où envoyer ses forces.
6. **Coffre de tenure** hebdomadaire pour la guilde intendante (ressources créées, jamais
   d'or prélevé sur l'HDV — §2.6).
7. **Chronique des sièges** : page publique (vainqueurs, tueurs de gardien, levées), lue
   depuis le journal.

---

## 6. Risques

| Risque | Parade |
|---|---|
| Un camp domine et décourage les autres | Pas de bonus de puissance au possesseur (§2.7), récompenses aux perdants (§2.6), ferveur de l'outsider (§5.4) |
| Population trop faible au créneau | Créneaux en soirée/week-end, annonce anticipée ; la possession « par défaut » reste au défenseur, donc un siège désert ne vole rien à personne |
| Double mise à mort du Gardien | Décrément atomique (§3.3) + test de concurrence |
| La possession fuit dans le seed | Table runtime à part, dans `EXCLUDE` (§3.1) |
| Charge : 30+ joueurs sur une carte | Le lot 0 diffuse des deltas de position (pas des cartes entières) ; mesurer `/map/cases/data` sous charge avant le premier siège |
| Multi-comptes pour lever / gonfler la contribution | Anti-farm PvP existant ; journal pour enquêter ; levée impossible pour le camp qui tient déjà le Cœur |

---

## 7. Décisions à arbitrer avant de coder

| # | Question | Recommandation |
|---|---|---|
| 1 | Qui possède : camp, guilde, ou camp + guilde intendante ? | **Camp + guilde intendante** (§2.2) |
| 2 | À qui va l'objet du Gardien ? | **Coup fatal** (§2.5) |
| 3 | « Une fois » = par siège, par joueur à vie, ou exemplaire unique au monde ? | **Par siège** + un exemplaire max par joueur |
| 4 | Objet lié ou échangeable / vendable à l'HDV ? | **Lié** (demande une colonne d'item contrôlée par échange, HDV et vente) |
| 5 | Créneaux | Mercredi 21 h et samedi 17 h, Europe/Paris |
| 6 | Combien de forteresses au lancement ? | **Une**, puis d'autres à créneaux simultanés |
| 7 | Malus d'XP à la mort pendant le siège | **Supprimé** |
| 8 | Hors siège : forteresse ouverte au possesseur ou fermée à tous ? | **Ouverte au possesseur** — c'est la récompense durable |
| 9 | Niveau minimum d'entrée | 20 (réglable par forteresse) |
| 10 | Durée de levée / coût en PA | 20 s / 20 PA, à rejouer en test |
