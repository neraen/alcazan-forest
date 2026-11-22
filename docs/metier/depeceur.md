# Dépeceur

Date : 18 novembre 2026.
Statut : progression créée et intégrée en base et au seed, avec autorisation de
concevoir la liste sur les mêmes 13 paliers que les autres métiers de récolte.
Cette liste est nouvelle : elle ne prétend pas restituer une ancienne liste introuvable.

## Présentation pour le site

Le dépeceur récupère des peaux, fourrures et enveloppes brutes destinées au travail
du tanneur. La progression va des peaux souples aux matières primordiales, en passant
par des ressources corrompues, enchantées et ancestrales.

Les niveaux sont ceux du métier, pas du personnage. Le niveau 0 ne dispense pas
d’apprendre le métier. Les paliers 50 et 150 complètent les paliers espacés de 20 niveaux.

## Ressources intégrées

| Niveau métier | Ressource | ID objet | Image |
|---|---|---|---|
| 0 | Peau souple | 201 | materiaux-generes-v1-peau-souple.png |
| 20 | Peau épaisse | 202 | materiaux-generes-v1-peau-epaisse.png |
| 40 | Fourrure dense | 203 | materiaux-generes-v1-fourrure-dense.png |
| 50 | Peau écailleuse | 204 | materiaux-generes-v1-peau-ecailleuse.png |
| 60 | Peau rugueuse | 205 | materiaux-generes-v1-peau-rugueuse.png |
| 80 | Peau corrompue | 206 | materiaux-generes-v1-peau-corrompue.png |
| 100 | Fourrure soyeuse | 207 | materiaux-generes-v1-fourrure-soyeuse.png |
| 120 | Peau enchantée | 208 | materiaux-generes-v1-peau-enchantee.png |
| 140 | Peau chitineuse | 209 | materiaux-generes-v1-peau-chitineuse.png |
| 150 | Fourrure de givre | 210 | materiaux-generes-v1-fourrure-givre.png |
| 160 | Peau de pierre | 211 | materiaux-generes-v1-peau-pierre.png |
| 180 | Peau ancestrale | 212 | materiaux-generes-v1-peau-ancestrale.png |
| 200 | Peau primordiale | 213 | materiaux-generes-v1-peau-primordiale.png |

Les treize ressources disposent depuis le 19 novembre 2026 d’icônes générées
dans une série homogène. L’ancienne image de Fourrure dense reste conservée en fichier. Ces objets sont des matières brutes, pas des cuirs déjà travaillés.
Les noms fantastiques ne confèrent aucun bonus automatique.

## Disponibilité et usages à concevoir

- Attribuer les ressources aux monstres avec les conditions de métier adaptées.
- Définir les taux et quantités des drops, puis les recettes de tannage et les quêtes.
- Aucun nouveau monstre, drop ou recette n’est ajouté dans ce lot.
- La Peau de bête coriace historique (objet 9, niveau 1) est conservée séparément pour préserver les drops et recettes déjà en place.

## Consignes pour une IA rédigeant le site

Reprendre exactement les noms et niveaux. Distinguer le catalogue intégré de la
disponibilité effective : ne pas inventer de monstres sources, taux de drop, lieux
ou recettes. Omettre les IDs techniques dans la présentation destinée aux joueurs.

## Références

- [Manifeste structuré](../../seeds/lots/metiers-002.json).
- [Bûcheron](bucheron.md), [Mineur](mineur.md), [Herboriste](herboriste.md).

## Complément illustré — 19 novembre 2026

Les treize peaux et fourrures ont reçu une série homogène d’icônes peintes sur fond sombre.
La Peau de bête coriace historique (objet 9) garde son image.
Ces images sont générées avec imagegen intégré pour le projet ; elles ne sont pas
attribuées à l’artiste des références. Niveaux, prix et références de jeu conservés.
Originaux : `output/imagegen/peaux-minerais-v1/`.
[Prompts, références et associations](../../seeds/lots/peaux-minerais-images-006.json).
