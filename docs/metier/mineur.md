# Mineur

Date de validation des paliers : 18 novembre 2026.
Statut : ressources intégrées en base et au seed le 18 novembre 2026.
Les points de récolte restent à placer ; les usages disponibles sont indiqués ci-dessous.

## Présentation

Le mineur est un métier de récolte d'Alcazan Forest. Il extrait des minerais, des
pierres et des ressources minérales destinés à l'artisanat et aux quêtes. Sa progression
commence par le fer et mène jusqu'aux pierres précieuses au niveau 200 du métier.

Cette fiche sert de référence de conception et de source pour rédiger une future page
du site. La section « Intégration » distingue les objets créés des usages encore prévus.

## Progression validée

Les niveaux ci-dessous sont les niveaux requis du **métier de mineur**, pas ceux du
personnage. Le palier 0 désigne la ressource de départ ; il ne dispense pas d'apprendre
le métier selon les règles générales du jeu.

| Niveau requis | Ressource débloquée |
|---|---|
| 0 | Fer |
| 20 | Cuivre |
| 40 | Étain |
| 50 | Charbon |
| 60 | Cobalt |
| 80 | Minerai corrompu |
| 100 | Argent |
| 120 | Minerai enchanté |
| 140 | Quartz |
| 150 | Améthyste |
| 160 | Serpentine |
| 180 | Or |
| 200 | Pierres précieuses : rubis, saphir, cristal pur |

La progression comporte **13 paliers**. Les seuls ajouts aux paliers espacés de
20 niveaux sont le charbon au niveau 50 et l'améthyste au niveau 150. Le palier 200
regroupe trois ressources distinctes, soit 15 ressources au total.

## Intentions de conception

- Limiter le nombre de ressources pour maîtriser le travail de création des visuels,
  filons, recettes et quêtes.
- Donner une utilité aux ressources dans les recettes et les quêtes ; éviter de créer
  des ressources uniquement pour remplir la progression.
- Conserver des usages aux ressources des premiers paliers dans la suite du jeu.
- Le cobalt occupe le palier 60 ; le nickel n'est pas retenu.
- Le bronze n'est pas une ressource récoltable de cette liste. Il est envisagé comme
  produit de transformation du cuivre et de l'étain.

## Pistes d'usage à préciser

Ces pistes orientent la conception future ; elles ne décrivent pas des recettes ni
des effets déjà validés ou implémentés.

| Ressource | Piste d'usage |
|---|---|
| Fer | Équipements de départ et outils |
| Cuivre et étain | Fabrication de bronze ; proportions et métier de transformation à définir |
| Charbon | Combustible pour des recettes de forge avancées ; ne pas bloquer les premières recettes avec une ressource de niveau 50 |
| Cobalt | Équipements et alliages de forge ; identité visuelle bleue envisagée |
| Minerai corrompu | Recettes et quêtes liées à la corruption |
| Argent | Bijouterie et équipements sacrés |
| Minerai enchanté | Équipements magiques |
| Quartz | Catalyseurs et focalisateurs magiques |
| Améthyste | Bijouterie et enchantements |
| Serpentine | Ornements et talismans |
| Or | Bijoux et composants précieux |
| Rubis, saphir et cristal pur | Artisanat de fin de progression |

Un même type de filon donnant les différentes pierres précieuses du palier 200 est
une possibilité pour limiter les visuels à créer. Le choix entre filon commun et
filons distincts, ainsi que les règles d'obtention, reste à définir.

## Éléments restant à concevoir

- Descriptions dans l'univers, visuels d'inventaire et visuels des filons.
- Zones de récolte et emplacement des filons.
- Quantités récoltées, expérience de métier, coûts et délais de recharge.
- Recettes utilisant chaque ressource : ingrédients, quantités, résultat et niveau requis.
- Quêtes utilisant chaque ressource : contexte, objectifs et quantités.
- Modalités d'obtention du rubis, du saphir et du cristal pur au niveau 200.

## Consignes pour la rédaction du site par une IA

- Utiliser « Mineur » comme titre et présenter le métier comme un métier de récolte.
- Reprendre exactement les noms et niveaux du tableau de progression validé.
- Présenter les trois pierres précieuses comme un même palier de niveau 200.
- Ne pas ajouter de palier intermédiaire ni réintroduire le nickel ou le bronze
  parmi les ressources récoltables.
- Distinguer la conception prévue du contenu effectivement disponible en jeu.
- Ne pas présenter les pistes d'usage comme des recettes existantes. Omettre les
  détails non définis plutôt que d'inventer des lieux, PNJ, prix, rendements ou effets.
