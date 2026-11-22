# Monstres — catalogue cumulatif

Ce document recense les monstres créés pour attribuer les butins des ZIP d'images.
Ajouter les nouveaux lots à la suite et conserver les entrées précédentes. Le catalogue
associé est [items.md](items.md). Les statistiques sont des valeurs de jeu ; la puissance
n'est pas un niveau de personnage. Les points de vie et le délai de réapparition sont
renseignés car le modèle du jeu en a également besoin.

## Lot loot-001 — 18 novembre 2026

**État :** huit monstres créés en base locale avec 50 liens de butin, non placés sur
les cartes. Le placement et l'équilibrage en combat restent à réaliser. Aucun boss
ni nouvelle mécanique de combat n'est ajouté.

**Portraits dédiés :** huit illustrations générées avec l’outil intégré ImageGen,
installées le 18 novembre 2026. Les portraits provisoires ont été remplacés.
[Prompts et provenance](../seeds/lots/loot-001-portraits.json).

[Manifeste du lot](../seeds/lots/loot-001.json). Tous les butins sont des objets
ordinaires, sans métier requis, tirés indépendamment à une unité par succès.
Les taux et statistiques sont un premier réglage à ajuster en jeu. Pour une page
publique, ne pas inventer de localisation et ne pas annoncer ces rencontres comme
accessibles tant qu'elles ne sont pas placées.

| ID | Nom | Puissance | Armure | Vie maximale | Réapparition |
|---|---|---|---|---|---|
| 9 | Loup à crinière cuivrée | 55 | 20 | 800 | 60 s |
| 10 | Mycéliandre des clairières | 35 | 10 | 600 | 60 s |
| 11 | Basilic des failles | 320 | 180 | 2400 | 120 s |
| 12 | Dévoreur des profondeurs | 240 | 70 | 1800 | 90 s |
| 13 | Gardien d’émeraude | 380 | 300 | 2800 | 150 s |
| 14 | Pillard des caravanes | 85 | 35 | 1000 | 60 s |
| 15 | Chaman des plumes rouges | 190 | 55 | 1600 | 90 s |
| 16 | Revenant de la cour écarlate | 500 | 220 | 3200 | 180 s |

<a id="monstre-9"></a>

### Loup à crinière cuivrée

Prédateur des sous-bois dont la crinière cuivrée est prisée des artisans.

- ID : `9`.
- Puissance : **55** ; armure : **20**.
- Vie maximale : 800 ; réapparition : 60 secondes.
- Portrait dédié : `loot-001-loup-cuivre-v1.png`.

![Loup à crinière cuivrée](../alcazan-front-prod/public/img/monstre/loot-001-loup-cuivre-v1.png)
- Placement : à définir.

| Objet | ID objet | Drop |
|---|---|---|
| Griffe de loup cuivré | 14 | 45 % |
| Mèche de crinière cuivrée | 19 | 40 % |
| Fourrure fauve roulée | 20 | 30 % |
| Croc lié de cuir | 26 | 20 % |

<a id="monstre-10"></a>

### Mycéliandre des clairières

Créature fongique qui rassemble fleurs, feuilles et champignons dans les clairières.

- ID : `10`.
- Puissance : **35** ; armure : **10**.
- Vie maximale : 600 ; réapparition : 60 secondes.
- Portrait dédié : `loot-001-myceliandre-v1.png`.

![Mycéliandre des clairières](../alcazan-front-prod/public/img/monstre/loot-001-myceliandre-v1.png)
- Placement : à définir.

| Objet | ID objet | Drop |
|---|---|---|
| Champignons de nacre | 18 | 40 % |
| Trèfle scintillant | 22 | 15 % |
| Fleur aux pétales d’aurore | 24 | 25 % |
| Feuille de rosée | 32 | 50 % |
| Chapeau d’amanite carmin | 34 | 35 % |
| Branche de baies vermeilles | 37 | 45 % |

