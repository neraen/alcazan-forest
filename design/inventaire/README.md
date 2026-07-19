# Handoff — Modale Inventaire (RPG)

## Overview
Modale plein écran d'inventaire / équipement pour un jeu de rôle. Deux panneaux :
le **sac** (grille d'objets filtrable par catégorie + recherche) à gauche, et la
**fiche personnage** (paperdoll d'équipement + portrait + stats) à droite. Une
**barre de détail** en pied affiche l'objet sélectionné avec ses actions
(Équiper / Utiliser / Vendre, et Jeter).

## About the Design Files
Les fichiers de ce dossier sont des **références de design** :
- `InventoryModal.jsx` — le composant React de référence, entièrement autonome
  (styles inline, aucune dépendance hors React).
- `Inventaire.dc.html` — le prototype HTML d'origine (mêmes valeurs, pour
  comparaison visuelle pixel-perfect).
- `assets/` — les images utilisées.

Ce ne sont pas forcément du code de production à copier tel quel. La tâche est de
**recréer ce design dans l'environnement du codebase cible** (React, Vue, etc.)
en suivant ses conventions (solution de style, système de composants, gestion des
icônes). `InventoryModal.jsx` fonctionne directement dans un projet React et sert
de point de départ ; adaptez le styling inline vers votre solution (CSS modules,
Tailwind, styled-components…).

## Fidelity
**Haute fidélité (hifi).** Couleurs, typographie, espacements et interactions sont
définitifs. À reproduire au pixel près, puis rebrancher sur les données réelles.

## Screens / Views

### Modale Inventaire
- **Purpose** : consulter le sac, équiper/utiliser/vendre/jeter un objet, voir
  l'équipement porté et les stats du personnage.
- **Canvas** : conçu sur `1920 × 1080`. La modale fait `1460 × 916 px`, centrée
  sur un fond assombri. En production, adaptez : centrez la modale (largeur/hauteur
  max, `overflow` interne) ; le canvas 1920×1080 n'est qu'un cadre de maquette.
- **Layout de la modale** (flex colonne, `border-radius: 18px`) :
  1. **Header** (hauteur `74px`) — icône + titre « Inventaire » + sous-titre
     « 42 / 60 emplacements », puis à droite les 3 pastilles de monnaie et le
     bouton fermer `✕` (40×40).
  2. **Body** (`flex: 1`, `display:flex`, `gap:20px`, `padding:20px`) :
     - **Gauche** (`flex:1`) : barre d'onglets → champ de recherche → grille
       d'objets `grid-template-columns: repeat(6, 1fr)`, `gap:10px`, scrollable.
     - **Droite** (`width:588px`, fixe) : titre « Équipement », paperdoll en
       grille `70px 1fr 70px` (5 slots à gauche, portrait au centre, 5 slots à
       droite), puis grille de stats `repeat(3,1fr)` collée en bas (`margin-top:auto`).
  3. **Footer / barre de détail** (`min-height:128px`) — vignette de l'objet
     sélectionné (92×92), nom + badge de rareté + type + description en italique +
     valeur en or, et à droite les boutons d'action.

### Composants clés
- **Onglet actif** : fond `#e3b64f`, texte/icône `#06232b`. Inactif : fond
  transparent, texte `#cfe3e5`, hover `rgba(227,182,79,.12)`. Chaque onglet montre
  icône + label + compteur.
- **Case d'objet** : carré (`aspect-ratio:1`), fond parchemin
  `linear-gradient(160deg,#f3e8cc,#e6d3a8)`, bordure `2.5px` couleur de rareté,
  pastille de rareté en haut-gauche (10px), badge quantité en bas-droite (si
  qty > 1). **Sélectionné** : bordure `#e3b64f` + halo
  `0 0 0 3px rgba(227,182,79,.55)`. Hover : `translateY(-2px)` + ombre portée.
- **Slot d'équipement** (70×70) : rempli → fond parchemin + bordure rareté ;
  vide → fond `rgba(255,255,255,.03)` + glyphe fantôme `rgba(159,195,201,.32)`.
  Label en pastille sous le slot. Hover → bordure `#e3b64f`.
- **Portrait** : cercle 176px avec anneau conique
  `conic-gradient(from 210deg,#e3b64f,#8a6a22,#e3b64f)`, image `border:3px #061c22`.
- **Badge de rareté** (footer) : texte + bordure = couleur de rareté, fond
  `rgba(255,255,255,.05)`.
- **Bouton primaire** : fond `#e3b64f`, texte `#06232b`, police Cinzel ; hover
  `#f2d488`. Label dynamique : Consommable → « Utiliser », Équipement → « Équiper »,
  sinon « Vendre ».
- **Bouton « Jeter »** : contour rouge `rgba(224,74,57,.5)`, texte `#e78a7d` ;
  hover fond `rgba(224,74,57,.18)`, texte `#ffb3a8`.

## Interactions & Behavior
- **Onglets** : filtrent la grille par catégorie (`tous` affiche tout).
- **Recherche** : filtre par sous-chaîne du nom (insensible à la casse), cumulée
  avec l'onglet actif.
- **Clic sur une case / un slot rempli** : sélectionne l'objet → met à jour la
  barre de détail et le halo doré.
- **Actions footer** : `onPrimary(item)` (Équiper/Utiliser/Vendre) et
  `onDrop(item)` (Jeter) sont des callbacks à brancher côté app.
- **Fermer** : `onClose()`.
- **Transitions** : hover des cases `.12s` (transform + box-shadow) ; onglets,
  slots et boutons `.15s`.

## State Management
État local du composant :
- `tab` (string) — catégorie active, défaut `"tous"`.
- `selectedId` (number) — id de l'objet sélectionné, défaut `7`.
- `query` (string) — texte de recherche.

La liste affichée est dérivée (`filtered`) de `items` + `tab` + `query`.
Les données (`items`, `character`, `currencies`, `equipment`, `stats`) arrivent en
props ; des jeux de démo sont fournis par défaut. En production, remplacer par les
données serveur et gérer équiper/jeter/vendre via les callbacks.

## Design Tokens
**Couleurs**
- Fond app : `#041e26` — fond modale : `linear-gradient(165deg,#0a2c36,#06232b 62%)`
- Panneau interne : `rgba(4,26,33,.5/.6)` — surfaces : `rgba(255,255,255,.04/.05)`
- Or (accent) : `#e3b64f`, hover `#f2d488` — texte clair : `#eef6f6`
- Texte secondaire : `#9fc3c9`, `#7fa8ae`, `#6f959b`, `#cfe3e5`
- Danger : `#e04a39` (contour `rgba(224,74,57,.5)`)
- Parchemin (cases) : `linear-gradient(160deg,#f3e8cc,#e6d3a8)`
- **Raretés** : common `#8ba0a6`, uncommon `#5fbf6a`, rare `#3f8fdd`,
  epic `#b06be6`, legendary `#e3b64f`
- Bordures dorées : `rgba(227,182,79,.16 → .5)`

**Typographie**
- Titres / boutons / noms : **Cinzel** (700), serif.
- Corps / labels / valeurs : **Nunito Sans** (400/600/700/800).
- Tailles : titre 27px, nom objet 22px, valeurs stats 15px, labels
  uppercase 9.5–12px (`letter-spacing` .04–.1em).

**Rayons** : cases 12px, panneaux 14–16px, modale 18px, pastilles 7–11px.
**Ombres** : modale `0 40px 120px rgba(0,0,0,.65)` ; cases sélectionnées halo
`0 0 0 3px rgba(227,182,79,.55)`.

## Assets
Dans `assets/` (fournis) :
- `map.png` — fond flouté derrière la modale.
- `avatar.png` — portrait du personnage.
- `cur-or.png`, `cur-pa.png`, `cur-pm.png` — icônes de monnaie (or, pièces
  d'argent, pièces de mana).
- `potion-red.png`, `potion-blue.png` — icônes d'objets.
- `spell1.png … spell4.png` — icônes de grimoires.

Les autres icônes d'objets, de stats et de slots vides sont des **glyphes SVG**
inline (objet `GLYPHS` en haut de `InventoryModal.jsx`) — aucune dépendance à une
librairie d'icônes. Remplacez-les par votre set d'icônes si le codebase en a un.

## Files
- `InventoryModal.jsx` — composant React de référence (props documentées en tête
  de fichier).
- `Inventaire.dc.html` — prototype HTML d'origine.
- `assets/` — images.

## Intégration rapide
```jsx
import InventoryModal from "./InventoryModal";

<InventoryModal
  assetBase="/assets/"          // où sont servies les images
  items={items}                 // sinon jeu de démo
  character={{ name, level, cls, avatar }}
  onClose={() => setOpen(false)}
  onPrimary={(item) => equipOrUse(item)}
  onDrop={(item) => dropItem(item)}
/>
```
Charger les polices côté hôte :
`Cinzel` (500/600/700) et `Nunito Sans` (400/600/700/800) via Google Fonts.
