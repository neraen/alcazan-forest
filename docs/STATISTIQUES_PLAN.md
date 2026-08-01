# Statistiques, journalisation et classements — plan d'exécution (01/08/2026)

Plan de mise en œuvre de l'observabilité du jeu, demandée en deux volets : un **monitoring
admin** (échanges, objets, monstres tués, joueurs) et un volet **joueur** (stats sur le profil
et classements publics). Le périmètre arbitré inclut le fait de **finir réellement les guildes
et le PvP**, aujourd'hui des demi-fonctionnalités dont les statistiques ne pourraient rien dire.

Ordre de lecture obligatoire avant de coder : `CLAUDE.md`, `DOCUMENTATION.md` §18 (compteurs de
progression — le patron exact à imiter), §12 (SacService, échanges), §20 (hôtel des ventes et
son arbitrage §20.6 sur le back-office), §6.9 (dette du PvP).

---

## 0. Ce qui est acquis et ce qui manque

**Acquis (ne rien réécrire) :**

| Besoin | Déjà là |
|---|---|
| Compter « combien de fois, par cible » | `CompteurJoueurService` + `joueur_compteur` (**unique** point de mutation, upsert natif) |
| Kills de monstres, par monstre | `TypeCompteur::MONSTRE_TUE`, incrémenté dans `DeathService` |
| Kills de boss, par boss | `user_boss.numberKill` + `lastKill` |
| Mutation de l'or et des items | `SacService` (**unique** point de mutation) |
| Point de passage unique de l'XP | `LevelingService::giveExperienceToAPlayer` |
| Transfert joueur↔joueur | `EchangeFinalisationService::finaliser` (transaction, verrous ordonnés) |
| Ventes asynchrones | `HotelVenteService` (+ `hotel_vente` garde `acheteur`, `closed_at`, `frais_depot`) |
| Sécurité admin par préfixe | `security.yaml`, règle `^/api/admin/` **déjà** placée avant `^/api` |
| Commandes planifiées | conteneur `alcazan-scheduler` (`app:echanges:expirer`, `app:hdv:expirer`, `app:regen-points`) |
| Liste admin rail + aperçu | `AdminCatalog.jsx` |
| Jauges et kit UI tokenisé | `ui/GaugeBar`, `Panel`, `ModalShell`, `_tokens.scss` |

**Manque :** tout le reste. Aucune table d'événements typés, aucun agrégat sans cible, aucun
endpoint de statistiques, aucun classement, aucun tableau de bord. Et trois trous de données
qui empêchent d'agréger quoi que ce soit aujourd'hui — détaillés en §1.2.

---

## 1. Critique de la demande

### 1.1 Ce qui est gratuit (aucun code de gameplay)

- **« Monstres tués »** est déjà en base : `SUM(joueur_compteur.valeur) WHERE type =
  'monstre_tue'`. Le backfill du cumul est **exact**, pas approché.
- **« Boss vaincus »** aussi : `SUM(user_boss.number_kill)`. Backfill exact.
- **« Richesse »** est `user.money`, un état courant qu'il suffit d'indexer.
- **« Guilde »** sur le profil est une jointure — à condition d'avoir réparé le modèle (§1.2c).
- Les emplacements d'accueil existent déjà et pointent dans le vide : `AdministrationPage.jsx`
  déclare un `NavLink to="/administration/joueurs"` **sans route correspondante**, et
  `SideMenu.jsx:28` un `{label: "Classement", to: "#"}`. Rien à concevoir, tout à brancher.
- `DOCUMENTATION.md` §18 « Reste à faire » annonçait déjà l'onglet « faits d'armes » comme
  « quasi gratuit à partir de `valeursParCible()` ». Il l'est.

### 1.2 Ce qui est faux ou impossible tel quel

**a) « XP total gagné » n'existe pas et n'est pas reconstituable exactement.**
`niveau_joueur.experience` est l'XP **courante dans le niveau**, pas un cumul :
`LevelingService::giveExperienceToAPlayer` fait `$newExperienceScore -= $experienceByLevel[$level]`
à chaque montée, et `giveExpMalusAfterDeath` en retire 9 % à chaque mort. Il faut donc un cumul
neuf, et le backfill (somme des paliers franchis + XP courante) est une **borne inférieure** :
il ignore l'XP réellement gagnée puis reperdue. On le fait quand même — partir de zéro
classerait un personnage niveau 120 **derrière** un nouveau venu qui tue un loup le lendemain
du déploiement, et un classement visiblement faux le premier jour ne se rattrape pas.