<a id="monstre-11"></a>

### Basilic des failles

Reptile ailé des failles, protégé par des écailles épaisses.

- ID : `11`.
- Puissance : **320** ; armure : **180**.
- Vie maximale : 2400 ; réapparition : 120 secondes.
- Portrait dédié : `loot-001-basilic-v1.png`.

![Basilic des failles](../alcazan-front-prod/public/img/monstre/loot-001-basilic-v1.png)
- Placement : à définir.

| Objet | ID objet | Drop |
|---|---|---|
| Œil de basilic | 25 | 15 % |
| Membrane de basilic | 27 | 40 % |
| Œuf de basilic azuré | 29 | 10 % |
| Cœur spiralé de basilic | 35 | 15 % |
| Écailles de basilic cuirassé | 56 | 45 % |

<a id="monstre-12"></a>

### Dévoreur des profondeurs

Créature souterraine aux appendices visqueux et à la gueule circulaire.

- ID : `12`.
- Puissance : **240** ; armure : **70**.
- Vie maximale : 1800 ; réapparition : 90 secondes.
- Portrait dédié : `loot-001-devoreur-v1.png`.

![Dévoreur des profondeurs](../alcazan-front-prod/public/img/monstre/loot-001-devoreur-v1.png)
- Placement : à définir.

| Objet | ID objet | Drop |
|---|---|---|
| Coquilles spiralées de jade | 23 | 40 % |
| Larve des profondeurs | 28 | 45 % |
| Tentacule violacé | 30 | 35 % |
| Ventouse du dévoreur | 63 | 20 % |

<a id="monstre-13"></a>

### Gardien d’émeraude

Gardien minéral animé par un noyau cristallin vert.

- ID : `13`.
- Puissance : **380** ; armure : **300**.
- Vie maximale : 2800 ; réapparition : 150 secondes.
- Portrait dédié : `loot-001-golem-v1.png`.

![Gardien d’émeraude](../alcazan-front-prod/public/img/monstre/loot-001-golem-v1.png)
- Placement : à définir.

| Objet | ID objet | Drop |
|---|---|---|
| Éclat d’émeraude brute | 21 | 35 % |
| Fragments de carapace minérale | 36 | 45 % |
| Poudre d’émeraude | 47 | 30 % |
| Grappe de cristaux d’émeraude | 62 | 15 % |

<a id="monstre-14"></a>

### Pillard des caravanes

Gobelin détrousseur qui conserve provisions, outils et fragments de chariots.

- ID : `14`.
- Puissance : **85** ; armure : **35**.
- Vie maximale : 1000 ; réapparition : 60 secondes.
- Portrait dédié : `loot-001-pillard-v1.png`.

![Pillard des caravanes](../alcazan-front-prod/public/img/monstre/loot-001-pillard-v1.png)
- Placement : à définir.

| Objet | ID objet | Drop |
|---|---|---|
| Cuissot du pillard | 31 | 40 % |
| Rouleau du convoyeur | 33 | 25 % |
| Coupe dorée dérobée | 40 | 10 % |
| Fromage de caravane | 42 | 45 % |
| Longue-vue du convoyeur | 43 | 15 % |
| Bourse brodée du marchand | 46 | 20 % |
| Pain de route | 48 | 50 % |
| Planches de chariot | 51 | 55 % |
| Roue de caravane | 52 | 25 % |
| Caisse de marchandises scellée | 53 | 15 % |
| Gourde de fer cabossée | 54 | 30 % |
| Écuelle du voyageur | 61 | 35 % |

<a id="monstre-15"></a>

### Chaman des plumes rouges

Chaman collectionnant talismans, pigments et trophées animaux.

- ID : `15`.
- Puissance : **190** ; armure : **55**.
- Vie maximale : 1600 ; réapparition : 90 secondes.
- Portrait dédié : `loot-001-chaman-v1.png`.

