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

