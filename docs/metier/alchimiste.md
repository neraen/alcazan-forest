# Alchimiste

Statut : contenu intégré en base et au seed le 18 novembre 2026.

## Présentation pour le site

L’alchimiste transforme les plantes, fleurs et champignons de l’herboriste en
potions de vie, de mana et de caractéristiques. Cette première collection contient
79 potions, chacune associée à un visuel de fiole remplie et à sa propre recette.
Les niveaux requis sont ceux du métier d’alchimiste, de 0 à 200.

## Règles effectives

- Une fabrication produit une potion ; les ingrédients sont consommés par l’atelier.
- Vie et mana : récupération immédiate, limitée au maximum du personnage.
- Force, dextérité, intelligence ou concentration : bonus fixe pendant 10 minutes.
- Une seule potion de caractéristiques peut être active à la fois, y compris de caractéristiques différentes.
- La potion compte dans la limite générale de trois bonus actifs, partagée avec les sorts.
- Un bonus expiré cesse de compter et d’agir. Un refus de bonus ne consomme pas la potion.
- Toutes les ressources d’herboriste de la liste validée ont un usage dans cette collection.

## Catalogue et recettes

Les ingrédients indiqués produisent **1 potion**. Les identifiants distinguent
la table `consommable` de la table `recette`. Les prix et courbes sont des valeurs
initiales d’équilibrage, modifiables dans les outils d’administration.

