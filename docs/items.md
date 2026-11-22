# Items — catalogue cumulatif

Ce document recense les objets créés à partir des ZIP fournis pour Alcazan Forest.
Ajouter chaque nouveau lot à la suite, sans remplacer les précédents. Les identifiants
BDD correspondent au contenu exporté dans le seed ; les références lot + image source
permettent de retrouver les créations même si les identifiants changent ultérieurement.

## Règles pour les prochains lots

- Inspecter les images et nommer chaque objet d'après son visuel.
- Dédupliquer les variantes avec/sans fond d'une même icône ; conserver une image originale transparente.
- Contrôler le manifeste et les objets existants avant import pour éviter les doublons.
- Créer les monstres et leurs liens de butin ; compléter aussi [monstre.md](monstre.md).
- Sauvegarder avant modification de la base, importer en transaction, vérifier les liens et images,
  puis exécuter `./scripts/content-dump.sh`.
- Conserver la provenance, la référence de licence fournie et le manifeste de chaque lot.
- Pour une page du site : ne pas inventer de recette, quête, effet utilisable ou lieu de rencontre.

## Lot loot-001 — High Quality RPG Loot Icons

Import local : 18 novembre 2026. Archive : `high-quality-rpg-loot-icons (1).zip`.
50 icônes uniques, fournies en deux variantes ; 50 objets créés depuis
`PNG/without background/1.png` à `50.png`. Les PSD et versions avec fond ne créent pas
 d'objets supplémentaires.

[Manifeste complet](../seeds/lots/loot-001.json) : provenance SHA-256, images, descriptions,
prix, taux de drop et identifiants. [Référence de licence fournie](../alcazan-front-prod/public/img/objet/loot-001-license.txt).

**État :** objets et butins intégrés en base locale. Monstres créés dans le catalogue,
non placés sur les cartes. Ces objets ne sont donc pas encore obtenables par une
rencontre dans le monde. Recettes et quêtes utilisant ce lot : à concevoir.

**Nature :** tous sont des `objet` ordinaires, sans métier requis. Une illustration de
nourriture, fiole, clé, livre ou bijou ne confère aucun effet de consommation,
d'ouverture, de sort ou d'équipement. Les peaux et plantes de ce lot ne remplacent pas
les progressions de métiers déjà conçues. Les prix et taux sont un premier réglage,
à ajuster en jeu ; chaque butin est tiré indépendamment et donne une unité en cas de succès.

### Objets et attribution des butins

