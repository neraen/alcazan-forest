# ProfileScreen — écran de profil (React)

Composant React autonome, **sans dépendance** (styles inline). Deux présentations dans un seul composant, via la prop `variant`.

## Fichiers
- `ProfileScreen.jsx` — le composant (export default).
- `assets/` — images utilisées (`avatar.png`, `logo.png`, `icon-profil.png`, `map.png` pour le fond de la modale).

## Polices
Utilise `Cinzel` (titres) et `Nunito Sans` (texte). À charger une fois dans ton app :

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
```

## Utilisation

```jsx
import ProfileScreen from "./ProfileScreen";

// Modale (carte floutée derrière)
{open && (
  <ProfileScreen
    variant="modal"
    assetBase="/assets"
    pointsPool={5}
    onClose={() => setOpen(false)}
    onValidate={(alloc, newStats) => save(newStats)}
  />
)}

// Plein écran (intégré à l'interface, remplit son conteneur)
<ProfileScreen variant="fullscreen" assetBase="/assets" pointsPool={5} onValidate={save} />
```

Toutes les props de données sont optionnelles (données de démo par défaut).

## Props

- `variant` : `"modal"` (défaut) | `"fullscreen"`.
- `assetBase` : dossier public des images. Défaut `"/assets"`.
- `character` : `{ name, level, cls, avatar }`.
- `info` : lignes du bloc « Informations » — `[{ label, value }, …]`.
- `stats` : les 6 caractéristiques (voir schéma).
- `pointsPool` : nombre de points à répartir. Défaut `5`.
- `onClose()` : fermeture (modale — clic sur le fond ou la croix).
- `onValidate(allocation, newStats)` : appelé au clic sur **Valider** ; `allocation` = points ajoutés par clé, `newStats` = nouvelles bases.
- Modale uniquement : `showBackdrop`, `backdropImage` (défaut `"map.png"`).
- Plein écran : `logo` (défaut `"logo.png"`), `profileIcon` (modale, défaut `"icon-profil.png"`).

## Schéma `stat`

```js
{ key: "force", label: "Force", base: 28, equip: 8, glyph: "strength", color: "#e3b64f" }
// base  = valeur du personnage
// equip = bonus d'équipement (affiché en vert, non modifiable)
// total affiché = base + equip + points alloués
```
Glyphes dispo : `heart, strength, target, wisdom, speed, luck, book` (objet `GLYPHS` en haut du fichier).

## Comportement des points
Les boutons `+ / −` puisent dans `pointsPool` (compteur « à répartir »). **Valider** verrouille les points dépensés : ils s'ajoutent à la base et retirent du pool. Le personnage central de l'ancienne page n'est **pas** repris.
