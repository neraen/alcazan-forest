# Handoff — Page principale du jeu « Alcazan Forest »

## Vue d'ensemble
Écran principal d'un MMORPG médiéval en 2D. L'utilisateur y voit la carte de sa
zone actuelle, sa fiche de personnage (avatar, PV, PM, niveau), navigue entre les
sections du jeu (Carte, Inventaire, Profil, Guilde, Journal, Classement), consulte
ses ressources (Or / PA / PM) et sa barre d'action (XP, sorts, potions, sorts
rapides). Redesign de la maquette d'origine : plus moderne, pro et ergonomique, en
conservant la patte or/vert-sombre médiévale.

Ce document décrit la **version « Cadre structuré »** retenue par l'utilisateur.

## À propos des fichiers de ce bundle
Les fichiers de ce dossier sont des **références de design**. `MainGamePage.jsx` est
un composant React **autonome et fonctionnel** (styles inline, aucune dépendance
hors React) qui sert de source de vérité visuelle. La tâche n'est pas forcément de
le copier tel quel : il faut **le recréer / l'adapter dans l'environnement du
codebase cible** (framework, système de style, conventions existantes). S'il n'y a
pas encore d'environnement, `MainGamePage.jsx` peut être intégré directement.

## Fidélité
**Haute fidélité (hifi).** Couleurs, typographie, espacements et tailles sont
définitifs et repris exactement dans le composant. Reproduire au pixel près, puis
brancher les vraies données de jeu via les props.

## Structure de la page
Conteneur `1920×1080`, `flex-direction: column`, fond
`linear-gradient(160deg, #06303b, #041e26 70%)`, `border-radius: 14px`.