| Image source | Aperçu | ID objet | Nom | Monstre | Drop | Prix de vente (or) |
|---|---|---|---|---|---|---|
| 1.png | ![Griffe de loup cuivré](../alcazan-front-prod/public/img/objet/loot-001-01.png) | 14 | Griffe de loup cuivré | [Loup à crinière cuivrée](monstre.md#monstre-9) | 45 % | 8 |
| 2.png | ![Plumes rituelles écarlates](../alcazan-front-prod/public/img/objet/loot-001-02.png) | 15 | Plumes rituelles écarlates | [Chaman des plumes rouges](monstre.md#monstre-15) | 40 % | 12 |
| 3.png | ![Crâne serti de jade](../alcazan-front-prod/public/img/objet/loot-001-03.png) | 16 | Crâne serti de jade | [Revenant de la cour écarlate](monstre.md#monstre-16) | 10 % | 55 |
| 4.png | ![Os de braise](../alcazan-front-prod/public/img/objet/loot-001-04.png) | 17 | Os de braise | [Revenant de la cour écarlate](monstre.md#monstre-16) | 35 % | 18 |
| 5.png | ![Champignons de nacre](../alcazan-front-prod/public/img/objet/loot-001-05.png) | 18 | Champignons de nacre | [Mycéliandre des clairières](monstre.md#monstre-10) | 40 % | 8 |
| 6.png | ![Mèche de crinière cuivrée](../alcazan-front-prod/public/img/objet/loot-001-06.png) | 19 | Mèche de crinière cuivrée | [Loup à crinière cuivrée](monstre.md#monstre-9) | 40 % | 9 |
| 7.png | ![Fourrure fauve roulée](../alcazan-front-prod/public/img/objet/loot-001-07.png) | 20 | Fourrure fauve roulée | [Loup à crinière cuivrée](monstre.md#monstre-9) | 30 % | 12 |
| 8.png | ![Éclat d’émeraude brute](../alcazan-front-prod/public/img/objet/loot-001-08.png) | 21 | Éclat d’émeraude brute | [Gardien d’émeraude](monstre.md#monstre-13) | 35 % | 24 |
| 9.png | ![Trèfle scintillant](../alcazan-front-prod/public/img/objet/loot-001-09.png) | 22 | Trèfle scintillant | [Mycéliandre des clairières](monstre.md#monstre-10) | 15 % | 12 |
| 10.png | ![Coquilles spiralées de jade](../alcazan-front-prod/public/img/objet/loot-001-10.png) | 23 | Coquilles spiralées de jade | [Dévoreur des profondeurs](monstre.md#monstre-12) | 40 % | 12 |
| 11.png | ![Fleur aux pétales d’aurore](../alcazan-front-prod/public/img/objet/loot-001-11.png) | 24 | Fleur aux pétales d’aurore | [Mycéliandre des clairières](monstre.md#monstre-10) | 25 % | 10 |
| 12.png | ![Œil de basilic](../alcazan-front-prod/public/img/objet/loot-001-12.png) | 25 | Œil de basilic | [Basilic des failles](monstre.md#monstre-11) | 15 % | 35 |
| 13.png | ![Croc lié de cuir](../alcazan-front-prod/public/img/objet/loot-001-13.png) | 26 | Croc lié de cuir | [Loup à crinière cuivrée](monstre.md#monstre-9) | 20 % | 10 |
| 14.png | ![Membrane de basilic](../alcazan-front-prod/public/img/objet/loot-001-14.png) | 27 | Membrane de basilic | [Basilic des failles](monstre.md#monstre-11) | 40 % | 22 |
| 15.png | ![Larve des profondeurs](../alcazan-front-prod/public/img/objet/loot-001-15.png) | 28 | Larve des profondeurs | [Dévoreur des profondeurs](monstre.md#monstre-12) | 45 % | 8 |
| 16.png | ![Œuf de basilic azuré](../alcazan-front-prod/public/img/objet/loot-001-16.png) | 29 | Œuf de basilic azuré | [Basilic des failles](monstre.md#monstre-11) | 10 % | 40 |
| 17.png | ![Tentacule violacé](../alcazan-front-prod/public/img/objet/loot-001-17.png) | 30 | Tentacule violacé | [Dévoreur des profondeurs](monstre.md#monstre-12) | 35 % | 16 |
| 18.png | ![Cuissot du pillard](../alcazan-front-prod/public/img/objet/loot-001-18.png) | 31 | Cuissot du pillard | [Pillard des caravanes](monstre.md#monstre-14) | 40 % | 5 |
| 19.png | ![Feuille de rosée](../alcazan-front-prod/public/img/objet/loot-001-19.png) | 32 | Feuille de rosée | [Mycéliandre des clairières](monstre.md#monstre-10) | 50 % | 4 |
| 20.png | ![Rouleau du convoyeur](../alcazan-front-prod/public/img/objet/loot-001-20.png) | 33 | Rouleau du convoyeur | [Pillard des caravanes](monstre.md#monstre-14) | 25 % | 6 |
| 21.png | ![Chapeau d’amanite carmin](../alcazan-front-prod/public/img/objet/loot-001-21.png) | 34 | Chapeau d’amanite carmin | [Mycéliandre des clairières](monstre.md#monstre-10) | 35 % | 7 |
| 22.png | ![Cœur spiralé de basilic](../alcazan-front-prod/public/img/objet/loot-001-22.png) | 35 | Cœur spiralé de basilic | [Basilic des failles](monstre.md#monstre-11) | 15 % | 30 |
| 23.png | ![Fragments de carapace minérale](../alcazan-front-prod/public/img/objet/loot-001-23.png) | 36 | Fragments de carapace minérale | [Gardien d’émeraude](monstre.md#monstre-13) | 45 % | 15 |
| 24.png | ![Branche de baies vermeilles](../alcazan-front-prod/public/img/objet/loot-001-24.png) | 37 | Branche de baies vermeilles | [Mycéliandre des clairières](monstre.md#monstre-10) | 45 % | 5 |
| 25.png | ![Fiole de macération reptilienne](../alcazan-front-prod/public/img/objet/loot-001-25.png) | 38 | Fiole de macération reptilienne | [Chaman des plumes rouges](monstre.md#monstre-15) | 25 % | 18 |
| 26.png | ![Masque du chaman cornu](../alcazan-front-prod/public/img/objet/loot-001-26.png) | 39 | Masque du chaman cornu | [Chaman des plumes rouges](monstre.md#monstre-15) | 15 % | 25 |
| 27.png | ![Coupe dorée dérobée](../alcazan-front-prod/public/img/objet/loot-001-27.png) | 40 | Coupe dorée dérobée | [Pillard des caravanes](monstre.md#monstre-14) | 10 % | 30 |
| 28.png | ![Mâchoire de la cour maudite](../alcazan-front-prod/public/img/objet/loot-001-28.png) | 41 | Mâchoire de la cour maudite | [Revenant de la cour écarlate](monstre.md#monstre-16) | 30 % | 20 |
| 29.png | ![Fromage de caravane](../alcazan-front-prod/public/img/objet/loot-001-29.png) | 42 | Fromage de caravane | [Pillard des caravanes](monstre.md#monstre-14) | 45 % | 4 |
| 30.png | ![Longue-vue du convoyeur](../alcazan-front-prod/public/img/objet/loot-001-30.png) | 43 | Longue-vue du convoyeur | [Pillard des caravanes](monstre.md#monstre-14) | 15 % | 16 |
| 31.png | ![Couronne écarlate](../alcazan-front-prod/public/img/objet/loot-001-31.png) | 44 | Couronne écarlate | [Revenant de la cour écarlate](monstre.md#monstre-16) | 5 % | 60 |
| 32.png | ![Fourrure tachetée rituelle](../alcazan-front-prod/public/img/objet/loot-001-32.png) | 45 | Fourrure tachetée rituelle | [Chaman des plumes rouges](monstre.md#monstre-15) | 30 % | 16 |
| 33.png | ![Bourse brodée du marchand](../alcazan-front-prod/public/img/objet/loot-001-33.png) | 46 | Bourse brodée du marchand | [Pillard des caravanes](monstre.md#monstre-14) | 20 % | 12 |
| 34.png | ![Poudre d’émeraude](../alcazan-front-prod/public/img/objet/loot-001-34.png) | 47 | Poudre d’émeraude | [Gardien d’émeraude](monstre.md#monstre-13) | 30 % | 20 |
| 35.png | ![Pain de route](../alcazan-front-prod/public/img/objet/loot-001-35.png) | 48 | Pain de route | [Pillard des caravanes](monstre.md#monstre-14) | 50 % | 3 |
| 36.png | ![Clé de la cour écarlate](../alcazan-front-prod/public/img/objet/loot-001-36.png) | 49 | Clé de la cour écarlate | [Revenant de la cour écarlate](monstre.md#monstre-16) | 15 % | 25 |
| 37.png | ![Médaillon du soleil rouge](../alcazan-front-prod/public/img/objet/loot-001-37.png) | 50 | Médaillon du soleil rouge | [Chaman des plumes rouges](monstre.md#monstre-15) | 10 % | 30 |
| 38.png | ![Planches de chariot](../alcazan-front-prod/public/img/objet/loot-001-38.png) | 51 | Planches de chariot | [Pillard des caravanes](monstre.md#monstre-14) | 55 % | 4 |
| 39.png | ![Roue de caravane](../alcazan-front-prod/public/img/objet/loot-001-39.png) | 52 | Roue de caravane | [Pillard des caravanes](monstre.md#monstre-14) | 25 % | 8 |
| 40.png | ![Caisse de marchandises scellée](../alcazan-front-prod/public/img/objet/loot-001-40.png) | 53 | Caisse de marchandises scellée | [Pillard des caravanes](monstre.md#monstre-14) | 15 % | 12 |
| 41.png | ![Gourde de fer cabossée](../alcazan-front-prod/public/img/objet/loot-001-41.png) | 54 | Gourde de fer cabossée | [Pillard des caravanes](monstre.md#monstre-14) | 30 % | 6 |
| 42.png | ![Talisman au crâne d’oiseau](../alcazan-front-prod/public/img/objet/loot-001-42.png) | 55 | Talisman au crâne d’oiseau | [Chaman des plumes rouges](monstre.md#monstre-15) | 15 % | 24 |
| 43.png | ![Écailles de basilic cuirassé](../alcazan-front-prod/public/img/objet/loot-001-43.png) | 56 | Écailles de basilic cuirassé | [Basilic des failles](monstre.md#monstre-11) | 45 % | 18 |
| 44.png | ![Parchemin au sceau ardent](../alcazan-front-prod/public/img/objet/loot-001-44.png) | 57 | Parchemin au sceau ardent | [Revenant de la cour écarlate](monstre.md#monstre-16) | 20 % | 28 |
| 45.png | ![Fétiche aux pompons de feu](../alcazan-front-prod/public/img/objet/loot-001-45.png) | 58 | Fétiche aux pompons de feu | [Chaman des plumes rouges](monstre.md#monstre-15) | 35 % | 14 |
| 46.png | ![Branche de fleurs astrales](../alcazan-front-prod/public/img/objet/loot-001-46.png) | 59 | Branche de fleurs astrales | [Chaman des plumes rouges](monstre.md#monstre-15) | 20 % | 20 |
| 47.png | ![Grimoire à l’œil écarlate](../alcazan-front-prod/public/img/objet/loot-001-47.png) | 60 | Grimoire à l’œil écarlate | [Revenant de la cour écarlate](monstre.md#monstre-16) | 8 % | 48 |
| 48.png | ![Écuelle du voyageur](../alcazan-front-prod/public/img/objet/loot-001-48.png) | 61 | Écuelle du voyageur | [Pillard des caravanes](monstre.md#monstre-14) | 35 % | 5 |
| 49.png | ![Grappe de cristaux d’émeraude](../alcazan-front-prod/public/img/objet/loot-001-49.png) | 62 | Grappe de cristaux d’émeraude | [Gardien d’émeraude](monstre.md#monstre-13) | 15 % | 35 |
| 50.png | ![Ventouse du dévoreur](../alcazan-front-prod/public/img/objet/loot-001-50.png) | 63 | Ventouse du dévoreur | [Dévoreur des profondeurs](monstre.md#monstre-12) | 20 % | 22 |

### Descriptions des objets

- **Griffe de loup cuivré** (objet 14) : Griffe recourbée à la base verdâtre, prélevée sur un loup à crinière cuivrée.
- **Plumes rituelles écarlates** (objet 15) : Faisceau de plumes rouges et violettes utilisé comme ornement rituel.
- **Crâne serti de jade** (objet 16) : Crâne ancien orné de pierres vertes et de dents dorées.
- **Os de braise** (objet 17) : Os pâle traversé par une fissure aux reflets de braise.
- **Champignons de nacre** (objet 18) : Petits champignons aux chapeaux nacrés et aux pieds mauves.
- **Mèche de crinière cuivrée** (objet 19) : Mèche de poils cuivrés rassemblée par un lien rouge.
- **Fourrure fauve roulée** (objet 20) : Bande de fourrure fauve aux longs poils clairs.
- **Éclat d’émeraude brute** (objet 21) : Éclat minéral vert translucide aux arêtes irrégulières.
- **Trèfle scintillant** (objet 22) : Trèfle vert entouré de minuscules lueurs dorées.
- **Coquilles spiralées de jade** (objet 23) : Deux coquilles vertes dont les spirales présentent un éclat vitreux.
- **Fleur aux pétales d’aurore** (objet 24) : Fleur aux pétales bleus, roses et blancs entourant un cœur doré.
- **Œil de basilic** (objet 25) : Œil doré à pupille fendue conservant un regard inquiétant.
- **Croc lié de cuir** (objet 26) : Large croc blanc entouré d’une fine lanière tressée.
- **Membrane de basilic** (objet 27) : Membrane orangée parcourue de nervures bleutées.
- **Larve des profondeurs** (objet 28) : Larve dorée au corps trapu, découverte auprès du dévoreur.
- **Œuf de basilic azuré** (objet 29) : Œuf bleu ponctué de taches sombres et de motifs clairs.
- **Tentacule violacé** (objet 30) : Appendice violet bordé de ventouses pâles.
- **Cuissot du pillard** (objet 31) : Pièce de viande rôtie dérobée dans les provisions d’une caravane.
- **Feuille de rosée** (objet 32) : Feuille verte enroulée autour de quelques gouttes limpides.
- **Rouleau du convoyeur** (objet 33) : Feuille roulée et maintenue par un lien vert.
- **Chapeau d’amanite carmin** (objet 34) : Champignon au chapeau rouge sombre piqueté de taches claires.
- **Cœur spiralé de basilic** (objet 35) : Cœur rouge surmonté d’un relief violet en spirale.
- **Fragments de carapace minérale** (objet 36) : Éclats de pierre gris argent arrachés à une enveloppe minérale.
- **Branche de baies vermeilles** (objet 37) : Petite branche portant des baies rouges et quelques feuilles vertes.
- **Fiole de macération reptilienne** (objet 38) : Fiole de liquide ambré contenant un fragment à l’œil reptilien.
- **Masque du chaman cornu** (objet 39) : Masque pâle à deux petites cornes et aux marques rouges.
- **Coupe dorée dérobée** (objet 40) : Coupe à deux anses retrouvée parmi les biens volés.
- **Mâchoire de la cour maudite** (objet 41) : Fragment de mâchoire garni de plusieurs rangées de dents pointues.
- **Fromage de caravane** (objet 42) : Morceau de fromage jaune conservé dans les provisions volées.
- **Longue-vue du convoyeur** (objet 43) : Petite longue-vue accompagnée d’un document de voyage.
- **Couronne écarlate** (objet 44) : Couronne dorée sertie de pierres rouges, vestige d’une cour disparue.
- **Fourrure tachetée rituelle** (objet 45) : Pièce de fourrure dorée à taches sombres, portée comme trophée.
- **Bourse brodée du marchand** (objet 46) : Bourse de tissu bleu vert ornée de motifs et de petites perles.
- **Poudre d’émeraude** (objet 47) : Poudre verte scintillante recueillie dans une petite coupe de bois.
- **Pain de route** (objet 48) : Pain doré entamé, issu des réserves d’un convoi.
- **Clé de la cour écarlate** (objet 49) : Clé dorée ouvragée, décorée de pierres rouges ; aucune serrure associée à ce stade.
- **Médaillon du soleil rouge** (objet 50) : Pendentif doré en forme de soleil entourant une pierre écarlate.
- **Planches de chariot** (objet 51) : Fragments de bois taillé récupérés sur un chariot démonté.
- **Roue de caravane** (objet 52) : Roue de bois à rayons, récupérée parmi les débris d’un convoi.
- **Caisse de marchandises scellée** (objet 53) : Petite caisse de bois fermée ; son ouverture n’est pas une mécanique définie.
- **Gourde de fer cabossée** (objet 54) : Gourde métallique sombre marquée par les voyages.
- **Talisman au crâne d’oiseau** (objet 55) : Crâne d’oiseau décoré de plumes et suspendu à un collier de perles.
- **Écailles de basilic cuirassé** (objet 56) : Plaques grises épaisses formant une protection hérissée de pointes.
- **Parchemin au sceau ardent** (objet 57) : Parchemin portant un sceau rouge et des reflets de braise.
- **Fétiche aux pompons de feu** (objet 58) : Petit fétiche bleu et doré terminé par deux pompons orangés.
- **Branche de fleurs astrales** (objet 59) : Deux rameaux bleutés liés ensemble et ornés de fleurs lumineuses.
- **Grimoire à l’œil écarlate** (objet 60) : Livre rouge au fermoir dentelé et à la couverture ornée d’un œil.
- **Écuelle du voyageur** (objet 61) : Vaisselle de bois accompagnée de couverts, récupérée dans un camp pillé.
- **Grappe de cristaux d’émeraude** (objet 62) : Groupe de cristaux verts dressés sur une matrice rocheuse.
- **Ventouse du dévoreur** (objet 63) : Ventouse circulaire rouge bordée d’excroissances violettes.

## Lot loot-002 — RPG Sea Loot Icons

Import local : 18 novembre 2026. Archive : `RPG-Sea-Loot-Icons (1).zip`.
50 objets issus des 50 icônes transparentes `PNG/without background/1.png` à `50.png`.
Les variantes avec fond et les PSD ne créent pas de doublons. Les octets des images
originales sont conservés ; aucun doublon exact détecté avec les autres lots.

[Manifeste](../seeds/lots/loot-002.json) — [Licence fournie](../alcazan-front-prod/public/img/objet/loot-002-license.txt).

**État :** objets, monstres et drops créés en base locale, portraits dédiés installés.
Monstres non placés sur les cartes : ces rencontres et leurs butins ne sont pas encore
accessibles dans le monde. Recettes et quêtes : à concevoir.

Tous les objets sont des butins ordinaires, sans métier requis. Les illustrations de
nourriture, bijoux, armes ou clés n'ajoutent aucun effet de consommation, équipement,
ouverture ou gain automatique d'or. Aucun compagnon ni nouvelle mécanique n'est créé.
Les prix et taux sont un premier réglage à éprouver en jeu. Chaque ligne est tirée
indépendamment et donne une unité en cas de succès. Les descriptions sont narratives,
pas des promesses de bonus ni de lieux déjà disponibles.

### Objets et attribution des butins

| Image source | Aperçu | ID objet | Nom | Monstre | Drop | Prix de vente (or) |
|---|---|---|---|---|---|---|
| 1.png | ![Conque rosée des marées](../alcazan-front-prod/public/img/objet/loot-002-01.png) | 64 | Conque rosée des marées | [Crabe des nacres](monstre.md#monstre-17) | 40 % | 8 |
| 2.png | ![Conque aux algues ondoyantes](../alcazan-front-prod/public/img/objet/loot-002-02.png) | 65 | Conque aux algues ondoyantes | [Crabe des nacres](monstre.md#monstre-17) | 45 % | 6 |
| 3.png | ![Crâne du marin englouti](../alcazan-front-prod/public/img/objet/loot-002-03.png) | 66 | Crâne du marin englouti | [Corsaire des épaves](monstre.md#monstre-18) | 30 % | 15 |
| 4.png | ![Doublons couverts de varech](../alcazan-front-prod/public/img/objet/loot-002-04.png) | 67 | Doublons couverts de varech | [Corsaire des épaves](monstre.md#monstre-18) | 25 % | 18 |
| 5.png | ![Clés rouillées des cales](../alcazan-front-prod/public/img/objet/loot-002-05.png) | 68 | Clés rouillées des cales | [Corsaire des épaves](monstre.md#monstre-18) | 30 % | 10 |
| 6.png | ![Journal du capitaine noyé](../alcazan-front-prod/public/img/objet/loot-002-06.png) | 69 | Journal du capitaine noyé | [Corsaire des épaves](monstre.md#monstre-18) | 15 % | 22 |
| 7.png | ![Corail ramifié des lagons](../alcazan-front-prod/public/img/objet/loot-002-07.png) | 70 | Corail ramifié des lagons | [Gardien des récifs](monstre.md#monstre-19) | 45 % | 12 |
| 8.png | ![Tête de poisson argenté](../alcazan-front-prod/public/img/objet/loot-002-08.png) | 71 | Tête de poisson argenté | [Requin aux écailles de jade](monstre.md#monstre-21) | 45 % | 5 |
| 9.png | ![Peigne de nacre rose](../alcazan-front-prod/public/img/objet/loot-002-09.png) | 72 | Peigne de nacre rose | [Crabe des nacres](monstre.md#monstre-17) | 15 % | 20 |
| 10.png | ![Perle des aurores marines](../alcazan-front-prod/public/img/objet/loot-002-10.png) | 73 | Perle des aurores marines | [Crabe des nacres](monstre.md#monstre-17) | 8 % | 40 |
| 11.png | ![Spirale d’azur](../alcazan-front-prod/public/img/objet/loot-002-11.png) | 74 | Spirale d’azur | [Crabe des nacres](monstre.md#monstre-17) | 25 % | 14 |
| 12.png | ![Galets polis des marées](../alcazan-front-prod/public/img/objet/loot-002-12.png) | 75 | Galets polis des marées | [Crabe des nacres](monstre.md#monstre-17) | 50 % | 4 |
| 13.png | ![Conque à lèvre nacrée](../alcazan-front-prod/public/img/objet/loot-002-13.png) | 76 | Conque à lèvre nacrée | [Crabe des nacres](monstre.md#monstre-17) | 35 % | 10 |
| 14.png | ![Valve de nacre rayée](../alcazan-front-prod/public/img/objet/loot-002-14.png) | 77 | Valve de nacre rayée | [Crabe des nacres](monstre.md#monstre-17) | 50 % | 5 |
| 15.png | ![Conque au cœur carmin](../alcazan-front-prod/public/img/objet/loot-002-15.png) | 78 | Conque au cœur carmin | [Crabe des nacres](monstre.md#monstre-17) | 20 % | 16 |
| 16.png | ![Arêtes du poisson des récifs](../alcazan-front-prod/public/img/objet/loot-002-16.png) | 79 | Arêtes du poisson des récifs | [Requin aux écailles de jade](monstre.md#monstre-21) | 50 % | 4 |
| 17.png | ![Crâne du poisson des failles](../alcazan-front-prod/public/img/objet/loot-002-17.png) | 80 | Crâne du poisson des failles | [Requin aux écailles de jade](monstre.md#monstre-21) | 35 % | 8 |
| 18.png | ![Astérie des profondeurs](../alcazan-front-prod/public/img/objet/loot-002-18.png) | 81 | Astérie des profondeurs | [Méduse des astéries](monstre.md#monstre-20) | 30 % | 14 |
| 19.png | ![Astérie rosée](../alcazan-front-prod/public/img/objet/loot-002-19.png) | 82 | Astérie rosée | [Méduse des astéries](monstre.md#monstre-20) | 45 % | 8 |
| 20.png | ![Astérie de braise marine](../alcazan-front-prod/public/img/objet/loot-002-20.png) | 83 | Astérie de braise marine | [Méduse des astéries](monstre.md#monstre-20) | 20 % | 18 |
| 21.png | ![Bras spiralés de méduse](../alcazan-front-prod/public/img/objet/loot-002-21.png) | 84 | Bras spiralés de méduse | [Méduse des astéries](monstre.md#monstre-20) | 40 % | 12 |
| 22.png | ![Darne du poisson azuré](../alcazan-front-prod/public/img/objet/loot-002-22.png) | 85 | Darne du poisson azuré | [Requin aux écailles de jade](monstre.md#monstre-21) | 45 % | 7 |
| 23.png | ![Éponge tubulaire dorée](../alcazan-front-prod/public/img/objet/loot-002-23.png) | 86 | Éponge tubulaire dorée | [Gardien des récifs](monstre.md#monstre-19) | 45 % | 9 |
| 24.png | ![Queue du poisson des récifs](../alcazan-front-prod/public/img/objet/loot-002-24.png) | 87 | Queue du poisson des récifs | [Requin aux écailles de jade](monstre.md#monstre-21) | 45 % | 5 |
| 25.png | ![Corail écarlate des courants](../alcazan-front-prod/public/img/objet/loot-002-25.png) | 88 | Corail écarlate des courants | [Gardien des récifs](monstre.md#monstre-19) | 35 % | 14 |
| 26.png | ![Corail de jade marin](../alcazan-front-prod/public/img/objet/loot-002-26.png) | 89 | Corail de jade marin | [Gardien des récifs](monstre.md#monstre-19) | 25 % | 18 |
| 27.png | ![Ombrelle de méduse rose](../alcazan-front-prod/public/img/objet/loot-002-27.png) | 90 | Ombrelle de méduse rose | [Méduse des astéries](monstre.md#monstre-20) | 15 % | 25 |
| 28.png | ![Collier de perles englouti](../alcazan-front-prod/public/img/objet/loot-002-28.png) | 91 | Collier de perles englouti | [Corsaire des épaves](monstre.md#monstre-18) | 10 % | 35 |
| 29.png | ![Chevalière d’ambre du corsaire](../alcazan-front-prod/public/img/objet/loot-002-29.png) | 92 | Chevalière d’ambre du corsaire | [Corsaire des épaves](monstre.md#monstre-18) | 8 % | 45 |
| 30.png | ![Aileron du requin de jade](../alcazan-front-prod/public/img/objet/loot-002-30.png) | 93 | Aileron du requin de jade | [Requin aux écailles de jade](monstre.md#monstre-21) | 30 % | 18 |
| 31.png | ![Requin juvénile des récifs](../alcazan-front-prod/public/img/objet/loot-002-31.png) | 94 | Requin juvénile des récifs | [Requin aux écailles de jade](monstre.md#monstre-21) | 10 % | 24 |
| 32.png | ![Escargot de nacre dorée](../alcazan-front-prod/public/img/objet/loot-002-32.png) | 95 | Escargot de nacre dorée | [Crabe des nacres](monstre.md#monstre-17) | 25 % | 12 |
| 33.png | ![Poisson-clown des lagons](../alcazan-front-prod/public/img/objet/loot-002-33.png) | 96 | Poisson-clown des lagons | [Requin aux écailles de jade](monstre.md#monstre-21) | 30 % | 8 |
| 34.png | ![Poisson aux écailles d’émeraude](../alcazan-front-prod/public/img/objet/loot-002-34.png) | 97 | Poisson aux écailles d’émeraude | [Requin aux écailles de jade](monstre.md#monstre-21) | 20 % | 14 |
| 35.png | ![Poisson aux voiles écarlates](../alcazan-front-prod/public/img/objet/loot-002-35.png) | 98 | Poisson aux voiles écarlates | [Requin aux écailles de jade](monstre.md#monstre-21) | 25 % | 12 |
| 36.png | ![Coquille en trompe marine](../alcazan-front-prod/public/img/objet/loot-002-36.png) | 99 | Coquille en trompe marine | [Crabe des nacres](monstre.md#monstre-17) | 40 % | 7 |
| 37.png | ![Plaque d’écailles cuivrées](../alcazan-front-prod/public/img/objet/loot-002-37.png) | 100 | Plaque d’écailles cuivrées | [Requin aux écailles de jade](monstre.md#monstre-21) | 40 % | 10 |
| 38.png | ![Tentacule tacheté des abysses](../alcazan-front-prod/public/img/objet/loot-002-38.png) | 101 | Tentacule tacheté des abysses | [Méduse des astéries](monstre.md#monstre-20) | 35 % | 16 |
| 39.png | ![Ancre envahie de corail](../alcazan-front-prod/public/img/objet/loot-002-39.png) | 102 | Ancre envahie de corail | [Corsaire des épaves](monstre.md#monstre-18) | 20 % | 14 |
| 40.png | ![Pavillon du corsaire noyé](../alcazan-front-prod/public/img/objet/loot-002-40.png) | 103 | Pavillon du corsaire noyé | [Corsaire des épaves](monstre.md#monstre-18) | 15 % | 18 |
| 41.png | ![Sabre rongé par les marées](../alcazan-front-prod/public/img/objet/loot-002-41.png) | 104 | Sabre rongé par les marées | [Corsaire des épaves](monstre.md#monstre-18) | 20 % | 16 |
| 42.png | ![Bouteille aux souvenirs marins](../alcazan-front-prod/public/img/objet/loot-002-42.png) | 105 | Bouteille aux souvenirs marins | [Corsaire des épaves](monstre.md#monstre-18) | 25 % | 12 |
| 43.png | ![Lingot de verre des épaves](../alcazan-front-prod/public/img/objet/loot-002-43.png) | 106 | Lingot de verre des épaves | [Corsaire des épaves](monstre.md#monstre-18) | 15 % | 25 |
| 44.png | ![Cadenas des cales oubliées](../alcazan-front-prod/public/img/objet/loot-002-44.png) | 107 | Cadenas des cales oubliées | [Corsaire des épaves](monstre.md#monstre-18) | 30 % | 10 |
| 45.png | ![Carapace du crabe nacrier](../alcazan-front-prod/public/img/objet/loot-002-45.png) | 108 | Carapace du crabe nacrier | [Crabe des nacres](monstre.md#monstre-17) | 35 % | 10 |
| 46.png | ![Éponge tubulaire violette](../alcazan-front-prod/public/img/objet/loot-002-46.png) | 109 | Éponge tubulaire violette | [Gardien des récifs](monstre.md#monstre-19) | 35 % | 12 |
| 47.png | ![Algue aux éventails d’or](../alcazan-front-prod/public/img/objet/loot-002-47.png) | 110 | Algue aux éventails d’or | [Gardien des récifs](monstre.md#monstre-19) | 45 % | 7 |
| 48.png | ![Varech aux plumes vertes](../alcazan-front-prod/public/img/objet/loot-002-48.png) | 111 | Varech aux plumes vertes | [Gardien des récifs](monstre.md#monstre-19) | 50 % | 5 |
| 49.png | ![Goutte de gelée ambrée](../alcazan-front-prod/public/img/objet/loot-002-49.png) | 112 | Goutte de gelée ambrée | [Méduse des astéries](monstre.md#monstre-20) | 40 % | 10 |
| 50.png | ![Tête du poisson aux voiles rouges](../alcazan-front-prod/public/img/objet/loot-002-50.png) | 113 | Tête du poisson aux voiles rouges | [Requin aux écailles de jade](monstre.md#monstre-21) | 40 % | 6 |

### Descriptions des objets

- **Conque rosée des marées** (objet 64) : Coquillage spiralé rose aux reliefs nacrés.
- **Conque aux algues ondoyantes** (objet 65) : Coquille orangée où poussent de longues algues vertes.
- **Crâne du marin englouti** (objet 66) : Crâne ancien recouvert de mousse marine.
- **Doublons couverts de varech** (objet 67) : Pièces dorées rongées par les algues ; objet de butin, pas un crédit automatique d’or.
- **Clés rouillées des cales** (objet 68) : Paire de clés anciennes patinées par le sel ; aucune serrure associée.
- **Journal du capitaine noyé** (objet 69) : Carnet fermé par une boucle, maculé d’algues et de sel.
- **Corail ramifié des lagons** (objet 70) : Branches de corail jaune et rouge aux extrémités arrondies.
- **Tête de poisson argenté** (objet 71) : Tête de poisson aux écailles sombres et argentées.
- **Peigne de nacre rose** (objet 72) : Peigne en forme de coquillage rose orné de petites perles.
- **Perle des aurores marines** (objet 73) : Grosse perle rosée nichée dans une coquille ouverte.
- **Spirale d’azur** (objet 74) : Coquillage bleu à spirale blanche et aux bords irisés.
- **Galets polis des marées** (objet 75) : Petits galets rouges, bleus et verts aux veines claires.
- **Conque à lèvre nacrée** (objet 76) : Conque dorée dont l’ouverture dévoile une nacre rose.
- **Valve de nacre rayée** (objet 77) : Valve en éventail traversée de bandes brunes et roses.
- **Conque au cœur carmin** (objet 78) : Long coquillage rose à l’ouverture rouge vif.
- **Arêtes du poisson des récifs** (objet 79) : Squelette de poisson pâle aux longues arêtes effilées.
- **Crâne du poisson des failles** (objet 80) : Crâne creux de poisson aux larges cavités.
- **Astérie des profondeurs** (objet 81) : Étoile marine violette parsemée de points clairs, au centre bleuté.
- **Astérie rosée** (objet 82) : Étoile marine rose à cinq bras et aux petites marques sombres.
- **Astérie de braise marine** (objet 83) : Étoile marine rouge orangé aux pointes bleues.
- **Bras spiralés de méduse** (objet 84) : Deux appendices violets recourbés, bordés de ventouses roses.
- **Darne du poisson azuré** (objet 85) : Tranche de poisson à chair orange et à peau bleutée.
- **Éponge tubulaire dorée** (objet 86) : Bouquet de tubes d’éponge jaune et vert.
- **Queue du poisson des récifs** (objet 87) : Queue de poisson aux nageoires longues et aux écailles brunes.
- **Corail écarlate des courants** (objet 88) : Corail rouge ramifié dont les extrémités prennent des tons orangés.
- **Corail de jade marin** (objet 89) : Corail compact vert translucide aux branches arrondies.
- **Ombrelle de méduse rose** (objet 90) : Ombrelle translucide rose accompagnée de fins filaments ondulants.
- **Collier de perles englouti** (objet 91) : Collier de perles blanches et vertes marqué par un long séjour sous l’eau.
- **Chevalière d’ambre du corsaire** (objet 92) : Anneau doré serti d’une pierre ambrée, recouvert de mousse marine.
- **Aileron du requin de jade** (objet 93) : Aileron triangulaire gris bleu à la surface lisse.
- **Requin juvénile des récifs** (objet 94) : Petit requin bleu pâle à la longue queue arquée ; objet de butin, pas un compagnon.
- **Escargot de nacre dorée** (objet 95) : Petit gastéropode pâle à coquille orange spiralée.
- **Poisson-clown des lagons** (objet 96) : Petit poisson orange rayé de blanc et de noir.
- **Poisson aux écailles d’émeraude** (objet 97) : Poisson vert aux nageoires bleutées et aux écailles brillantes.
- **Poisson aux voiles écarlates** (objet 98) : Poisson rouge brun doté de nageoires fines comme des voiles.
- **Coquille en trompe marine** (objet 99) : Longue coquille brune courbée à l’ouverture évasée.
- **Plaque d’écailles cuivrées** (objet 100) : Ensemble d’écailles imbriquées aux reflets de cuivre et d’argent.
- **Tentacule tacheté des abysses** (objet 101) : Tentacule pâle moucheté de violet et bordé de ventouses.
- **Ancre envahie de corail** (objet 102) : Ancre ancienne recouverte d’algues et de petits coquillages.
- **Pavillon du corsaire noyé** (objet 103) : Pavillon noir déchiré portant un crâne blanc et des traces d’algues.
- **Sabre rongé par les marées** (objet 104) : Sabre courbe couvert de végétation marine ; objet ordinaire non équipable.
- **Bouteille aux souvenirs marins** (objet 105) : Bouteille bleue renfermant un rouleau et de petits vestiges du rivage.
- **Lingot de verre des épaves** (objet 106) : Bloc translucide turquoise emprisonnant une étoile marine et des algues.
- **Cadenas des cales oubliées** (objet 107) : Cadenas métallique arrondi recouvert d’algues ; aucun mécanisme d’ouverture associé.
- **Carapace du crabe nacrier** (objet 108) : Carapace orange accompagnée de pinces et de petites pattes.
- **Éponge tubulaire violette** (objet 109) : Groupe de tubes d’éponge pourpre aux ouvertures sombres.
- **Algue aux éventails d’or** (objet 110) : Algue verte et jaune aux frondes en forme d’éventails.
- **Varech aux plumes vertes** (objet 111) : Frondes marines vertes et bleutées aux bords finement découpés.
- **Goutte de gelée ambrée** (objet 112) : Goutte de matière dorée translucide aux prolongements souples.
- **Tête du poisson aux voiles rouges** (objet 113) : Tête brune de poisson aux nageoires rouges ébouriffées.

## Lot loot-003 — RPG Monster Loot Icons

Import local : 18 novembre 2026. Archive : `RPG-Monster-loot-Icons (1).zip`.
50 objets issus des 50 icônes transparentes `PNG/without background/1.png` à `50.png`.
Les variantes avec fond et les PSD ne créent pas de doublons. Les octets des images
originales sont conservés ; aucun doublon exact détecté avec les autres lots.

[Manifeste](../seeds/lots/loot-003.json) — [Licence fournie](../alcazan-front-prod/public/img/objet/loot-003-license.txt).

**État :** objets, monstres et drops créés en base locale, portraits dédiés installés.
Monstres non placés sur les cartes : ces rencontres et leurs butins ne sont pas encore
accessibles dans le monde. Recettes et quêtes : à concevoir.

Tous les objets sont des butins ordinaires, sans métier requis. Les illustrations de
nourriture, bijoux, armes ou clés n'ajoutent aucun effet de consommation, équipement,
ouverture ou gain automatique d'or. Aucun compagnon ni nouvelle mécanique n'est créé.
Les prix et taux sont un premier réglage à éprouver en jeu. Chaque ligne est tirée
indépendamment et donne une unité en cas de succès. Les descriptions sont narratives,
pas des promesses de bonus ni de lieux déjà disponibles.

### Objets et attribution des butins

| Image source | Aperçu | ID objet | Nom | Monstre | Drop | Prix de vente (or) |
|---|---|---|---|---|---|---|
| 1.png | ![Chapeau du mycotaure pourpre](../alcazan-front-prod/public/img/objet/loot-003-01.png) | 114 | Chapeau du mycotaure pourpre | [Mycotaure des sous-bois](monstre.md#monstre-22) | 45 % | 8 |
| 2.png | ![Champignon brun des souches](../alcazan-front-prod/public/img/objet/loot-003-02.png) | 115 | Champignon brun des souches | [Mycotaure des sous-bois](monstre.md#monstre-22) | 50 % | 5 |
| 3.png | ![Champignon torsadé carmin](../alcazan-front-prod/public/img/objet/loot-003-03.png) | 116 | Champignon torsadé carmin | [Mycotaure des sous-bois](monstre.md#monstre-22) | 35 % | 10 |
| 4.png | ![Pleurotes de brume verte](../alcazan-front-prod/public/img/objet/loot-003-04.png) | 117 | Pleurotes de brume verte | [Mycotaure des sous-bois](monstre.md#monstre-22) | 25 % | 14 |
| 5.png | ![Éclats de mandibule ivoire](../alcazan-front-prod/public/img/objet/loot-003-05.png) | 118 | Éclats de mandibule ivoire | [Rampant cuirassé](monstre.md#monstre-27) | 40 % | 10 |
| 6.png | ![Plaque de chitine violacée](../alcazan-front-prod/public/img/objet/loot-003-06.png) | 119 | Plaque de chitine violacée | [Rampant cuirassé](monstre.md#monstre-27) | 45 % | 12 |
| 7.png | ![Baies bleues du sylvain](../alcazan-front-prod/public/img/objet/loot-003-07.png) | 120 | Baies bleues du sylvain | [Sylvain des ruches](monstre.md#monstre-23) | 45 % | 6 |
| 8.png | ![Feuilles vernissées du sylvain](../alcazan-front-prod/public/img/objet/loot-003-08.png) | 121 | Feuilles vernissées du sylvain | [Sylvain des ruches](monstre.md#monstre-23) | 50 % | 5 |
| 9.png | ![Gerbe d’herbes nouées](../alcazan-front-prod/public/img/objet/loot-003-09.png) | 122 | Gerbe d’herbes nouées | [Sylvain des ruches](monstre.md#monstre-23) | 40 % | 7 |
| 10.png | ![Gelée d’émeraude vive](../alcazan-front-prod/public/img/objet/loot-003-10.png) | 123 | Gelée d’émeraude vive | [Gelée prismatique](monstre.md#monstre-24) | 45 % | 9 |
| 11.png | ![Gelée d’azur bouillonnante](../alcazan-front-prod/public/img/objet/loot-003-11.png) | 124 | Gelée d’azur bouillonnante | [Gelée prismatique](monstre.md#monstre-24) | 40 % | 11 |
| 12.png | ![Gelée ambrée au crâne captif](../alcazan-front-prod/public/img/objet/loot-003-12.png) | 125 | Gelée ambrée au crâne captif | [Gelée prismatique](monstre.md#monstre-24) | 15 % | 24 |
| 13.png | ![Noyau rubis prismatique](../alcazan-front-prod/public/img/objet/loot-003-13.png) | 126 | Noyau rubis prismatique | [Gelée prismatique](monstre.md#monstre-24) | 8 % | 40 |
| 14.png | ![Patte membraneuse du rampant](../alcazan-front-prod/public/img/objet/loot-003-14.png) | 127 | Patte membraneuse du rampant | [Rampant cuirassé](monstre.md#monstre-27) | 35 % | 8 |
| 15.png | ![Aile d’opale bleutée](../alcazan-front-prod/public/img/objet/loot-003-15.png) | 128 | Aile d’opale bleutée | [Harpie aux plumes d’opale](monstre.md#monstre-26) | 35 % | 18 |
| 16.png | ![Mèche de chimère cuivrée](../alcazan-front-prod/public/img/objet/loot-003-16.png) | 129 | Mèche de chimère cuivrée | [Chimère des brumes](monstre.md#monstre-25) | 40 % | 12 |
| 17.png | ![Appendice ocellé du rampant](../alcazan-front-prod/public/img/objet/loot-003-17.png) | 130 | Appendice ocellé du rampant | [Rampant cuirassé](monstre.md#monstre-27) | 20 % | 18 |
| 18.png | ![Fourrure des brumes argentées](../alcazan-front-prod/public/img/objet/loot-003-18.png) | 131 | Fourrure des brumes argentées | [Chimère des brumes](monstre.md#monstre-25) | 30 % | 22 |
| 19.png | ![Fragments d’os du terrier](../alcazan-front-prod/public/img/objet/loot-003-19.png) | 132 | Fragments d’os du terrier | [Rampant cuirassé](monstre.md#monstre-27) | 50 % | 4 |
| 20.png | ![Œuf de chimère moucheté](../alcazan-front-prod/public/img/objet/loot-003-20.png) | 133 | Œuf de chimère moucheté | [Chimère des brumes](monstre.md#monstre-25) | 10 % | 35 |
| 21.png | ![Œil de la chimère pâle](../alcazan-front-prod/public/img/objet/loot-003-21.png) | 134 | Œil de la chimère pâle | [Chimère des brumes](monstre.md#monstre-25) | 15 % | 30 |
| 22.png | ![Pointes de corne de chimère](../alcazan-front-prod/public/img/objet/loot-003-22.png) | 135 | Pointes de corne de chimère | [Chimère des brumes](monstre.md#monstre-25) | 35 % | 18 |
| 23.png | ![Courge dorée du sylvain](../alcazan-front-prod/public/img/objet/loot-003-23.png) | 136 | Courge dorée du sylvain | [Sylvain des ruches](monstre.md#monstre-23) | 30 % | 8 |
| 24.png | ![Ossements blanchis du terrier](../alcazan-front-prod/public/img/objet/loot-003-24.png) | 137 | Ossements blanchis du terrier | [Rampant cuirassé](monstre.md#monstre-27) | 45 % | 5 |
| 25.png | ![Fagot d’ossements liés](../alcazan-front-prod/public/img/objet/loot-003-25.png) | 138 | Fagot d’ossements liés | [Rampant cuirassé](monstre.md#monstre-27) | 25 % | 9 |
| 26.png | ![Œufs du nid d’opale](../alcazan-front-prod/public/img/objet/loot-003-26.png) | 139 | Œufs du nid d’opale | [Harpie aux plumes d’opale](monstre.md#monstre-26) | 10 % | 28 |
| 27.png | ![Poudres prismatiques](../alcazan-front-prod/public/img/objet/loot-003-27.png) | 140 | Poudres prismatiques | [Gelée prismatique](monstre.md#monstre-24) | 25 % | 18 |
| 28.png | ![Fiole de lucioles sylvestres](../alcazan-front-prod/public/img/objet/loot-003-28.png) | 141 | Fiole de lucioles sylvestres | [Sylvain des ruches](monstre.md#monstre-23) | 15 % | 18 |
| 29.png | ![Gland du sylvain des ruches](../alcazan-front-prod/public/img/objet/loot-003-29.png) | 142 | Gland du sylvain des ruches | [Sylvain des ruches](monstre.md#monstre-23) | 45 % | 6 |
| 30.png | ![Rayon de miel doré](../alcazan-front-prod/public/img/objet/loot-003-30.png) | 143 | Rayon de miel doré | [Sylvain des ruches](monstre.md#monstre-23) | 35 % | 10 |
| 31.png | ![Ruche suspendue du sylvain](../alcazan-front-prod/public/img/objet/loot-003-31.png) | 144 | Ruche suspendue du sylvain | [Sylvain des ruches](monstre.md#monstre-23) | 15 % | 20 |
| 32.png | ![Membrane pourpre de chimère](../alcazan-front-prod/public/img/objet/loot-003-32.png) | 145 | Membrane pourpre de chimère | [Chimère des brumes](monstre.md#monstre-25) | 35 % | 20 |
| 33.png | ![Plumes d’opale irisées](../alcazan-front-prod/public/img/objet/loot-003-33.png) | 146 | Plumes d’opale irisées | [Harpie aux plumes d’opale](monstre.md#monstre-26) | 40 % | 16 |
| 34.png | ![Ramure aux étincelles d’ambre](../alcazan-front-prod/public/img/objet/loot-003-34.png) | 147 | Ramure aux étincelles d’ambre | [Sylvain des ruches](monstre.md#monstre-23) | 20 % | 18 |
| 35.png | ![Bûche aux feuilles d’automne](../alcazan-front-prod/public/img/objet/loot-003-35.png) | 148 | Bûche aux feuilles d’automne | [Sylvain des ruches](monstre.md#monstre-23) | 40 % | 8 |
| 36.png | ![Quartier de viande du terrier](../alcazan-front-prod/public/img/objet/loot-003-36.png) | 149 | Quartier de viande du terrier | [Rampant cuirassé](monstre.md#monstre-27) | 35 % | 7 |
| 37.png | ![Cristal azuré prismatique](../alcazan-front-prod/public/img/objet/loot-003-37.png) | 150 | Cristal azuré prismatique | [Gelée prismatique](monstre.md#monstre-24) | 15 % | 25 |
| 38.png | ![Branche aux baies d’ambre](../alcazan-front-prod/public/img/objet/loot-003-38.png) | 151 | Branche aux baies d’ambre | [Sylvain des ruches](monstre.md#monstre-23) | 40 % | 7 |
| 39.png | ![Queue annelée du rampant](../alcazan-front-prod/public/img/objet/loot-003-39.png) | 152 | Queue annelée du rampant | [Rampant cuirassé](monstre.md#monstre-27) | 35 % | 10 |
| 40.png | ![Boule de duvet des brumes](../alcazan-front-prod/public/img/objet/loot-003-40.png) | 153 | Boule de duvet des brumes | [Chimère des brumes](monstre.md#monstre-25) | 45 % | 9 |
| 41.png | ![Crâne de la harpie d’opale](../alcazan-front-prod/public/img/objet/loot-003-41.png) | 154 | Crâne de la harpie d’opale | [Harpie aux plumes d’opale](monstre.md#monstre-26) | 10 % | 30 |
| 42.png | ![Segment épineux du rampant](../alcazan-front-prod/public/img/objet/loot-003-42.png) | 155 | Segment épineux du rampant | [Rampant cuirassé](monstre.md#monstre-27) | 30 % | 14 |
| 43.png | ![Coquille tachetée du terrier](../alcazan-front-prod/public/img/objet/loot-003-43.png) | 156 | Coquille tachetée du terrier | [Rampant cuirassé](monstre.md#monstre-27) | 25 % | 12 |
| 44.png | ![Fragment rouge du noyau prismatique](../alcazan-front-prod/public/img/objet/loot-003-44.png) | 157 | Fragment rouge du noyau prismatique | [Gelée prismatique](monstre.md#monstre-24) | 30 % | 16 |
| 45.png | ![Fleur d’or des ruches](../alcazan-front-prod/public/img/objet/loot-003-45.png) | 158 | Fleur d’or des ruches | [Sylvain des ruches](monstre.md#monstre-23) | 30 % | 10 |
| 46.png | ![Collier de trophées d’opale](../alcazan-front-prod/public/img/objet/loot-003-46.png) | 159 | Collier de trophées d’opale | [Harpie aux plumes d’opale](monstre.md#monstre-26) | 15 % | 24 |
| 47.png | ![Noisettes du sylvain](../alcazan-front-prod/public/img/objet/loot-003-47.png) | 160 | Noisettes du sylvain | [Sylvain des ruches](monstre.md#monstre-23) | 45 % | 5 |
| 48.png | ![Serres de la harpie d’opale](../alcazan-front-prod/public/img/objet/loot-003-48.png) | 161 | Serres de la harpie d’opale | [Harpie aux plumes d’opale](monstre.md#monstre-26) | 35 % | 18 |
| 49.png | ![Patte de chimère rousse](../alcazan-front-prod/public/img/objet/loot-003-49.png) | 162 | Patte de chimère rousse | [Chimère des brumes](monstre.md#monstre-25) | 30 % | 16 |
| 50.png | ![Plaque cloutée du rampant](../alcazan-front-prod/public/img/objet/loot-003-50.png) | 163 | Plaque cloutée du rampant | [Rampant cuirassé](monstre.md#monstre-27) | 35 % | 12 |

### Descriptions des objets

- **Chapeau du mycotaure pourpre** (objet 114) : Chapeau de champignon rouge sombre parsemé de petites verrues grises.
- **Champignon brun des souches** (objet 115) : Champignon brun à pied épais et aux lamelles grises.
- **Champignon torsadé carmin** (objet 116) : Champignon rouge au chapeau ondulé et au pied torsadé.
- **Pleurotes de brume verte** (objet 117) : Faisceau de champignons en étages aux teintes vertes et bleues.
- **Éclats de mandibule ivoire** (objet 118) : Fragments allongés de mandibule pâle aux pointes acérées.
- **Plaque de chitine violacée** (objet 119) : Plaque sombre segmentée aux reflets violets et bleus.
- **Baies bleues du sylvain** (objet 120) : Baies rondes bleu profond accompagnées de feuilles vertes.
- **Feuilles vernissées du sylvain** (objet 121) : Feuilles épaisses brillantes aux nuances vertes et jaunes.
- **Gerbe d’herbes nouées** (objet 122) : Herbes longues rassemblées en une petite gerbe torsadée.
- **Gelée d’émeraude vive** (objet 123) : Matière gélatineuse verte formant une bulle brillante.
- **Gelée d’azur bouillonnante** (objet 124) : Masse de gelée bleue couverte de bulles arrondies.
- **Gelée ambrée au crâne captif** (objet 125) : Gelée orange translucide emprisonnant un petit crâne ancien.
- **Noyau rubis prismatique** (objet 126) : Cristal rouge taillé naturellement en facettes lumineuses.
- **Patte membraneuse du rampant** (objet 127) : Appendice vert terminé par trois doigts souples.
- **Aile d’opale bleutée** (objet 128) : Aile couverte de plumes bleues bordées de duvet gris.
- **Mèche de chimère cuivrée** (objet 129) : Longue mèche de pelage roux aux reflets cuivrés.
- **Appendice ocellé du rampant** (objet 130) : Appendice violet tacheté portant une marque circulaire dorée à son extrémité.
- **Fourrure des brumes argentées** (objet 131) : Longue bande de fourrure blanche aux reflets argentés.
- **Fragments d’os du terrier** (objet 132) : Petits éclats d’os ocre récupérés dans le terrier du rampant.
- **Œuf de chimère moucheté** (objet 133) : Œuf vert moucheté traversé de fines fissures.
- **Œil de la chimère pâle** (objet 134) : Œil pâle irisé à pupille noire fendue.
- **Pointes de corne de chimère** (objet 135) : Deux pointes de corne ivoire parcourues de reflets bleus.
- **Courge dorée du sylvain** (objet 136) : Petite courge orange brillante à pédoncule vert.
- **Ossements blanchis du terrier** (objet 137) : Ensemble de longs os clairs retrouvés près du rampant.
- **Fagot d’ossements liés** (objet 138) : Os pâles rassemblés et maintenus par un lien sombre.
- **Œufs du nid d’opale** (objet 139) : Deux œufs crème et ocre nichés dans un duvet brun.
- **Poudres prismatiques** (objet 140) : Petits tas de poudre scintillante rose, jaune, verte et bleue.
- **Fiole de lucioles sylvestres** (objet 141) : Fiole verte bouchée contenant de petites lueurs dorées.
- **Gland du sylvain des ruches** (objet 142) : Gland ambré suspendu à une branche feuillue.
- **Rayon de miel doré** (objet 143) : Alvéoles de cire remplies de miel ambré.
- **Ruche suspendue du sylvain** (objet 144) : Petite ruche ocre accrochée à une branche.
- **Membrane pourpre de chimère** (objet 145) : Aile membraneuse rouge sombre aux nervures marquées.
- **Plumes d’opale irisées** (objet 146) : Deux plumes pâles traversées de reflets roses, bleus et dorés.
- **Ramure aux étincelles d’ambre** (objet 147) : Faisceau de brindilles fines entouré de petites lueurs ambrées.
- **Bûche aux feuilles d’automne** (objet 148) : Morceau de bois orangé portant quelques feuilles automnales.
- **Quartier de viande du terrier** (objet 149) : Pièce de viande sombre sur un os, trouvée dans les réserves du rampant.
- **Cristal azuré prismatique** (objet 150) : Éclat cristallin bleu turquoise serti dans une roche grise.
- **Branche aux baies d’ambre** (objet 151) : Tige arquée portant de petites baies orange.
- **Queue annelée du rampant** (objet 152) : Long appendice rose segmenté terminé par une touffe brune.
- **Boule de duvet des brumes** (objet 153) : Boule de duvet gris clair aux poils fins.
- **Crâne de la harpie d’opale** (objet 154) : Crâne d’oiseau pâle au long bec crochu.
- **Segment épineux du rampant** (objet 155) : Appendice brun orangé articulé et bordé de pointes ivoire.
- **Coquille tachetée du terrier** (objet 156) : Coquille spiralée crème et rose marquée de taches violettes.
- **Fragment rouge du noyau prismatique** (objet 157) : Morceau de minerai rouge parcouru de veines claires.
- **Fleur d’or des ruches** (objet 158) : Fleur jaune à nombreux pétales ronds portée par une tige verte.
- **Collier de trophées d’opale** (objet 159) : Collier de perles brunes portant trois pendentifs sculptés en forme de crocs.
- **Noisettes du sylvain** (objet 160) : Deux noisettes aux coques rousses et aux reflets dorés.
- **Serres de la harpie d’opale** (objet 161) : Patte d’oiseau rose terminée par trois longues griffes sombres.
- **Patte de chimère rousse** (objet 162) : Patte velue rousse aux doigts pâles et aux griffes ivoire.
- **Plaque cloutée du rampant** (objet 163) : Plaque de carapace gris bleu hérissée de petites protubérances.


## Lot alchimie-001 — ressources et potions (18 novembre 2026)

- 15 ressources de [mineur](metier/mineur.md), dont 9 avec image adaptée et 6 sans image.
- 13 ressources d’[herboriste](metier/herboriste.md), sans image.
- 79 [potions d’alchimiste et recettes](metier/alchimiste.md), toutes illustrées, avec effets de vie, mana ou caractéristiques.
- Les ressources sont des `objet` ; les potions des `consommable`. Aucun drop ni monstre créé dans ce lot.
- [Manifeste exploitable par une IA](../seeds/lots/alchimie-001.json) : correspondances exactes avec les IDs en base, recettes et images sources.
- Les ressources existantes fer (6), argent (7) et sauge (5) sont réutilisées. Les points de récolte restent à configurer.


## Lot metiers-002 — bois, peaux et compléments visuels

Intégré le 18 novembre 2026 : 13 ressources de [bûcheron](metier/bucheron.md)
(dont le chêne existant réutilisé) et 13 ressources de [dépeceur](metier/depeceur.md).
Soit 25 nouveaux objets. La peau historique reste distincte.
Sept icônes du pack background sont associées : frêne, bois enchanté, fourrure dense,
cristal pur, menthe sauvage, fleur enchantée et fleur de l’arbre-monde.
Les autres ressources sans correspondance convaincante restent sans image.
Aucun nouveau drop, recette ou point de récolte n’est ajouté.

Le [manifeste](../seeds/lots/metiers-002.json) contient les IDs, niveaux,
images, chemins sources et empreintes SHA-256. Il complète le lot alchimie-001,
qui conserve l’historique de son import initial.


## Lot herboriste-images-003 — illustrations d’herboriste

Douze associations d’images, sans nouvel objet : neuf images manquantes complétées,
trois anciennes remplacées. Seule la Mandragore reste sans image dans la progression.
Les niveaux, recettes et effets ne changent pas. Sources et anciennes valeurs :
[manifeste](../seeds/lots/herboriste-images-003.json).


### Trèfle astral — 18 novembre 2026

La Mandragore (objet 185) est remplacée par le Trèfle astral, niveau 150,
avec l’image `herboriste-trefle-astral.png` (pack de plantes, visuel 28).
Identifiant, prix et recettes inchangés. Les 13 ressources d’herboriste sont illustrées.
Historique : `seeds/lots/herboriste-trefle-004.json`.


### Images des 13 bois — 19 novembre 2026

Treize icônes générées via imagegen intégré, associées aux objets de bûcheron.
Seul le champ image est modifié ; niveaux, prix et références conservés.
Manifestes et prompts : `seeds/lots/bois-images-005.json`. Originaux conservés dans
`output/imagegen/bois-v1/`, fichiers servis dans `public/img/objet/bois-generes-v1-*.png`.


### Peaux et derniers minerais illustrés — 19 novembre 2026

18 icônes générées via imagegen intégré : les 13 ressources de la progression Dépeceur
et les 5 ressources minières sans image (étain, charbon, cobalt, serpentine, saphir).
Les autres minerais et la peau historique ne sont pas modifiés. Seul le champ image
est mis à jour : aucun changement de niveau, prix, recette ou drop.
Les quatre progressions de récolte sont désormais entièrement illustrées.
Prompts et associations : `seeds/lots/peaux-minerais-images-006.json`.
Originaux : `output/imagegen/peaux-minerais-v1/`.
