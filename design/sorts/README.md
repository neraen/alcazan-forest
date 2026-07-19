# Handoff: Modale Sortilèges (Spells assignment modal)

## Overview
A fullscreen modal for an isometric RPG where the player manages spells ("Sortilèges").
The left column ("Grimoire") lists all learned spells; the right column shows the selected
spell's details and lets the player assign it to one of 8 hotbar slots; the footer shows the
resulting hotbar in play order.

## About the design files
The files in this bundle are **design references authored in HTML/React** — a prototype showing
the intended look and behavior, **not** production code to ship as-is. The task is to **recreate
this design inside your target codebase** using its established patterns (routing, state, styling
system, image pipeline). `SpellsModal.jsx` is a faithful, dependency-free React translation of
the prototype provided as a convenience — adapt it to your stack rather than treating it as final.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, and interactions are final.
Recreate pixel-for-pixel, then map styling onto your design system if you have one.

## The component
`SpellsModal.jsx` — a single default-exported React function component. No external deps
(React only). All styling is inline. Props:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `assetBase` | string | `"assets/"` | URL/path prefix for spell + map images |
| `showBackdrop` | boolean | `true` | Render the blurred map image behind the modal |
| `onClose` | function | no-op | Called when the ✕ button is clicked |

State is internal (`selectedId`, `slots`). For production, lift `slots` (and probably the spell
list) into your app state / server so assignments persist.

## Fixed canvas
The prototype is designed at **1920×1080**; the modal itself is **1460×916**, centered.
For a responsive app, keep the modal's internal proportions but let it size to the viewport
(e.g. `max-width`, `max-height: 90vh`) instead of hard-coding 1460×916.

## Layout
```
section 1920×1080  (blurred map backdrop + radial vignette, modal centered)
└─ modal 1460×916  flex column, radius 18, gold 1px border, big drop shadow
   ├─ header  74px   [icon] [title + subtitle] [nav pill] [✕ →right]
   ├─ body    flex:1 gap 20 padding 20
   │   ├─ grimoire  flex:1   section head + scrolling spell-card list
   │   └─ detail    480px    thumb+name+type, desc, 3 stat rows, 4×2 slot picker, unassign btn
   └─ footer  hotbar: label + 8 slot buttons (76×76) right-aligned
```

## Components & exact values

### Header (height 74)
- Icon tile: 40×40, radius 10, border `rgba(227,182,79,.5)`, bg `rgba(227,182,79,.1)`, wand SVG in gold.
- Title "Sortilèges": Cinzel 700, 27px, `#e3b64f`, letter-spacing .04em.
- Subtitle "{n} sorts équipés · {n} appris": Nunito Sans 700, 12px, uppercase, `#7fa8ae`, ls .1em.
- Nav pill: bg `rgba(4,26,33,.55)`, border `rgba(227,182,79,.2)`, radius 12, padding 5, gap 4.
  - Links: 14px, padding 7×18, radius 8. Inactive `#b7d2d6` 700 (hover `#f2d488`). Active "Sorts": bg `#e3b64f`, color `#05242c`, 800.
- Close ✕: 40×40, radius 10, border `rgba(227,182,79,.35)`, bg `rgba(255,255,255,.04)`, `#cfe3e5`, 20px.
  Hover: bg `rgba(224,74,57,.25)`, border `#e04a39`, color `#ffd9d2`.

### Grimoire section head
- Gold bar 6×20 radius 3. Title "Grimoire" Cinzel 700 18px `#e3b64f` uppercase ls .06em.
- Right hint "Sélectionne un sort pour l'assigner" 12px 700 `#7fa8ae`.

