# Refonte graphique & réécriture CSS — plan de référence

Objectif double, mené conjointement : reproduire au pixel près les maquettes du dossier
`design/` (Claude Design, palette or / vert sombre, Cinzel + Nunito Sans) ET remplacer
l'intégralité du CSS legacy par un système propre. **La logique de jeu (state Redux,
appels API, gameplay) n'est jamais modifiée** — uniquement markup + styles, en
rebranchant les vraies données là où les maquettes ont des valeurs en dur.

## Sources de vérité

| Écran | Bundle | Référence visuelle |
|---|---|---|
| Page principale | `design/page_principale/` | `MainGamePage.jsx` + `README.md` (tokens, dimensions, hovers) |
| Profil (modale) | `design/react/` | `ProfileScreen.jsx` + `ProfileScreen.README.md` |
| Inventaire | `design/inventaire/` (repris dans `design/react/`) | `InventoryModal.jsx` |
| Sorts | `design/sorts/` (repris dans `design/react/`) | `SpellsModal.jsx` / `SpellbookModal.jsx` |
| Guilde | `design/guilde/` (repris dans `design/react/`) | `GuildModal.jsx` |
| Historique | `design/guilde/` + `design/react/` | `HistoryModal.jsx` |

`design/react/` est le bundle le plus général : il reprend les autres dossiers et ajoute
la modale Profil. Les `.jsx` des bundles sont des **références** (styles inline,
autonomes) : on ne les copie pas, on les recrée selon les conventions ci-dessous.
Les assets des bundles sont en basse résolution : **on garde les assets du jeu**
(`src/img/`, `public/img/`) ; on ne copie un asset de bundle que s'il n'existe aucun
équivalent dans le jeu.

## Architecture CSS cible

```
src/styles/
  app.scss        ← point d'entrée unique (importé par index.js)
  _tokens.scss    ← design tokens en custom properties CSS (:root)
  _base.scss      ← reset léger, body, typo par défaut, scrollbars, liens
  _legacy.scss    ← ancien CSS trié, TRANSITOIRE : vidé phase après phase, supprimé en phase 7
src/components/ui/            ← kit UI réutilisable (vrais CSS Modules)
  panel/Panel.jsx|.module.scss       carte or/vert (radius 16, fond rgba(8,40,50,.85))
  gaugeBar/GaugeBar.jsx|.module.scss barres PV / PM / XP (variantes hp|mp|xp)
  slot/Slot.jsx|.module.scss         slot de sort/potion (54px, mini 25px, variante vide dashed)
  gameButton/GameButton.jsx|.module.scss  bouton or outline (Déconnexion…)
```

Règles :
1. **Vrais CSS Modules** : chaque composant importe SON `X.module.scss`
   (`import styles from './X.module.scss'`). Plus aucun `*.module.scss` importé dans
   `app.scss`. Classes en camelCase (`styles.playerCard`).
2. Les couleurs / rayons / ombres / transitions viennent **exclusivement** de
   `_tokens.scss` (`var(--gold)`, …). Aucun hex en dur dans les modules.
3. Les classes-marqueurs fonctionnelles (`lifeBar`, `manaBar`, `pa`, `pm`, `spell-bar`,
   `spell-container`, `spell-filter-<id>`, `consommable-filter-<id>`, `pnj`) sont des
   hooks pour intro.js et les `querySelector` de cooldown : **conservées dans le markup,
   sans style**. Ne jamais les supprimer sans adapter les consommateurs.
4. Polices : Cinzel (titres, 500/600/700) + Nunito Sans (corps, 400/600/700/800),
   chargées une seule fois dans `public/index.html`. Les anciennes polices (Akaya
   Telivigala, MedievalSharp, Press Start 2P, Montserrat, Modern Antiqua) disparaissent
   avec les pages qui les utilisaient.
5. Bootstrap (CDN dans `index.html` + classes utilitaires) : encore requis par les pages
   non refaites. **Interdit dans le code refondu** ; retiré en phase 7.
6. À chaque phase : le CSS legacy remplacé est **supprimé** de `_legacy.scss` dans la
   même PR. Aucun style mort ne survit à sa phase.

## Design tokens (extraits de `design/page_principale/README.md`)

