# Images de carte des ressources — 15 novembre 2026

Générées avec l’outil intégré ImageGen, PNG transparents. Les images d’inventaire sont conservées.

Dans Administration → Artisanat → Ressources, « Image affichée sur la carte » permet d’envoyer un PNG ou de choisir un fichier existant (sans extension).
Le sprite de l’objet est prioritaire pour les interactions de type récolter qui le donnent ; sans sprite, l’ancienne image de l’interaction est utilisée. Les coffres/leviers ne changent pas.

Les huit ressources de la base locale sont équipées. Les images du cuir et de la marguerite restent disponibles même sans point de récolte actuellement posé. Attention : le point nommé « Filon de cuivre » donne déjà du fer ; son nom et son butin n’ont pas été modifiés.

## Prompts de génération

Chaque appel utilise transparent_background=true et le prompt suivant, en substituant SUBJECT et SLUG :

> Use case: stylized-concept. Asset: ONE isolated harvestable resource map sprite for Alcazan Forest, a classic RPG Maker-like 2D medieval forest game. Subject: SUBJECT Style: crisp hand-painted pixel-art aesthetic, limited colors and bold clean readable silhouette at 32x32 or 48x48 screen pixels, visible chunky pixels rather than fine detail, top-down three-quarter overhead view, soft top-left lighting and dark contour. Match bright grassy RPG forest maps. Centered single object occupying 80% of canvas, equal transparent padding, entire object visible. Truly transparent background. No scenery, no ground tile or grass platform, no UI, no frame, no circle, no text, no labels, no sparkles or glow (added by code), no checkerboard drawn into image. Same consistent scale and rendering as a small retro RPG map prop. Produce exactly one sprite, not a sheet. Filename intent: SLUG.

- `champignon-bleu-carte.png` : A cluster of three vivid cobalt blue mushrooms with pale ivory stems and tiny cream cap speckles, rooted together.
- `sauge-des-bois-carte.png` : A living woodland sage plant: dense rosette of broad fuzzy muted sage-green leaves, two short violet flower spikes. Distinct low bush silhouette.
- `minerai-fer-carte.png` : A squat jagged dark slate-grey iron ore boulder with rusty reddish-brown seams and pale steel-grey exposed facets. Clearly iron, no orange copper crystals.
- `minerai-argent-carte.png` : A jagged grey ore rock with bright silvery white metallic crystalline veins, cool lavender-grey shadow, distinct pointed silhouette. No gold.
- `chene-carte.png` : A small harvestable oak sapling with chunky brown trunk and compact round oak-leaf canopy, two small golden acorns, readable tree silhouette fitting a single map tile.
- `peau-bete-carte.png` : A small naturally folded pile of coarse brown wild beast hide with fur edges, one cream underside fold, no animal body, no blood, no tools.
- `cuir-travaille-carte.png` : A neat small roll of warm russet tanned leather atop a folded leather sheet, ivory inner rolled edge, no fur, no tools.
- `marguerite-carte.png` : A living small clump of three white daisies with large bright yellow centers, distinct petals and rich green leaves, varying stem heights. Clearly daisies.



### Sprites de récolte niveau 0 — 19 novembre 2026

Fer (objet 6), Bois de frêne (189), Ortie (177) : nouveaux PNG transparents
`recolte-{fer,frene,ortie}-niv0-v1.png`, liés via `objet.image_carte` sans extension.
Les inventaires, recettes et points de récolte ne sont pas modifiés. La résolution
des interactions RECOLTER existantes utilise automatiquement cette image d’objet.
Les nouveaux points de frêne et d’orties restent à placer/configurer dans le maker.

Images générées via imagegen intégré en prenant le screenshot utilisateur comme
référence de style et d’échelle. Alpha contrôlé ; silhouettes couvrant 91 à 96 %
de la largeur des PNG. CSS actuel conservé (120 % × 145 %, contain, ancrage bas),
soit environ 109 à 115 % de largeur de case pour le dessin. Aucune modification CSS.
Aperçu simulé : `output/qa/recolte-niveau0.html` ; son ouverture dans le navigateur
intégré a été bloquée (protocole file), donc pas de validation visuelle en session de jeu.
Originaux et référence : `output/imagegen/recolte-niveau0-v1/`.
Manifeste et prompts : `seeds/lots/recolte-niveau0-images-007.json`.


### Essai sprites niveau 0 v2 — 19 novembre 2026

Fer, frêne et orties utilisent désormais `recolte-*-niv0-v2`, variantes imagegen
très légèrement adoucies. Les v1 sont conservées. Sur la carte web, seuls ces trois
fichiers reçoivent `image-rendering: auto`, `width: calc(120% - 4px)` et
`height: calc(145% - 4px)`, avec centrage horizontal compensé de 2 px et ancrage bas
inchangé. Règles ciblées dans InteractionMap.module.scss ; les autres sprites ne changent pas.
Alpha contrôlé, SCSS compilé. Rendu final à confirmer par l’utilisateur en jeu.
Images : `output/imagegen/recolte-niveau0-v2/`.
Prompt et associations : `seeds/lots/recolte-niveau0-images-008.json`.


### Harmonisation des récoltes historiques — 19 novembre 2026

La capture utilisateur montrait encore les anciens chêne turquoise et champignon bleu
saturé : les sprites du frêne et de l’Ortie ne sont pas utilisés par ces points historiques.
Objets 8 (chêne), 4 (champignon bleu) et 5 (sauge) : `image_carte` remplacée par
`chene-carte-sobre-v3`, `champignon-bleu-carte-sobre-v3`, `sauge-des-bois-carte-sobre-v3`.
Palette naturelle olive/brun, bleu ardoise et gris-vert/mauve discret ; contours moins épais.
Le fer, le frêne et les orties ne sont pas modifiés. Aucun changement de niveau ou de récolte.
Le halo doré permanent est remplacé pour ces trois sprites web par une ombre discrète ;
le survol conserve un léger éclaircissement. Marqueur et clic inchangés.
Images générées par imagegen : `output/imagegen/recolte-sobre-v3/`.
Prompts et historique : `seeds/lots/recolte-sobre-images-009.json`.
Alpha et associations vérifiés, SCSS compilé ; rendu final à confirmer en jeu par l’utilisateur.


### Série complète des sprites de récolte — 19 novembre 2026

38 sprites générés avec imagegen intégré : 14 gisements, 12 arbres, 12 plantes/champignons.
Le fer, le chêne et la sauge validés sont conservés : les 41 ressources des trois
progressions disposent désormais d’une image de carte. Le champignon bleu historique
est réduit de 4 px sur le web. Aucun niveau, recette, icône d’inventaire ou placement modifié.

Après validation des formes, palette renforcée au rendu web : saturation et petites
variations de teinte par ressource dans `InteractionMap.module.scss`, PNG intacts.
Le gris d’indisponibilité reste fonctionnel ; survol discret sans halo permanent.
Ces filtres concernent la carte web, pas les fichiers PNG bruts ni le client mobile.

Manifeste, prompts et palette : `seeds/lots/recolte-complete-images-010.json`.
Originaux : `output/imagegen/recolte-complete-v4/`. Fichiers servis :
`alcazan-front-prod/public/img/interaction/*-carte-sobre-v4.png`.
Associations vérifiées en transaction (seul image_carte change), alpha et copies contrôlés,
SCSS compilé. Rendu des nouvelles couleurs à confirmer en jeu ; pas de validation navigateur.
