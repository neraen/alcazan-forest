# Coffres — sprites de carte

Cinq coffres fermés générés avec imagegen intégré, en PNG transparent.
Même perspective et mêmes proportions ; rareté identifiée par couleur et ornements.
Ces fichiers sont prêts pour le décor ou une interaction, sans nouveau butin ou point placé en base.

| Rareté | Couleur | Skin sans extension |
|---|---|---|
| Classique | Bois et fer | `coffre-classique-carte-v1` |
| Non commun | Vert et bronze | `coffre-non-commun-carte-v1` |
| Rare | Bleu et argent | `coffre-rare-carte-v1` |
| Épique | Violet et or | `coffre-epique-carte-v1` |
| Légendaire | Ambre et or | `coffre-legendaire-carte-v1` |

Fichiers servis : `alcazan-front-prod/public/img/interaction/coffre-*-carte-v1.png`.
Originaux et prompts : `output/imagegen/coffres-v1/manifest.json`.
La couleur est intégrée aux PNG, sans filtre CSS nécessaire. Rendu en jeu à valider.


## Coffres plaçables — 19 novembre 2026

Créés comme interactions `ouvrir`, selon le coffre du Bois de Hal (interaction 10, carte 1, case 203).
Disponibles dans **MapMaker → Poser une interaction**. Réglages dans **Administration → Interactions**.

Base initiale commune : 0 PA, recharge 7 200 secondes, portée monde (partagée entre joueurs pour chaque case),
usage répétable, sans métier ni condition. Butin initial repris du modèle : 500 or + 200 XP.
Chaque rareté possède sa propre récompense modifiable ; ces valeurs ne constituent pas un équilibrage par rareté.
Le coffre existant et les placements de carte sont conservés.

| Nom | Interaction ID | Récompense ID |
|---|---|---|
| Coffre classique | 13 | 104 |
| Coffre non commun | 14 | 105 |
| Coffre rare | 15 | 106 |
| Coffre épique | 16 | 107 |
| Coffre légendaire | 17 | 108 |