| Token | Valeur |
|---|---|
| Or / hover / soft / softer | `#e3b64f` / `#f2d488` / `rgba(227,182,79,.3)` / `rgba(227,182,79,.12)` |
| Fond page | `linear-gradient(160deg, #06303b, #041e26 70%)` |
| Panneau / panneau opaque | `rgba(8,40,50,.85)` / `#08222a` |
| Header / barre d'action | `rgba(4,26,33,.6)` / `rgba(4,26,33,.95)` |
| Encre (texte sur or) | `#05242c` |
| Texte / dim / mute / faint | `#eef6f6` / `#b7d2d6` / `#9fc3c9` / `#7fa8ae` |
| PV (dégradé, label) | `#a91f1c → #e04a39`, `#ef7b6d` |
| PM (dégradé, label) | `#1d5fa8 → #3f8fdd`, `#6fb4f0` |
| XP (dégradé) | `#b8892e → #e3b64f` |
| PA (label) | `#f0a95c` |
| Track de barre | `rgba(255,255,255,.08)` |
| Slot vide (dashed) | `rgba(159,195,201,.3)` |
| Rayons | 6 (barres/mini-slots) · 8–10 (boutons/slots) · 12 (logo/nav) · 16 (cartes) |
| Ombres | page `0 20px 60px rgba(0,0,0,.5)` · avatar `0 6px 18px rgba(0,0,0,.5)` |
| Transition | `.15s` (hovers : slots lift -2px, nav couleur, rail fond) |

La maquette est composée en 1920×1080 ; l'implémentation utilise un layout fluide
(flex, `100vh`) qui respecte les proportions (header 72px, colonne gauche 340px).

---

## Phase 0 — Design system (FAIT dans cette session)

**Fichiers** : `src/styles/{app,_tokens,_base,_legacy}.scss`, `public/index.html`
(polices), `src/components/ui/*`.

- [x] Tokens en custom properties, palette complète ci-dessus.
- [x] Base : body dégradé vert sombre, Nunito Sans par défaut, scrollbars or/vert fines,
      sélection, liens.
- [x] Kit UI : `Panel`, `GaugeBar` (hp/mp/xp), `Slot` (md/mini/vide), `GameButton`.
- [x] `_legacy.scss` = ancien `app.scss` trié ; suppression des fichiers styles morts
      (`settings.scss`, `app.css`, `_debug/_flex/_mixins/_utiles/_base` anciens,
      ~30 `*.module.scss` vides).

## Phase 1 — Page principale `/carte` (FAIT dans cette session)

**Maquette** : `design/page_principale/`. **Fichiers** : `Navbar`, `MapPage`,
`UsernameBlock` (fiche joueur), `SideMenu` (rail), `UserStatsBlock` (ressources),
`SpellBar` + `Spell` + `Consommable` + `Buff` (barre d'action), `index.js` (footer).

Données réelles rebranchées : nom de zone (`Map` → `mapInfo.nom`, remonté via le
callback `setMapLoaded`), pseudo/`nomClasse`/niveau/PV/PM (`UsersApi.find()` +
`joueurState`), Or/PA/PM (`joueurState`), XP (`getExpJoueur`), sorts/consommables/buffs
(APIs existantes). `Target` et le bloc notification restent dans la colonne gauche.

Checklist de validation visuelle (vérifiée en session le 17/07/2026, viewport 1920×1080) :
- [x] Header 72px : logo 46px radius 12, titre Cinzel 22 or + sous-titre uppercase,
      nav segmentée (actif = fond or texte encre, hover = `#f2d488`), bouton
      Déconnexion outline or uppercase.
- [x] Colonne gauche 340px : fiche joueur (zone Cinzel uppercase + label ZONE,
      séparateur dégradé, avatar 92px rond bordure or + badge Niv., barres SANTÉ/MANA
      12px labels colorés), rail 6 items (icône 42px + label + chevron ›, hover fond
      or 12%), panneau ressources (Or or / PA orange / PM bleu).
- [x] Zone principale : carte encadrée (radius 16, bordure or), barre d'action
      (ligne XP label Cinzel + valeur, 8 slots sorts 54px + vides dashed, séparateurs
      verticaux, 2 potions, grille buffs 3×2 de 25px). NB : la grille de cases du jeu
      garde son dimensionnement `vh` (gameplay), centrée dans le cadre au lieu d'une
      image plein cadre.
- [x] Hovers : slots lift -2px + bordure or, transitions .15s (hover rail vérifié).
- [x] intro.js du tutoriel fonctionne (tooltip vérifié sur la barre de vie, hooks
      `js-*` ciblés) ; mécanisme de cooldown inchangé (`spell-filter-<id>` conservé).
- [x] Aucune classe Bootstrap dans les fichiers refondus ; ancien CSS de ces blocs
      supprimé de `_legacy.scss` ; aucun hex hors `_tokens.scss` dans les nouveaux
      modules ; modale d'inventaire legacy toujours fonctionnelle depuis le rail.

## Phase 2 — Profil (FAIT le 17/07/2026)

**Maquette** : `design/react/ProfileScreen.jsx`, variante « fullscreen » (+ README).
**Fichiers refaits** : `pages/profilPage/` (sous-nav Cinzel Profil/Sorts/Options,
soulignement or actif), `components/profil/profil/` (identité + infos réelles
`nomClasse`/`niveau`/`nomGuilde`/`nomAlignement`, panneau Équipement base+bonus par
stat, grille 2×3 de cartes caractéristiques avec steppers), `components/profil/options/`.
Nouveau composant kit : `ui/sectionTitle/SectionTitle` (barre or + Cinzel, tailles
md/lg/xl) ; `Panel` étendu (variant soft, radius lg, paddings lg/xl). Tokens ajoutés :
couleurs par stat, `--bonus`, badge points (`--level-*`), surfaces de lignes.
Logique conservée à l'identique (`getCaracteristiques`, `updateCaracteristiques`,
garde `maxCaracsAllowed`) ; le « +n » en attente est purement présentatif
(diff vs valeurs persistées). Les blocs « Statistiques générales / PvP » (données
factices en dur) et le personnage central ne sont pas repris, conformément au README.