| Potion | Niveau | Effet | Ingrédients | Durée fabrication (s) | ID consommable / recette | Image |
|---|---|---|---|---|---|---|
| Potion de concentration — Pendentif de cristal | 0 | +5 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 8 × Ortie | 20 | 8 / 9 | alchimie-001-014.png |
| Potion de dextérité — Bouillon verdoyant | 0 | +5 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 8 × Ortie | 20 | 4 / 5 | alchimie-001-003.png |
| Potion de force — Flamme de verre | 0 | +5 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 8 × Ortie | 20 | 6 / 7 | alchimie-001-008.png |
| Potion de mana — Azur limpide | 0 | Rend 25 points de mana, sans dépasser le maximum. | 8 × Ortie | 20 | 5 / 6 | alchimie-001-007.png |
| Potion de vie — Sang vermeil | 0 | Rend 80 points de vie, sans dépasser le maximum. | 8 × Ortie | 20 | 16 / 17 | alchimie-001-029.png |
| Potion d’intelligence — Améthyste obscure | 0 | +5 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 8 × Ortie | 20 | 3 / 4 | alchimie-001-001.png |
| Potion de concentration — Marche des songes | 20 | +9 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 8 × Ortie, 4 × Camomille | 60 | 9 / 10 | alchimie-001-015.png |
| Potion de dextérité — Rosée d’émeraude | 20 | +9 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 8 × Ortie, 4 × Camomille | 60 | 7 / 8 | alchimie-001-009.png |
| Potion de force — Cristal incandescent | 20 | +9 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 8 × Ortie, 4 × Camomille | 60 | 12 / 13 | alchimie-001-023.png |
| Potion de mana — Saphir léger | 20 | Rend 65 points de mana, sans dépasser le maximum. | 8 × Ortie, 4 × Camomille | 60 | 14 / 15 | alchimie-001-027.png |
| Potion de vie — Chaleur du foyer | 20 | Rend 200 points de vie, sans dépasser le maximum. | 8 × Ortie, 4 × Camomille | 60 | 25 / 26 | alchimie-001-038.png |
| Potion d’intelligence — Brume violette | 20 | +9 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 8 × Ortie, 4 × Camomille | 60 | 17 / 18 | alchimie-001-030.png |
| Potion de concentration — Rêve incandescent | 40 | +13 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Bolet luisant, 4 × Camomille | 100 | 10 / 11 | alchimie-001-016.png |
| Potion de dextérité — Vigueur sylvestre | 40 | +13 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Bolet luisant, 4 × Camomille | 100 | 11 / 12 | alchimie-001-017.png |
| Potion de force — Ambre hexagonal | 40 | +13 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Bolet luisant, 4 × Camomille | 100 | 19 / 20 | alchimie-001-032.png |
| Potion de force — Gourde ambrée | 40 | +13 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Bolet luisant, 4 × Camomille | 100 | 13 / 14 | alchimie-001-024.png |
| Potion de mana — Saphir profond | 40 | Rend 105 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Bolet luisant, 4 × Camomille | 100 | 15 / 16 | alchimie-001-028.png |
| Potion de vie — Cœur de rubis | 40 | Rend 320 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Bolet luisant, 4 × Camomille | 100 | 26 / 27 | alchimie-001-039.png |
| Potion d’intelligence — Fragment de gemme | 40 | +13 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Bolet luisant, 4 × Camomille | 100 | 38 / 39 | alchimie-001-061.png |
| Potion de concentration — Éclat du destin | 50 | +15 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Menthe sauvage, 4 × Bolet luisant | 120 | 22 / 23 | alchimie-001-035.png |
| Potion de dextérité — Finesse d’émeraude | 50 | +15 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Menthe sauvage, 4 × Bolet luisant | 120 | 18 / 19 | alchimie-001-031.png |
| Potion de force — Flamme élancée | 50 | +15 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Menthe sauvage, 4 × Bolet luisant | 120 | 21 / 22 | alchimie-001-034.png |
| Potion de mana — Goutte des lagons | 50 | Rend 125 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Menthe sauvage, 4 × Bolet luisant | 120 | 23 / 24 | alchimie-001-036.png |
| Potion de mana — Souffle de givre | 50 | Rend 125 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Menthe sauvage, 4 × Bolet luisant | 120 | 20 / 21 | alchimie-001-033.png |
| Potion de vie — Rubis vivant | 50 | Rend 380 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Menthe sauvage, 4 × Bolet luisant | 120 | 27 / 28 | alchimie-001-040.png |
| Potion de concentration — Reflet d’argent | 60 | +17 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Lavande, 4 × Menthe sauvage | 140 | 24 / 25 | alchimie-001-037.png |
| Potion de dextérité — Souplesse du changeforme | 60 | +17 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Lavande, 4 × Menthe sauvage | 140 | 30 / 31 | alchimie-001-043.png |
| Potion de force — Tonique d’ambre | 60 | +17 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Lavande, 4 × Menthe sauvage | 140 | 28 / 29 | alchimie-001-041.png |
| Potion de mana — Clarté lunaire | 60 | Rend 145 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Lavande, 4 × Menthe sauvage | 140 | 31 / 32 | alchimie-001-049.png |
| Potion de vie — Nectar féerique | 60 | Rend 440 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Lavande, 4 × Menthe sauvage | 140 | 41 / 42 | alchimie-001-068.png |
| Potion d’intelligence — Regard démoniaque | 60 | +17 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Lavande, 4 × Menthe sauvage | 140 | 39 / 40 | alchimie-001-063.png |
| Potion de concentration — Gland de sagesse | 80 | +21 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Champignon corrompu, 4 × Lavande | 180 | 44 / 45 | alchimie-001-071.png |
| Potion de dextérité — Sève bouillonnante | 80 | +21 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Champignon corrompu, 4 × Lavande | 180 | 35 / 36 | alchimie-001-057.png |
| Potion de force — Écailles ardentes | 80 | +21 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Champignon corrompu, 4 × Lavande | 180 | 29 / 30 | alchimie-001-042.png |
| Potion de mana — Éclats de glace | 80 | Rend 185 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Champignon corrompu, 4 × Lavande | 180 | 37 / 38 | alchimie-001-060.png |
| Potion de vie — Cœur enchâssé | 80 | Rend 560 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Champignon corrompu, 4 × Lavande | 180 | 53 / 54 | alchimie-001-080.png |
| Potion d’intelligence — Vapeur arcanique | 80 | +21 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Champignon corrompu, 4 × Lavande | 180 | 47 / 48 | alchimie-001-074.png |
| Potion de force — Braise carrée | 100 | +25 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Sauge, 4 × Champignon corrompu | 220 | 32 / 33 | alchimie-001-054.png |
| Potion de force — Réserve de l’apothicaire | 100 | +25 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Sauge, 4 × Champignon corrompu | 220 | 33 / 34 | alchimie-001-055.png |
| Potion de mana — Pointe de givre | 100 | Rend 225 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Sauge, 4 × Champignon corrompu | 220 | 43 / 44 | alchimie-001-070.png |
| Potion de vie — Cœur solaire | 100 | Rend 680 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Sauge, 4 × Champignon corrompu | 220 | 54 / 55 | alchimie-001-081.png |
| Potion d’intelligence — Œil vigilant | 100 | +25 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Sauge, 4 × Champignon corrompu | 220 | 59 / 60 | alchimie-001-086.png |
| Potion de concentration — Mémoire du chêne | 120 | +29 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Fleur enchantée, 4 × Sauge | 260 | 45 / 46 | alchimie-001-072.png |
| Potion de dextérité — Agilité du têtard | 120 | +29 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Fleur enchantée, 4 × Sauge | 260 | 40 / 41 | alchimie-001-064.png |
| Potion de force — Feuille de chêne | 120 | +29 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Fleur enchantée, 4 × Sauge | 260 | 34 / 35 | alchimie-001-056.png |
| Potion de mana — Gel cristallin | 120 | Rend 265 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Fleur enchantée, 4 × Sauge | 260 | 49 / 50 | alchimie-001-076.png |
| Potion de vie — Larmes du phénix | 120 | Rend 800 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Fleur enchantée, 4 × Sauge | 260 | 58 / 59 | alchimie-001-085.png |
| Potion d’intelligence — Mémoire des anciens | 120 | +29 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Fleur enchantée, 4 × Sauge | 260 | 63 / 64 | alchimie-001-090.png |
| Potion de concentration — Essence élancée | 140 | +33 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Morille des songes, 4 × Fleur enchantée | 300 | 52 / 53 | alchimie-001-079.png |
| Potion de dextérité — Vivacité de l’orage | 140 | +33 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Morille des songes, 4 × Fleur enchantée | 300 | 51 / 52 | alchimie-001-078.png |
| Potion de force — Vigueur draconique | 140 | +33 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Morille des songes, 4 × Fleur enchantée | 300 | 36 / 37 | alchimie-001-058.png |
| Potion de mana — Givre éternel | 140 | Rend 305 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Morille des songes, 4 × Fleur enchantée | 300 | 50 / 51 | alchimie-001-077.png |
| Potion de vie — Chaleur fumante | 140 | Rend 920 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Morille des songes, 4 × Fleur enchantée | 300 | 65 / 66 | alchimie-001-092.png |
| Potion d’intelligence — Savoir des ombres | 140 | +33 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Morille des songes, 4 × Fleur enchantée | 300 | 64 / 65 | alchimie-001-091.png |
| Potion de concentration — Lueur argentée | 150 | +35 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Trèfle astral, 4 × Morille des songes | 320 | 56 / 57 | alchimie-001-083.png |
| Potion de dextérité — Émeraude ouverte | 150 | +35 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Trèfle astral, 4 × Morille des songes | 320 | 57 / 58 | alchimie-001-084.png |
| Potion de force — Souffle ardent | 150 | +35 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Trèfle astral, 4 × Morille des songes | 320 | 42 / 43 | alchimie-001-069.png |
| Potion de mana — Glacier miniature | 150 | Rend 325 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Trèfle astral, 4 × Morille des songes | 320 | 60 / 61 | alchimie-001-087.png |
| Potion de mana — Larmes des sirènes | 150 | Rend 325 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Trèfle astral, 4 × Morille des songes | 320 | 55 / 56 | alchimie-001-082.png |
| Potion de vie — Rosée du phénix | 150 | Rend 980 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Trèfle astral, 4 × Morille des songes | 320 | 66 / 67 | alchimie-001-093.png |
| Potion de concentration — Arc-en-ciel intérieur | 160 | +37 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Orchidée lunaire, 4 × Trèfle astral | 340 | 61 / 62 | alchimie-001-088.png |
| Potion de dextérité — Lueur de larve | 160 | +37 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Orchidée lunaire, 4 × Trèfle astral | 340 | 74 / 75 | alchimie-001-102.png |
| Potion de force — Cristal d’ambre | 160 | +37 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Orchidée lunaire, 4 × Trèfle astral | 340 | 48 / 49 | alchimie-001-075.png |
| Potion de force — Poigne spectrale | 160 | +37 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Orchidée lunaire, 4 × Trèfle astral | 340 | 46 / 47 | alchimie-001-073.png |
| Potion de mana — Vague des marées | 160 | Rend 345 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Orchidée lunaire, 4 × Trèfle astral | 340 | 68 / 69 | alchimie-001-095.png |
| Potion de vie — Essence de licorne | 160 | Rend 1040 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Orchidée lunaire, 4 × Trèfle astral | 340 | 69 / 70 | alchimie-001-096.png |
| Potion d’intelligence — Galaxie tourbillonnante | 160 | +37 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Orchidée lunaire, 4 × Trèfle astral | 340 | 67 / 68 | alchimie-001-094.png |
| Potion de concentration — Champignon infusé | 180 | +41 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Amanite spectrale, 4 × Orchidée lunaire | 380 | 72 / 73 | alchimie-001-099.png |
| Potion de dextérité — Éclair miniature | 180 | +41 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Amanite spectrale, 4 × Orchidée lunaire | 380 | 77 / 78 | alchimie-001-105.png |
| Potion de force — Écailles de braise | 180 | +41 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Amanite spectrale, 4 × Orchidée lunaire | 380 | 62 / 63 | alchimie-001-089.png |
| Potion de mana — Cœur de glace | 180 | Rend 385 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Amanite spectrale, 4 × Orchidée lunaire | 380 | 71 / 72 | alchimie-001-098.png |
| Potion de vie — Grâce de licorne | 180 | Rend 1160 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Amanite spectrale, 4 × Orchidée lunaire | 380 | 70 / 71 | alchimie-001-097.png |
| Potion d’intelligence — Souffle des âmes | 180 | +41 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Amanite spectrale, 4 × Orchidée lunaire | 380 | 75 / 76 | alchimie-001-103.png |
| Potion de concentration — Reflets scintillants | 200 | +45 concentration pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Fleur de l’arbre-monde, 4 × Amanite spectrale | 420 | 79 / 80 | alchimie-001-107.png |
| Potion de dextérité — Souplesse du ver | 200 | +45 dextérité pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Fleur de l’arbre-monde, 4 × Amanite spectrale | 420 | 81 / 82 | alchimie-001-109.png |
| Potion de force — Croc de dragon | 200 | +45 force pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Fleur de l’arbre-monde, 4 × Amanite spectrale | 420 | 78 / 79 | alchimie-001-106.png |
| Potion de mana — Flocons suspendus | 200 | Rend 425 points de mana, sans dépasser le maximum. | 4 × Ortie, 4 × Fleur de l’arbre-monde, 4 × Amanite spectrale | 420 | 73 / 74 | alchimie-001-101.png |
| Potion de vie — Germe de renouveau | 200 | Rend 1280 points de vie, sans dépasser le maximum. | 4 × Ortie, 4 × Fleur de l’arbre-monde, 4 × Amanite spectrale | 420 | 80 / 81 | alchimie-001-108.png |
| Potion d’intelligence — Feu follet captif | 200 | +45 intelligence pendant 10 minutes. Une seule potion de caractéristiques active à la fois. | 4 × Ortie, 4 × Fleur de l’arbre-monde, 4 × Amanite spectrale | 420 | 76 / 77 | alchimie-001-104.png |