### Spell card (button, one per spell)
- Layout: flex row, gap 16, padding 14×16, radius 14, full width.
- Default bg `rgba(8,40,50,.55)`, border `rgba(227,182,79,.2)`, shadow `0 3px 10px rgba(0,0,0,.25)`.
- **Selected**: bg `rgba(227,182,79,.1)`, border `#e3b64f`, shadow `0 0 0 2px rgba(227,182,79,.35), 0 8px 22px rgba(0,0,0,.4)`.
- Hover (non-selected): border `rgba(227,182,79,.55)`.
- Thumb: 66×66, radius 13, 2px border = spell accent, bg `#0a2027`, shadow `0 4px 12px rgba(0,0,0,.4)`, image `object-fit: cover`.
- Name: 800 17px `#eef6f6`. Type badge: padding 2×10, radius 7, bg `accent + "1f"` (12% alpha), border accent, 10.5px 800 uppercase ls .05em, color accent.
- Desc: 500 13.5px `#b6d0d4` italic, line-height 1.35.
- Meta chips (cooldown, range): bg `rgba(255,255,255,.04)`, border `rgba(227,182,79,.16)`, radius 8, padding 4×10; 15px gold icon + 12px 800 `#cfe3e5` label.
- Right slot column: 66px min-width, left border `rgba(227,182,79,.14)`, pad-left 14. "Barre" label 9.5px 800 uppercase `#7fa8ae`; value Cinzel 700 26px — `#e3b64f` when assigned (shows slot#+1) else `—` `#557077`.

### Detail panel (480 wide)
- Panel: bg `rgba(4,26,33,.5)`, border `rgba(227,182,79,.25)`, radius 16, padding 22, flex column gap 16.
- Big thumb 96×96, radius 16, 3px accent border, shadow `0 8px 24px rgba(0,0,0,.5)`.
- Name: Cinzel 700 24px `#eef6f6`. Type badge as above (11px, padding 3×12).
- Desc: 500 15px `#c4dbde` italic, line-height 1.5.
- Stat rows (3): "Temps de recharge" (clock, gold, bg `rgba(227,182,79,.14)`), "Portée" (target, `#5fbf6a`, bg `rgba(95,191,106,.14)`), "Type" (bolt, `#6fb4f0`, bg `rgba(111,180,240,.14)`). Row: bg `rgba(255,255,255,.03)`, border `rgba(227,182,79,.16)`, radius 11, padding 12×14. Icon tile 34×34 radius 9. Label 13px 800 uppercase `#7fa8ae`. Value 17px 800 `#eef6f6`.
- Assign label "Emplacement dans la barre": 12px 800 uppercase `#e3b64f` ls .06em.
- Slot picker: 4-column grid, gap 8, 8 buttons "1"–"8". Off: bg `rgba(255,255,255,.03)`, `#cfe3e5`, border `rgba(227,182,79,.25)`. On (this spell's slot): bg `#e3b64f`, color `#06232b`, border `#e3b64f`. Cinzel 700 16px, padding 12×0, radius 10. Hover: border `#e3b64f`.
- Unassign "Retirer de la barre": padding 11, radius 11, border `rgba(224,74,57,.5)`, transparent bg, `#e78a7d` 800 12px uppercase. Hover: bg `rgba(224,74,57,.18)`, color `#ffb3a8`.

### Footer hotbar
- Bg gradient `rgba(4,26,33,.9)`→`rgba(4,26,33,.35)` (bottom→top), top border `rgba(227,182,79,.35)`, padding 16 24 20.
- Label "Barre de sorts" Cinzel 700 16px `#e3b64f`; sub "Ordre d'affichage en jeu" 11px 700 `#7fa8ae`.
- 8 slot buttons, 76×76, radius 13, gap 12, right-aligned.
  - Empty: bg `rgba(0,0,0,.35)`, border `rgba(227,182,79,.2)`, inset shadow `inset 0 2px 8px rgba(0,0,0,.5)`.
  - Filled: bg `#0a2027`, border = `accent + "cc"` (80% alpha), holds the spell image (cover).
  - Selected occupant: border `#e3b64f`, shadow `0 0 0 2px rgba(227,182,79,.5)`.
  - Key badge (top-left, 3/5): 11px 800, `#f2d488` if filled else `#557077`, text-shadow `0 1px 2px rgba(0,0,0,.8)`.
  - Hover: border `rgba(227,182,79,.6)`.

## Interactions & behavior
- **Select spell** — click a grimoire card → `selectedId = card.id`; detail panel + slot picker reflect it.
- **Assign** — click a slot-picker button `i` OR an empty hotbar slot `i` → put selected spell in slot `i`.
  Any spell already in slot `i` is removed first (single-occupancy swap-out). A spell holds at most one slot.
- **Reassign** — assigning an already-assigned spell to a new slot moves it (its old slot frees up).
- **Click filled hotbar slot** — selects the occupying spell (does not reassign).
- **Unassign** — "Retirer de la barre" removes the selected spell from the bar (if present).
- **Close** — ✕ fires `onClose`.
- Transitions: all interactive elements `transition: all .15s`.
- No loading/error states in scope. All hover states listed per-component above.

> ⚠️ React inline styles can't express `:hover`. `SpellsModal.jsx` omits hover styling — reimplement
> the documented hover states via your CSS/styled-components/Tailwind layer.

## State management
- `selectedId: string` — currently selected spell id (default `"tir"`).
- `slots: Record<spellId, number>` — spell id → hotbar index 0–7; key absent = not on bar
  (default `{ tir:0, dest:1, poison:2, maitrise:3 }`).
- Invariants: each slot index appears at most once (swap-out enforces it); each spell id maps to at most one index.
- For production, persist `slots` server-side / in app state and pass the spell list in as data.

## Data (spells)
| id | name | img | type | accent | cd (s) | range (cases) |
|----|------|-----|------|--------|--------|---------------|
| tir | Tir rapide | spell1.png | Attaque | `#3f8fdd` | 5 | 4 |
| dest | Flèche destructrice | spell2.png | Attaque | `#6fb4f0` | 10 | 5 |
| poison | Flèche empoisonnée | spell3.png | Poison | `#5fbf6a` | 10 | 3 |
| maitrise | Maîtrise de l'arc | spell4.png | Buff | `#cbe64f` | 0 | 0 |

Label formatting: cooldown `0 → "Instantané"`, else `"{cd} s"`. Range `0 → "Personnel"`, else `"{range} cases"`.

## Design tokens
**Colors**
- Background `#041e26` · Panel `#06232b` / `#0a2c36` · Modal gradient `linear-gradient(165deg,#0a2c36,#06232b 62%)`
- Gold `#e3b64f` · Gold light `#f2d488` · Ink (on gold) `#06232b`/`#05242c`
- Text `#eef6f6` · Soft `#c4dbde` · Muted `#7fa8ae` · Dim `#557077` · Card text `#b6d0d4`/`#cfe3e5`
- Danger `#e04a39` (close hover / unassign)
- Type accents: blue `#3f8fdd`/`#6fb4f0`, green `#5fbf6a`, lime `#cbe64f`. Badge bg = accent + `1f` (~12% alpha).

**Radii** 7, 8, 9, 10, 11, 13, 14, 16, 18 px. **Gaps/padding** on a loose 4px scale (4,8,10,12,14,16,18,20,22,24).

**Shadows**
- Modal `0 40px 120px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)`
- Card default `0 3px 10px rgba(0,0,0,.25)`; selected `0 0 0 2px rgba(227,182,79,.35), 0 8px 22px rgba(0,0,0,.4)`
- Thumbs `0 4px 12px rgba(0,0,0,.4)` (small) / `0 8px 24px rgba(0,0,0,.5)` (large)
- Hotbar empty inset `inset 0 2px 8px rgba(0,0,0,.5)`

**Typography**
- Headings: **Cinzel** 500/600/700 (title 27, section 18, detail name 24, slot digit 26, footer 16).
- Body/UI: **Nunito Sans** 400/600/700/800.
- Load app-side, e.g.:
  `https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap`

## Icons
Inline stroke SVGs (viewBox 0 0 24 24, stroke-width 1.8, round caps): `wand`, `clock`, `target`, `bolt`.
Defined in `SpellsModal.jsx` (`ICONS`). Swap for your icon set if you have equivalents.

## Assets
In `assets/` (from the prototype). Only the following are used by this component:
- `spell1.png … spell4.png` — spell icons (square, rendered `object-fit: cover`).
- `map.png` — blurred background (only when `showBackdrop`).

The other files in the project's `assets/` (avatar, potions, nav icons, logo, cursors) are **not**
used here — supply real spell art from your asset pipeline; these are placeholders.

## Files
- `SpellsModal.jsx` — the component.
- `assets/spell1–4.png`, `assets/map.png` — images referenced.
- Original prototype in the parent project: `Sorts.dc.html`.
