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
- **Appui long sur un autre joueur** remplace le clic droit (menu contextuel d'échange,
  lot 9). **Tap sur un PNJ** ouvre sa modale. **Tap sur une interaction** ouvre le panneau
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

La carte occupe tout l'écran ; le HUD est **en surimpression**, en colonne à gauche —
même disposition que le web, mais flottante : une colonne OPAQUE de 340 pt prendrait
40 % de la largeur.

```
┌──────────────────────────────────────────────────────────────┐
│ ☰  Tutoriel Boisé  ◎                                         │
│ ┌──────────────────────┐                                     │
│ │ avatar  testrefonte  │                                     │
│ │ Niv.1 ▰▰▰▰ 400/400   │            (la carte)               │
│ │ 958 Or  600 PA 800 PM│         ~18 × 8 cases visibles      │
│ └──────────────────────┘                                     │
│ ┌──────────────────────┐                                     │
│ │ CIBLE Loup ▰▰ 40/120 │   ┌──────────────────────────────┐  │
│ └──────────────────────┘   │ XP ▰▰▰▰▰░░ 4123/10000        │  │
│                            │ [🗡][🏹][✨][ ][ ] │ [🧪][🧪]  │  │
│                            └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Le rail de navigation (Inventaire, Profil, Sorts, Établi, HDV, Artisanat, Guilde, Journal,
Classement) passe dans un **drawer** ouvert par le ☰ — fidèle au web, où Inventaire /
Profil / Sorts / Établi / HDV sont des **modales au-dessus de la carte** et non des pages.
En RN ce sont des routes `presentation: "modal"` : même sémantique, geste natif de
fermeture en prime.

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
| **9** | Social : guilde, classement, journal, échanges joueur-à-joueur (Mercure) | Un échange à deux aboutit |
| **10** | Donjons (groupe, salles, combat, sondage 2 s), artisanat, hôtel des ventes | — |
| **11** | Finitions : tutoriel natif, notifications, icône/splash, build EAS | — |

Les lots 0 à 6 constituent la v1 demandée ; 7 et 8 la complètent (ils sont dans le
périmètre « boucle de jeu » retenu) ; 9+ sont les suites.

## 5 bis. État au 13/11/2026 — lots 0 à 8 livrés

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
  src/core/                  config, http, auth, media, mapBackgrounds, types
  src/core/api/              users, map, target, quest, interaction, inventaire,
                             boutique, donjon
  src/core/store/            actions, reducers, index (forme identique au web)
  src/core/domain/           distance, items, caracteristiques
  src/ui/                    tokens, Panel, GaugeBar, Slot, GameButton,
                             SectionTitle, ModalShell, gameText, toast/
  src/game/map/              MapCanvas, CaseTile, InteractionSheet, useCarte
  src/game/hud/              TopBar, PlayerCard, TargetCard, ActionBar,
                             SpellSlotButton, ConsommableSlotButton, MenuDrawer
  src/game/pnj/              QuestDialogue, ShopView, ItemCard
```

**Reste à faire pour une v1 complète** : vérifier un combat de bout en bout contre un
monstre (nécessite d'amener un personnage sur une case de monstre), et le tutoriel
intro.js, qui n'est pas porté — l'app n'a pas encore d'équivalent natif des bulles.

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
- **Mercure** (lot 9) : hub sur le port hôte **5001**, abonnement par
  `POST /api/mercure/token` + query param `authorization` de l'EventSource. RN n'a pas
  d'`EventSource` natif → `react-native-sse`.
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