**b) Un compteur ne peut pas porter un total sans cible.**
`CompteurJoueurService::incrementer` **refuse `$cibleId <= 0`** (doc §18 : « un compteur ne
redescend jamais », cible ≤ 0 ignorée). Il n'y a donc pas de « cible 0 » disponible pour
« XP totale » ou « joueurs tués ». Forcer une fausse cible casserait le modèle que
`CLAUDE.md` décrit comme la clé de voûte du système. D'où une table sœur, `joueur_cumul`,
avec le même contrat : `joueur_compteur` répond « combien par cible », `joueur_cumul` « combien
au total ». C'est aussi la réponse à la question laissée ouverte en doc §18 à propos de
`KILL_PVP` (« la cible n'est pas un id de contenu mais une classe/un alignement — à arbitrer ») :
**il n'y a pas de cible**, donc il n'y a pas de compteur à cible.

**c) La guilde est réellement en double modélisation, et les deux moitiés sont vivantes.**
`user.guilde_id` n'est **écrite par aucun code** — le seul `setGuilde` hors entités est
`PlayerActionController:499`, et il porte sur `JoueurGuilde`, pas sur `User`. C'est la cause
exacte du bug « rejoindre une guilde ne fait rien de visible » : `joueurGuildeJoin` crée une
ligne `joueur_guilde`, et tout l'affichage lit `user.guilde`.

> ⚠️ **Correction du 01/08/2026 (constat en jeu).** Une première lecture concluait à une
> « colonne morte à supprimer ». C'est faux sur deux points, et l'erreur aurait coûté cher :
> la colonne **porte des données** (renseignées à la main en base — le profil de test affiche
> bien sa guilde) et elle est **lue par quatre jointures**, pas une :
> `UserRepository:41` et `:139`, `CarteCarreauRepository:74`,
> `DonjonInstanceMembreRepository:40`, en plus de `GuildeController:55`.
> La supprimer sans rien d'autre effacerait le nom de guilde sur le profil, sur la carte et
> dans la liste des membres d'instance. Le lot 5 doit donc **migrer les données** de
> `user.guilde_id` vers `joueur_guilde` et **récrire les quatre jointures**, pas « supprimer
> une colonne inutile ».

**d) « Honneur PvP » classerait les joueurs sur une valeur fausse.**
`SpellService::computeHonnorGain/Loose` écrit directement via `UserRepository::updatePlayerHonnor`
— seule valeur de progression du jeu sans point de mutation unique — et sa chaîne de six
`if/else` a des trous : une différence de niveaux **entre 30 et 50**, ou **égale à 9, 18 ou 30**,
tombe dans le `else` final et rapporte **+50**, soit le maximum, pour avoir tué quelqu'un
40 niveaux en dessous de soi. L'exact inverse de l'intention documentée en §2 (« attaquer
50 niveaux plus bas = −5 »). `user.honneur` est en outre **nullable**, donc
`$user->getHonneur() + $honnor` opère sur NULL.

**e) Le PvP est gratuit.** `SpellService::doDamage` (le chemin PvP) **ne décompte jamais les PA**,
alors que `doDamageOnBoss` le fait explicitement (`SpellService.php:137`). S'y ajoutent
l'absence de contrôle de portée et de cooldown (dette §6.9). Statifier un PvP qu'on peut jouer
en boucle gratuitement produirait des classements qui ne mesurent que la vitesse de clic.

**f) `historique` est intypable.** `message VARCHAR(255)` libre + `is_external`, sans type ni
payload. `REFONTE_PLAN` l.313-318 avait explicitement **refusé** d'inventer les 8 catégories de
la maquette, faute de typage back. Re-typer les lignes existantes par regex sur du texte
interpolé (`"Vous infligez 42 points…<br />"`) produirait de la **fausse donnée structurée dans
la table qui sert d'enquête** — le pire résultat possible. Précédent inverse à citer : les
backfills `Version20260714225015` et `Version20260724223740` portaient sur des données déjà
structurées ; ici il n'y a rien à structurer.

**g) « Objets échangés » ne se joint pas en SQL.** `echange_ligne.item_id` et
`hotel_vente.item_id` n'ont **pas de FK** (choix documenté §20 : la colonne est polymorphe).
Aucune requête ne peut ramener le nom, et donc aucun `GROUP BY nom`. Le journal doit **figer le
nom dans son contexte JSON au moment de l'événement**, via `SacService::decrireItem()`. Bénéfice
collatéral : l'événement survit à la suppression du contenu.

### 1.3 Ce qui est trop cher pour maintenant

