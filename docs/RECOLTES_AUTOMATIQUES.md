# Récoltes automatiques

## Dans l’interface

1. Ouvrir **Administration → Item Maker** (`/administration/items`).
2. Cliquer **Créer un item → Ressource de métier** (ou modifier un objet existant).
3. Saisir le nom, choisir un métier de famille **Récolte** et le palier requis.
4. Choisir séparément l’image d’inventaire et l’**Image affichée sur la carte** (PNG transparent).
5. Enregistrer. La récolte est créée automatiquement, même sans image (repère générique).
6. Ouvrir **MapMaker**, choisir la carte et **Poser une interaction**. Sélectionner la ressource,
   cliquer sur les cases voulues, puis **Sauvegarder les changements**.
   Recharger le MapMaker si sa liste était déjà ouverte pendant la création.

Pour ajuster PA, quantité, XP, recharge, conditions ou modes : **Administration → Interactions**,
choisir la ressource, régler puis enregistrer. Il n’y a plus à créer cette fiche manuellement.
Le même fonctionnement s’applique à l’éditeur de ressources de l’ArtisanatMaker.

## Valeurs initiales

Nouvelle interaction : type `recolter`, active, répétable, 3 PA, quantité 1,
12 XP métier, recharge personnelle de 300 secondes, choix mesuré/intensif activé.
Ces valeurs correspondent au mode de base ; les modificateurs des modes restent ceux du jeu.
Nom, métier et niveau suivent l’objet à chaque enregistrement. L’image de carte est déjà
résolue directement depuis l’objet, avec fallback sur le sprite historique de l’interaction.
Les réglages des interactions existantes sont conservés.

La règle s’applique à TOUS les métiers de famille `recolte`, dépeceur compris. Elle ne pose
rien sur les cartes et ne modifie pas les drops de monstres. Les ressources sans sprite
peuvent être illustrées ultérieurement.

Retirer le métier ou choisir un métier de fabrication désactive les récoltes liées,
sans supprimer les cases. Leur réactivation reste manuelle dans Interactions si nécessaire.
Les coffres donnant le même objet restent intacts.

## Technique et reprise

`RecolteRessourceService` synchronise les interactions `RECOLTER` dont la récompense donne
l’objet. Ce lien existant fait foi : aucune table ni migration supplémentaire.
Appel dans `ArtisanatEditorService::enregistrerObjet`, commun aux deux éditeurs,
dans la même transaction avec verrou pessimiste sur l’objet existant. Pas de flush interne.
Si plusieurs points configurés différemment existent déjà, ils sont conservés et synchronisés.
Ne pas éditer le nom/métier/palier dans Interactions pour remplacer ceux de la ressource :
le prochain enregistrement de l’objet les resynchronisera.

Commande de rattrapage idempotente : `php bin/console app:recoltes:synchroniser`.
Exécutée le 19 novembre 2026 : 56 ressources, 52 nouvelles interactions, 4 réutilisées.
Aucun placement changé. Le fer passe au palier 0, le chêne au palier 40 et la sauge au
palier 100/herboriste, conformément aux objets (anciens points incohérents corrigés).

Validation : 42 tests fonctionnels, 279 assertions ; syntaxe JSX contrôlée.
Deux passages de synchronisation : 56 récoltes, zéro ressource manquante, zéro doublon.