1. **Header** (hauteur `72px`, `flex-shrink:0`)
   - Bloc logo (46×46, radius 12) + titre `Alcazan Forest` (Cinzel 700, 22px, #e3b64f)
     + sous-titre `MMORPG MÉDIÉVAL` (11.5px, 700, letter-spacing .12em, uppercase, #7fa8ae).
   - Nav segmentée (fond `rgba(255,255,255,.05)`, border `rgba(227,182,79,.2)`, radius 12,
     padding 5). Onglet actif : fond #e3b64f, texte #05242c, 800 ; inactifs : texte #b7d2d6,
     700, hover → #f2d488. Items : Carte, Profil, Inventaire, Administration.
   - Bouton `Déconnexion` aligné à droite : texte #e3b64f, 800, 13px, uppercase,
     letter-spacing .1em, border `1px solid rgba(227,182,79,.55)`, radius 10, padding 10/20,
     hover → fond `rgba(227,182,79,.2)`.

2. **Corps** (`flex:1`, `display:flex`, `gap:20px`, `padding:20px`)
   - **Colonne gauche** (`width:340px`, `flex-shrink:0`, `gap:16px`) :
     - **Fiche joueur** (carte radius 16, fond `rgba(8,40,50,.85)`, border `rgba(227,182,79,.3)`,
       padding 20). En-tête `Tutoriel boisé` (Cinzel 700, 18px, uppercase, #e3b64f) + label `ZONE`.
       Séparateur dégradé. Avatar 92×92 rond, border 2px #e3b64f, badge `Niv. 20` centré en bas.
       Nom `neraën` (800, 22px, #eef6f6) + `Aventurière` (600, 13px, #9fc3c9). Deux barres :
       SANTÉ (label #ef7b6d, remplissage `linear-gradient(90deg,#a91f1c,#e04a39)`, 300/780 → 38%)
       et MANA (label #6fb4f0, `linear-gradient(90deg,#1d5fa8,#3f8fdd)`, 250/250 → 100%).
       Barres : hauteur 12px, radius 6, track `rgba(255,255,255,.08)`.
     - **Navigation icônes** (même style de carte, padding 10). 6 items = icône ronde 42×42
       + label (800, 15px, #b7d2d6) + chevron `›` à droite. Hover → fond `rgba(227,182,79,.12)`.
       Items : Carte, Inventaire, Profil, Guilde, Journal, Classement.
     - **Ressources** (même carte, padding 14/18, gap 10). 3 lignes icône 24×24 + valeur 800/15px :
       `6573 Or` (#e3b64f), `600 PA` (#f0a95c), `-5277 PM` (#6fb4f0).
   - **Zone principale** (`flex:1`, carte radius 16, border `rgba(227,182,79,.3)`, overflow hidden,
     fond #08222a) :
     - **Carte** (`flex:1`) : image plein cadre `object-fit: cover`.
     - **Barre d'action** (`flex-shrink:0`, border-top or, fond `rgba(4,26,33,.95)`, padding 12/20) :
       - Ligne XP : label `XP` (Cinzel 700, 13px, #e3b64f) + barre `linear-gradient(90deg,#b8892e,#e3b64f)`
         (9430/12081 → 78%) + valeur (800, 13px).
       - Ligne actions (gap 16) : 4 slots de sorts (54×54, radius 10, border or, hover → border #e3b64f
         + translateY(-2px)) et slots vides (dashed `rgba(159,195,201,.3)`) | séparateur vertical |
         2 potions (vie / mana, mêmes slots) | séparateur | grille compacte 3×2 de mini-sorts (25×25, radius 6).

## Interactions & comportement
- Onglets nav → `onNavClick(item)`. Onglet actif contrôlé par la prop `activeNav`.
- Items de la colonne icônes → `onRailClick(index)`.
- Slots de sorts → `onSpellClick(index)`.
- Bouton déconnexion → `onLogout()`.
- Hovers : nav (couleur), items rail (fond), slots sorts/potions (border + lift 2px). Transition `.15s`.
- Les barres (PV/PM/XP) se remplissent par calcul `current / max * 100`.

## État / données
Aucun état interne métier — le composant est **piloté par les props** (voir `defaultData`
exporté depuis `MainGamePage.jsx`). Seul état local : le `hover` par slot/item.
Brancher : joueur, ressources, expérience, sorts équipés, potions, carte de zone,
onglet actif. Callbacks fournis pour toutes les actions.

## Design tokens
- **Couleurs** : or #e3b64f (hover #f2d488), encre #05242c, fonds #06303b → #041e26,
  panneaux `rgba(8,40,50,.85)`, action bar `rgba(4,26,33,.95)`. Texte : #eef6f6 / #b7d2d6 /
  #9fc3c9 / #7fa8ae. PV #a91f1c→#e04a39 (label #ef7b6d). PM #1d5fa8→#3f8fdd (label #6fb4f0).
  XP #b8892e→#e3b64f. PA #f0a95c. Tracks `rgba(255,255,255,.08)`.
- **Radius** : 6 (barres/mini), 8–10 (boutons/slots), 12 (logo/nav), 14 (page), 16 (cartes).
- **Ombres** : page `0 20px 60px rgba(0,0,0,.5)`, avatar `0 6px 18px rgba(0,0,0,.5)`.
- **Typo** : titres **Cinzel** (500/600/700) ; corps **Nunito Sans** (400/600/700/800).
- **Espacements** : padding page 20, gap colonnes 20, gap interne cartes 14–16.

## Polices à charger (globalement)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
```

## Assets
Fournis dans `./assets/` (extraits de la capture d'origine — **basse résolution**,
à remplacer par les fichiers sources haute-déf du jeu) :
`map.png`, `avatar.png`, `logo.png`, `icon-{carte,inventaire,profil,guilde,journal,classement}.png`,
`spell1..4.png`, `potion-red.png`, `potion-blue.png`, `cur-{or,pa,pm}.png`.
Servir depuis `public/assets` ou ajuster la prop `assetBase` (défaut `/assets`).

## Utilisation
```jsx
import MainGamePage, { defaultData } from "./MainGamePage";

<MainGamePage
  assetBase="/assets"
  activeNav="Carte"
  player={monJoueur}
  resources={mesRessources}
  experience={{ current: 9430, max: 12081 }}
  onNavClick={(item) => navigate(item)}
  onRailClick={(i) => openSection(i)}
  onSpellClick={(i) => castSpell(i)}
  onLogout={handleLogout}
/>
```
Le composant fait `1920×1080`. Pour l'adapter à l'écran, l'envelopper dans un
conteneur avec `transform: scale(...)` ou remplacer les dimensions fixes par des
unités relatives selon les besoins responsive du projet.

## Fichiers
- `MainGamePage.jsx` — composant React autonome (source de vérité).
- `assets/` — images référencées.
- `README.md` — ce document.
