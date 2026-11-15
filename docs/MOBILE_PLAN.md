# Application mobile Alcazan Forest — plan de portage React Native

> Rédigé le 13/11/2026. Cible : `alcazan-app/` (Expo SDK 53, RN 0.79, expo-router 5).
> Source : `alcazan-front-prod/` (CRA 4, React 18, Redux, CSS Modules) et la refonte
> graphique terminée le 20/07/2026 (`docs/REFONTE_PLAN.md`, bundles `design/`).

## 0. Décisions prises avant d'écrire une ligne

| Question | Décision | Pourquoi |
|---|---|---|
| Périmètre v1 | **Boucle de jeu complète** : connexion, carte + déplacement, ciblage/combat, barre de sorts, inventaire, profil, PNJ/quêtes | C'est la tranche qui rend l'app *jouable*. Guilde, HDV, artisanat, donjons, classement, journal, échanges viennent en lots 7+. L'administration (5 500 LOC, 10 éditeurs) ne sera **jamais** portée : clavier + souris + tableaux, elle n'a rien à faire sur un téléphone. |
| Rendu de la carte | **Caméra qui suit le joueur**, en **PAYSAGE** (révisé en cours de route, voir ci-dessous) | 24×16 cases ne tiennent pas sur un téléphone à une taille tapable. À 48 pt la carte fait 1152×768 pt : on en montre une fenêtre, centrée sur le joueur, pannable et zoomable. |

> **Révision du 13/11/2026 — paysage.** Le portrait a été essayé puis abandonné après
> relecture à l'écran : la grille fait 24×16, soit un rapport **3:2**, et en portrait on
> n'en voit qu'une fente verticale pendant que le HUD mange la moitié de la hauteur utile.
> En paysage, le HUD reprend la mise en page du web — une colonne à gauche (fiche joueur,
> cible) et la barre d'action en bas — et la fenêtre de carte passe de ~8×12 cases à
> ~18×8. L'orientation est verrouillée **à l'exécution** (`expo-screen-orientation`) et
> pas seulement dans `app.json` : Expo Go ignore le champ `orientation` du manifeste.
| Partage de code | **Core porté dans l'app** (`alcazan-app/src/core/`), mêmes noms et mêmes signatures que `alcazan-front-prod/src/services` + `src/store` | Le front web est un **sous-module git sur une autre branche** (`migration-typescript`) ; un workspace npm imposerait de restructurer les sous-modules et la chaîne Docker du front. La duplication est assumée et documentée : le contrat d'API étant côté serveur, c'est lui la vraie source unique. |

## 1. Ce qui est réutilisable, ce qui ne l'est pas

Le front web fait **15 576 LOC** de JS/JSX réparties en 179 fichiers, plus 70 feuilles SCSS.

- **Réutilisable tel quel (~1 570 LOC)** : `src/services/*Api.js` (de simples enveloppes
  axios), `src/store/{actions,reducers,index}.js` (Redux pur, `react-redux` fonctionne en
  RN), `src/services/distanceCalculator.js`, `carateristiqueService.js`. Il faut y changer
  **trois** choses : `localStorage` → `expo-secure-store`, `window.*` → rien,
  `require()` d'images → URL distantes.
- **À recréer intégralement** : tout le rendu. Pas de CSS en RN — ni cascade, ni
  `background-image`, ni `:hover`, ni `vh`, ni `conic-gradient` (le filtre de cooldown des
  sorts), ni `backdrop-filter` (les panneaux translucides), ni `dangerouslySetInnerHTML`
  (les messages de jeu que le back envoie en HTML avec des `<br/>`).
