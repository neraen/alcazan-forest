# Herboriste

Date de validation : 18 novembre 2026.
Statut : ressources intégrées en base et au seed le 18 novembre 2026.
Les points de récolte restent à placer ; les usages disponibles sont indiqués ci-dessous.

## Présentation

L'herboriste est un métier de récolte d'Alcazan Forest. Il cueille des plantes,
des fleurs et des champignons destinés à l'artisanat et aux quêtes. Les ressources
familières des premiers niveaux laissent progressivement place à des végétaux
fantastiques. Les champignons possèdent une identité magique dès le premier palier
qui leur est consacré.

Cette fiche sert de référence pour une future page du site. La section « Intégration »
décrit les objets et recettes effectivement créés.

## Progression validée

Les niveaux sont ceux du **métier d'herboriste**, pas ceux du personnage. Le palier 0
désigne la ressource de départ et ne dispense pas d'apprendre le métier.

| Niveau requis | Ressource débloquée | Type |
|---|---|---|
| 0 | Ortie | Plante |
| 20 | Camomille | Fleur |
| 40 | Bolet luisant | Champignon |
| 50 | Menthe sauvage | Plante |
| 60 | Lavande | Fleur |
| 80 | Champignon corrompu | Champignon |
| 100 | Sauge | Plante |
| 120 | Fleur enchantée | Fleur |
| 140 | Morille des songes | Champignon |
| 150 | Trèfle astral | Plante |
| 160 | Orchidée lunaire | Fleur |
| 180 | Amanite spectrale | Champignon |
| 200 | Fleur de l'arbre-monde | Fleur |

La progression comporte **13 paliers et 13 ressources**. Les seuls ajouts aux
paliers espacés de 20 niveaux sont la menthe sauvage au niveau 50 et le trèfle astral
au niveau 150. « Plante », « Fleur » et « Champignon » sont ici des catégories de
présentation, pas une classification botanique ni de nouvelles mécaniques.

## Identité visuelle des champignons

| Champignon | Intention visuelle validée |
|---|---|
| Bolet luisant | Points dorés sur le chapeau et douce lumière sous les lamelles |
| Champignon corrompu | Veines violettes et spores sombres flottant autour |
| Morille des songes | Chapeau bleu irisé laissant échapper une brume rose |
| Amanite spectrale | Chapeau translucide et halo blanc bleuté, presque fantomatique |

Ces descriptions sont des directions artistiques fantastiques. Elles n'imposent ni
animation particulière, ni effet de jeu, ni bonus lors de la récolte.

## Intentions de conception et pistes d'usage

- Limiter le nombre de ressources pour maîtriser la création des visuels, recettes
  et quêtes, comme pour le mineur et le bûcheron.
- Envisager des usages dans les potions, onguents, poisons et objets de quête.
  Les recettes et leurs effets restent à concevoir dans l'univers du jeu.
- Réutiliser les plantes communes comme ingrédients de base de recettes avancées
  pour conserver leur utilité au fil de la progression.
- Relier thématiquement la fleur de l'arbre-monde au bois d'arbre-monde du bûcheron,
  sans présumer d'un lieu de récolte partagé ou d'une recette commune.

## Éléments restant à concevoir

- Descriptions dans l'univers et visuels des ressources autres que les champignons.
- Visuels des nouveaux points de récolte.
- Zones et emplacements de récolte.
- Quantités, expérience de métier, coûts et délais de recharge.
- Autres recettes et usages : la première série d’alchimie est définie dans [Alchimiste](alchimiste.md).
- Quêtes : contexte, objectifs et quantités.

## Consignes pour la rédaction du site par une IA

- Utiliser « Herboriste » comme titre et présenter un métier de récolte.
- Reprendre exactement les noms, types et niveaux du tableau validé.
- Ne pas ajouter de ressource ou de palier intermédiaire.
- Utiliser les intentions visuelles des champignons pour les décrire, sans en
  déduire de propriétés de jeu ou d'effets médicinaux réels.
- Distinguer la conception prévue du contenu effectivement disponible en jeu.
- Ne pas présenter les pistes d'usage comme des recettes existantes ; omettre les
  détails non définis plutôt que d'inventer des lieux, PNJ, rendements ou effets.
- Garder les notes techniques et les points ouverts hors du texte destiné aux
  joueurs, sauf pour une page présentant explicitement les travaux à venir.

## Références du projet