![Chaman des plumes rouges](../alcazan-front-prod/public/img/monstre/loot-001-chaman-v1.png)
- Placement : à définir.

| Objet | ID objet | Drop |
|---|---|---|
| Plumes rituelles écarlates | 15 | 40 % |
| Fiole de macération reptilienne | 38 | 25 % |
| Masque du chaman cornu | 39 | 15 % |
| Fourrure tachetée rituelle | 45 | 30 % |
| Médaillon du soleil rouge | 50 | 10 % |
| Talisman au crâne d’oiseau | 55 | 15 % |
| Fétiche aux pompons de feu | 58 | 35 % |
| Branche de fleurs astrales | 59 | 20 % |

<a id="monstre-16"></a>

### Revenant de la cour écarlate

Ancien dignitaire maudit, gardien des reliques de sa cour disparue.

- ID : `16`.
- Puissance : **500** ; armure : **220**.
- Vie maximale : 3200 ; réapparition : 180 secondes.
- Portrait dédié : `loot-001-revenant-v1.png`.

![Revenant de la cour écarlate](../alcazan-front-prod/public/img/monstre/loot-001-revenant-v1.png)
- Placement : à définir.

| Objet | ID objet | Drop |
|---|---|---|
| Crâne serti de jade | 16 | 10 % |
| Os de braise | 17 | 35 % |
| Mâchoire de la cour maudite | 41 | 30 % |
| Couronne écarlate | 44 | 5 % |
| Clé de la cour écarlate | 49 | 15 % |
| Parchemin au sceau ardent | 57 | 20 % |
| Grimoire à l’œil écarlate | 60 | 8 % |

## Lot loot-002 — RPG Sea Loot Icons — 18 novembre 2026

**État :** 5 monstres et 50 liens de butin créés en base locale.
Portraits dédiés générés avec l'outil intégré ImageGen. Les monstres ne sont pas encore
placés sur les cartes. Le placement et l'équilibrage en combat restent à réaliser.
Les décors des portraits indiquent une ambiance, pas un lieu déjà existant en jeu.

[Manifeste](../seeds/lots/loot-002.json) — [Prompts et provenance des portraits](../seeds/lots/loot-002-portraits.json).

Tous les drops sont des objets ordinaires sans métier requis, à une unité par succès,
avec un tirage indépendant pour chaque ligne. Aucun boss ni pouvoir de combat spécifique
n'est ajouté par le nom ou l'apparence d'une créature.

| ID | Nom | Puissance | Armure | Vie maximale | Réapparition |
|---|---|---|---|---|---|
| 17 | Crabe des nacres | 70 | 100 | 900 | 60 s |
| 18 | Corsaire des épaves | 280 | 120 | 2200 | 120 s |
| 19 | Gardien des récifs | 220 | 240 | 2500 | 120 s |
| 20 | Méduse des astéries | 160 | 15 | 1300 | 90 s |
| 21 | Requin aux écailles de jade | 350 | 150 | 2600 | 120 s |

<a id="monstre-17"></a>

### Crabe des nacres

Bernard-l’ermite géant portant une coquille nacrée couverte de trésors du rivage.

- ID : `17`.
- Puissance : **70** ; armure : **100**.
- Vie maximale : 900 ; réapparition : 60 secondes.
- Portrait dédié : `loot-002-crabe-v1.png`.
- Placement : à définir.

