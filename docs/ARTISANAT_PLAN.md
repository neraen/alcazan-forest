# Artisanat — plan d'exécution (26/07/2026)

Plan de mise en œuvre de l'artisanat (métiers de récolte et de craft, karma, recettes,
écran d'administration). Il part du document de game design fourni par l'utilisateur et le
**corrige** là où il entre en conflit avec le code existant : le socle `Interaction` /
`Metier` livré le 25/07/2026 (doc §14) fait déjà la moitié du chemin, et plusieurs points du
document sont soit gratuits, soit impossibles tels quels.

Ordre de lecture obligatoire avant de coder : `CLAUDE.md`, `DOCUMENTATION.md` §14
(cases interactives et métiers), §13.7 (tick paresseux), §12 (SacService et réservations).

---

## 0. Ce qui est acquis et ce qui manque

**Acquis (ne rien réécrire) :**

| Besoin de l'artisanat | Déjà là |
|---|---|
| Poser une ressource sur une case | `Interaction` type `RECOLTER` + `carte_carreau.interaction_id` |
| Exiger un métier et un niveau pour récolter | `interaction.metier_id` / `niveau_metier_min` |
| Donner de l'XP de métier | `interaction.experience_metier` → `MetierService` |
| Réapparition de la ressource | `interaction.cooldown_secondes` + `PorteeRecharge` + `interaction_recharge` |
| Distribuer un butin | `RecompenseService` (**unique** point de conversion) |
| Mutation du sac et de l'or | `SacService` (**unique** point de mutation, réservations comprises) |
| Progression de métier | `MetierService` (**unique** point de mutation) |
| Éditer tout ça | InteractionMaker + outil « Poser une interaction » du MapMaker |

**Manque :** familles de métiers et plafonds, apprentissage explicite, karma, choix
éthique/intensif, épuisement partagé d'un gisement, recettes, fabrication différée, écran
d'administration de l'artisanat, butin conditionné par un métier (dépeceur).

---

## 1. Critique du document de design

### 1.1 Ce qui est gratuit (aucun code)

- **« Une nouvelle ressource tous les 20 niveaux »** n'est pas une mécanique, c'est du
  contenu : `interaction.niveau_metier_min` = 1, 20, 40… Rien à développer, tout à écrire
  dans l'InteractionMaker.
- **« Niveau 1 à 200 »** : `metier.niveau_max` existe déjà (défaut 100). On passe la donnée
  à 200 en base. La courbe `MetierService::experiencePourNiveau` (`100 × (n−1)^1.5`) tient
  jusque-là (≈ 280 000 XP au palier 200) et reste le placeholder assumé qu'elle est.
- **« Le niveau du métier doit être ≥ au niveau de l'objet »** : c'est
  `recette.niveau_requis`, un simple garde-fou serveur.

### 1.2 Ce qui est faux ou impossible tel quel

**a) « Maximum 2 métiers de récolte / 3 de craft » casse le contrat actuel de
`MetierService`.**
Aujourd'hui, « pas de ligne `joueur_metier` = niveau 0 » et la ligne se crée **toute seule**
au premier gain d'XP. On ne peut pas plafonner ce qui s'auto-crée. Il faut :
- une `famille` sur `Metier` (récolte / craft), sans quoi le plafond n'est pas calculable ;
- un **acte d'apprentissage explicite** — donc l'invariant devient « pas de ligne = métier
  non appris », et `gagnerExperience` **refuse** de créer la ligne ;
- un **oubli**, sinon une erreur de choix enferme définitivement le joueur.
C'est le changement le plus structurant du chantier : il modifie une règle documentée dans
`CLAUDE.md` et `DOCUMENTATION.md` §14.3, qui devront être mises à jour.

**b) « La récolte non éthique a un impact négatif sur les autres joueurs » est
mécaniquement impossible en l'état.**
La portée `JOUEUR` donne à chacun son propre cooldown : par construction, ce que fait A ne
peut pas atteindre B. Il faut un **second état, partagé, sur la même case** — l'épuisement du
gisement — lu *en plus* du cooldown personnel. On le porte dans `interaction_recharge` avec
une clé dédiée `monde:epuisement`, plutôt que dans une table neuve : le verrou pessimiste,
l'unicité `(carte_carreau, cle)` et l'exclusion du seed sont déjà en place.
> La clé est volontairement `monde:epuisement` et non `monde` : une interaction de portée
> `MONDE` (coffre) utilise déjà `monde`, les deux ne doivent jamais se marcher dessus.

