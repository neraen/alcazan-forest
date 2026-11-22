# Bûcheron

Date de validation des paliers : 18 novembre 2026.
Statut : les 13 ressources sont intégrées en base et au seed le 18 novembre 2026.
Les nouveaux points de récolte, recettes et quêtes restent à concevoir.

## Présentation

Le bûcheron est un métier de récolte d'Alcazan Forest. Il récolte différentes essences
de bois destinées à l'artisanat et aux quêtes. Sa progression commence par le frêne
et mène jusqu'au bois d'arbre-monde au niveau 200 du métier. Les essences familières
des premiers paliers côtoient progressivement des bois fantastiques.

Cette fiche sert de référence de conception et de source pour rédiger une future page
du site. La section Intégration distingue les objets créés des usages encore à réaliser.

## Progression validée

Les niveaux ci-dessous sont ceux du **métier de bûcheron**, pas ceux du personnage.
Le palier 0 désigne la ressource de départ ; il ne dispense pas d'apprendre le métier
selon les règles générales du jeu. Ces niveaux représentent la maîtrise nécessaire
dans le jeu, pas une hiérarchie botanique.

| Niveau requis | Bois débloqué |
|---|---|
| 0 | Frêne |
| 20 | Châtaignier |
| 40 | Chêne |
| 50 | Bouleau |
| 60 | Érable |
| 80 | Bois corrompu |
| 100 | Noyer |
| 120 | Bois enchanté |
| 140 | If |
| 150 | Ébène |
| 160 | Bois de fer |
| 180 | Bois ancestral |
| 200 | bois-generes-v1-arbre-monde.png |

La progression comporte **13 paliers et 13 ressources**. Les seuls ajouts aux paliers
espacés de 20 niveaux sont le bouleau au niveau 50 et l'ébène au niveau 150.
Pour les essences nommées par leur arbre, la ressource récoltée est le bois correspondant.

## Intentions de conception

- Limiter le nombre de ressources pour maîtriser le travail de création des visuels,
  points de récolte, recettes et quêtes.
- Donner des usages aux bois dans l'artisanat et les quêtes sans imposer une mécanique
  particulière à chaque essence.
- Conserver des usages aux bois des premiers paliers dans la suite du jeu.
- Faire du bois d'arbre-monde une ressource finale emblématique de l'univers
  d'Alcazan Forest ; son histoire précise reste à écrire.

## Pistes d'usage à préciser

Les bois peuvent alimenter la fabrication de manches d'armes, d'arcs, de bâtons,
de boucliers et d'objets de quête. La répartition exacte entre les essences reste
à concevoir.

| Ressource | Piste d'usage |
|---|---|
| If | Arcs |
| Ébène | Objets précieux |
| Bois de fer | Équipements résistants |

Ces pistes ne décrivent pas des recettes ou des bonus déjà définis. Aucun effet
automatique n'est attribué aux bois corrompu, enchanté, ancestral ou d'arbre-monde
par leur seul nom.

## Éléments restant à concevoir

- Descriptions dans l'univers et apparence de chaque essence.
- Visuels d'inventaire et visuels des points de récolte.
- Zones de récolte et emplacement des arbres.
- Quantités récoltées, expérience de métier, coûts et délais de recharge.
- Recettes utilisant chaque bois : ingrédients, quantités, résultat et niveau requis.
- Quêtes utilisant chaque bois : contexte, objectifs et quantités.

## Consignes pour la rédaction du site par une IA

- Utiliser « Bûcheron » comme titre et présenter le métier comme un métier de récolte.
- Reprendre exactement les noms et niveaux du tableau de progression validé.
- Ne pas ajouter de palier intermédiaire ou de nouvelle essence.
- Distinguer la conception prévue du contenu effectivement disponible en jeu.
- Ne pas présenter les pistes d'usage comme des recettes existantes. Omettre les
  détails non définis plutôt que d'inventer des lieux, PNJ, prix, rendements ou effets.
- Ne pas déduire un bonus de combat ou une propriété magique du nom d'un bois.
- Garder les notes techniques et les points de conception ouverts hors du texte
  destiné aux joueurs, sauf si la page présente explicitement les travaux à venir.

## Références du projet

- [Documentation générale](../../DOCUMENTATION.md), §14 et §16 : interactions,
  apprentissage, progression et artisanat.