## Notes techniques et limites

- [Manifeste complet](../../seeds/lots/alchimie-001.json) : sources, empreintes SHA-256, images, ingrédients, IDs, prix, XP et difficulté de chaque recette.
- Visuels : `alcazan-front-prod/public/img/consommables/`, icônes de bonus dans `public/img/spell/alchimie/`.
- Source : WenrexaPotionsPack_Vol2 ; 79 visuels retenus, 30 écartés (fioles vides, cassées, renversées et objets non utilisables). Les exclusions figurent dans le manifeste.
- Le délai de 3 secondes est celui du bouton de consommation existant ; il n’est pas un verrou de cooldown côté serveur.
- Les points de récolte restent à placer : la création des objets et recettes ne rend pas automatiquement tous les ingrédients récoltables sur les cartes.
- Aucun monstre ni drop ajouté pour ce lot.
- Les descriptions visuelles ne donnent aucun effet supplémentaire : seule la valeur de l’effet indiqué s’applique.

## Consignes pour une IA rédigeant le site

Reprendre les noms, niveaux, effets et ingrédients ci-dessus sans inventer d’effets
secondaires, de lieux ou de marchands. Ne pas exposer les IDs techniques aux joueurs.
Distinguer le catalogue créé de la disponibilité des ingrédients dans le monde.