Validation (vérifiée navigateur) :
- [x] Sous-nav 62px centrée, actif or + underline 3px.
- [x] Colonne gauche 480px : avatar 62px, pseudo 24px, ligne classe·niveau or
      uppercase, lignes info (label faint uppercase / valeur), Équipement (pastille
      couleur stat, base blanc, +bonus vert, total or).
- [x] Colonne droite : badge « points à répartir » (vert si > 0), cartes stat
      (icône teintée par stat via color-mix, base·équip, steppers 44px, total or 30px),
      bouton Valider (or, Cinzel, hover #f2d488).
- [x] Interaction : +2 constitution → total et panneau Équipement synchronisés,
      pool décrémenté, badge « +2 » vert ; Valider → persistance vérifiée via l'API.
- [x] `profil.scss` supprimé (classes encore utilisées par `ProfilJoueur` déplacées
      dans `_legacy.scss`), ancien `ProfilPage.module.scss` (bandeau image) supprimé.

**Reste pour plus tard** : `ProfilJoueur` (`/profil/:pseudo`) garde son style legacy —
il dépend du système de hover d'équipement, refonte avec la **phase 3** ;
`profilSpell.scss` + onglet Sorts → **phase 4**.

## Phase 3 — Inventaire (FAIT le 17/07/2026)

**Maquette** : `design/inventaire/InventoryModal.jsx` (+ README).
**Architecture** : un écran partagé `components/inventory/screen/` —
`InventoryScreen` (en-tête + monnaies, onglets par catégorie avec compteurs,
recherche, grille 6 col. de cases parchemin à bordure de rareté, halo or de
sélection), `CharacterPanel` (paperdoll 7 slots gauche/droite + portrait anneau
conique + tuiles de bonus d'équipement — réutilisable), `ItemDetailBar` (vignette,
badge de rareté, caractéristiques, valeur, action contextuelle), `itemUtils`
(normalisation équipements/consommables/objets + mapping raretés).
Utilisé par la **page** `/inventaire` (fond dégradé, panneau centré) et par la
**modale** du rail (overlay flouté + ✕). `ui/glyphs/Glyph` : glyphes SVG partagés
(stats, slots vides, recherche) — profil refactoré pour les consommer.
Actions branchées sur l'existant UNIQUEMENT : Équiper (`wearEquipement`) / Retirer
(`unwearEquipement`) + double-clic conservé ; pas de « Jeter / Vendre / Utiliser »
(aucune API — la vente passe par les échoppes PNJ). Rareté `heroique` (6e du jeu,
absente de la maquette) → token `--rarity-heroique` rouge.
`ProfilJoueur` (/profil/:pseudo, reporté de la phase 2) refait avec
`CharacterPanel` + `ItemDetailBar` + panneaux identité/actions.

Validation (vérifiée navigateur, données réelles en base de test) :
- [x] En-tête 74px : titre Cinzel 27 + compteur d'objets, pastilles Or/PA/PM, ✕ 40px
      (hover danger).
- [x] Onglets (actif fond or texte encre, compteurs), recherche, grille parchemin
      (pastille + badge quantité + hover lift), halo or à la sélection.
- [x] Paperdoll : slots vides fantômes + pastilles de label, portrait 176px anneau
      conique, badge NIVEAU ; tuiles de bonus recalculées.
- [x] Équiper → slot rempli + bonus mis à jour + sac décrémenté ; Retirer → inverse.
- [x] Modale identique depuis le rail de la carte (backdrop flou + radial).
- [x] Purge : composants `inventory/*` legacy et `equipement/*` supprimés (ainsi que
      leurs `.module.scss` importés globalement), blocs inventaire/profil-joueur
      retirés de `_legacy.scss`. Styles `.shop-item*` (+ `--rotate`/`spin`)
      conservés pour l'échoppe PNJ, `.inventaire-title/-active` pour SocialPage.

NB : le drag & drop react-dnd mentionné initialement n'était utilisé nulle part
dans l'inventaire (dépendance dormante).

### Phase 3b — Système de modales réutilisable (FAIT le 17/07/2026)

Deux briques dans `src/components/ui/gameModal/`, à utiliser pour TOUTES les
modales à venir (PNJ, quêtes, échoppes…) :
- **`GameModal`** (comportement) : overlay qui **superpose la zone de carte**
  (portal vers `#game-modal-root`, hôte rendu par MapPage dans le cadre de la
  carte, `position: relative`) avec repli plein écran sur les pages sans carte ;
  backdrop flouté cliquable + fermeture Échap ; z-index 1200.
- **`ModalShell`** (apparence) : cadre or radius 18 qui remplit son conteneur,
  header 74px standard (icône, titre Cinzel 27, sous-titre uppercase, zone droite
  libre, ✕ hover danger), corps flexible, pied optionnel (ex : `ItemDetailBar`).

Migrations faites : `InventoryScreen` refactoré sur `ModalShell` (page /inventaire
= cadre dimensionné, modale = GameModal) ; nouveau `ProfilModal` (rail « Profil »
→ modale au-dessus de la carte, `Profil variant="modal"` aux paddings maquette ;
la page /personnage reste). Le rail ouvre désormais Inventaire ET Profil en modale.

### Ajustements post-revue (FAIT le 17/07/2026)

- **Cible portable 14" sans scroll** : mode compact via
  `@media (max-height: 899px)` (header de modale 60px, slots 62px, portrait 138px,
  barre de détail 104px, paddings resserrés) — au-dessus de 900px de haut, les
  valeurs maquette restent au pixel. Vérifié à 1512×870 : zéro scroll de page,
  zéro scroll interne (8 tuiles de bonus + barre de détail visibles) sur
  /personnage/profil et /inventaire.
- **Profil** : lignes Classe/Niveau retirées du bloc Informations (déjà dans la
  ligne d'identité dorée) ; le grand chiffre or des cartes de caractéristiques
  affiche la **base seule** (le total avec équipement reste dans le panneau
  Équipement).
- **Bug historique ZQSD corrigé** : `GameModal` pose `data-game-modal` sur son
  overlay et `Map.handleKeybord` ignore les touches tant qu'une modale est
  ouverte (vérifié réseau : aucune requête `update_position` modale ouverte,
  reprise normale après fermeture). Les modales legacy (PNJ/quêtes/échoppes)
  bénéficieront du même garde en migrant sur GameModal.
- **Ciblage refondu** (vérifié le 19/07/2026) : `Target` est une carte du design
  system placée SOUS la fiche joueur (tag CIBLE + ✕ décibler, avatar bordure
  danger, jauges Santé/Mana, « Voir le profil » pour les joueurs, quantité ×N
  pour les monstres) — plus de scroll quand on cible. Pour faire de la place :
  Or/PA/PM déplacés à droite de la barre d'action (rangée des slots) et rail de
  navigation en 2 colonnes (chevrons retirés). Purge : `StatBar`, styles
  `.joueur-cible*`/`.lifeBar`/`.manaBar`/`.avatar-player` + media queries.

## Phase 4 — Sorts (FAIT le 19/07/2026)

**Maquette** : `design/sorts/SpellsModal.jsx` (+ README très détaillé).
**Back (pattern DTO)** : `UserSortilege.ordre` (modèle existant) branché —
`POST /joueur/spell/equip` (assignation 1-8 avec échange, seed de la barre par
défaut à la première personnalisation), `POST /joueur/spell/unequip`,
`POST /joueur/spells/book` (grimoire complet + ordre) ; `/joueur/spells` (barre)
renvoie les sorts assignés triés par `ordre`, sinon comportement historique.
**Front** : `components/spells/screen/SpellsScreen` (ModalShell : grimoire à
cartes accent-par-type attack/soin/buff, panneau de détail 480px avec 3 stat
rows + picker 4×2 + « Retirer de la barre », footer hotbar 8×76px), utilisé par
l'onglet `/personnage/sorts` (cadre pleine page) et la modale du rail « Sorts »
(7e entrée). `SpellBar` place les sorts par `ordre` et se rafraîchit via le bump
`spellBarVersion` (même motif que `consommableBarVersion`).
Purge : `ProfilSpellBar`, `profilSpell.scss`, styles `.spell/.spell-filter/
.img-spell/.spell-bar` + leurs media queries (seul le hook `.spell-container`
survit). Vérifié navigateur : assignation slot 5 → 2, barre du jeu rafraîchie en
direct, persistance en base.

### Phase 4b — Modales PNJ / quêtes / échoppe / guilde (FAIT le 19/07/2026)

`PnjInteractionHost` migré sur `GameModal size="auto"` + `ModalShell
fit="content"` (nouvelles options : contenu auto-dimensionné centré sur la
carte floutée). Sous-titre contextuel (Quête/Échoppe/Guildes · nom du PNJ).
- `QuestDialogue` + `PnjActionDialogue` : module partagé `PnjDialogue.module`
  (avatar + pastille nom, paragraphes italiques, messages bloqués en danger,
  actions = bouton or Cinzel + `GameButton`) ; `PnjAvatar` avec repli propre
  quand l'avatar du PNJ est manquant en base (cas du PNJ tutoriel :
  `avatar = "pnjTutorialAvatar"`, fichier inexistant — bug de contenu préexistant
  à corriger un jour dans le seed).
- `ShopView` : onglets segmentés Acheter/Vendre ; `ShopBuy` : cartes à bordure
  de rareté (vignette parchemin, caractéristiques en pastilles, prix, niveau,
  bouton Acheter désactivé si or insuffisant) ; `ShopSell` : placeholder stylé
  (la vente n'est pas implémentée côté jeu).
- `GuildeView` : effet machine à écrire conservé, registre en lignes panneau
  (nom, description, badge niveau, `GameButton` Rejoindre — le bouton
  « Détails » sans handler a été retiré).
Purge : `components/modal/` (Modal legacy + images), `QuestView.module`,
ancien `ShopView.module`, styles `.shop-item*` (+ `--rotate`/`spin`),
`.btn-action`, `.guilde-body-transition`/`.title-guilde-list`/`.th-guilde-list`,
police Modern Antiqua. Vérifié navigateur : quête du tutoriel jouée de bout en
bout (accepter → choix de classe → classe changée), échoppe/guilde restylées sur
les mêmes primitives.

## Phase 5 — Guilde

**Maquette** : `design/guilde/GuildModal.jsx` (+ README : couleurs de grade/classe/
statut dérivées). **Code** : `pages/guildePage/`, `components/pnj/guildeView/`,
`components/social/Guilde.jsx`.
Validation : roster (table stylée tokens), identité, objectifs, journal, trésor ;
suppression des styles `.table-guilde*`, police Modern Antiqua.

## Phase 6 — Historique

**Maquette** : `design/react/HistoryModal.jsx` (+ README : catégories d'événements →
couleur/icône/filtre). **Code** : `pages/historyPage/`, `components/historique/`.
Validation : chronologie, filtres par groupe, résumé ; suppression des styles
`.history-*`.

## Phase 7 — Purge finale

- Retirer Bootstrap (CDN dans `index.html`, `react-bootstrap` de `package.json`) après
  refonte des pages restantes (login, register, home, messagerie, social,
  administration — à minima les rendre présentables avec les tokens).
- Supprimer `_legacy.scss` (doit être vide), l'`app.css` résiduel éventuel, les vieilles
  polices TTF (`BerryRotunda.ttf`, `DungeonFont.ttf`) et images GUI orphelines.
- `grep` final : aucun hex hors `_tokens.scss`, aucun `!important`, aucun
  `*.module.scss` non importé par son composant.