**c) « La différence de rendement doit être importante » produit un équilibre dégénéré.**
Si l'intensif donne ×3 de ressources pour ×2,5 de temps de réapparition, les deux modes ont
le **même débit horaire** et le choix n'est plus qu'un bouton de karma. Pour que le dilemme
existe, l'intensif doit être réellement plus rentable à l'heure (proposition : ×3 quantité
pour ×2 cooldown, soit +50 % de débit), et le karma doit alors coûter quelque chose.
> ⚠️ **Trou assumé au lot 1** : l'utilisateur a arbitré que le karma serait pour l'instant
> *stocké et affiché, sans effet*. Conséquence à connaître : tant que le lot 6 n'est pas
> fait, **le jeu optimal est de toujours récolter en intensif**, et le dilemme est purement
> cosmétique. Le socle est posé pour que le lot 6 ne coûte presque rien.

**d) Le temps de production ne doit pas passer par le scheduler.**
`alcazan-scheduler` tourne à la minute — trop grossier, et il ferait tourner du travail pour
des joueurs déconnectés. On applique la règle déjà établie pour le tick de donjon et les
cooldowns d'interaction : **résolution paresseuse**. La commande porte un `pret_at` ; rien ne
s'exécute tant que le joueur ne revient pas la retirer.

**e) Le pourcentage de recyclage doit être figé au lancement.**
Sinon, éditer une recette pendant qu'une commande cuit change rétroactivement ce qui est
rendu. On stocke un **instantané JSON des ingrédients consommés** sur la commande, et le
recyclage rend depuis cet instantané — jamais depuis la recette.

**f) Pas de nouvelle entité « Ressource ».**
Une ressource, c'est un `Objet` porteur d'un métier et d'un niveau : deux colonnes nullables.
Une entité parallèle obligerait à réoutiller inventaire, échange, boutique, butin et
récompense — pour rien.

**g) L'XP de craft ne doit pas être une formule en dur.**
« Selon le niveau de l'objet et la difficulté de la recette » enferme l'équilibrage dans le
code. On garde un champ `experience_metier` **saisi par recette** (comme pour les
interactions), l'écran d'admin pré-remplissant une suggestion calculée. Même principe pour la
récolte.

### 1.3 Ce qui est trop cher pour maintenant

**Les bonus passifs aux paliers 10/30/50/70 puis tous les 20 niveaux** sont la partie la plus
risquée : il faut brancher des modificateurs dans le rendement de récolte, les prix, les
temps de craft, les taux de butin — c'est-à-dire toucher `SacService`, `VenteService`,
`RecompenseService` et `CraftService` en même temps. Le document lui-même range les arbres
passifs en « évolutions futures ». **Reporté au lot 6**, avec le même patron whitelisté que
`QuestEffect` (enum `BonusMetier` + registre), jamais du code libre en base.

---

## 2. Décisions arbitrées avec l'utilisateur (26/07/2026)

| Question | Décision | Conséquence |
|---|---|---|
| Où crafte-t-on ? | **Modale Atelier, accessible partout** | Aucun contenu de carte requis ; une contrainte de poste de travail reste ajoutable plus tard comme simple condition |
| Que fait le karma ? | **Stocké et affiché, aucun effet** | Le dilemme éthique n'est pas arbitré en jeu (cf. §1.2c) ; lot 6 |
| Apprentissage d'un métier | **PNJ maître de métier** | Nouveau `Pnj.type = 'metier'` + vue dédiée, patron `guildeView` |

---

## 3. Découpage en lots