![Crabe des nacres](../alcazan-front-prod/public/img/monstre/loot-002-crabe-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Conque rosée des marées | 64 | 40 % |
| Conque aux algues ondoyantes | 65 | 45 % |
| Peigne de nacre rose | 72 | 15 % |
| Perle des aurores marines | 73 | 8 % |
| Spirale d’azur | 74 | 25 % |
| Galets polis des marées | 75 | 50 % |
| Conque à lèvre nacrée | 76 | 35 % |
| Valve de nacre rayée | 77 | 50 % |
| Conque au cœur carmin | 78 | 20 % |
| Escargot de nacre dorée | 95 | 25 % |
| Coquille en trompe marine | 99 | 40 % |
| Carapace du crabe nacrier | 108 | 35 % |

<a id="monstre-18"></a>

### Corsaire des épaves

Marin mort-vivant gardant les reliques et richesses des navires engloutis.

- ID : `18`.
- Puissance : **280** ; armure : **120**.
- Vie maximale : 2200 ; réapparition : 120 secondes.
- Portrait dédié : `loot-002-corsaire-v1.png`.
- Placement : à définir.

![Corsaire des épaves](../alcazan-front-prod/public/img/monstre/loot-002-corsaire-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Crâne du marin englouti | 66 | 30 % |
| Doublons couverts de varech | 67 | 25 % |
| Clés rouillées des cales | 68 | 30 % |
| Journal du capitaine noyé | 69 | 15 % |
| Collier de perles englouti | 91 | 10 % |
| Chevalière d’ambre du corsaire | 92 | 8 % |
| Ancre envahie de corail | 102 | 20 % |
| Pavillon du corsaire noyé | 103 | 15 % |
| Sabre rongé par les marées | 104 | 20 % |
| Bouteille aux souvenirs marins | 105 | 25 % |
| Lingot de verre des épaves | 106 | 15 % |
| Cadenas des cales oubliées | 107 | 30 % |

<a id="monstre-19"></a>

### Gardien des récifs

Sentinelle de pierre et de corail abritant algues et éponges marines.

- ID : `19`.
- Puissance : **220** ; armure : **240**.
- Vie maximale : 2500 ; réapparition : 120 secondes.
- Portrait dédié : `loot-002-corallien-v1.png`.
- Placement : à définir.

![Gardien des récifs](../alcazan-front-prod/public/img/monstre/loot-002-corallien-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Corail ramifié des lagons | 70 | 45 % |
| Éponge tubulaire dorée | 86 | 45 % |
| Corail écarlate des courants | 88 | 35 % |
| Corail de jade marin | 89 | 25 % |
| Éponge tubulaire violette | 109 | 35 % |
| Algue aux éventails d’or | 110 | 45 % |
| Varech aux plumes vertes | 111 | 50 % |

<a id="monstre-20"></a>

### Méduse des astéries

Méduse lumineuse dont les tentacules transportent des étoiles marines.

- ID : `20`.
- Puissance : **160** ; armure : **15**.
- Vie maximale : 1300 ; réapparition : 90 secondes.
- Portrait dédié : `loot-002-meduse-v1.png`.
- Placement : à définir.

![Méduse des astéries](../alcazan-front-prod/public/img/monstre/loot-002-meduse-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Astérie des profondeurs | 81 | 30 % |
| Astérie rosée | 82 | 45 % |
| Astérie de braise marine | 83 | 20 % |
| Bras spiralés de méduse | 84 | 40 % |
| Ombrelle de méduse rose | 90 | 15 % |
| Tentacule tacheté des abysses | 101 | 35 % |
| Goutte de gelée ambrée | 112 | 40 % |

<a id="monstre-21"></a>

### Requin aux écailles de jade

Prédateur des récifs aux écailles vertes, entouré des vestiges de ses proies.

- ID : `21`.
- Puissance : **350** ; armure : **150**.
- Vie maximale : 2600 ; réapparition : 120 secondes.
- Portrait dédié : `loot-002-requin-v1.png`.
- Placement : à définir.

![Requin aux écailles de jade](../alcazan-front-prod/public/img/monstre/loot-002-requin-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Tête de poisson argenté | 71 | 45 % |
| Arêtes du poisson des récifs | 79 | 50 % |
| Crâne du poisson des failles | 80 | 35 % |
| Darne du poisson azuré | 85 | 45 % |
| Queue du poisson des récifs | 87 | 45 % |
| Aileron du requin de jade | 93 | 30 % |
| Requin juvénile des récifs | 94 | 10 % |
| Poisson-clown des lagons | 96 | 30 % |
| Poisson aux écailles d’émeraude | 97 | 20 % |
| Poisson aux voiles écarlates | 98 | 25 % |
| Plaque d’écailles cuivrées | 100 | 40 % |
| Tête du poisson aux voiles rouges | 113 | 40 % |

## Lot loot-003 — RPG Monster Loot Icons — 18 novembre 2026

**État :** 6 monstres et 50 liens de butin créés en base locale.
Portraits dédiés générés avec l'outil intégré ImageGen. Les monstres ne sont pas encore
placés sur les cartes. Le placement et l'équilibrage en combat restent à réaliser.
Les décors des portraits indiquent une ambiance, pas un lieu déjà existant en jeu.

[Manifeste](../seeds/lots/loot-003.json) — [Prompts et provenance des portraits](../seeds/lots/loot-003-portraits.json).

Tous les drops sont des objets ordinaires sans métier requis, à une unité par succès,
avec un tirage indépendant pour chaque ligne. Aucun boss ni pouvoir de combat spécifique
n'est ajouté par le nom ou l'apparence d'une créature.

| ID | Nom | Puissance | Armure | Vie maximale | Réapparition |
|---|---|---|---|---|---|
| 22 | Mycotaure des sous-bois | 65 | 35 | 850 | 60 s |
| 23 | Sylvain des ruches | 180 | 140 | 2000 | 90 s |
| 24 | Gelée prismatique | 145 | 20 | 1200 | 75 s |
| 25 | Chimère des brumes | 420 | 180 | 2900 | 150 s |
| 26 | Harpie aux plumes d’opale | 230 | 65 | 1700 | 90 s |
| 27 | Rampant cuirassé | 200 | 200 | 2100 | 90 s |

<a id="monstre-22"></a>

### Mycotaure des sous-bois

Créature fongique robuste portant des champignons rouges, bruns et bleutés.

- ID : `22`.
- Puissance : **65** ; armure : **35**.
- Vie maximale : 850 ; réapparition : 60 secondes.
- Portrait dédié : `loot-003-mycotaure-v1.png`.
- Placement : à définir.

![Mycotaure des sous-bois](../alcazan-front-prod/public/img/monstre/loot-003-mycotaure-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Chapeau du mycotaure pourpre | 114 | 45 % |
| Champignon brun des souches | 115 | 50 % |
| Champignon torsadé carmin | 116 | 35 % |
| Pleurotes de brume verte | 117 | 25 % |

<a id="monstre-23"></a>

### Sylvain des ruches

Gardien végétal dont les branches abritent fruits, fleurs et ruches dorées.

- ID : `23`.
- Puissance : **180** ; armure : **140**.
- Vie maximale : 2000 ; réapparition : 90 secondes.
- Portrait dédié : `loot-003-sylve-v1.png`.
- Placement : à définir.

![Sylvain des ruches](../alcazan-front-prod/public/img/monstre/loot-003-sylve-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Baies bleues du sylvain | 120 | 45 % |
| Feuilles vernissées du sylvain | 121 | 50 % |
| Gerbe d’herbes nouées | 122 | 40 % |
| Courge dorée du sylvain | 136 | 30 % |
| Fiole de lucioles sylvestres | 141 | 15 % |
| Gland du sylvain des ruches | 142 | 45 % |
| Rayon de miel doré | 143 | 35 % |
| Ruche suspendue du sylvain | 144 | 15 % |
| Ramure aux étincelles d’ambre | 147 | 20 % |
| Bûche aux feuilles d’automne | 148 | 40 % |
| Branche aux baies d’ambre | 151 | 40 % |
| Fleur d’or des ruches | 158 | 30 % |
| Noisettes du sylvain | 160 | 45 % |

<a id="monstre-24"></a>

### Gelée prismatique

Masse gélatineuse multicolore animée par un noyau de cristaux rouges et bleus.

- ID : `24`.
- Puissance : **145** ; armure : **20**.
- Vie maximale : 1200 ; réapparition : 75 secondes.
- Portrait dédié : `loot-003-gelee-v1.png`.
- Placement : à définir.

![Gelée prismatique](../alcazan-front-prod/public/img/monstre/loot-003-gelee-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Gelée d’émeraude vive | 123 | 45 % |
| Gelée d’azur bouillonnante | 124 | 40 % |
| Gelée ambrée au crâne captif | 125 | 15 % |
| Noyau rubis prismatique | 126 | 8 % |
| Poudres prismatiques | 140 | 25 % |
| Cristal azuré prismatique | 150 | 15 % |
| Fragment rouge du noyau prismatique | 157 | 30 % |

<a id="monstre-25"></a>

### Chimère des brumes

Prédateur ailé à fourrure argentée, crinière cuivrée et cornes ivoire.

- ID : `25`.
- Puissance : **420** ; armure : **180**.
- Vie maximale : 2900 ; réapparition : 150 secondes.
- Portrait dédié : `loot-003-chimere-v1.png`.
- Placement : à définir.

![Chimère des brumes](../alcazan-front-prod/public/img/monstre/loot-003-chimere-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Mèche de chimère cuivrée | 129 | 40 % |
| Fourrure des brumes argentées | 131 | 30 % |
| Œuf de chimère moucheté | 133 | 10 % |
| Œil de la chimère pâle | 134 | 15 % |
| Pointes de corne de chimère | 135 | 35 % |
| Membrane pourpre de chimère | 145 | 35 % |
| Boule de duvet des brumes | 153 | 45 % |
| Patte de chimère rousse | 162 | 30 % |

<a id="monstre-26"></a>

### Harpie aux plumes d’opale

Créature aviaire au plumage irisé qui garde ses nids et ses trophées.

- ID : `26`.
- Puissance : **230** ; armure : **65**.
- Vie maximale : 1700 ; réapparition : 90 secondes.
- Portrait dédié : `loot-003-harpie-v1.png`.
- Placement : à définir.

![Harpie aux plumes d’opale](../alcazan-front-prod/public/img/monstre/loot-003-harpie-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Aile d’opale bleutée | 128 | 35 % |
| Œufs du nid d’opale | 139 | 10 % |
| Plumes d’opale irisées | 146 | 40 % |
| Crâne de la harpie d’opale | 154 | 10 % |
| Collier de trophées d’opale | 159 | 15 % |
| Serres de la harpie d’opale | 161 | 35 % |

<a id="monstre-27"></a>

### Rampant cuirassé

Créature fouisseuse segmentée dont la carapace protège un corps aux nombreux appendices.

- ID : `27`.
- Puissance : **200** ; armure : **200**.
- Vie maximale : 2100 ; réapparition : 90 secondes.
- Portrait dédié : `loot-003-rampant-v1.png`.
- Placement : à définir.

![Rampant cuirassé](../alcazan-front-prod/public/img/monstre/loot-003-rampant-v1.png)

| Objet | ID objet | Drop |
|---|---|---|
| Éclats de mandibule ivoire | 118 | 40 % |
| Plaque de chitine violacée | 119 | 45 % |
| Patte membraneuse du rampant | 127 | 35 % |
| Appendice ocellé du rampant | 130 | 20 % |
| Fragments d’os du terrier | 132 | 50 % |
| Ossements blanchis du terrier | 137 | 45 % |
| Fagot d’ossements liés | 138 | 25 % |
| Quartier de viande du terrier | 149 | 35 % |
| Queue annelée du rampant | 152 | 35 % |
| Segment épineux du rampant | 155 | 30 % |
| Coquille tachetée du terrier | 156 | 25 % |
| Plaque cloutée du rampant | 163 | 35 % |