- [Documentation générale](../../DOCUMENTATION.md), §14 et §16 : interactions et artisanat.
- [Plan de l'artisanat](../ARTISANAT_PLAN.md).
- [Images des ressources](../IMAGES_RESSOURCES.md).
- [Mineur](mineur.md) et [Bûcheron](bucheron.md) : autres métiers de récolte validés.

## Intégration — 18 novembre 2026

Source structurée : [alchimie-001.json](../../seeds/lots/alchimie-001.json).

| Niveau métier | Ressource | ID objet | Image |
|---|---|---|---|
| 0 | Ortie | 177 | herboriste-003-177.png |
| 20 | Camomille | 178 | herboriste-003-178.png |
| 40 | Bolet luisant | 179 | herboriste-003-179.png |
| 50 | Menthe sauvage | 180 | herboriste-003-180.png |
| 60 | Lavande | 181 | herboriste-003-181.png |
| 80 | Champignon corrompu | 182 | herboriste-003-182.png |
| 100 | Sauge | 5 | herboriste-003-5.png |
| 120 | Fleur enchantée | 183 | herboriste-003-183.png |
| 140 | Morille des songes | 184 | herboriste-003-184.png |
| 150 | Trèfle astral | 185 | herboriste-trefle-astral.png |
| 160 | Orchidée lunaire | 186 | herboriste-003-186.png |
| 180 | Amanite spectrale | 187 | herboriste-003-187.png |
| 200 | Fleur de l’arbre-monde | 188 | herboriste-003-188.png |

Les treize ressources disposent maintenant d’une image. Toutes servent aux
[recettes d’alchimie](alchimiste.md). La Sauge réutilise l’objet 5 (ancienne Feuille
de sauge des bois), désormais niveau 100. La recette historique de Potion de vie
mineure remplace cet ingrédient par l’Ortie pour rester accessible aux débutants.
Les points de récolte de ces plantes restent à configurer.

Complément visuel : [metiers-002.json](../../seeds/lots/metiers-002.json),
images du pack `background-20261118T212445Z-1-001.zip`, conservées avec leur fond.

## Mise à jour des images — lot herboriste-images-003

Douze images associées : neuf cases vides complétées et trois anciennes images
remplacées (menthe, fleur enchantée, fleur de l’arbre-monde). La Mandragore restait alors vide (remplacée depuis, voir ci-dessous).
Les 50 champignons du troisième ZIP sont des doublons exacts du pack Craftpix.
Les fichiers conservent leur fond et ne sont pas retouchés.

Les intentions artistiques initiales restent des pistes, pas une description exacte
des icônes sélectionnées : le Bolet est jaune avec un dessous poreux, le Champignon
corrompu violet et visqueux, la Morille des songes dorée et alvéolée, l’Amanite
spectrale blanc verdâtre avec un chapeau pâle. Les illustrations de plantes sont
stylisées ; ne pas les présenter comme des planches d’identification botanique.

[Manifeste courant des images](../../seeds/lots/herboriste-images-003.json) : sources,
empreintes, IDs et anciennes images. Les manifestes antérieurs conservent l’historique.

## Trèfle astral — remplacement de la Mandragore

Sur demande du créateur, la ressource de niveau 150 devient le **Trèfle astral**,
illustré par les feuilles bleu-vert lumineuses du visuel 28 du pack de plantes.
L’objet 185, son niveau, son prix et toutes ses références de recettes sont conservés.
Les 13 ressources de la progression sont maintenant illustrées.
[Manifeste](../../seeds/lots/herboriste-trefle-004.json).

## Sprite de récolte niveau 0 — 19 novembre 2026

Ortie (objet 177) : `image_carte = recolte-ortie-niv0-v2`.
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
| 177 | Ortie | 0 | `herbe-ortie-carte-sobre-v4` |
| 178 | Camomille | 20 | `herbe-camomille-carte-sobre-v4` |
| 179 | Bolet luisant | 40 | `herbe-bolet-luisant-carte-sobre-v4` |
| 180 | Menthe sauvage | 50 | `herbe-menthe-carte-sobre-v4` |
| 181 | Lavande | 60 | `herbe-lavande-carte-sobre-v4` |
| 182 | Champignon corrompu | 80 | `herbe-champignon-corrompu-carte-sobre-v4` |
| 5 | Sauge | 100 | `sauge-des-bois-carte-sobre-v3` |
| 183 | Fleur enchantée | 120 | `herbe-fleur-enchantee-carte-sobre-v4` |
| 184 | Morille des songes | 140 | `herbe-morille-songes-carte-sobre-v4` |
| 185 | Trèfle astral | 150 | `herbe-trefle-astral-carte-sobre-v4` |
| 186 | Orchidée lunaire | 160 | `herbe-orchidee-lunaire-carte-sobre-v4` |
| 187 | Amanite spectrale | 180 | `herbe-amanite-spectrale-carte-sobre-v4` |
| 188 | Fleur de l’arbre-monde | 200 | `herbe-fleur-arbre-monde-carte-sobre-v4` |