- **À jeter** : `react-router-dom` (→ expo-router), `react-toastify` (→ toast maison),
  `intro.js` (le tutoriel sera refait en bulles natives, lot 8), `react-dnd` /
  `react-beautiful-dnd` (le glisser-déposer de l'inventaire devient un appui long),
  `@ckeditor` et toute l'administration.

### Le piège qui structure tout : les images

Le front web charge les fonds de carte par `require("../../../img/map/" + mapId + ".png")`,
donc **au bundle webpack, depuis `src/img/`**. Un bundler Metro ne sait pas faire un
`require()` dynamique : il lui faut une **table statique** `{2: require('…/2.png'), …}`.

Deux régimes, et c'est la nature de l'image qui tranche :

- **Les fonds de carte sont embarqués.** Les 38 PNG sont déjà dans
  `alcazan-app/assets/images/maps/` — vérifié identiques à `src/img/map/` (même md5, mêmes
  ids). Un registre `mapBackgrounds.ts` les expose par id. C'est le bon choix pour eux :
  ils pèsent 21 Mo, ne changent jamais en cours de partie, et un fond manquant rendrait la
  carte injouable. Une **nouvelle** carte créée par le MapMaker exige en revanche une
  nouvelle release de l'app → le registre se rabat sur `mediaUrl('/img/map/<id>.png')`,
  qui ne marchera que si le fichier a aussi été déposé dans `public/img/map/` (aujourd'hui
  3 cartes sur 41 y sont). À documenter dans le MapMaker le jour venu.
- **Tout le reste vient du réseau** : les noms de fichiers sont en base (`pnj.skin`,
  `monstre.image`, `spell.icone`, `equipement.icone`, `objet.image`, `interaction.skin`,
  `alignement.icone`…), donc aucune table statique n'est possible. Ces dossiers sont tous
  présents dans `alcazan-front-prod/public/img/` et déjà servis en HTTP : **rien à changer
  côté web, back ou nginx.**

Côté app : une seule constante `MEDIA_URL` et un helper `mediaUrl(path)`. Aucun chemin
d'image n'est reconstruit ailleurs (règle déjà posée côté web par `itemUtils.itemImage()`).

## 2. Architecture cible

```
alcazan-app/
  app/                              # routes expo-router (fichier = écran)
    _layout.tsx                     # Providers : Redux, polices, SafeArea, Toast, garde d'auth
    index.tsx                       # redirige vers /carte ou /connexion
    connexion.tsx  inscription.tsx
    (jeu)/
      _layout.tsx                   # Stack : carte en plein écran + routes modales
      carte.tsx                     # l'écran-hub (carte + HUD)
      inventaire.tsx  profil.tsx  sorts.tsx   # presentation: "modal"
      pnj/[pnjId].tsx               # dialogue / échoppe / métier
  src/
    core/                           # ← port fidèle du web, zéro JSX
      http.ts                       # instance axios + intercepteur Authorization
      auth.ts                       # login / logout / token (SecureStore) / rôles
      media.ts                      # mediaUrl()
      api/{users,map,spells,inventaire,quest,pnj,target,buff,consommable}.ts
      store/{actions,reducers,index}.ts
      domain/distance.ts
    ui/                             # kit visuel natif
      tokens.ts                     # _tokens.scss transposé en objet TS
      {Panel,GaugeBar,Slot,GameButton,SectionTitle,ModalShell,Toast}.tsx
    game/
      map/{MapCanvas,MapCamera,Case,PlayerSprite,PnjSprite,...}.tsx
      hud/{PlayerCard,TargetCard,ActionBar,SpellSlot,ConsommableSlot,MenuRail}.tsx
```

### Règles d'architecture (les mêmes que côté web, transposées)

1. **Le serveur fait foi.** Aucune règle de jeu ne descend dans l'app : portée, PA, coût,
   prix, quantités sont revérifiés côté back. Le client ne fait que du confort d'affichage
   (grisage d'un sort hors de portée) — exactement comme le web aujourd'hui.
2. **Le store Redux garde la forme exacte du web** (`state.data.joueurState`,
   `state.data.target`, `state.data.positionJoueur`, …). Un correctif de logique écrit
   d'un côté se transpose alors mécaniquement de l'autre.
3. **⚠️ Le contrat de réponse des trois endpoints d'attaque** (doc §21.13 bis) vaut aussi
   ici : `damage, experience, newExperience, level, lifeJoueur, damageReturns,
   droppedItems, killMessage, message, pa, needRefresh`. Le web accède à
   `droppedItems?.[0] ?? ""` **défensivement** parce qu'une clé manquante y cassait
   l'écran entier ; le port doit conserver cette défense, pas la « nettoyer ».
4. **Les messages de jeu contiennent du HTML** (`<br/>`, parfois du gras). En RN il n'y a
   pas de `dangerouslySetInnerHTML` : un `renderGameText()` unique convertit `<br/>` en
   retours ligne et supprime le reste des balises. Jamais de parsing ailleurs.

## 3. Le cœur du sujet : la carte sur un écran de téléphone

### Ce que fait le web

`.cases` est une boîte flex de `100.8vh × 67.2vh` remplie de 384 `.case` de `4.19vh`
(48 px sur un écran 1080p), posées sur `background-image: url(img/map/<id>.png)` en
`cover`. Les monstres **ne sont pas dessinés** (ils sont peints dans l'image de fond et se
ciblent en marchant dessus) ; seuls joueurs, PNJ, boss et interactions ont un sprite.
Le survol affiche une étiquette.

### Ce que fait l'app

- **Grille en valeurs absolues**, plus de `vh` : `CELL = 48` points de base, carte
  `1152 × 768`. L'image de fond est un `expo-image` posé en `absoluteFill` sur ce cadre,
  `contentFit="fill"` (le `cover` du web ne sert qu'à absorber les ratios d'image : la
  grille, elle, est strictement 24×16 — le serveur ne renvoie jamais d'autre dimension).
- **Caméra** : un conteneur `Animated.View` avec `translateX/translateY/scale`
  (reanimated), piloté par un `PanGesture` + `PinchGesture` (gesture-handler, déjà présent
  dans le package.json). Quand `positionJoueur` change, la caméra se recentre en
  `withTiming(220ms)` — **sauf si le joueur vient de déplacer la vue à la main** (drapeau
  `userPanned`, remis à zéro par le bouton « Recentrer »), sinon la carte reprendrait la
  main sur le doigt du joueur.
- **Zoom** : borné `[0.55, 2.0]`, défaut `1.0`. À 1.0 et en paysage, on voit ~18×8 cases
  de 48 pt : au-dessus de la cible tactile de 44 pt, et c'est le rayon d'action utile
  (portée des sorts, adjacence des PNJ et des wraps).
- **Tap sur une case** = le `handleClick` du web, à l'identique : wrap adjacent → changement
  de carte ou modale de porte de donjon ; case dans `unabledCases` → déplacement. Rien
  d'autre ne se produit, et surtout aucune règle n'est ajoutée.
- **Le clic droit sur un autre joueur n'a pas d'équivalent au doigt** : on le CIBLE (tap),
  puis on touche son portrait dans la carte de cible → sa fiche publique, qui porte
  « Proposer un échange » (lot 9, voir « Profil d'un joueur et échanges »). **Tap sur un PNJ** ouvre sa modale. **Tap sur une interaction** ouvre le panneau
  de récolte.
- **Pas de survol** : l'étiquette joueur/PNJ devient une **info-bulle au tap** qui se ferme
  au tap suivant. ⚠️ `Map.getJoueur()` renvoie `props.user` entier pour soi mais un objet
  **reconstruit** pour autrui (doc : c'est le contrat de `Player`) — le port doit recopier
  cette projection champ pour champ, sous peine de refaire le bug de l'icône d'alignement
  invisible chez les autres.
- **Zones de donjon télégraphiées** (lot 10) : le `box-shadow` + hachures + `@keyframes`
  deviennent une bordure + un overlay semi-opaque animés par reanimated. Le contraste doit
  rester **volontairement fort** (constat en jeu : une teinte discrète disparaît sur les
  sols sombres).

### Mise en page de l'écran de jeu (paysage, 874 × 402 pt sur un iPhone 16 Pro)

La carte occupe tout l'écran ; le HUD est **en surimpression, dans les COINS**. La
première version reprenait la colonne du web (fiche joueur de 244 × 230 pt à gauche,
barre de dix emplacements en bas) : sur 400 pt de haut elle couvrait un tiers du décor.
Refonte du 13/11/2026 :

```
┌──────────────────────────────────────────────────────────────┐
│ (◉) TESTREFONTE        ┌ TUTORIEL BOISÉ ┐   ◎958 600PA 799PM ☰│
│  1  ▰▰▰ 400/400        (ou la CIBLE, au                      ◎│
│     ▰▰▰ 100/100         même emplacement)                     │
│     ── xp                                                     │
│                          (la carte)                           │
│                    ~21 × 10 cases visibles                    │
│                                                               │
│                                              ┌─────────────┐  │
│                                              │ [🏹] │[🧪][🧪]│  │
└──────────────────────────────────────────────┴─────────────┴──┘
```

- **Cartouche du joueur** (haut-gauche, ≈ 204 × 56) : portrait, niveau, PV/PM chiffrés
  DANS la barre, filet d'XP. Un appui ouvre le Profil.
- **Centre** : le nom de zone, remplacé par la **carte de cible** quand il y en a une
  (`TargetCard` reste monté en permanence : c'est lui qui déclenche le chargement de la
  cible).
- **Haut-droite** : or / PA / PM, le ☰, et le bouton **◎ de recentrage qui n'apparaît que
  si la vue a été déplacée à la main** (`onVueLibre`).
- **Bas-droite** : la barre d'action, qui ne dessine QUE les emplacements remplis (les
  vides servent au glisser-déposer du web ; ici l'assignation se fait dans l'écran Sorts).
- **Caméra** : zoom de départ 0,85 (≈ 21 × 10 cases, case de 41 pt), zoom minimal = la
  carte COUVRE l'écran, pincement ancré sous les doigts, vue bornée au bord du monde —
  sauf si ce bord enverrait le personnage sous le HUD (`marges` de `MapCanvas`).
- **Sur la carte, quatre signes et pas un de plus** : point clair = case où marcher ;
  pastille or = PNJ ou interaction (grise quand elle recharge) ; anneau or au sol = moi ;
  étiquette rouge = ma cible. Le pseudo d'autrui tient DANS sa case, présence et
  alignement en badges de coin.

Le rail de navigation (Inventaire, Profil, Sorts, Établi, HDV, Artisanat, Guilde, Journal,
Classement) est une **grille de tuiles** qui sort de la droite, ouverte par le ☰ : en
paysage une liste verticale n'en montrait que cinq. Inventaire / Profil / Sorts restent
des routes `presentation: "modal"`.

## 4. Le kit visuel

`src/ui/tokens.ts` transpose `_tokens.scss` à l'identique (or `#e3b64f`, fonds
`#06303b → #041e26`, panneaux `rgba(8,40,50,.85)` bordés `rgba(227,182,79,.3)`, PV
`#a91f1c→#e04a39`, PM `#1d5fa8→#3f8fdd`, XP `#b8892e→#e3b64f`, rayons 6/10/12/16).
Polices **Cinzel** (titres) et **Nunito Sans** (corps) via `@expo-google-fonts/*`.

Transpositions qui demandent un choix :

| Web | Mobile |
|---|---|
| `linear-gradient` (jauges, fonds) | `expo-linear-gradient` |
| `backdrop-filter: blur()` (panneaux) | `expo-blur` (`BlurView`), déjà au package.json |
| `conic-gradient` (cooldown de sort) | arc animé en `react-native-svg`, ou — plus simple et retenu — **voile sombre dont la hauteur décroît** + compte à rebours chiffré |
| `:hover` | appui long / tap |
| `box-shadow` | `shadow*` iOS + `elevation` Android (valeurs figées dans les tokens) |
| `text-transform`, `letter-spacing` | supportés tels quels |

## 5. Lots de travail

| Lot | Contenu | Fini quand |
|---|---|---|
| **0** | Fondations : deps, `MEDIA_URL`/`API_URL`, polices, tokens, kit UI, registre des fonds de carte, ménage du gabarit Expo | L'app démarre sur un écran aux couleurs du jeu |
| **1** | Core : `http`, `auth` (SecureStore), les 9 modules d'API, le store Redux | Un écran de debug affiche `joueur/data/minimal` |
| **2** | Connexion / inscription / garde d'auth / déconnexion | On se connecte avec un vrai compte et le token survit au redémarrage |
| **3** | Carte : grille, fond, caméra, sprites, déplacement, wraps | On se déplace au doigt d'une carte à l'autre |
| **4** | HUD : carte joueur, carte cible, barre d'action, XP, PA/PM, toasts | L'état du personnage est juste et vivant |
| **5** | Combat : ciblage (joueur/monstre/boss), sorts, cooldowns, butin, mort | On tue un monstre et on voit l'XP et le butin |
| **6** | PNJ : dialogue, quêtes (`quest/action`), échoppe, métiers ; interactions de case (récolte) | La première quête du tutoriel se termine sur mobile |
| **7** | Inventaire + équipement + profil (caractéristiques, karma) | On équipe une arme et les stats bougent |
| **8** | Sorts (grimoire, assignation des 8 slots), consommables | On réassigne sa barre |
| **9** | Social : guilde ✅, classement ✅, journal ✅, échanges joueur-à-joueur ✅ (Mercure), fiche publique d'un joueur ✅ | Un échange à deux aboutit |
| **10** | Donjons (groupe, salles, combat, sondage 2 s), artisanat ✅, hôtel des ventes ✅ | — |
| **11** | Finitions : tutoriel natif, notifications, icône/splash, build EAS | — |

Les lots 0 à 6 constituent la v1 demandée ; 7 et 8 la complètent (ils sont dans le
périmètre « boucle de jeu » retenu) ; 9+ sont les suites.

## 5 bis. État au 14/11/2026 — lots 0 à 9 livrés, 10 entamé

Vérifié dans le simulateur iOS (iPhone 16 Pro, Expo Go, back Docker local) :
connexion sur un vrai compte, carte du Tutoriel Boisé avec sprites et autres joueurs,
déplacement, dialogue d'un PNJ, inventaire, fiche de personnage, grimoire, toasts.

```
alcazan-app/
  app/_layout.tsx            Providers + garde d'auth + verrou paysage
  app/connexion.tsx          app/inscription.tsx
  app/(jeu)/_layout.tsx      carte plein écran + routes modales
  app/(jeu)/carte.tsx        l'écran-hub
  app/(jeu)/inventaire.tsx   profil.tsx   sorts.tsx   pnj/[pnjId].tsx
  app/(jeu)/classement.tsx   journal.tsx   guilde.tsx   hotel.tsx
  app/(jeu)/artisanat.tsx    etabli.tsx
  src/core/                  config, http, auth, media, mapBackgrounds, types,
                             preferences (réglages de confort, hors Redux)
  src/core/api/              users, map, target, quest, interaction, inventaire,
                             boutique, donjon, classement, historique, guilde,
                             hotelVente, craft, metier
  src/core/store/            actions, reducers, index (forme identique au web)
  src/core/domain/           distance, items, caracteristiques, temps, texte
  src/ui/                    tokens, Panel, GaugeBar, Slot, GameButton,
                             SectionTitle, ModalShell, gameText, toast/,
                             Onglets, Chip, SearchField, Vignette, Vide, confirmer
  src/game/map/              MapCanvas, CaseTile, InteractionSheet, useCarte
  src/game/hud/              TopBar, PlayerCard, TargetCard, ActionBar,
                             SpellSlotButton, ConsommableSlotButton, MenuDrawer,
                             CroixDirectionnelle
  src/game/pnj/              QuestDialogue, ShopView, ItemCard
  src/game/artisanat/        MetierCard, RecetteCard, FileFabrication
  src/game/hotel/            HotelAcheter, HotelVendre, HotelMesVentes, LigneLot
```

### Écrans du menu (14/11/2026) — classement, journal, guilde, hôtel, artisanat, établi

Les six entrées du menu qui répondaient « arrive dans un prochain lot » sont livrées :
du lot 9 il ne restait que les **échanges joueur-à-joueur** (livrés le même jour, voir
plus bas), du lot 10 il ne reste que les **donjons**. Vérifié à l'écran dans le simulateur : les six écrans, un dépôt puis un
retrait à l'hôtel des ventes, un retrait à l'établi. **Non vérifié**, faute de données sur
le compte de test : un achat et la pagination de l'hôtel (catalogue vide), la gestion de
guilde côté baron/officier (le compte n'est que recrue), la fondation d'une guilde, le
lancement d'une fabrication (ingrédients manquants), Android.

Ces écrans ne sont pas des pages web rétrécies. Les règles de dessin qu'ils partagent —
à reprendre telles quelles pour les suivants :

- **Deux colonnes, jamais une pile.** Un rail à gauche (~220 pt, `ScrollView` en
  `flexGrow: 0`) porte les filtres ou la liste maîtresse ; la colonne de droite
  (`flex: 1, minWidth: 0`) porte le contenu. 400 pt de haut ne supportent pas une barre
  de filtres AU-DESSUS d'une liste : elle en mangerait le tiers.
- **Le détail va dans la colonne d'à côté, pas dans la ligne.** Guilde : toucher un membre
  remplace la fiche de la guilde par ses actions (grades, transmettre, exclure). Hôtel :
  toucher un objet du sac remplit le formulaire de vente à droite. Des micro-boutons par
  ligne (patron du web) font des cibles de 20 pt.
- **`Onglets`** sous l'en-tête quand l'écran a plusieurs vues (hôtel, guilde), avec une
  pastille numérique (lots en vente, candidatures en attente).
- **Cibles de 36 pt minimum** (`Chip`), et un `Chip` porte une information en plus de son
  libellé quand il le peut (mon rang dans chaque catégorie du classement, le nombre de
  lignes de chaque nature du journal).
- **Tout ce qui coûte ou ne s'annule pas passe par `confirmer()`** (`Alert` native) :
  acheter, retirer une annonce, annuler une fabrication, exclure, transmettre, dissoudre,
  quitter, fonder. Un pouce dérape plus qu'une souris.
- **Les champs de saisie sont EN HAUT de leur colonne** : en paysage le clavier couvre la
  moitié basse de l'écran. Les quantités se règlent au pas-à-pas (− / + / Max), pas au
  clavier.
- **Le mode de fabrication est GLOBAL à l'écran** (deux `Chip` + la phrase du serveur), pas
  un sélecteur par recette comme sur le web : une liste déroulante par carte ne tient pas.
- **Le serveur fait foi et le dit lui-même** : `realisable`, `prete`, `peutGerer`,
  `peutPromouvoir`, `estMien`, `rang`, `curseurs` (frais de dépôt) descendent tels quels.
  Aucun chiffre de règle en dur côté app, aucune durée décomptée localement
  (`core/domain/temps` recalcule depuis les dates du serveur).

Écart ASSUMÉ avec le web : l'hôtel des ventes liste ses lots en lignes (`LigneLot`) au
lieu de réutiliser la carte d'échoppe — une grille de cartes ne montrait que quatre
annonces à la fois.

**Ciblage automatique des monstres de plein air** (`useCarte.majCibleMonstre`) : marcher
sur une case `hasMonstre` cible le monstre, la quitter décible — comme le web. Il n'est
joué qu'à l'ARRIVÉE sur une case (premier chargement, déplacement, changement de carte),
jamais sur un simple rechargement `needRefresh` : sinon le monstre qu'on vient de tuer
serait reciblé aussitôt, ce que le web ne fait pas non plus.

**Reste à faire pour une v1 complète** : vérifier un combat de bout en bout contre un
monstre (nécessite d'amener un personnage sur une case de monstre), et le tutoriel
intro.js, qui n'est pas porté — l'app n'a pas encore d'équivalent natif des bulles.

**Cooldown des sorts** : notion de PvP. `SpellSlotButton` ne le déclenche que pour un sort
lancé sur soi ou contre un autre joueur ; contre un monstre, un boss ou un renfort on
enchaîne sans attendre (le port l'appliquait à tort à toutes les cibles — le web ne le
fait que pour `player`).

### Profil d'un joueur et échanges (14/11/2026)

**Fiche publique** (`app/(jeu)/joueur/[pseudo].tsx`, port de `ProfilJoueur.jsx`) : on y
arrive en touchant le PORTRAIT de la carte de cible quand la cible est un joueur (le lien
`/profil/<pseudo>` de `Target.jsx`). Trois colonnes — qui il est + ce qu'on peut lui
proposer, ce qu'il porte, le détail de la pièce touchée. Lecture seule. Amis et messagerie
ne sont pas portés. C'est aussi la **porte d'entrée de l'échange** : « Proposer un
échange » y remplace le clic droit du web (`PlayerContextMenu`). Le bouton se grise si la
cible est à plus d'une case, mais ce n'est qu'un confort : le serveur revérifie.

**Échange joueur-à-joueur** — faisable sans rien toucher au back, tous les endpoints
existaient. Le port tient en cinq pièces :

| Pièce | Rôle |
|---|---|
| `core/api/echange.ts` | port de `EchangeApi.js`, mêmes noms, mêmes payloads |
| `core/sse.ts` + `core/useMercure.ts` | le temps réel (voir ci-dessous) |
| `game/echange/EchangeHost.tsx` | l'hôte SANS rendu, monté UNE fois dans `app/(jeu)/_layout.tsx` |
| `game/echange/EchangeBandeau.tsx` | ce qui se voit sur la carte |
| `app/(jeu)/echange.tsx` | la session ouverte |

L'état Redux `data.echange = { etat, invitations }` est celui du web au champ près
(`UPDATE_ECHANGE` ignore toujours une `version` plus ancienne de la même session).

- **L'hôte est dans le LAYOUT du jeu, pas dans la carte.** Sur le web `EchangeHost` rend
  bannière et modale au même endroit ; ici une route modale est un écran à part, donc
  l'hôte ne rend rien et ce qui se voit est réparti entre le bandeau (carte) et l'écran
  d'échange. Monté dans le layout, il reçoit une invitation même inventaire ouvert.
- **Temps réel : React Native n'a pas d'`EventSource`.** `core/sse.ts` lit le flux sur un
  `XMLHttpRequest` (`responseText` grandit au fil de l'eau dès `readyState 3`) — ~70
  lignes, aucune dépendance native, donc ça marche dans Expo Go. `useMercure` refait la
  reconnexion À LA MAIN, avec un jeton NEUF à chaque tentative (il expire, et il doit
  couvrir le topic de la session en cours). ⚠️ L'adresse du hub vient de `MERCURE_URL`
  (`core/config.ts`) et NON du `mercureUrl` renvoyé par `POST /mercure/token` : le back y
  répond sa propre vision (`localhost:5001`), fausse depuis un vrai téléphone.
- **Deux filets que le web n'a pas** : un sondage REST de repli tant que le hub n'est pas
  joint (4 s pendant une session, 20 s sinon), et une resynchronisation au retour au
  premier plan (`AppState`) — iOS suspend le flux d'une app en arrière-plan, et une
  session ne vit que cinq minutes.
- **L'écran d'échange est REDESSINÉ pour le paysage** : le web empile « mon offre / son
  offre » au-dessus du sac, ce qui ne tient pas dans ~260 pt de haut. Ici trois colonnes
  dans l'ordre du geste — MON SAC (je touche) → MON OFFRE → SON OFFRE. Toucher un objet
  en propose UN de plus, l'appui long propose toute la pile ; « − » et ✕ sur mes lignes.
  Le champ d'or est EN HAUT de sa colonne : vérifié, il reste visible clavier ouvert.
- **Interface pessimiste, comme le web** : chaque geste part avec `expectedVersion`, rien
  ne bouge avant l'état renvoyé ; un 409 fait adopter l'état frais (`useEchange.executer`).
  Pas de grisé pendant l'envoi : à ~100 ms par geste, toute la colonne clignoterait.
- **✕ REPLIE l'écran, il n'annule pas** (écart assumé avec le web, où la croix annule) :
  elle est sous le pouce, et un échange annulé par mégarde oblige les deux joueurs à tout
  refaire. Le bandeau de la carte propose alors « Reprendre ». Annuler est un bouton à
  part, derrière `confirmer()`. Pour la même raison la route a `gestureEnabled: false`.
- **L'écran s'ouvre quand la session S'OUVRE** (effet sur l'id de la session `ouvert`),
  pas « tant qu'une session est ouverte » : sinon le replier le rouvrirait en boucle.
- **Le bandeau est au-dessus de la barre d'action, centré** : c'est le seul endroit qui
  ne recouvre ni la croix, ni les sorts, ni les messages (en haut). Une seule invitation
  affichée à la fois.

Vérifié dans le simulateur avec un second joueur piloté par l'API : invitation reçue en
temps réel, invitation envoyée depuis la fiche, ouverture automatique à l'acceptation,
ajout/retrait d'objets, pile entière à l'appui long, or saisi au clavier, offre adverse
mise à jour en direct, double confirmation → « Échange conclu ! » (or et sac vérifiés en
base), repli puis reprise, annulation par l'autre joueur. **Non vérifié** : l'expiration
des cinq minutes à l'écran, le chemin 409, le sondage de repli (hub coupé), le retour
d'arrière-plan, Android, et un vrai téléphone (où `MERCURE_URL` doit désigner la machine
de dev — port 5001 — ou le hub de production).

### Croix directionnelle et messages (14/11/2026)

**Croix directionnelle** (`game/hud/CroixDirectionnelle`), coin bas-gauche de la carte,
translucide au repos, désactivable dans le menu (`core/preferences`, propre à
l'appareil, conservée entre deux lancements).

- **Elle n'ajoute aucune règle de déplacement** : `useCarte.pasVers(dx, dy)` cherche la
  case voisine et rejoue `taperCase` dessus. Cases accessibles, portes, arbitrage du
  serveur : tout est commun avec le tap, les deux ne peuvent pas diverger.
- **Un disque, pas quatre boutons** : le pouce glisse d'une direction à l'autre sans se
  relever, et les diagonales (le jeu a huit voisines) tombent entre deux flèches — 60°
  par flèche, 30° par diagonale, zone morte au centre.
- **Un appui bref = UN pas** : la répétition ne démarre qu'après 320 ms de maintien, puis
  marche à ~6 cases/s. Elle s'ARRÊTE sur un mur, un refus du serveur ou un changement de
  carte : continuer empilerait un toast par tentative, ou ferait retraverser la porte
  qu'on vient de franchir.
- `seDeplacer`/`changerDeCarte` rendent maintenant un booléen et `taperCase` une
  `IssuePas` (`'pas' | 'carte' | 'rien'`) : c'est ce qui dit à la boucle si elle peut
  enchaîner. Un tap sur la carte ignore cette valeur.
- Les préférences sont HORS du store Redux (dont la forme est celle du web) et rangées
  dans `expo-secure-store`, seul stockage persistant déjà embarqué.

**Messages (toasts)** :

- **Largeur jusqu'à 620 pt, texte centré** : un compte rendu d'attaque tient sur une ou
  deux lignes au lieu d'une colonne étroite.
- **Durée selon la LONGUEUR** (`dureeLecture` : 1 s + 38 ms par caractère, entre 2 s et
  5,5 s) et non plus 4 s fixes ; une barre de temps au pied du message montre ce qu'il
  reste. Un tap le ferme toujours.
- **Le même message encore affiché est remplacé, pas empilé.**
- **Sur la carte ils s'affichent EN HAUT**, sous le bandeau du HUD : le bas appartient
  aux pouces (croix à gauche, barre d'action à droite). Dans les écrans modaux ils
  restent en bas, le haut portant l'en-tête et les onglets. Le fournisseur tranche avec
  `usePathname() === '/carte'`.

### Pièges rencontrés pendant le portage (à ne pas redécouvrir)

- ⚠️ **`??` n'est pas `||` sur un état initialisé à 0.** `joueurState.mapId ??
  etat.mapId ?? user.mapId` retenait le `0` de l'état initial et demandait la carte 0 :
  le serveur répond **500** et l'écran reste sur son chargement. Sur un identifiant qui
  vaut 0 quand il est « absent », c'est `||` qu'il faut.
- ⚠️ **Un `fetch` sans `catch` laisse un chargement éternel.** Le web s'en tire avec la
  console du navigateur ; sur mobile, un écran bloqué ne dit rien du tout. Chaque
  chargement d'écran attrape et toaste.
- ⚠️ **Ne pas marquer la caméra « déplacée à la main » sur `onTouchesDown`** : ce
  gestionnaire se déclenche à CHAQUE contact, donc à chaque tap sur une case, et la
  caméra cesserait définitivement de suivre le joueur. C'est `onStart` du `Pan` (après le
  seuil de 10 pt) qui fait foi.
- ⚠️ **Expo Go ignore `orientation` dans `app.json`** (il lit sa propre configuration
  native) : le verrou doit être posé à l'exécution par `expo-screen-orientation`.
- ⚠️ **Le clavier matériel du simulateur suit la disposition du Mac** : taper
  `testrefonte@local.test` en AZERTY donne `testrefonte2locql`. Passer par le
  presse-papier (`xcrun simctl pbcopy booted` puis appui long → Coller).
- ⚠️ **`.expo/types/router.d.ts` peut appartenir à `root`** (héritage d'un ancien
  `npm` lancé en sudo) : Metro échoue alors à régénérer les routes typées, et `tsc`
  valide des routes qui n'existent plus. Le supprimer suffit, le dossier parent étant à
  l'utilisateur.
- ⚠️ **En paysage, un toast étalé sur toute la largeur recouvre le HUD** : largeur bornée
  et centrage, et un décalage bas supérieur à la hauteur de la barre d'action.
- ⚠️ **En paysage l'encoche est sur un PETIT côté** : `insets.left`/`right` valent ~60 pt
  et `insets.top` 0. Tout écran qui ne lit que `top`/`bottom` (réflexe du portrait) a sa
  première colonne sous l'encoche — c'était le cas de `ModalShell` et du menu.
- ⚠️ **`<Modal>` de React Native ne connaît que le portrait sur iOS** sans
  `supportedOrientations` : dans une app verrouillée en paysage, préférer un voile en
  `absoluteFill` rendu en dernier par l'écran (patron `MenuDrawer`, `InteractionSheet`).
- ⚠️ **Un `ScrollView` grandit par défaut** (`flexGrow: 1`) : `width: 260` ne le retient
  pas dans une rangée, il faut `flexGrow: 0`. Et un plancher `minWidth` en points sur des
  colonnes `flex: 1` les fait SORTIR de l'écran dès que la somme dépasse la largeur utile.
- ⚠️ **Un `scale` nu zoome depuis l'origine de la vue**, pas depuis les doigts : il faut
  mémoriser le point du monde sous le pincement et recalculer la translation. Et le
  panoramique doit être limité à UN doigt (`maxPointers(1)`), sinon les deux gestes
  écrivent la même translation et la carte tremble.
- ⚠️ **Le réducteur ignore les clés `undefined`** de `updateJoueurState` (seul écart avec
  celui du web) : les réponses d'attaque n'ont pas toutes les mêmes clés, et le spread nu
  affichait « undefined PA » jusqu'au rechargement suivant.
- ⚠️ **Un Metro lancé avant une suppression de routes garde l'ancien arbre** (écran rouge
  `ENOENT … app/(drawer)/_layout.tsx`) : le relancer avec `--clear`.
- ⚠️ **Sur iOS un toast rendu à la racine passe SOUS les routes modales.** Une route en
  `presentation: 'modal'` est un contrôleur NATIF présenté par-dessus toute la hiérarchie
  React : aucune confirmation, aucun refus ne se voyait dans l'inventaire, le profil ou
  l'hôtel des ventes — on les découvrait en refermant l'écran. L'hôte des toasts est donc
  rendu dans un `FullWindowOverlay` (`react-native-screens`), **monté à la demande et
  re-monté à chaque toast** (`key`) : UIKit empile par ordre d'arrivée, un hôte monté au
  lancement se retrouve sous la première modale ouverte après lui. Vérifié : les taps de
  déplacement passent toujours à côté d'un toast affiché. Android n'en a pas besoin.
  Corollaire : un message déjà à l'écran est RE-MONTÉ quand le suivant arrive — sa barre
  de temps repart donc de son échéance (`expireA`), pas de zéro, et il ne rejoue pas son
  animation d'entrée.
- ⚠️ **`locationX`/`locationY` d'un toucher ne sont fiables qu'à la POSE du doigt** : en
  glissant, ils sont mesurés depuis la vue survolée. La croix directionnelle relève son
  origine à l'écran au premier contact (`pageX − locationX`) puis ne lit plus que
  `pageX`/`pageY`, et tout son décor est en `pointerEvents: 'none'`.
- ⚠️ **Le pavé numérique d'iOS n'a pas de touche « Retour »** : en paysage il ne se referme
  plus et masque le bouton de validation. Champs de prix en
  `keyboardType="numbers-and-punctuation"`.
- **Ni `Intl` ni `new Date("YYYY-MM-DD HH:mm:ss")`** — par précaution, pas après un bug
  constaté : ce format de date (celui du journal) n'est pas de l'ISO et son analyse n'est
  pas garantie d'un moteur JS à l'autre, pas plus que la présence des formats localisés.
  `core/domain/temps.dateServeur()` découpe la chaîne à la main et
  `core/domain/texte.nombre()` pose les séparateurs de milliers par regex.
- ⚠️ **Les routes typées d'expo-router ne connaissent pas un écran qu'on vient de créer**
  tant que Metro n'a pas régénéré `.expo/types` : `router.push('/(jeu)/etabli' as never)`,
  comme le fait déjà `MenuDrawer`.
- ⚠️ **Recharger à chaud le fournisseur RACINE (`ToastProvider`) pendant qu'une modale est
  ouverte fige la pile native** : l'écran reste affiché, ne répond plus et ignore les
  liens. Ce n'est pas un bug de l'app — relancer Expo Go
  (`xcrun simctl terminate booted host.exp.Exponent`, puis rouvrir l'URL `exp://`).
- **Ouvrir un écran sans passer par le menu** :
  `xcrun simctl openurl booted "exp://127.0.0.1:<port>/--/hotel"` (ou `journal`, `guilde`,
  `classement`, `artisanat`, `etabli`) pousse la route directement.
- **Vérifier à l'écran** : le simulateur capture en portrait une app en paysage. Pour un
  tap, un point paysage `(x, y)` se vise en `(402 − y, x)` ; pour lire une capture, la
  tourner de 270° (`sips -r 270`). La connexion passe par le presse-papier
  (`xcrun simctl pbcopy booted` puis appui long → Paste), jamais par le clavier.

## 6. Points de vigilance recensés avant de commencer

- **`localhost` n'existe pas sur un téléphone physique.** Le simulateur iOS, lui, atteint
  l'hôte sur `localhost`. `API_URL`/`MEDIA_URL` sont donc surchargeables
  (`app.json → extra`, variables `EXPO_PUBLIC_*`), avec un défaut `localhost` pour le
  simulateur et l'IP LAN à renseigner pour un vrai appareil.
- **Le JWT expire en 1 h** (`exp - iat = 3600`). Le web laisse l'utilisateur tomber sur un
  401 ; l'app doit au minimum détecter l'expiration et renvoyer proprement vers la
  connexion (intercepteur axios sur les 401). Pas de refresh token côté back : ne pas en
  inventer un.
- **`jwt-decode` v3 dépend de `atob`**, absent de Hermes. Prendre la v4 (autonome).
- **Pas de scheduler côté client, mais un sondage obligatoire en donjon** : le tick serveur
  est paresseux, c'est `POST /api/donjon/combat` toutes les 2 s qui fait avancer la
  rencontre (doc §13.7). Au lot 10, ce sondage doit s'arrêter quand l'app passe en
  arrière-plan (`AppState`) — sinon on consomme de la batterie pour rien, et le combat
  avance sans spectateur.
- **Mercure** (lot 9, fait) : hub sur le port hôte **5001**, abonnement par
  `POST /api/mercure/token` + query param `authorization`. RN n'a pas d'`EventSource`
  natif → client maison `core/sse.ts` sur XHR (pas de `react-native-sse` : une
  dépendance de moins pour ~70 lignes).
- **`react-native-reanimated` exige son plugin Babel** en dernière position de
  `babel.config.js`, et `react-native-gesture-handler` un `GestureHandlerRootView` à la
  racine. Les deux dépendances sont déjà installées mais **ni l'une ni l'autre n'est
  câblée** dans le scaffold actuel.
- **Le scaffold `alcazan-app` est encore le gabarit `create-expo-app`** : deux groupes de
  routes concurrents (`(tabs)` et `(drawer)`), `_layout.tsx` qui monte `(drawer)`, et des
  composants de démo (`HelloWave`, `ParallaxScrollView`, `Collapsible`). Ils sont supprimés
  au lot 0 — les garder ferait croire à des écrans qui n'existent pas.
- **`orientation: "landscape"`** dans `app.json` contredit la décision « portrait + caméra »
  → passe à `"portrait"` (puis `"default"` au lot 11 si on veut la rotation).