- [Plan de l'artisanat](../ARTISANAT_PLAN.md) : conception du système de métiers.
- [Images des ressources](../IMAGES_RESSOURCES.md) : catalogue et conventions visuelles.
- [Mineur](mineur.md) : autre métier de récolte conçu avec le même rythme de paliers.

## Intégration — 18 novembre 2026

| Niveau métier | Ressource | ID objet | Image |
|---|---|---|---|
| 0 | Bois de frêne | 189 | bois-generes-v1-frene.png |
| 20 | Bois de châtaignier | 190 | bois-generes-v1-chataignier.png |
| 40 | Bûche de chêne | 8 | bois-generes-v1-chene.png |
| 50 | Bois de bouleau | 191 | bois-generes-v1-bouleau.png |
| 60 | Bois d’érable | 192 | bois-generes-v1-erable.png |
| 80 | Bois corrompu | 193 | bois-generes-v1-corrompu.png |
| 100 | Bois de noyer | 194 | bois-generes-v1-noyer.png |
| 120 | Bois enchanté | 195 | bois-generes-v1-enchante.png |
| 140 | Bois d’if | 196 | bois-generes-v1-if.png |
| 150 | Bois d’ébène | 197 | bois-generes-v1-ebene.png |
| 160 | Bois de fer | 198 | bois-generes-v1-fer.png |
| 180 | Bois ancestral | 199 | bois-generes-v1-ancestral.png |
| 200 | bois-generes-v1-arbre-monde.png | 200 | Aucune |

Le chêne réutilise l’objet 8, désormais au niveau métier 40. Les treize bois
disposent depuis le 19 novembre 2026 d’une série d’icônes générées et homogènes.
Aucune nouvelle recette ni point de récolte ajouté dans ce lot.

[Manifeste structuré](../../seeds/lots/metiers-002.json).

## Série illustrée — 19 novembre 2026

Treize icônes originales générées avec l’outil intégré imagegen à partir de références
visuelles du pack : peinture 2D stylisée, fond sombre, bûche en diagonale et éclairage
chaud. Chaque essence se distingue par son écorce, sa coupe, ses feuilles ou sa teinte
magique. Ces images sont générées pour le projet et ne sont pas attribuées à l’artiste
du pack. Les anciennes images restent conservées dans les fichiers.

Originaux : `output/imagegen/bois-v1/`. Fichiers utilisés par le jeu :
`alcazan-front-prod/public/img/objet/bois-generes-v1-*.png`.
[Prompts, références et associations](../../seeds/lots/bois-images-005.json).

## Sprite de récolte niveau 0 — 19 novembre 2026

Bois de frêne (objet 189) : `image_carte = recolte-frene-niv0-v2`.
PNG transparent en pixel art, silhouette large et contrastée pour la carte.
L’icône d’inventaire est conservée. Aucun nouveau point de récolte placé par ce lot.
[Manifeste et prompt](../../seeds/lots/recolte-niveau0-images-007.json).


## Sprites de carte complets — 19 novembre 2026

Images de récolte liées par `objet.image_carte`, distinctes des icônes d’inventaire.
PNG transparents servis dans `alcazan-front-prod/public/img/interaction/`.
Les ressources sont illustrées ; aucun nouveau point de récolte n’est placé par ce lot.
Palette web renforcée par ressource via CSS, formes conservées.
Prompts et réglages : `seeds/lots/recolte-complete-images-010.json`.

| Objet ID | Ressource | Niveau | image_carte |
|---|---|---|---|
| 189 | Bois de frêne | 0 | `arbre-frene-carte-sobre-v4` |
| 190 | Bois de châtaignier | 20 | `arbre-chataignier-carte-sobre-v4` |
| 8 | Bûche de chêne | 40 | `chene-carte-sobre-v3` |
| 191 | Bois de bouleau | 50 | `arbre-bouleau-carte-sobre-v4` |
| 192 | Bois d’érable | 60 | `arbre-erable-carte-sobre-v4` |
| 193 | Bois corrompu | 80 | `arbre-corrompu-carte-sobre-v4` |
| 194 | Bois de noyer | 100 | `arbre-noyer-carte-sobre-v4` |
| 195 | Bois enchanté | 120 | `arbre-enchante-carte-sobre-v4` |
| 196 | Bois d’if | 140 | `arbre-if-carte-sobre-v4` |
| 197 | Bois d’ébène | 150 | `arbre-ebene-carte-sobre-v4` |
| 198 | Bois de fer | 160 | `arbre-fer-carte-sobre-v4` |
| 199 | Bois ancestral | 180 | `arbre-ancestral-carte-sobre-v4` |
| 200 | Bois d’arbre-monde | 200 | `arbre-arbre-monde-carte-sobre-v4` |