Chaque lot est livrable et testable seul. Après **tout** lot touchant au contenu :
`docker exec symfony-backend php bin/console doctrine:migrations:diff` puis `migrate`,
`doctrine:schema:validate` vert, `php vendor/bin/phpunit` vert, puis
`./scripts/content-dump.sh` (avec `--push` si l'utilisateur veut synchroniser).

---

### Lot 0 — Socle métiers : familles, plafonds, apprentissage

**Pourquoi d'abord** : les lots 2 et 3 supposent tous les deux « le joueur a appris ce
métier ». Rien ne peut passer devant.

**Backend**
- Enum `App\Enum\FamilleMetier` : `RECOLTE` / `CRAFT` (+ `label()`, valeurs stockées en base
  — ne jamais les renommer).
- `Metier` : `+ famille` (enum, non nullable), `niveauMax` passé à 200 côté **données**.
- `JoueurMetier` : `+ apprisAt` (`datetime_immutable`). **La ligne signifie désormais
  « appris »**, plus « a déjà pratiqué ».
- `Config\ArtisanatConfig` : plafonds (`2` récolte, `3` craft), en un seul endroit.
- `MetierService` — reste l'unique point de mutation, ne flushe toujours pas :
  - `apprendre(User, Metier)` : refuse si déjà appris, ou si le plafond de la famille est
    atteint (message joueur explicite nommant les métiers déjà appris) ;
  - `oublier(User, Metier)` : supprime la ligne, **progression perdue** (confirmation côté
    front) ;
  - `estAppris()`, `metiersDe(User)` groupés par famille, `placesRestantes(User)` ;
  - `gagnerExperience()` : **ne crée plus la ligne** — lève `MetierException` si le métier
    n'est pas appris. C'est le garde-fou qui rend le plafond réel.
- Contenu `pnj_metier` (N-N) : quels métiers un maître enseigne.
- `PnjInteractionService` : `case 'metier'` → `view: 'metier'`, payload = dialogue de la
  séquence sans quête (comme `guilde`) + métiers enseignés + état du joueur (appris ou non,
  places restantes). Patron exact de `buildGuildePayload`.
- `MetierController` : `POST /api/metier/apprendre`, `POST /api/metier/oublier`
  (DTO + `#[MapRequestPayload]`). `POST /api/joueur/metiers` existe déjà.

**Frontend**
- `components/pnj/metierView/MetierView.jsx` + `.module.scss` (patron `guildeView`), branché
  dans `PnjInteractionHost` — **jamais** de modale par tuile.
- Onglet « Métiers » dans la modale Profil : liste, barre d'XP, places restantes.
  Kit UI existant (`Panel`, `GaugeBar`, `SectionTitle`) et tokens — aucun hex en dur.

**Tests**
- `MetierServiceTest` (existant, à étendre) : gain d'XP refusé sans apprentissage, plafond
  par famille, oubli, montée multi-niveaux jusqu'à 200, `niveauMax`.
- `MetierApiFunctionalTest` (nouveau) : apprendre / plafond atteint / oublier / vue du PNJ
  maître / un non-authentifié est refusé.

**Migration de données** : les `joueur_metier` existants sont considérés appris
(`apprisAt` = maintenant). À noter dans la migration.

**Docs** : `CLAUDE.md` et `DOCUMENTATION.md` §14.3 — l'invariant « pas de ligne = niveau 0 »
devient « pas de ligne = métier non appris ».

---

### Lot 1 — Ressources et karma (données seulement)

**Backend**
- `Objet` : `+ metier` (ManyToOne nullable), `+ niveauRessource` (int, défaut 0). Une
  ressource = un `Objet` marqué. Rien d'autre ne change dans l'inventaire ou l'échange.
- `User` : `+ karma` (int, défaut 0).
- `KarmaService` : **unique point de mutation du karma** — même contrat que `SacService`
  (ne flushe pas, l'appelant fournit la transaction). Bornes ±1000 dans `ArtisanatConfig`,
  `palier()` renvoyant un libellé (« Gardien », « Neutre », « Pilleur »…).
- Karma exposé sur la fiche de personnage (`ProfilControlleur`).

**Frontend** : karma affiché dans la modale Profil (valeur + libellé de palier).

**Tests** : `KarmaServiceTest` (bornes hautes et basses, paliers, pas de flush interne).

> Aucun effet de jeu à ce lot — décision assumée §2. Le service existe pour que les lots 2 et
> 3 aient un point de mutation unique dès le premier jour, et que le lot 6 se branche dessus
> sans refactor.

---

### Lot 2 — Récolte éthique vs intensive

**Backend**
- `Interaction` : `+ recolteChoix` (bool, défaut `false`) — cette case propose-t-elle le
  choix ? Les cases existantes gardent leur comportement actuel.
- `Config\RecolteConfig` : multiplicateurs des deux modes (quantité, cooldown personnel,
  épuisement partagé, karma). Proposition de départ, à équilibrer en jeu :

  | | Quantité | Cooldown perso | Épuisement partagé | Karma |
  |---|---|---|---|---|
  | Éthique | ×1 | ×0,5 | aucun | +1 |
  | Intensive | ×3 | ×2 | verrou monde = 3 × cooldown | −2 |

- `CaseDTO` : `+ mode` (`ethique` \| `intensive` \| absent). **Absent = comportement
  actuel**, pour la non-régression des cases déjà posées.
- `InteractionService::executer()` :
  - refuse un `mode` sur une case qui n'est pas `recolteChoix` (le client ne décide de rien) ;
  - lit, **en plus** du cooldown personnel, la recharge `monde:epuisement` de la case et
    refuse si le gisement est épuisé (message joueur : « le filon a été saigné, il faut le
    laisser se refaire ») ;
  - applique les multiplicateurs, pose les deux recharges, crédite le karma via
    `KarmaService`.
  - `decrire()` / `decrireCases()` renvoient l'état d'épuisement partagé (informatif).
- `RecompenseService::distribuer()` : `+ int $multiplicateur = 1`. Modification contenue —
  il reste **l'unique** point de conversion, on ne distribue toujours rien ailleurs.

**Frontend**
- Clic sur une case `recolteChoix` → petit choix à deux boutons (patron `GameButton`) avant
  l'appel, avec le rendement et le coût annoncés. **Piège connu** : tout enfant en
  `position:absolute; inset:0` doit s'ancrer dans un `.case` resté `position: relative`
  (`mapGrid.scss`), sinon il déborde sur la grille et mange les clics de déplacement.
- Repère d'épuisement partagé distinct du cooldown personnel (deux causes, deux visuels).

**Tests** (`InteractionApiFunctionalTest`, étendu)
- rendement et cooldown différents selon le mode ;
- karma crédité/débité ;
- **un intensif de A épuise le gisement pour B** (le cœur du lot) ;
- mode absent ⇒ comportement d'avant, à l'identique ;
- mode envoyé sur une case sans `recolteChoix` ⇒ refus.

---

### Lot 3 — Recettes, atelier et fabrication paresseuse

**Contenu (versionné, capturé par le seed)**
- `recette` : nom, `metier`, `niveauRequis`, `difficulte`, `tempsSecondes`,
  `recompense_id` (= la sortie, distribuée par `RecompenseService`), `experienceMetier`,
  `actif`.
  > La sortie est une `Recompense` **par choix** : c'est l'unique point de conversion du
  > projet, s'en écarter dupliquerait la distribution d'items.
- `recette_ingredient` : `recette` + (`objet` \| `equipement` \| `consommable`, nullables,
  même forme que `Recompense`) + `quantite`.

**Runtime (à ajouter à l'`EXCLUDE` de `scripts/content-dump.sh` — impératif)**
- `craft_commande` : `user`, `recette`, `mode` (`RECYCLAGE` \| `RAPIDE`), `lanceeAt`,
  `pretAt`, `retireeAt`, `ingredients` (JSON — **instantané** des ingrédients consommés),
  `statut`.

**Backend**
- `CraftService` : **UNIQUE machine à états de la fabrication**. Personne d'autre n'écrit
  dans `craft_commande`.
  - `lancer()` : métier appris + niveau suffisant, ingrédients **disponibles** (possédé −
    réservé, via `SacService::quantiteDisponible` — une ressource réservée dans un échange en
    cours n'est pas craftable), débit via `SacService` dans une transaction unique, calcul de
    `pretAt` selon le mode, écriture de l'instantané. Nombre de commandes simultanées plafonné
    par `ArtisanatConfig`.
  - `commandes()` : **résolution paresseuse** — l'état se déduit de `pretAt` face à l'horloge
    serveur, aucun job, aucun scheduler.
  - `retirer()` : refuse avant `pretAt` et après `retireeAt` (idempotence stricte : deux
    retraits ne dupliquent pas la sortie), distribue via `RecompenseService`, rend le
    pourcentage de recyclage **depuis l'instantané** via `SacService`, crédite l'XP via
    `MetierService` et le karma via `KarmaService`.
  - `annuler()` : avant `pretAt`, rend les ingrédients à l'identique ; après, refusé (la
    fabrication est faite, il faut la retirer).
  - Modes : `RECYCLAGE` = temps normal + X % rendus + karma positif ;
    `RAPIDE` = temps × 0,25, rien rendu, karma négatif (valeurs dans `ArtisanatConfig`).
- `CraftController` : `POST /api/craft/{recettes,lancer,commandes,retirer,annuler}`.

**Frontend**
- Modale **Atelier** : `ui/gameModal/GameModal` + `ModalShell` **obligatoirement** (jamais
  d'overlay ad hoc), un onglet par métier de craft appris, liste des recettes avec
  ingrédients manquants surlignés, choix du mode, file des commandes en cours.
- **Compte à rebours recalculé depuis `pretAt`** (date serveur) à chaque seconde, jamais
  décompté localement — même règle que les zones de donjon et les cooldowns d'interaction.

**Tests**
- `CraftServiceTest` : ingrédients manquants, ingrédients réservés par un échange, niveau
  insuffisant, métier non appris, plafond de commandes, calcul de `pretAt` par mode.
- `CraftApiFunctionalTest` : cycle complet, retrait avant terme refusé, **double retrait
  refusé**, recyclage rendant l'instantané et **non** la recette modifiée entre-temps,
  annulation avant/après `pretAt`.

---

### Lot 4 — ArtisanatMaker (l'écran d'administration demandé)

Un seul écran, `/administration/artisanat`, trois onglets.

- **Métiers** : fiche (nom, description, icône, famille, `niveauMax`) + PNJ maîtres qui
  l'enseignent.
- **Ressources** : les `Objet` marqués d'un métier et d'un niveau. C'est le **premier
  éditeur d'`Objet` du projet** — aujourd'hui la création d'objets passe encore par du SQL.
- **Recettes** : fiche + ingrédients + sortie, avec suggestion d'XP pré-remplie.

**Backend**
- `ArtisanatEditorController` sous `/api/artisanat/editor/*`, règle `ROLE_ADMIN` placée
  **avant** `^/api` dans `security.yaml` (comme les quatre éditeurs existants).
- `ArtisanatEditorService` : sauvegarde en **une transaction** avec des **ids stables** (les
  lignes envoyées avec un id sont mises à jour, celles sans id créées, celles absentes
  supprimées).
  > ⚠️ **Piège Doctrine déjà rencontré (§14.5)** : relire ingrédients et recettes depuis
  > **leur repository**, jamais depuis la collection de l'entité — après une sauvegarde,
  > la collection est périmée et l'éditeur réaffiche un état vide.
- `Config\ArtisanatConfig` pilote les champs du formulaire (patron `QuestActionTypeConfig` /
  `DonjonMecaniqueConfig` / `InteractionConfig`) : **le front ne connaît aucun type en dur**.
- Suppression refusée si la recette est référencée par une commande non retirée, ou si le
  métier est encore porté par une interaction / une recette — avec un message disant quoi
  faire (comme la suppression d'interaction posée).

**Frontend**
- `administration/pages/ArtisanatMakerPage.jsx` + formulaires sous
  `administration/components/forms/ArtisanatMaker/`, service
  `administration/services/ArtisanatMakerApi.js`. Entrée de menu dans `AdministrationPage`.
- **Rappel §15.1** : `onSubmit={(event) => this.handleSubmit(event)}` + `preventDefault()`.
  Un `<form>` sans ça recharge la page sur une simple touche Entrée et la sauvegarde ne part
  jamais.

**Tests** : `ArtisanatEditorApiFunctionalTest` — 403 pour un non-admin alors que les routes
joueur restent ouvertes, config décrivant les champs, création + relecture complète, ids
d'ingrédients stables, retrait d'un ingrédient, suppressions refusées.

---

### Lot 5 — Dépeceur : butin conditionné par un métier

- `MonstreObjet` : `+ metier` (nullable), `+ niveauMetierMin`, `+ experienceMetier`.
- `DeathService::dieMonster()` : une ligne de butin liée à un métier n'est tirée que si le
  joueur a ce métier au niveau requis ; elle crédite alors l'XP via `MetierService`. Les
  lignes sans métier sont inchangées.
- **Assainissement au passage** (dette visible) : `dieMonster` flushe dans la boucle de butin
  et n'ouvre aucune transaction — un flush unique en fin de méthode, dans une transaction.
  La branche « drop d'équipement » est un `TODO` commenté depuis longtemps : soit on
  l'implémente via `SacService`, soit on la supprime — ne pas la laisser en l'état.
- Le tanneur consomme les peaux : **pur contenu**, une recette du lot 3. Zéro code.

**Tests** : butin refusé sans le métier, obtenu avec, XP créditée, non-régression des lignes
sans métier.

---

### Lot 6 — Différé : dents du karma et paliers passifs

Hors périmètre immédiat (§2), listé pour ne pas le redécouvrir :
- `TypeConditionInteraction::KARMA_MIN` / `KARMA_MAX` (quasi gratuit, le système de
  conditions existe) ;
- modificateur de prix marchand selon le karma (`VenteService` / `ShopService`) ;
- `metier_palier` + enum whitelistée `BonusMetier` + registre, sur le patron de
  `QuestEffect` / `QuestEffectRegistry` — **jamais** d'effet libre stocké en base ;
- impact environnemental des zones, opposition durable/intensif à l'échelle d'une carte.

---

## 4. Points de vigilance transverses

1. **`MetierService` change d'invariant** (lot 0). Toute la documentation qui dit « pas de
   ligne = niveau 0 » doit être corrigée en même temps que le code, sinon le prochain agent
   recréera l'auto-création.
2. **Trois services conservent leur monopole** : `SacService` (items et or),
   `RecompenseService` (conversion en butin), `MetierService` (progression). `CraftService` et
   `KarmaService` s'y ajoutent. Aucun contrôleur n'écrit jamais dans ces tables.
3. **Rien de périodique** : ni commande de scheduler, ni job. Récolte, épuisement et
   fabrication se résolvent **paresseusement** sur des dates serveur.
4. **`content-dump.sh`** : ajouter `craft_commande` à l'`EXCLUDE` **au lot 3**, avant tout
   dump — sinon des commandes de joueurs partent dans le seed partagé. `interaction_recharge`
   et `joueur_metier` y sont déjà. Les nouvelles tables de contenu (`recette`,
   `recette_ingredient`, `pnj_metier`) sont capturées automatiquement, c'est voulu.
5. **Migrations** : `doctrine:migrations:diff` puis `migrate` à chaque lot,
   `doctrine:schema:validate` doit rester vert. Sauvegarder la base avant
   (`mysqldump`) — elle n'existe que dans le volume Docker local.
6. **Front** : CSS Modules colocalisés + tokens (aucun hex en dur), kit `src/components/ui/`
   avant d'écrire du neuf, modales via `GameModal`/`ModalShell`, Bootstrap interdit.
7. **Le client ne décide de rien** : mode de récolte, mode de craft, disponibilité,
   quantités — tout est revérifié serveur. Ce que renvoie `decrire()` n'autorise jamais rien.

---

## 5. Séquence d'exécution

```
Lot 0  socle métiers (familles, plafonds, apprentissage PNJ)   ← bloquant pour 2 et 3
Lot 1  ressources marquées + karma stocké/affiché
Lot 2  récolte éthique vs intensive + épuisement partagé
Lot 3  recettes + atelier + fabrication paresseuse
Lot 4  ArtisanatMaker (écran d'administration)
Lot 5  dépeceur (butin conditionné) + assainissement DeathService
Lot 6  (différé) dents du karma, paliers passifs
```

Les lots 4 et 5 sont indépendants l'un de l'autre et du lot 3 côté code ; le lot 4 est
toutefois nécessaire pour **écrire** le contenu que les lots 2, 3 et 5 rendent jouable. En
attendant, le contenu de test se pose en SQL, comme pour les donjons.

À la fin du chantier : section **§16 Artisanat** dans `DOCUMENTATION.md`, mise à jour des
« pièges connus » de `CLAUDE.md`, et `./scripts/content-dump.sh`.