- Garder les notes techniques et les points de conception ouverts hors du texte
  destiné aux joueurs, sauf si la page présente explicitement les travaux à venir.

## Références du projet

- [Documentation générale](../../DOCUMENTATION.md), §14 et §16 : interactions,
  apprentissage, progression et artisanat.
- [Plan de l'artisanat](../ARTISANAT_PLAN.md) : conception du système de métiers.
- [Images des ressources](../IMAGES_RESSOURCES.md) : catalogue et conventions visuelles.

## Intégration — 18 novembre 2026

Source structurée : [alchimie-001.json](../../seeds/lots/alchimie-001.json).

| Niveau métier | Ressource | ID objet | Image |
|---|---|---|---|
| 0 | Minerai de fer | 6 | metier-mineur-01.png |
| 20 | Minerai de cuivre | 164 | metier-mineur-02.png |
| 40 | Minerai d’étain | 165 | materiaux-generes-v1-minerai-etain.png |
| 50 | Charbon | 166 | materiaux-generes-v1-charbon.png |
| 60 | Minerai de cobalt | 167 | materiaux-generes-v1-minerai-cobalt.png |
| 80 | Minerai corrompu | 168 | metier-mineur-06.png |
| 100 | Minerai d’argent | 7 | metier-mineur-07.png |
| 120 | Minerai enchanté | 169 | metier-mineur-08.png |
| 140 | Quartz | 170 | metier-mineur-09.png |
| 150 | Améthyste | 171 | metier-mineur-10.png |
| 160 | Serpentine | 172 | materiaux-generes-v1-serpentine.png |
| 180 | Minerai d’or | 173 | metier-mineur-12.png |
| 200 | Rubis | 174 | metier-mineur-13.png |
| 200 | Saphir | 175 | materiaux-generes-v1-saphir.png |
| 200 | Cristal pur | 176 | metiers-002-043.png |

Les quinze ressources sont illustrées : neuf visuels du pack minier, un cristal du
pack complémentaire et cinq icônes générées pour les ressources jusque-là sans image.
Les objets fer (6) et argent (7) existants sont réutilisés, avec les niveaux validés.
Aucun nouveau filon, drop ou recette de forge n’a été ajouté dans ce lot.

Complément visuel : [metiers-002.json](../../seeds/lots/metiers-002.json),
images du pack `background-20261118T212445Z-1-001.zip`, conservées avec leur fond.

## Complément illustré — 19 novembre 2026

Seuls l’étain, le charbon, le cobalt, la serpentine et le saphir ont reçu une image
générée. Les dix ressources déjà illustrées restent inchangées.
Ces images sont générées avec imagegen intégré pour le projet ; elles ne sont pas
attribuées à l’artiste des références. Niveaux, prix et références de jeu conservés.
Originaux : `output/imagegen/peaux-minerais-v1/`.
[Prompts, références et associations](../../seeds/lots/peaux-minerais-images-006.json).

## Sprite de récolte niveau 0 — 19 novembre 2026

Minerai de fer (objet 6) : `image_carte = recolte-fer-niv0-v2`.
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
| 6 | Minerai de fer | 0 | `recolte-fer-niv0-v2` |
| 164 | Minerai de cuivre | 20 | `mine-cuivre-carte-sobre-v4` |
| 165 | Minerai d’étain | 40 | `mine-etain-carte-sobre-v4` |
| 166 | Charbon | 50 | `mine-charbon-carte-sobre-v4` |
| 167 | Minerai de cobalt | 60 | `mine-cobalt-carte-sobre-v4` |
| 168 | Minerai corrompu | 80 | `mine-corrompu-carte-sobre-v4` |
| 7 | Minerai d’argent | 100 | `mine-argent-carte-sobre-v4` |
| 169 | Minerai enchanté | 120 | `mine-enchante-carte-sobre-v4` |
| 170 | Quartz | 140 | `mine-quartz-carte-sobre-v4` |
| 171 | Améthyste | 150 | `mine-amethyste-carte-sobre-v4` |
| 172 | Serpentine | 160 | `mine-serpentine-carte-sobre-v4` |
| 173 | Minerai d’or | 180 | `mine-or-carte-sobre-v4` |
| 174 | Rubis | 200 | `mine-rubis-carte-sobre-v4` |
| 175 | Saphir | 200 | `mine-saphir-carte-sobre-v4` |
| 176 | Cristal pur | 200 | `mine-cristal-pur-carte-sobre-v4` |