- **Classement « heal »** (l'un des 5 placeholders de 2023) : rien ne compte les soins, et dans
  un jeu sans contenu coopératif il mesurerait « qui a spammé le sort de soin sur lui-même ».
- **Classement « alignement »** : l'alignement n'a aucune conséquence de jeu aujourd'hui. Le
  lot 6 lui en donne une (feu ami interdit) ; le classement n'a de sens qu'après.
- **Classements matérialisés** : une table de snapshot, une commande de scheduler, une fenêtre
  de fraîcheur et un mode de panne (« le classement est figé depuis 3 jours ») pour une
  volumétrie de quelques comptes. À la volée avec un index, et une porte de sortie (§4).
- **Cooldown serveur des sorts** : c'est un trou **général** (`attackPlayerVsMonster` et
  `attackPlayerVsBoss` l'ont aussi). Le boucher côté PvP seul créerait une asymétrie plus
  déroutante que le trou actuel. Lot séparé, couvrant les trois endpoints. En attendant, le PA
  redevenu obligatoire (lot 6) fait office de cooldown.
- **`guilde.niveau`** : le brancher sur la somme des XP des membres serait facile et **faux**.
  Un « niveau » qui ne débloque rien est un chiffre décoratif que le joueur croira signifiant.

---

## 2. Décisions arbitrées avec l'utilisateur (01/08/2026)

| Question | Décision | Conséquence |
|---|---|---|
| Journal d'événements ou compteurs agrégés ? | **Les deux, rôles disjoints** | Le journal répond à « que s'est-il passé » (enquête), les agrégats à « combien au total » (classements). Deux tables, jamais deux vérités sur la même question |
| Périmètre guildes / PvP | **Les finir réellement** | Le chantier n'est plus seulement de l'observabilité : lots 5 et 6 sont du gameplay, et passent **après** le socle |
| Classements | **Publics** + stats perso sur le profil | Page `/classement` accessible à tous, rang personnel sur la fiche |

Décisions techniques prises dans la foulée, détaillées à leur lot :

| Question | Décision | Pourquoi en une ligne |
|---|---|---|
| Où écrire dans le journal ? | Chez les **appelants**, jamais dans `SacService` | Une ligne par **fait**, pas par mutation : un échange = 1 fait mais 6 à 10 appels `SacService` |
| `JournalService` flushe-t-il ? | Non — INSERT natif, exceptions avalées | Ne jamais faire échouer une action ; ne jamais journaliser un fait annulé |
| Sort de `historique` | Coexistence, **pas de backfill** | §1.2f |
| Route admin | `^/api/admin/stats/*` | La règle existe déjà et est déjà bien placée → zéro ligne touchée dans `security.yaml` |
| Graphiques front | SVG maison, **aucune dépendance** | CRA 4 / webpack 4 : `recharts`/`chart.js` tirent des `d3-*` ESM-only, risque de casser le build du jeu |
| Rétention | Purge 90 jours, livrée **au lot 1** | 40 lignes maintenant, ou une opération d'urgence sur 40 Go plus tard |
| Les 5 fichiers vides de `components/classement/` | Supprimés | 0 octet, jamais importés, et leur découpage (un composant par classement) contredit le design retenu |

---

## 3. Découpage en lots

Chaque lot est livrable et testable seul. Après **tout** lot :
`doctrine:migrations:diff` puis `migrate`, `doctrine:schema:validate` vert,
`php vendor/bin/phpunit` vert, puis `./scripts/content-dump.sh` (avec `--push` si l'utilisateur
veut synchroniser).

> **Séquence : le socle AVANT le gameplay.** Guildes et PvP passent après les lots 1-4.
> Cinq raisons : les lots 1-3 se construisent intégralement sur les données d'aujourd'hui donc
> quelque chose marche tôt ; un bug de `GuildeService` ne peut pas casser le classement s'il
> arrive deux lots plus tard ; injecter le journal dans du code qu'on est déjà en train
> d'écrire coûte une ligne, l'y ajouter après coûte une réouverture ; **la règle anti-farm de
> l'honneur lit le journal**, donc le PvP ne peut pas le précéder ; et livrer du gameplay sans
> savoir observer ce qu'il produit, c'est équilibrer à l'aveugle.

---

### Lot 1 — Socle de journalisation + flux admin brut

**Pourquoi d'abord** : tout le reste en dépend, et c'est le seul lot qui donne de la valeur
sans toucher à une seule règle de jeu.

**Backend — créés**
- `Entity/EvenementJeu.php` + `Repository/EvenementJeuRepository.php` : `inserer()`,
  `insererPlusieurs()`, `rechercher(?userId, ?types, ?depuis, ?jusqua, page, parPage)`,
  `compterParJour()`, `supprimerAvant(limite, lot = 5000)`.
- `Enum/TypeEvenement.php` — valeurs stockées en base, **ne jamais les renommer** (convention
  `TypeCompteur`), avec `label()`, `categorie()` et `phrase(array $contexte)`.
  16 cas au départ : `MONSTRE_TUE`, `BOSS_VAINCU`, `MORT_JOUEUR`, `XP_GAGNEE`,
  `NIVEAU_ATTEINT`, `ECHANGE_CONCLU`, `HDV_DEPOT`, `HDV_ACHAT`, `HDV_RETRAIT`,
  `HDV_EXPIRATION`, `ACHAT_PNJ`, `VENTE_PNJ`, `CRAFT_TERMINE`, `RECOLTE`, `QUETE_TERMINEE`,
  `CONNEXION`.
- `Enum/CategorieEvenement.php` : `COMBAT`, `ECONOMIE`, `PROGRESSION`, `SOCIAL`, `SYSTEME`.
- `service/JournalService.php` — **UNIQUE point d'écriture** de `evenement_jeu` :
  `consigner(TypeEvenement, ?User $acteur, ?User $cibleUser, ?string $cibleType, ?int $cibleId,
  int $quantite, int $montantOr, array $contexte)` et `consignerPlusieurs(array)`.
- `service/JournalNormalizer.php` — résout `cible_type`/`cible_id` en nom lisible ; passe par
  `SacService::decrireItem()` pour les items (§1.2g rend la jointure SQL impossible).
- `Config/JournalConfig.php` (`RETENTION_JOURS = 90`, `PAGE_PAR_DEFAUT = 50`).
- `Controller/AdminStatsController.php` : `POST /api/admin/stats/journal`,
  `POST /api/admin/stats/referentiels` (types et catégories — le front n'en connaît aucun en dur).
- `DTO/JournalFiltreDTO.php` (patron `#[MapRequestPayload]` d'`ActionController`).
- `Command/PurgerJournalCommand.php` → `app:journal:purger`.

**Schéma `evenement_jeu`** : `id BIGINT`, `type VARCHAR(40)`, `acteur_id` FK `user`,
`cible_user_id` FK `user`, `cible_type VARCHAR(20)`, `cible_id INT` (**sans FK**, polymorphe),
`quantite INT`, `montant_or INT`, `contexte JSON`, `cree_le DATETIME`.
Quatre index : `(acteur_id, cree_le)`, `(cible_user_id, cree_le)`, `(type, cree_le)`, `(cree_le)`.

> ⚠️ **`montant_or`, jamais `or`** : mot réservé MySQL. Même famille de piège que
> `donjon_salle.condition`, sauf qu'ici on l'évite par le nommage plutôt que par des backticks —
> un nom qui doit être échappé finit toujours par casser un INSERT quelque part.

> **`cible_user_id` est une colonne, pas une clé du JSON.** La requête n°1 de l'admin est « la
> fiche du joueur X », c'est-à-dire tout ce qu'il a fait **et** subi. Sans colonne dédiée, cette
> requête deviendrait un scan complet avec `JSON_EXTRACT` — exactement la table qu'on ne peut
> pas scanner. Avec les deux index, c'est deux parcours d'index.

> **Une seule ligne par mort**, pas un couple `JOUEUR_TUE`/`MORT` : `acteur_id` = le tueur
> (NULL si environnement), `cible_user_id` = le mort, `contexte.cause`. Les deux index la lisent
> dans les deux sens. Dupliquer doublerait le volume et créerait deux vérités à réconcilier.

> **Pas d'événement générique `OR_GAGNE`/`ITEM_OBTENU`.** Sinon un achat HDV produit 4 lignes
> qu'aucune colonne ne relie, et le journal cesse de raconter une histoire pour redevenir un log
> d'inventaire — que `SacService` garantit déjà par construction. Un achat = **une** ligne
> `HDV_ACHAT` (acteur = acheteur, cible_user = vendeur, `montant_or` = prix, contexte = items).

**Backend — branchements** (tous déjà dans une transaction sauf `diePlayer`) :
`DeathService::dieMonster`/`dieRenfort`/`diePlayer`, `SpellService::doDamageOnBoss`,
`LevelingService`, `EchangeFinalisationService::finaliser`, `HotelVenteService` (×4),
`ShopService`, `VenteService`, `CraftService::retirer`, `InteractionService::executer`,
`QuestProgressionService`, et `CONNEXION` là où `lastConnexion` est mis à jour — **une ligne
par jour et par joueur au maximum**, sinon le rafraîchissement de carte inonde la table.

**Backend — nettoyage** (vrai bug rencontré au passage) : `HistoriqueRepository::getAllRowsForPlayer`
fait `->where('historique.user = '.$userId)`, **sans `ORDER BY` ni limite** → paramètre lié,
`ORDER BY date DESC`, `LIMIT 200`. Suppression de `insertHistoryForPlayer` (DQL `INSERT`
n'existe pas : la méthode est cassée et inutilisée). `@deprecated` sur `HistoriqueService`.

**Infra** : `EXCLUDE` += `evenement_jeu` dans `scripts/content-dump.sh` — `is_excluded()` fait
un **match exact**, donc une ligne dédiée, jamais de glob. `app:journal:purger` dans la boucle
horaire du scheduler de `docker-compose.yaml`, à côté de `app:regen-points`.

**Frontend** : `administration/pages/JournalPage.jsx`, `administration/services/AdminStatsApi.js`
(patron `ArtisanatMakerApi.js` : helper `post` local + JSDoc), route `PrivateRoute isAdmin` et
entrée de menu dans `AdministrationPage.jsx`, styles dans `administration/admin.scss`.

**Tests** : `JournalServiceTest` — insertion nominale, contexte JSON relu, **un rollback de la
transaction englobante efface la ligne**, **une insertion en échec ne remonte pas d'exception**,
`consignerPlusieurs` fait un seul INSERT. `AdminStatsApiFunctionalTest` — 403 pour un non-admin
(vérifie la règle `^/api/admin/`), filtres, pagination. `dieMonster` écrit un `MONSTRE_TUE`.
Purge : ligne ancienne supprimée, récente conservée.

---

### Lot 2 — Cumuls et « faits d'armes » sur le profil

**Backend** : `Entity/JoueurCumul.php`, `Repository/JoueurCumulRepository.php`,
`Enum/TypeCumul.php` (`XP_TOTALE`, `MONSTRES_TUES`, `BOSS_VAINCUS`, `JOUEURS_TUES`, `MORTS`,
`OR_GAGNE`, `OR_DEPENSE` — avec `label()`, `unite()`, `format()`),
`service/CumulJoueurService.php`, `Command/ReparerCumulsCommand.php` (`app:cumuls:reparer`),
`POST /api/joueur/stats`.

`CumulJoueurService` est une **copie conforme du contrat de `CompteurJoueurService`** : unique
point de mutation, ne flushe pas, `INSERT … ON DUPLICATE KEY UPDATE valeur = valeur + ?` en SQL
natif. **C'est l'index UNIQUE `(user_id, cle)` qui rend l'upsert possible** — même invariant à
documenter que pour `joueur_compteur` : le retirer ferait perdre des incréments concurrents en
silence, pas seulement l'intégrité.

`ajouter(User, TypeCumul, int $pas = 1)`, `ajouterParId(int $userId, …)`, `valeur()`, `valeurs()`.
La variante par id existe parce que `LevelingService::giveExperienceToAPlayer` reçoit un
`int $userId` : un `find()` serait un aller-retour base gratuit dans un chemin appelé à chaque
coup porté du jeu.

> ⚠️ `giveExperienceToAPlayer` reçoit aussi les **malus** (`giveExpMalusAfterDeath` passe un
> négatif). N'incrémenter `XP_TOTALE` que si `$experience > 0` : un malus de mort n'est pas de
> l'XP « dé-gagnée ». Test dédié.

> **Ce qui n'est PAS un cumul** : `user.money` et `user.honneur` sont des **états courants**.
> Leurs classements les lisent directement, avec un index. Les recopier dans `joueur_cumul`
> créerait une seconde vérité sur l'or, ce que `CLAUDE.md` interdit frontalement.

> **`BOSS_VAINCUS` est une dénormalisation assumée** de `SUM(user_boss.number_kill)`. On ne
> crée surtout pas de `TypeCompteur::BOSS_VAINCU`, qui serait une troisième vérité, et on ne
> touche pas à `user_boss` dont `ActionType::BATTRE_BOSS` dépend. Ce qui rend la dénormalisation
> légitime, c'est qu'elle est **recalculable** : `app:cumuls:reparer` la refait depuis ses
> sources, et un test asserte la concordance après un kill.

**Migration** : `joueur_cumul` (UNIQUE `(user_id, cle)`, index `(cle, valeur)`) ;
`user.hors_classement BOOLEAN NOT NULL DEFAULT 0`, mis à 1 pour les comptes `ROLE_ADMIN` — sans
quoi le compte de développement, rempli de données de test, trusterait les six podiums le jour
du déploiement (et filtrer sur `JSON_CONTAINS(roles, …)` détruirait l'index).
Backfills **exacts** pour `MONSTRES_TUES` et `BOSS_VAINCUS`, **borne inférieure** pour
`XP_TOTALE` : le docblock doit le dire et dire pourquoi on la fait quand même (§1.2a).
`EXCLUDE` += `joueur_cumul`.

**Frontend** : `Panel variant="soft"` « Faits d'armes » dans `components/profil/profil/profil.jsx`,
colonne gauche sous le Panel identité, avec les `infoRow` existants. Libellés et unités viennent
du serveur — aucune chaîne en dur, même discipline que `FamilleMetier`.

> `POST /api/joueur/stats` **et non** un enrichissement de `/joueur/data/minimal` : ce dernier
> est le chemin **chaud**, rappelé à chaque rafraîchissement de carte ; y ajouter sept agrégats
> taxerait chaque déplacement. Le profil, lui, s'ouvre ponctuellement.

**Tests** : `CumulJoueurServiceTest` sur le patron de `CompteurJoueurServiceTest` (incrément
concurrent, pas ≤ 0 ignoré, `valeurs()` en une requête) ; « un malus de mort n'incrémente pas
`XP_TOTALE` » ; « après un kill de boss, `BOSS_VAINCUS` == `SUM(user_boss.number_kill)` ».

---

### Lot 3 — Page de classement publique

**Backend** : `service/ClassementService.php` (`categories()`, `top(string $cle, int $limite)`,
`rangDe(User, string $cle)`), `Controller/ClassementController.php`
(`POST /api/classement/liste`, `POST /api/classement/moi`), `Config/ClassementConfig.php`.
Catégories : XP totale, richesse, monstres tués, boss vaincus, honneur.
Migration : index `user (money)` et `user (honneur)`. Aucune table.

> **Toutes les lectures passent par `ClassementService::top()`.** C'est ce qui rend le choix
> « à la volée » réversible : matérialiser un jour = créer une table de snapshot, écrire
> `app:classements:calculer`, et changer le corps d'**une** méthode. Zéro impact front.

**Frontend** : `pages/classementPage/ClassementPage.jsx` + `.module.scss` sur le patron
`ArtisanatPage` (rail 320 px + principal, `useCallback charger()` avec `Promise.all`) ;
`components/classement/ClassementTable.jsx` sur le patron de tableau de `GuildePage`
(`.tableHead` en grid + badges) ; `ClassementTabs.jsx`, `RangJoueur.jsx` ;
`services/ClassementApi.js` ; route dans `index.js` **avant** le `<Route path="/">` final ;
`SideMenu.jsx:28` `to: "#"` → `to: "/classement"` ; `git rm` des 5 fichiers vides.

> Le classement est **une** table générique pilotée par les catégories que le serveur déclare,
> pour qu'ajouter un classement soit une modification back uniquement. C'est précisément ce que
> le découpage des placeholders de 2023 (un composant par classement) empêchait.

---

### Lot 4 — Tableau de bord admin

`POST /api/admin/stats/tableau-de-bord` : joueurs actifs 24 h / 7 j (depuis les `CONNEXION` —
c'est ce qui répond à « pas d'historisation des connexions » sans dispositif neuf), événements
par jour et par catégorie sur 30 j, **or créé vs or détruit** (les frais de dépôt HDV sont un
puits monétaire documenté §20 : c'est la première fois qu'il devient mesurable), top objets
échangés, top vendeurs.
`POST /api/admin/stats/joueur` : identité, cumuls, 100 derniers événements, résumé d'inventaire
— **c'est cet endpoint qui remplit enfin le `NavLink to="/administration/joueurs"`**.

**Frontend** : `administration/pages/StatistiquesPage.jsx`,
`administration/pages/JoueursPage.jsx` (patron `AdminCatalog`),
`components/ui/sparkline/Sparkline.jsx` ajouté au kit UI, tokenisé, zéro hex en dur.

---

### Lot 5 — Guildes réelles *(gameplay ; découpable en 5a/5b/5c)*

**5a — Modèle et service.** `Enum/GradeGuilde.php` (`BARON`/`OFFICIER`/`MEMBRE`/`RECRUE`, avec
`rang()`, `peutAccepter()`, `peutPromouvoir()`, `peutExclure()`, `peutDissoudre()`),
`service/GuildeService.php`, `Exception/GuildeException.php`, `Config/GuildeConfig.php`.

`GuildeService` est l'**unique machine à états** du lobby de guilde et **ouvre sa transaction**
— comme `EchangeService`, `HotelVenteService`, `CraftService`, `DonjonInstanceService`. La règle
« ne flushe pas » vise les services de **valeur** (Sac, Karma, Metier, Compteur, Recompense),
pas les machines à états.
`creer / candidater / accepter / refuser / promouvoir / exclure / quitter / dissoudre / etat /
annuaire`. Règles portées ici et nulle part ailleurs : `placeMax` vérifié dans `accepter()`
(les deux `todo` du contrôleur actuel), alignement obligatoire et identique, un baron ne peut
pas quitter sans transmettre ou dissoudre, on n'exclut pas un grade ≥ au sien, la dissolution
supprime toutes les lignes. Coût de création en or via `GuildeConfig`, aucun chiffre en dur.

Grades en **enum PHP** plutôt que via la table `Grade` : elle est vide de sémantique (nom +
icône), ne porte aucune permission, et des permissions en base sont de toute façon interprétées
par le code — même raisonnement que `ActionType`. Bonus : `joueur_guilde.grade` contient déjà
`'recrue'`, donc **zéro backfill de grade**. Les entités mortes `Grade`/`JoueurGrade` sont
supprimées : les laisser est exactement le mécanisme qui a produit la colonne morte de §1.2c.

**Migration** : `joueur_guilde` += `statut` (`candidat`|`membre`) + `rejoint_le` ;
**dédoublonnage par `MIN(id)` PUIS** `UNIQUE (user_id)` — l'endpoint actuel n'a aucun garde-fou,
il peut donc exister des doublons, et poser l'index d'abord ferait échouer la migration sur
données existantes (même famille de piège que « colonne NOT NULL sans défaut »).

⚠️ **Puis, dans cet ordre** : (1) **remonter** les `user.guilde_id` renseignés vers
`joueur_guilde` (grade `baron`, statut `membre`) pour les joueurs qui n'y ont pas déjà une
ligne — sinon on perd des appartenances réelles ; (2) **récrire les quatre jointures**
`leftJoin('user.guilde', …)` (`UserRepository:41` et `:139`, `CarteCarreauRepository:74`,
`DonjonInstanceMembreRepository:40`) pour passer par `joueur_guilde` ; (3) seulement alors
`DROP` de `user.guilde_id` et de la relation `Guilde::$users`, sans quoi `schema:validate` ne
repasse pas au vert. Puis `DROP TABLE grade, joueur_grade`.

Sauter l'étape (2) effacerait le nom de guilde sur le profil, sur la carte et dans la liste
des membres d'instance de donjon.

> ⚠️ **Infra obligatoire dans ce lot.** `guilde` n'est **pas** dans `EXCLUDE` et vit dans
> `seeds/content-seed.sql` : dès que la création est ouverte aux joueurs, `content-dump.sh`
> pousserait leurs guildes dans git et `content-load.sh` les écraserait en laissant les lignes
> `joueur_guilde` (elles, exclues) orphelines. Donc `EXCLUDE` += `guilde`, `EXCLUDE` −=
> `joueur_grade`, et **`./scripts/content-dump.sh --push` dans le même lot** puisque la table
> `grade` disparaît du seed. Conséquence assumée : les guildes de test du seed (« guilde de
> test », « RATP ») disparaissent du contenu partagé.

**5b — API et journal.** `GuildeController` réécrit, `TypeEvenement` += 8 cas
(`GUILDE_CREEE`, `_CANDIDATURE`, `_ACCEPTATION`, `_REFUS`, `_DEPART`, `_EXCLUSION`, `_GRADE`,
`_DISSOUTE`), `PlayerActionController::joueurGuildeJoin` **supprimé**.

**5c — Front.** `GuildePage.jsx` : onglets Ma guilde / Annuaire / Candidatures, avec création,
candidature, acceptation, promotion, exclusion, départ, dissolution. Catégorie « guildes »
allumée au classement — modification **back-only**, le front suit.

**Tests** : chaque transition et chaque refus (`placeMax` atteint, alignement différent, grade
insuffisant, baron qui quitte sans transmettre, double candidature) ; **invariant : au plus une
ligne `joueur_guilde` par joueur après chaque transition**.

**Fini quand** : un joueur crée une guilde, un autre candidate, le baron accepte, et le membre
apparaît dans la liste **et** sur les deux profils — c'est-à-dire que le bug de §1.2c est mort.

---

### Lot 6 — PvP réel *(gameplay)*

`service/PvpService.php`, `service/HonneurService.php`, `Config/PvpConfig.php`,
`DTO/CauseMort.php`, `Exception/PvpException.php`.

**`SpellService` n'est pas assaini, il est cantonné.** Il reste le *calculateur de dégâts*,
partagé par le PvE, les boss et les donjons ; le PvP est un *jeu de règles* (ciblage, PA,
portée, honneur, XP, attribution de la mort). Les mélanger est exactement ce qui a produit un
contrôleur de 70 lignes qui construit du HTML. `PvpService::attaquer()` appelle
`SpellService::doDamage()` pour le calcul et porte tout le reste ;
`computeHonnorGain`/`computeHonnorLoose` **sortent** de `SpellService`.

**Gardes manquants, tous serveur, tous dans `verifierAttaque()`** (patron :
`DonjonCombatService::verifierAttaqueBoss`, mécanique déjà validée pour les boss) : même carte,
distance de Chebyshev ≤ portée du sort, **PA suffisants et réellement décomptés** (§1.2e),
cible vivante et différente de soi, ni l'un ni l'autre sous `summoningSickness` (sinon on tue en
boucle au cimetière), alignement différent selon `PvpConfig::FEU_AMI_AUTORISE` — la seule règle
qui donne enfin un sens de jeu à `alignement`.

**`diePlayer` apprend le tueur sans casser son contrat** : `diePlayer(User $user,
?CauseMort $cause = null)`, paramètre **optionnel** donc les 4 sites d'appel existants compilent
inchangés. `CauseMort` est un petit DTO à constructeurs nommés (`pvp`, `monstre`, `boss`,
`zoneDonjon`). Le `consigner()` est placé **après** les UPDATE DQL et **avant** le
`entityManager->refresh($user)` obligatoire : un INSERT natif y est indifférent, mais l'ordre
rend l'intention lisible — on journalise une mort déjà écrite en base.

> ⚠️ `diePlayer` **reste sans transaction propre**, contrairement à `dieMonster`/`dieRenfort`.
> Lui en ajouter une mélangerait DQL hors UoW, `refresh()` et `donjonInstanceService->sortir()` :
> refactoring à risque sans rapport avec ce chantier. Dette explicite, pas un oubli.

**`HonneurService`** — `CLAUDE.md` impose un point unique pour toute valeur de progression, et
l'honneur est la seule qui n'en ait pas. Contrat calqué sur `KarmaService` : ne flushe pas,
borne la valeur. Corrections apportées :
- `user.honneur` nullable → **`UPDATE … WHERE honneur IS NULL` PUIS `NOT NULL DEFAULT 0`**,
  dans cet ordre, sinon la migration casse sur données existantes.
- Les chaînes `if/else` trouées → **formule continue bornée** dans `PvpConfig`
  (`clamp(BASE + PENTE × Δniveau, MIN, MAX)`). *Une chaîne de six branches sur des entiers aura
  toujours des trous* (§1.2d) ; une droite bornée ne peut pas en avoir.
- **Anti-farm** : l'honneur n'est accordé que si l'attaquant n'a pas déjà tué **cette** victime
  depuis `PvpConfig::FENETRE_ANTI_FARM_HEURES`, lu directement dans `evenement_jeu` via l'index
  `(acteur_id, cree_le)`.
- L'XP PvP `mt_rand(180, 240)` en dur devient `PvpConfig::experiencePour()` ; le `/* todo */` part.

> **C'est le seul endroit où le journal devient une entrée de gameplay** et non plus seulement
> un log. C'est délibéré, borné dans le temps, et ça impose un invariant :
> `RETENTION_JOURS ≫ FENETRE_ANTI_FARM_HEURES`. La rétention ne doit jamais descendre sous la
> fenêtre anti-farm.

Cumuls `JOUEURS_TUES` et `MORTS`, classement PvP allumé. `attackPlayerVsPlayer` réduit à une
délégation : les messages descendent dans `PvpService`, **une seule source pour la réponse et
pour le journal**. `ActionType::KILL_PVP` peut enfin être implémenté en lisant le cumul avec un
instantané de départ — mais `user_quete.compteurs_depart` est aujourd'hui indexé par
`TypeCompteur::cle()` ; lui faire accueillir une clé `cumul:joueurs_tues` est une extension du
format (chaîne libre dans un JSON), à décider au moment de toucher le fichier. Sinon, statu quo :
`KILL_PVP` reste réservé et le dispatcher continue de jeter.

**Tests** : `HonneurServiceTest` — **la formule est monotone et sans trou sur [-200, +200]**
(c'est le test qui aurait attrapé le bug de §1.2d), bornes respectées ; `PvpServiceTest` — hors
portée, PA insuffisants, **PA réellement décomptés**, `summoningSickness`, même alignement,
anti-farm (2ᵉ kill de la même victime dans la fenêtre → 0 honneur).

---

### Lot 7 — Journal du joueur refondu *(optionnel)*

`POST /api/historique/infos` servi depuis `evenement_jeu` via `TypeEvenement::phrase()` +
`CategorieEvenement`, en **union** avec les lignes `historique` antérieures à la bascule
(catégorie « Archives »). `HistoryPage.jsx` gagne les vraies catégories que `REFONTE_PLAN`
l.313-318 avait refusé d'inventer — et la raison invoquée alors (« nécessiteraient un typage
des événements côté back ») est exactement ce que ce chantier livre. Aucun backfill (§1.2f).

---

## 4. Points de vigilance transverses

- **`content-dump.sh`** : 3 tables à ajouter à `EXCLUDE` (`evenement_jeu` lot 1, `joueur_cumul`
  lot 2, `guilde` lot 5) et 1 à retirer (`joueur_grade` lot 5). `is_excluded()` fait un **match
  exact** : une ligne par table, jamais de glob. Ne jamais toucher à `SANITIZED`.
- **`montant_or`** : ne jamais renommer en `or` (mot réservé MySQL).
- **Migrations sur données existantes** : `honneur NOT NULL` et `UNIQUE (user_id)` sur
  `joueur_guilde` cassent tous les deux si l'ordre n'est pas « nettoyage → contrainte ».
- **Le journal ne doit jamais devenir une source de vérité de gameplay**, à la seule exception
  de l'anti-farm du lot 6 — délibérée, bornée, et qui impose `RETENTION_JOURS ≫ FENETRE_ANTI_FARM`.
- **Le journal n'est pas un grand livre comptable.** La vérité sur ce que possède un joueur est
  son inventaire, dont `SacService` est déjà l'unique point de mutation. Le journal répond à
  « qu'est-ce qui s'est passé », pas à « combien a-t-il ». On peut donc rater un mouvement d'or
  sans que ce soit un défaut : confondre les deux, c'est se condamner à réconcilier deux sources.
- **`diePlayer` reste sans transaction** : dette explicite (lot 6).
- Textes joueur en français ; tokens `_tokens.scss` ; CSS Modules colocalisés ;
  `GameModal` + `ModalShell` pour toute modale ; jamais de `vw` ; jamais de Bootstrap.
- **Documentation** : `DOCUMENTATION.md` **§21** au fil des lots (tableaux Question/Choix/Pourquoi,
  « Invariants » en puces gras, « Pièges rencontrés », « Tests », « Reste à faire »), et une
  puce dense par lot structurant dans `CLAUDE.md` § Pièges connus, au format
  « **Nom (date, doc §21)** : X est l'UNIQUE point de mutation de Y ».
- **§21 doit préciser l'arbitrage §20.6** (« back-office de modération : inutile tant que le jeu
  n'a pas de population ») plutôt que le contredire en silence. Ce chantier ne l'infirme pas, il
  le distingue : un back-office de *modération* (annuler une vente, sanctionner) reste inutile ;
  un back-office d'*observation* est utile **précisément parce qu'il n'y a pas encore de
  population** — c'est l'outil qui dit si l'économie et le gameplay tiennent avant d'inviter
  des joueurs.

---

## 5. Séquence d'exécution

1. **Lot 1** — socle de journalisation + flux admin. *Valeur : on voit enfin ce qui se passe.*
2. **Lot 2** — cumuls + faits d'armes sur le profil. *Valeur : le joueur voit ses stats.*
3. **Lot 3** — page de classement publique. *Valeur : le lien mort du rail fonctionne.*
4. **Lot 4** — tableau de bord admin. *Valeur : la demande (a) est complète.*
5. **Lot 5** — guildes réelles. *Gameplay ; le bug « rejoindre ne fait rien » meurt.*
6. **Lot 6** — PvP réel. *Gameplay ; l'honneur devient une valeur défendable.*
7. **Lot 7** — journal du joueur refondu. *Optionnel, si le lot 1 a tenu ses promesses.*

Contrepartie assumée du choix « socle d'abord » : la catégorie **« classement des guildes »
n'existe pas au lot 3** et s'allume au lot 5. C'est une contrainte de conception utile, pas un
défaut — elle force le front à afficher les catégories que le serveur déclare, donc tout ajout
ultérieur est back-only.

**Ce chantier ne rend pas le PvP « fini » au sens gameplay.** Il le rend *correct* : gardes
serveur, honneur non troué, mort attribuée, anti-farm. Ce qui manquerait encore — zones PvP,
flag de consentement, butin PvP, sanctions — n'est pas dans le périmètre « statifier et logger »
et ne doit pas y entrer par la bande.
