# Modales Alcazan Forest (React)

Composants React autonomes, **sans dépendance** (styles inline). Prêts à intégrer.

## Fichiers
- `InventoryModal.jsx` — modale d'inventaire (export default).
- `SpellbookModal.jsx` — modale de sortilèges (export default).
- `GuildModal.jsx` — modale de guilde : roster, identité, objectifs, journal, trésor (export default).
- `HistoryModal.jsx` — modale d'historique / journal d'aventure : résumé, filtres, chronologie (export default).
- `assets/` — images utilisées par les données de démo (avatar, potions, grimoires, sorts, monnaies, logo, fond de carte).

## Polices
Le composant utilise `Cinzel` (titres) et `Nunito Sans` (texte). Charge-les une fois dans ton app (elles ne sont PAS incluses) :

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
```

## Utilisation

```jsx
import InventoryModal from "./InventoryModal";

function Game() {
  const [open, setOpen] = useState(false);
  return open ? (
    <InventoryModal
      assetBase="/assets"                 // dossier public des images
      character={{ name: "neraën", level: 20, cls: "Aventurière", avatar: "avatar.png" }}
      items={items}                       // voir DEFAULT_ITEMS pour le schéma
      equipment={equipment}               // { left: [...], right: [...] }
      stats={stats}                       // 6 caractéristiques
      currencies={currencies}
      onClose={() => setOpen(false)}
      onEquip={(item) => equip(item)}
      onUse={(item) => use(item)}
      onSell={(item) => sell(item)}
      onDrop={(item) => drop(item)}
    />
  ) : null;
}
```

Toutes les props de données sont optionnelles (données de démo par défaut).

## Schéma des données

**item** :
```js
{ id, name, cat, rarity, qty, value, desc,
  img?,    // fichier image dans assetBase (ex "potion-red.png") — prioritaire
  glyph?   // icône vectorielle de secours si pas d'image
}
```
- `cat` : `"equipement" | "consommables" | "ressources" | "grimoires"` (l'onglet « Tout » regroupe tout).
- `rarity` : `"common" | "uncommon" | "rare" | "epic" | "legendary"` (couleur de bordure).

**equipment** : `{ left: [slot…], right: [slot…] }`, chaque slot :
```js
{ label: "Tête", slot: "head", itemId: 7, empty: "helmet" }
// itemId = id de l'objet équipé (ou null) ; empty = glyphe affiché quand vide
```

**stat** : `{ label, value, glyph, color }` — 6 caractéristiques (Constitution, Force, Dextérité, Intelligence, Sagesse, Chance).

## Remplacer les icônes par tes vraies images
Renseigne `img` sur chaque objet (chemin relatif à `assetBase`). Le `glyph` vectoriel n'est utilisé qu'en secours. Les glyphes disponibles sont listés dans l'objet `GLYPHS` en haut du fichier.

## Réglages d'affichage (InventoryModal)
`showBackdrop`, `showSearch`, `showStats` (booléens), `backdropImage`, `capacity={{ used, total }}`.

---

# SpellbookModal — modale de sortilèges

```jsx
import SpellbookModal from "./SpellbookModal";

function Game() {
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState({ tir: 0, dest: 1, poison: 2, maitrise: 3 });
  return open ? (
    <SpellbookModal
      assetBase="/assets"
      spells={spells}                 // voir DEFAULT_SPELLS pour le schéma
      assignments={assignments}       // { [spellId]: slotIndex 0-7 }
      slotCount={8}
      onChange={setAssignments}       // appelé à chaque modif de la barre
      onClose={() => setOpen(false)}
    />
  ) : null;
}
```

**spell** :
```js
{ id, name, img, type, accent, cd, range, desc }
// img : fichier dans assetBase (ex "spell1.png")
// accent : couleur de bordure/pastille du sort (hex)
// cd : temps de recharge en secondes (0 = « Instantané »)
// range : portée en cases (0 = « Personnel »)
```

- **Sélection** d'un sort dans le grimoire → panneau de détail à droite.
- **Assignation** : les 8 boutons « Emplacement dans la barre » placent le sort sélectionné dans un slot (échange si occupé) ; « Retirer » le sort de la barre.
- **Barre de sorts** (footer) : cliquer un slot vide y place le sort sélectionné, cliquer un slot occupé sélectionne ce sort.

Réglages : `slotCount`, `showBackdrop`, `backdropImage`.

---

# GuildModal — modale de guilde

```jsx
import GuildModal from "./GuildModal";

{open && (
  <GuildModal
    assetBase="/assets"
    guild={guild}               // { name, level, rank, motto, xp, xpPct, treasury, capacity }
    members={members}           // voir DEFAULT_MEMBERS pour le schéma
    objectives={objectives}     // [{ label, count, pct, c1, c2 }]
    activity={activity}         // [{ who, txt, time, color }]
    perks={perks}               // [string]
    onClose={() => setOpen(false)}
    onInvite={() => invite()}
  />
)}
```

**member** :
```js
{ name, grade, cls, lvl, status, contrib, since, you? }
// grade  : "Maître de guilde" | "Sénéchal" | "Chevalier" | "Baron" | "Écuyer" | "Recrue"
// cls    : "Paladin" | "Mage" | "Archer" | "Guerrier" | "Prêtre" | "Voleur"
// status : "Connecté" | "En quête" | "Hors ligne"
// contrib: nombre (Or contribué) ; you = true met la ligne en surbrillance « VOUS »
```
Les couleurs de grade / classe / statut sont dérivées automatiquement (voir `GRADE_COLORS`, `CLASS_COLORS`, `STATUS_COLORS`).

Réglages : `showBackdrop`, `showObjectives`, `backdropImage`.

---

# HistoryModal — modale d'historique / journal d'aventure

```jsx
import HistoryModal from "./HistoryModal";

{open && (
  <HistoryModal
    assetBase="/assets"
    character={{ name: "neraën", level: 20 }}
    days={days}                 // [{ label, date }]
    events={events}             // voir DEFAULT_EVENTS pour le schéma
    summary={summary}           // [{ label, value, cat }]
    highlights={highlights}     // [{ label, value, color, icon }]
    onClose={() => setOpen(false)}
  />
)}
```

**event** :
```js
{ day, cat, time, who, text, badge }
// day  : index dans le tableau `days`
// cat  : "dmgIn" | "dmgOut" | "heal" | "death" | "level" | "gold" | "loot" | "quest"
//        → détermine couleur, icône, libellé de catégorie et groupe de filtre
```
Le filtre latéral regroupe les catégories : combat (dmgIn/dmgOut/death), soins (heal), progression (level/quest), butin (gold/loot).

Réglages : `showBackdrop`, `showHighlights`, `compactRows`, `backdropImage`.
