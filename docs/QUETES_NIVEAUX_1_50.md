# Alcazan Forest — proposition de quêtes, niveaux 1 à 50

Dossier de conception à relire — 14 novembre 2026. **Aucune quête de ce dossier n'est installée dans la base.** Les numéros Q01–Q40 sont des références éditoriales, pas des identifiants SQL. Q01 révisée le 16 novembre 2026 (combat sans classe, glandes de sève, raccord par Q05) : déroulé au §4.0.

## 1. Direction proposée : « La sève et les rouages »

À Limuren, Dezelle voit ses plantes mourir par les racines. Ce qui ressemble à une maladie locale conduit à des cargaisons falsifiées, puis à une machine sous le Manoir du rouage obscur. Quelqu'un détourne la vitalité de la forêt pour alimenter les villes. Les trois alignements veulent arrêter le désastre, mais aucun ne veut renoncer à ce que cette découverte pourrait lui apporter.

Le joueur commence par rendre de petits services. Il apprend ensuite à reconnaître les intérêts derrière les demandes, choisit éventuellement un camp, puis décide de ce qu'il faut sauver — et de ce qu'il accepte de sacrifier.

**Ton :** forêt merveilleuse mais abîmée, petites communautés, commerce douteux, humour dans les détails, décisions sérieuses lorsque les conséquences deviennent visibles. Personne n'est malveillant simplement parce que son blason est rouge ou vert. Les contrats de chasse restent lisibles ; les grandes enquêtes récompensent l'observation et la préparation.

### Ce qui vient réellement du jeu

- Lieux : bois de Hal, Limuren, étang de la Courmasse, Auberlême, cascade des pierres d'argent, Suncho, Dunhill, Manoir du rouage obscur, Freiwill, château d'Alastair, établissement de Mr. Petrus Cimber, Donjon Scintillant.
- Personnages : Leopold le grand Huvelle, Dezelle, Eolan, aubergiste, armurier, maître des guildes. Petrus Cimber apparaît dans un nom de carte ; son rôle de personnage ci-dessous est proposé.
- Amorce existante : **« Des racines et Dezelle »**, avec les racines noircies et une contamination transportée par la vermine.
- Camps : **Les Exilés** (bleu), **Le cartel de Brumebois** (vert), **Les royalistes** (rouge).
- Créatures : Psilofrost, libellule, loup d'Alcazan, élémental d'eau, araignée des terres désolées, gobelin guerrier ; boss Grimbald l'assoiffé.
- Métiers : quatre de récolte et sept de fabrication ; récolte mesurée/intensive, fabrication soignée/expéditive, karma, échanges et HDV existent.

### Ce que ce dossier invente

L'intrigue de la sève, l'histoire politique des camps, les nouveaux personnages, les nouveaux ennemis, les objets de quête et les récompenses nommées sont **des propositions**, pas du lore déjà établi. Le seed décrit très peu les alignements (« on verra. » pour deux d'entre eux). Leurs doctrines proposées :

| Camp | Conviction | Contradiction | Porte-parole proposé |
|---|---|---|---|
| Les Exilés | Personne ne devrait dépendre d'un trône ou d'une compagnie pour vivre. | Protéger les siens peut devenir abandonner les autres. | Maëline, intendante des déplacés |
| Cartel de Brumebois | Les routes et les échanges maintiennent les villes en vie. | Tout finit par avoir un prix, même ce qui appartient à tous. | Varo, négociateur de convois |
| Les royalistes | Une autorité responsable doit garantir la sécurité et les réserves. | L'ordre peut servir à couvrir les fautes de ceux qui gouvernent. | Capitaine Ysarde |

Les lieux de rencontre des émissaires ne redéfinissent pas les capitales des camps : les liens actuels `alignement.carte_id` ne suffisent pas à déduire leur géopolitique.

## 2. Rythme, récompenses et lecture des fiches

**40 quêtes**, avec des niveaux d'ouverture entre 1 et 50. Ce n'est pas une obligation de faire exactement une quête par niveau. Les niveaux indiqués sont des cibles de conception : le bestiaire existant ne porte pas de niveau, et ses statistiques ne permettent pas d'affirmer qu'un combat est adapté sans essai.

- **Courte :** une demande, une sortie, un retour ; 5–15 minutes actives visées.
- **Parcours :** 2–4 objectifs, avec déplacement ou apprentissage ; 15–35 minutes actives.
- **Longue :** enquête, branches, préparation ou donjon ; 45–90 minutes actives répartissables en plusieurs sessions.
- Les attentes de PA, les trajets réels et les disponibilités de groupe s'ajoutent. Ces durées ne sont pas des mesures de jeu.
- Toutes les quêtes sont **uniques par personnage**. Aucune récompense répétable ni boucle de dialogue rémunérée.
- Dans les fiches, « donner/livrer » consomme l'objet ; « montrer » le conserve. Les ressources d'une livraison peuvent être achetées. « Récolter/fabriquer soi-même » exige une pratique après acceptation de l'étape.
- Les étapes séparées par une flèche sont successives. Les objectifs multiples obligatoires sont des étapes successives, pas plusieurs boutons alternatifs dans une même séquence.
- Une quête commencée reste disponible au-delà de sa tranche de niveau. Aucun délai réel d'abandon et aucun PNJ disponible seulement à une heure donnée.

### Barème proposé

Les récompenses XP/or sont détaillées par fiche. Les objets nommés nouveaux figurent au §6. Les valeurs sont un premier budget à tester, **pas un équilibrage validé**. L'XP des combats s'ajoute à l'XP de quête.

| Catégorie | Récompense recherchée |
|---|---|
| Service court | XP modérée, frais et objets remis compensés, petit bénéfice |
| Initiation | XP, de quoi pratiquer, aucun avantage durable imposant le métier ou le camp |
| Enquête longue | Environ 2–3 récompenses courtes de la tranche + objet garanti |
| Fin d'arc | Objet distinctif au choix, sans tirage aléatoire et sans supériorité d'un camp |

La campagne accompagne la montée 1–50 ; elle ne promet pas de fournir à elle seule toute l'XP nécessaire. La table des niveaux demande environ 628 000 XP pour passer de 1 à 50. Ne pas reprendre les récompenses de démonstration existantes comme étalon économique.

## 3. Catalogue des 40 quêtes

### Niveaux 1–10 — prendre racine à Limuren

#### Q01 — La sève noire

**Niveau 1 · Tutoriel · Leopold · Tutoriel Boisé.** Première quête du jeu : elle **remplace** l'actuelle « Choix de la classe » (quête 1), dont le choix de classe devient l'étape 3. Révisée le 16/11/2026, déroulé complet au §4.0.

> « Tu dormais contre cet arbre comme s'il t'avait recraché. Regarde son écorce… ça suinte. »

Se réveiller au pied d'un arbre qui suinte une sève noire → se défendre **sans classe** contre 5 jeunes psilofrosts → retrouver sa classe comme un souvenir → s'équiper → prélever une fiole de sève → rapporter 3 glandes de sève lâchées par des libellules contaminées → atteindre le niveau 2 → partir vers Limuren avec la fiole pour Dezelle.

Le joueur combat d'abord en gueux, puis avec sa classe : la différence de puissance justifie le choix de classe sans qu'il faille l'expliquer. La sève noire, qui est le fil rouge de la campagne, apparaît dès la première minute.

**Récompense :** 10 000 XP (garantit le niveau 2 quelle que soit l'XP de combat), 30 or, 2 potions de vie mineures remises avant le second combat. **À créer :** jeune psilofrost, libellule contaminée, Fiole de sève noire, Glande de sève, interaction « arbre suintant » ; ne pas employer le rat existant, dont la vie maximale vaut 0 dans le seed.

#### Q02 — La soupe a des jambes

**Niveau 2 · Courte · Aubergiste · Limuren.** Indépendante.

> « Je veux bien que ma soupe soit fraîche. Pas qu'elle s'enfuie. »

Vaincre 4 jeunes psilofrosts près du bois de Hal → revenir annoncer que le chemin du fournisseur est dégagé. Objectif de morts, sans drop supplémentaire.

**Récompense :** 1 800 XP, 45 or. **À créer :** texte et quête ; réutilise la variante de Q01.

#### Q03 — Ce que la forêt veut bien donner

**Niveau 3 · Initiation récolte · Intendant des apprentis, nouveau PNJ près d'Eolan.** Indépendante. Déroulé complet au §4.1.

Rencontrer Eolan → choisir librement un métier de récolte → pratiquer une récolte de sa branche → revenir expliquer la différence entre rendement, recharge et épuisement.

**Récompense :** 2 500 XP, 60 or ; le joueur conserve les matières prélevées. **À prévoir :** une branche par métier, dont un contrôle spécifique pour le dépeçage.

#### Q04 — Des ailes pour l'Armoire

**Niveau 4 · Courte · Dezelle · Armoire d'Armoise.** Indépendante.

> « Une aile de libellule dans une décoction, c'est une mesure. Deux, c'est une mauvaise idée. »

Rapporter 4 ailes de libellule. Le joueur peut chasser ou acheter les ailes ; le texte le dit explicitement.

**Récompense :** 2 000 XP, 140 or. **À configurer :** butin d'ailes sur les libellules, absent du seed examiné ; cible initiale 60 % par victoire, à tester. La valeur de référence des quatre ailes est 96 or.

#### Q05 — Des racines et Dezelle

**Niveau 2 pour l'ouverture, 5 pour la suite · Parcours, début de campagne · Dezelle.** Adaptation de la quête existante, pas un doublon à importer. Elle prend le relais de Q01 : son niveau minimal passe de 4 à 2.

> « Hier, cette plante était saine. Aujourd'hui, ses racines sont noires. Demain, j'aimerais avoir autre chose à te montrer qu'un pot vide. »

**Ouverture (raccord avec Q01) :** remettre la Fiole de sève noire (`DONNER_OBJET`) → Dezelle reconnaît la pourriture de ses pots, mais renvoie le joueur s'aguerrir (`ATTEINDRE_LEVEL` 5, ce qui laisse la place à Q02–Q04). La remise se fait dans Q05 parce qu'un PNJ ne présente que sa propre quête (§7, point 1) : une étape de Q01 posée chez Dezelle serait invisible.

Vaincre 5 psilofrosts de lisière → apporter 3 chapeaux de champignon bleu → écouter le diagnostic : la contamination est transportée, elle n'est pas née dans les pots.

**Récompense :** 3 500 XP, 100 or, 2 potions mineures. **À vérifier :** difficulté de la variante, butin 60 % déjà présent sur le psilofrost d'origine, conservation des identifiants et des parties en cours lors d'une future adaptation.

#### Q06 — Rien ne se forge tout seul

**Niveau 6 · Initiation fabrication · Intendant des apprentis.** Q03 conseillée, non obligatoire. Déroulé complet au §4.2.

Choisir un métier de fabrication chez Eolan → obtenir ses premiers ingrédients → lancer une recette → attendre → **retirer** le résultat → revenir parler du travail soigné et du travail expéditif.

**Récompense :** 3 000 XP, 80 or, résultat conservé. **À créer :** recettes de niveau métier 1 pour les branches encore vides, financement d'amorçage commun.

#### Q07 — L'eau n'a pas cette couleur

**Niveau 8 · Parcours, campagne · Dezelle.** Après Q05.

> « Les racines ont bu quelque chose. Suis l'eau ; elle ment moins que les gens. »

Rejoindre l'étang de la Courmasse → parler au pêcheur Orrin, nouveau PNJ → rejoindre l'Auberlême → montrer à Orrin un échantillon prélevé sur une interaction de rive. Il reconnaît l'odeur d'un produit utilisé pour conserver les cargaisons.

**Récompense :** 4 000 XP, 120 or. **À créer :** Orrin, échantillon d'eau sombre et interaction. L'enquête récompense le déplacement et le constat, pas une compétence de récolte imposée.

#### Q08 — Trois voix sous le même arbre

**Niveau 10 · Initiation alignement · Nelle · Limuren centre.** Indépendante de la campagne. Déroulé au §4.3.

Rencontrer les trois émissaires → entendre leur lecture du même conflit de ravitaillement → choisir un camp, ou terminer la visite en restant indépendant.

**Récompense :** 4 000 XP, 100 or, identiques pour les quatre conclusions. **Effet :** appartenance au camp choisi ; **aucune couleur de personnage à cette étape**. Branche indépendante compatible avec la campagne entière.

### Niveaux 11–20 — les routes et les serments

#### Q09 — Les dents du passage

**Niveau 11 · Courte · Nelle · Passage de l'Auberlême.** Indépendante.

Vaincre 5 loups de lisière qui bloquent les porteurs. Aucun prélèvement de peau obligatoire : un personnage sans dépeçage peut terminer.

**Récompense :** 3 000 XP, 140 or. **À créer :** variante du loup adaptée à ce palier ; le loup existant a 1 500 PV et une puissance de 155, à ne pas attribuer automatiquement à un débutant.

#### Q10 — La facture qui boit l'encre

**Niveau 12 · Longue, enquête · Orrin.** Après Q07. Déroulé au §5.1.

Un manifeste de cargaison annonce du grain, mais les traces retrouvées sont minérales. Recouper le sceau, le poids et le témoignage du batelier ; identifier la fausse livraison avant de choisir à qui remettre le dossier.

**Récompense :** 7 000 XP, 250 or, Broche de la rive. **Choix :** publier les faits (+3 karma) ou protéger le témoin en transmettant une copie anonyme (+3 karma). Deux valeurs défendables, même puissance de récompense.

#### Q11 — Une lame n'est pas un argument

**Niveau 13 · Initiation PvP · Sergent Darel, nouveau PNJ · Limuren.** Indépendante. Déroulé au §4.4.

Formation dialoguée : portée et PA → différence honneur/karma/alignement → conséquences du feu ami → anti-farm et retour après la mort → trois mises en situation à résoudre.

**Récompense :** 3 500 XP, 100 or, 2 potions mineures. Pas d'honneur offert par un questionnaire. Pas de victoire contre un joueur obligatoire pour débloquer la suite.

#### Q12 — De quoi tenir la route

**Niveau 14 · Courte, livraison · Armurier de Limuren.** Indépendante.

Livrer 4 bûches de chêne → livrer 2 cuirs travaillés. Achat, échange ou fabrication autorisés. Le cuir sert à réparer les sangles du convoi ; le bois, les traverses.

**Récompense :** 3 000 XP, 180 or. Valeur de référence des matériaux : 80 or. Les frais du marché restent à la charge du joueur, annoncés comme tels.

#### Q13 — Les couleurs qu'on porte

**Niveau 15 · Initiation allégeance · Émissaire du camp choisi.** Après Q08, avec un alignement. Trois variantes d'une même quête ; §4.5.

Accomplir un service reflétant les valeurs du camp → rendre compte d'un dilemme → confirmer le serment. **Le personnage prend alors les couleurs de son alignement**, visibles par tous.

**Récompense :** 7 500 XP, 200 or, couleur et Insigne de serment. Même puissance pour les trois camps. **Développement requis :** état d'allégeance distinct, effet de serment, rendu du personnage.

#### Q14 — Un éclat dans la vase

**Niveau 16 · Parcours, campagne · Orrin.** Après Q10.

Examiner la cascade des pierres d'argent → vaincre 4 éclats d'eau troublée → prendre un fragment scintillant dans une interaction de berge → le montrer à Dezelle. Elle identifie un résidu provenant d'une galerie, pas d'une plante.

**Récompense :** 4 500 XP, 180 or. **À créer :** variante d'élémental faible, interaction et fragment. Celui-ci est une preuve garantie, pas un drop rare.

#### Q15 — La dette de Grimbald

**Niveau 18 · Longue, donjon · Dezelle.** Après Q14.

Préparer une expédition → parcourir le Donjon Scintillant → vaincre Grimbald → obtenir son registre dans une scène de quête après victoire → revenir à Dezelle. Le registre révèle qu'il stockait les cristaux contre paiement, sans savoir à quoi ils servaient.

**Récompense :** 9 000 XP, 350 or, un équipement Scintillant au choix parmi quatre profils. Le coffre ordinaire du boss reste un butin séparé.

**À vérifier :** donjon actuellement ouvert au niveau 15, difficulté réelle au niveau 18, accès au registre, règle de victoire personnelle. Une victoire passée peut satisfaire `BATTRE_BOSS` ; si une nouvelle expédition est exigée, il faut un contrôle supplémentaire.

#### Q16 — L'auberge ne fait pas crédit aux fantômes

**Niveau 20 · Courte, pause · Aubergiste.** Indépendante.

> « Trois clients me doivent un repas. Deux sont partis. Le troisième est encore là, c'est déjà un progrès. »

Aller retrouver un voyageur à Limuren centre → choisir de l'aider à porter un colis jusqu'à l'armurier ou de payer ses 25 or de dette → rapporter le reçu à l'aubergiste. Le portage est représenté par un objet remis, pas une escorte d'IA.

**Récompense :** 4 000 XP, 100 or. **À créer :** voyageur, colis et reçu. Le trajet économise la dette ; le paiement économise le trajet.

### Niveaux 21–30 — Suncho, les comptes et les visages

#### Q17 — Les canaux ont faim

**Niveau 21 · Courte · Éclusière Mira, nouveau PNJ · Suncho canaux.** Indépendante.

Vaincre 6 élémentals des canaux. Mira explique qu'ils se reforment autour des rejets des ateliers, sans attribuer le phénomène à tous les artisans.

**Récompense :** 4 000 XP, 220 or. **À créer :** variante de palier et placement.

#### Q18 — Le prix d'un silence

**Niveau 22 · Parcours, campagne · Greffier Solan, nouveau PNJ · Suncho place impériale.** Après Q15.

Montrer le registre de Grimbald → parler au gardien des archives → choisir entre payer 80 or pour une recherche urgente ou livrer 4 cuirs travaillés pour réparer les registres → lire la copie authentifiée. Les livraisons portent une autorisation de Dunhill.

**Récompense :** 5 500 XP, 240 or. **À créer :** greffier, archiviste, copie ; les deux voies convergent avec les mêmes informations.

#### Q19 — Des liens qui ne mordent pas

**Niveau 23 · Courte · Mira.** Indépendante.

Rapporter 5 fibres de toile résistante pour renforcer les paniers des éclusiers. Elles tombent sur les araignées des berges ; taux initial 75 %. Un personnage peut acheter le lot.

**Récompense :** 4 000 XP, 220 or. **À créer :** fibres (valeur de référence 20 or), variante d'araignée et butin. Aucun métier requis.

#### Q20 — Le banquet des absents

**Niveau 25 · Longue, enquête sociale · Mira.** Après Q18. Déroulé au §5.2.

Des rations sont facturées au nom de familles parties. Interroger trois témoins, suivre un lot de caisses, puis découvrir que la fraude nourrit aussi des déplacés invisibles dans les registres. Démanteler le profit sans supprimer leur nourriture demande davantage de travail que dénoncer immédiatement.

**Récompense :** 10 000 XP, 400 or, Anneau des témoins. Le parcours approfondi ajoute 2 000 XP et +4 karma ; il ne donne pas un équipement supérieur.

#### Q21 — La commande aux sept mains

**Niveau 26 · Parcours, artisanat facultatif · Intendant des apprentis.** Q06 requise pour la voie personnelle ; voie fournisseur ouverte à tous.

Choisir un des sept lots professionnels → fabriquer puis retirer 3 recettes de sa branche, **ou** fournir 3 produits finis achetés. Expliquer clairement que la seconde voie est une contribution commerciale, pas une validation de maîtrise.

**Récompense :** 5 000 XP, 320 or. **À créer :** lots équilibrés à un coût matière total maximal de 180 or ; une sortie différente par métier, détaillée au §6. Métier niveau 1 suffisant.

#### Q22 — Une trêve sur le pont

**Niveau 27 · Parcours, diplomatie · Darel · Passage de l'Auberlême.** Q11 conseillée, non requise.

Parler à deux émissaires opposés → éliminer 5 pillards gobelins qui profitent du blocage → choisir qui escortera le prochain convoi dans le récit. Aucun changement réel de propriété de carte.

**Récompense :** 5 500 XP, 260 or. Le choix modifie la conclusion et donne +2 karma, sans bonus d'honneur ni condition PvP.

#### Q23 — Les dents dans les cordages

**Niveau 28 · Courte · Varo · Suncho commerces.** Indépendante, accessible à tous les camps.

Vaincre 7 loups affamés autour des stocks. Varo paie même un Exilé : il a besoin d'une route praticable plus que d'un ami.

**Récompense :** 4 500 XP, 260 or. **À créer :** variante de palier et placement.

#### Q24 — Le registre à deux encres

**Niveau 30 · Longue, campagne · Solan.** Après Q20. Déroulé au §5.3.

Comparer manifeste, copie des archives et livre du banquet → résoudre l'ordre des trois convois → découvrir que les faux achats de grain payaient des pièces de machine → choisir la manière de rendre les preuves publiques.

**Récompense :** 12 000 XP, 500 or, Cape des comptes ouverts. Les trois solutions d'enquête convergent vers le Manoir du rouage obscur.

### Niveaux 31–40 — Dunhill et la machine

#### Q25 — Les aiguilles de Dunhill

**Niveau 31 · Courte · Garde de la porte, nouveau PNJ · Dunhill.** Indépendante.

Vaincre 8 araignées des murs. Aucun drop nécessaire ; quête utile pour découvrir les accès aux canaux des malandrins.

**Récompense :** 5 000 XP, 300 or. **À créer :** garde et variante d'araignée.

#### Q26 — Un colis pour personne

**Niveau 32 · Parcours, campagne · Solan puis receleur Bastian, nouveau PNJ.** Après Q24.

Apporter une caisse témoin scellée au croisement de Launay → parler au receleur → suivre son indication jusqu'aux canaux → retrouver un bordereau dans une cache. Le destinataire officiel n'existe pas.

**Récompense :** 6 500 XP, 320 or. **À créer :** Bastian, caisse et cache. « Suivre » signifie ici visiter une destination révélée, pas filer un PNJ mobile.

#### Q27 — Le fer n'a pas d'opinion

**Niveau 33 · Courte, livraison · Contremaîtresse Adra, nouveau PNJ · Dunhill porte.** Indépendante.

Livrer 10 minerais de fer → livrer 4 cuirs travaillés pour consolider un treuil municipal. Matières achetables ; aucune obligation d'avoir deux métiers.

**Récompense :** 5 000 XP, 380 or. Valeur matière de référence : 194 or.

#### Q28 — La maison qui respire

**Niveau 35 · Longue, enquête · Bastian.** Après Q26. Déroulé au §5.4.

Le manoir semble respirer la nuit. Examiner trois témoins matériels, lire les plans d'Adra, puis choisir entre interrompre une conduite ou chercher le circuit de secours. La seconde voie demande une préparation supplémentaire et révèle que l'arrêt brutal menace les quartiers alimentés par la machine.

**Récompense :** 13 000 XP, 600 or, Amulette du contremaître. Parcours de secours : +2 000 XP, +4 karma. **Pas de panne globale imposée aux autres joueurs.**

#### Q29 — Les gardiens sans bannière

**Niveau 36 · Courte · Adra.** Indépendante.

Vaincre 8 mercenaires gobelins. Ils portent des pièces des trois camps : première trace visible d'une opération qui profite de leurs rivalités.

**Récompense :** 5 500 XP, 340 or. **À créer :** variante du gobelin guerrier, placement.

#### Q30 — Le rouage manquant

**Niveau 37 · Parcours, campagne · Adra.** Après Q28.

Livrer 6 minerais de fer → livrer 2 cuirs travaillés → rejoindre l'établi d'Adra → choisir un réglage sur son schéma → récupérer le rouage isolant. Adra fait la fabrication ; un métier personnel n'est pas requis.

**Récompense :** 7 000 XP, 380 or. Le rouage est un objet de progression, pas un équipement ni une récompense revendable prévue comme source de bénéfice.

#### Q31 — Celui qui ferme les vannes

**Niveau 39 · Longue, campagne · Adra.** Après Q30.

Entrer dans une nouvelle annexe instanciée du manoir → vaincre les gardiens de conduite → résoudre deux vannes grâce aux indices de Q28 → battre le Régulateur, nouveau boss mécanique → trouver le contrat signé à Freiwill.

**Récompense :** 15 000 XP, 700 or, un équipement du Rouage apaisé au choix. **À créer :** annexe, boss, mécanique et contrat. Aucune prétention que la carte actuelle du manoir contient déjà ce donjon.

#### Q32 — Le droit de repartir

**Niveau 40 · Parcours, conclusion locale · Bastian.** Après Q31.

Décider du sort des ouvriers impliqués : témoignage public protégé, ou départ discret contre remise de tous les plans. Apporter la décision à Adra puis porter le contrat à l'avant-poste de Freiwill.

**Récompense :** 7 000 XP, 380 or. Témoignage : +3 karma ; départ : +1 karma. Les deux voies livrent le même dossier utile ; aucune ne bloque la campagne.

### Niveaux 41–50 — Freiwill et ce qui restera

#### Q33 — Le thé a un goût de rouille

**Niveau 41 · Parcours, campagne · Petrus Cimber, personnage proposé · Freiwill.** Après Q32.

> « Le thé n'a pas changé. L'eau, oui. C'est une nuance que les puissants trouvent très commode. »

Livrer 4 feuilles de sauge → comparer trois infusions par le dialogue → montrer le dépôt à un fontainier → apprendre que le réseau du château reçoit la même eau que la ville.

**Récompense :** 7 500 XP, 400 or. **À créer :** Petrus, fontainier, échantillons narratifs. L'identification repose sur les indices, pas un test aléatoire.

#### Q34 — Des quais sans crocs

**Niveau 42 · Courte · Maëline · Freiwill quai.** Indépendante et ouverte à tous les camps.

Vaincre 8 élémentals de vase autour des réserves débarquées. Les familles arrivent par le quai ; la quête sert les civils, pas le recrutement des Exilés.

**Récompense :** 6 000 XP, 380 or. **À créer :** variante de haut palier.

#### Q35 — La mémoire des exilés

**Niveau 43 · Longue, enquête · Maëline.** Après Q33.

Interroger une ancienne ouvrière → visiter l'église → comparer la date d'un registre funéraire à celle du premier contrat → demander des explications à Ysarde. La machine avait d'abord été construite pour traverser un hiver meurtrier ; son exploitation a continué bien après l'urgence.

**Récompense :** 14 000 XP, 650 or, Médaillon des noms rendus. **Choix :** publier les noms avec l'accord des survivants, ou publier les faits en les anonymisant. Même récompense, +3 karma dans les deux cas.

#### Q36 — Ce que coûte une garnison

**Niveau 44 · Courte, livraison · Ysarde · Avant-poste de Freiwill.** Indépendante, tous camps.

Livrer 8 cuirs travaillés → livrer 8 bûches de chêne pour remettre les brancards en état. L'armée paie une commande ; elle ne gagne pas l'allégeance du fournisseur.

**Récompense :** 6 000 XP, 500 or. Valeur de référence des matériaux : 264 or.

#### Q37 — Le dernier inventaire

**Niveau 45 · Parcours, campagne · Petrus.** Après Q35.

Réunir successivement la déposition de Maëline, le bilan logistique de Varo et l'ordre de réquisition d'Ysarde → présenter les trois au conseil. Chaque interlocuteur fournit une pièce différente ; aucun ne peut être remplacé par un paiement.

**Récompense :** 8 000 XP, 450 or. **À créer :** trois preuves, dialogues ; remise dans un ordre fixe pour rester compatible avec la progression linéaire existante.

#### Q38 — Trois promesses, une forêt

**Niveau 47 · Longue, campagne · Conseil des trois émissaires.** Après Q37. Déroulé au §5.5.

Chaque camp propose une solution imparfaite. Le joueur prépare un dossier et choisit : sceller l'installation, la rationner sous contrôle public, ou la démanteler progressivement. Cette décision ne change pas automatiquement son alignement.

**Récompense :** 15 000 XP, 750 or, 4 potions de palier 45. Les solutions ont des coûts narratifs et des préparatifs différents, mais un budget de puissance identique.

#### Q39 — Ce qui pousse sous les pierres

**Niveau 49 · Longue, finale de campagne · Dezelle et Adra.** Après Q38.

Revenir à la source avec le dispositif préparé → traverser un nouveau sanctuaire de racines sous la machine → vaincre le Cœur greffé → appliquer la solution choisie. Le boss est la conséquence du pompage et de la corruption, pas la forêt déclarée mauvaise par principe.

**Récompense :** 18 000 XP, 900 or, un équipement rare des Racines franches au choix. **À créer :** instance, boss et conclusion selon la branche. Résolution personnelle à l'instance ; les cartes communes ne changent pas selon le dernier joueur passé.

#### Q40 — La première feuille

**Niveau 50 · Épilogue · Dezelle · Armoire d'Armoise.** Après Q39.

> « Elle n'est pas très grande. Elle ne brille même pas. Mais hier, il n'y avait rien. »

Recevoir les nouvelles des trois régions → revenir auprès du premier pot malade → choisir à qui offrir la première bouture : aux déplacés, aux ateliers ou aux enfants de la garnison. Chaque destinataire représente un avenir possible, pas un nouveau changement de camp.

**Récompense :** 10 000 XP, 500 or, Souvenir de la première feuille, objet commémoratif sans statistique. Trois textes de fin. Un titre de profil peut être ajouté plus tard ; il n'est pas promis comme fonctionnalité existante.

## 4. Les six initiations, prêtes à scénariser

### 4.0 Q01 — La sève noire : entrer dans l'histoire par ses mécaniques

**Principe.** Chaque mécanique répond à un besoin du récit : on ne présente pas les PA, on donne une raison d'en dépenser, puis on nomme ce que le joueur vient de faire. Une seule mécanique nouvelle par étape. La première quête n'enseigne que le cœur du jeu : **bouger, parler, combattre, interagir, progresser**. Alignements, métiers, échanges, HDV, guildes et donjons viennent avec leurs propres initiations (Q03, Q06, Q08, Q11). L'intro.js existant (flag « tutoriel actif ») montre où cliquer ; la quête porte l'histoire.

Contexte de la carte : le joueur apparaît en (9,9) du Tutoriel Boisé, Leopold se tient en (6,11) et Eolan en (11,9). Des psilofrosts y sont déjà posés.

| # | Étape | Mécanique apprise | Condition | Ce qu'affiche le journal |
|---|---|---|---|---|
| 1 | Réveil | Marcher (PM), ouvrir un dialogue | `PASSER_DIALOGUE` | « Parlez à Leopold » + lieu |
| 2 | Les mains nues | Ciblage, barre de sorts, PA, riposte, PV | `BATTRE_MONSTRE` ×5 jeune psilofrost | « Vaincre 5 × Jeune psilofrost — 3 / 5 » |
| 3 | Ce qui te revient | Choix de classe | `CHOIX` → `SCRIPTED_EFFECT` `choisir_classe` (actions existantes 1–4) | décision à prendre |
| 4 | Ça ne te va pas comme ça | Inventaire, équiper | voir ci-dessous | — |
| 5 | Prélever la sève | Case interactive, coût en PA, sac | `POSSEDER_OBJET` Fiole de sève noire | « Posséder Fiole de sève noire » |
| 6 | Ce que la sève a changé | Butin, combat de classe, potion, remettre un objet | `DONNER_OBJET` ×3 Glande de sève | « Apporter 3 × Glande de sève — 1 / 3 en sac » |
| 7 | Des forces qui se réveillent | Niveau, points de caractéristiques | `PASSER_DIALOGUE` (action existante 8 « Terminer ») | « Parlez à Leopold » |

**Étape 1 — Réveil.**

> « Tu dormais contre cet arbre comme s'il t'avait recraché. Regarde son écorce… ça suinte. Tu te souviens de ton nom, au moins ? Bon. C'est déjà ça. »

Le joueur marche de (9,9) jusqu'à Leopold : trois cases, trois PM, et la jauge bouge sous ses yeux. Bouton : « Où suis-je ? ».

**Étape 2 — Les mains nues.**

> « Tu entends ? La sève les attire. Ils arrivent. Pas d'arme ? Alors tes poings feront l'affaire — défends-toi ! »

Le joueur est encore **gueux** (classe par défaut). Sa barre propose un seul sort, « Patate de forain » (corps à corps, 1 PA, 38 de dégâts de base). Il apprend à marcher sur la case d'un monstre pour le cibler, à frapper, à voir les PA baisser et à encaisser une riposte. Une phrase de Leopold suffit sur la mort : « Si tu tombes, tu te réveilleras au cimetière, plus faible d'un peu d'expérience. Évite. »

Le compteur part de l'entrée dans l'étape (`compteurs_depart`) : les psilofrosts tués avant ne comptent pas.

**Étape 3 — Ce qui te revient.**

> « Tu te bats comme un gueux. Mais ce geste-là, juste avant de frapper… tu l'as déjà fait mille fois. Qu'est-ce que tu tenais, avant ? »

Quatre boutons, qui sont des souvenirs et pas un menu de classes : « Un arc » (archer), « Une lame » (guerrier), « Un grimoire » (sorcier), « Rien — mes poings suffisaient » (moine). Ce sont les actions existantes 1–4 avec leurs libellés réécrits. L'équipement de départ arrive dans le sac.

**Étape 4 — Ça ne te va pas comme ça.**

> « Un arc au fond d'un sac, ça ne protège personne. Sors-le. »

Aucun `ActionType` ne vérifie qu'un objet est équipé. Deux options :
- **Ajouter `EQUIPER_EQUIPEMENT`** : un `case` dans l'enum, sa condition lue sur `user_equipement`, son champ dans `QuestActionTypeConfig`. C'est la version qui valide vraiment le geste.
- **Sans développement** : `PASSER_DIALOGUE` et guidage intro.js vers l'inventaire. Le joueur peut alors passer l'étape sans s'équiper ; l'étape 6 le lui fera vite sentir.

**Étape 5 — Prélever la sève.**

> « Je veux un peu de cette saleté dans une fiole. Pas sur tes mains. »

Une interaction posée sur l'arbre suintant, à côté du point d'apparition : petit coût en PA, récompense = 1 Fiole de sève noire. Elle enseigne les cases interactives et le sac. L'interaction n'est **pas** conditionnée à Q01 : un vétéran qui a fait l'ancienne quête doit pouvoir y prendre la fiole pour ouvrir Q05. Recharge de portée JOUEUR longue (24 h) ; la fiole n'a pas de prix de vente, ce qui rend toute tentative de farm inutile.

Récompense de l'étape : **2 potions de vie mineures**, avant le combat qui suit.

**Étape 6 — Ce que la sève a changé.**

> « Les libellules de la mare ont bu à cet arbre. Elles ne sont plus tout à fait des libellules. Rapporte-moi ce qu'elles ont dans le ventre — trois, que je compare. »

Le joueur se bat cette fois avec les sorts de sa classe : il sent la différence avec l'étape 2 sans qu'on la lui explique. La libellule contaminée lâche une Glande de sève à **100 %** : avec 60 %, il faut en moyenne 5 victoires pour 3 glandes, et certains joueurs en feraient 9. Un butin, c'est la ligne « droppedItems » de la réponse d'attaque ; le joueur voit l'objet tomber dans son sac et la jauge du journal avancer.

La remise des 3 glandes porte la récompense de la quête : **10 000 XP et 30 or**. Le niveau 2 tombe à ce moment-là.

**Étape 7 — Des forces qui se réveillent.**

> « Tu le sens ? Ce n'est pas la sève, ça. C'est toi. Va voir ce que tu as dans le ventre, toi aussi. »

Guidage intro.js vers le Profil et la répartition des points de caractéristiques. Puis la transition :

> « Cette pourriture n'est pas d'ici. Dezelle, à Limuren, saura ce que c'est. Prends la fiole, passe par le bois de Hal. Et ne la bois pas. »

Le bouton « Terminer » clôt Q01. La remise de la fiole se fait dans **Q05**, chez Dezelle : un PNJ ne présente que sa propre quête (§7, point 1).

**Combat : premiers chiffres à éprouver.** Avec 1 point par caractéristique, « Patate de forain » fait environ 40 dégâts.

| Créature | PV | Puissance | Riposte (`rand(p, 2,2p)`) | Coût estimé |
|---|---|---|---|---|
| Jeune psilofrost | 80 | 6 | 6–13 | 2 coups par victoire, ~10 PA et ~100 PV perdus sur 400 pour 5 victoires |
| Libellule contaminée | 180 | 12 | 12–26 | 2 à 4 coups selon la classe (sorts de niveau 1 de 45 à 120 de base), ~6–12 PA pour 3 victoires ; les potions servent |

Le psilofrost d'origine (500 PV, puissance 20) demanderait une douzaine de coups au gueux et le tuerait avant la 5e victoire. Total visé : moins de 30 PA pour toute la quête, la régénération n'étant que de +10 PA par heure. Recharges courtes (30 s) : plusieurs débutants partagent la même carte.

**Données existantes et parties en cours.**
- Garder l'id de la quête 1 et ses actions 1–4 (choix de classe) et 8 (« Terminer »). La séquence qui porte les actions 1–4 passe en position 3, celle de l'action 8 en position 7. La contrainte unique `(quete_id, position)` impose de renuméroter en passant par des positions temporaires.
- Un joueur arrêté sur l'ancienne étape 1 reprend directement au choix de classe : il saute le combat en gueux, ce qui est acceptable.
- Un joueur qui a déjà fini l'ancienne Q01 ne la refait pas ; il peut prendre la fiole sur l'arbre pour ouvrir Q05.
- La quête 2 « Un début prometteur » n'a aucune séquence : la supprimer ou la réutiliser, mais ne pas la laisser proposée.
- Les nouveaux monstres doivent être **peints dans le fond de la carte** (§6) : la mare des libellules et les psilofrosts près de l'arbre.

**À vérifier avant publication.**
- ~~Barre de sorts après le choix de classe~~ — **corrigé le 16/11/2026** : `choisirClasse` vide désormais `user_sortilege` (`UserSortilegeRepository::viderBarre`). Avant, la ligne « Patate de forain » d'un gueux qui avait personnalisé sa barre restait en base : la barre de la nouvelle classe s'affichait bien, mais sa première personnalisation ne matérialisait pas la barre par défaut, et le joueur ne gardait que le sort qu'il venait de placer.
- Plusieurs `monstre_carreau` du Tutoriel Boisé ont une `quantity` négative (−25, −3) : comprendre ce que le moteur en fait avant d'y poser les nouvelles créatures.
- L'XP de combat (180–240 par action) ne doit pas suffire à passer niveau 2 avant l'étape 6, sinon le moment de la montée de niveau est perdu.
- Parcours complet dans les quatre classes, et une mort volontaire à l'étape 2.

### 4.1 Q03 — récolter sans imposer un métier

**Ouverture de l'intendant :**

> « Une forêt n'est pas un coffre qu'on ouvre jusqu'au fond. Eolan t'apprendra un métier. Moi, je veux m'assurer que tu sais ce que ton geste laisse derrière lui. »

**Étape 1 — découvrir.** Présenter les quatre métiers, leurs ressources et leur place dans les échanges. Deux emplacements de récolte au maximum, indépendants des trois de fabrication. Oublier un métier fait perdre sa progression. Aucun métier appris automatiquement par un bouton de dialogue.

**Étape 2 — apprendre chez Eolan.** Le joueur passe par le vrai écran de métier. S'il en connaît déjà un, il choisit ce métier pour l'exercice. S'il a rempli ses places, aucune demande d'oubli. Les boutons de choix précèdent l'objectif pratique ; ils ne prétendent pas vérifier l'apprentissage.

**Étape 3 — branche pratique, une seule suffit :**

| Métier | Travail personnel | Matériaux conservés | Prérequis de contenu |
|---|---|---|---|
| Herboriste | Récolter 3 chapeaux de champignon bleu | 3 chapeaux ou davantage selon le mode | Gisement existant, compteur de récolte |
| Mineur | Récolter 3 minerais de fer | Minerai obtenu | Filon existant, compteur de récolte |
| Bûcheron | Récolter 3 bûches de chêne | Bois obtenu | Chêne existant, compteur de récolte |
| Dépeceur | Prélever personnellement 2 peaux via des victoires | Peaux obtenues | Butin de métier existant sur psilofrost ; contrôle de prélèvement à ajouter |

Pour le dépeceur, acheter une peau ne valide pas une pratique. Le compteur `RESSOURCE_RECOLTEE` actuel ne suffit pas à prouver un butin de métier : cette branche nécessite un événement/compteur approprié. Une version purement informative reste possible, mais ne doit pas prétendre certifier un dépeçage.

**Étape 4 — expliquer le choix.** Montrer les modes sur une ressource compatible. Mesuré : moins de matière immédiate, retour plus rapide, pas d'épuisement partagé. Intensif : plus de matière, retour plus lent, gisement temporairement indisponible pour les autres. Le karma varie, mais n'accorde aujourd'hui aucun bonus de combat ou prix marchand.

Question : « Si tu vides ce filon, que trouve le prochain mineur ? » Mauvaise réponse : explication et nouvel essai, sans coût. Aucune obligation de récolter intensivement pour finir.

**Conclusion :** « La bonne récolte, ce n'est pas seulement ce que tu rapportes. C'est aussi ce qu'on pourra encore y trouver. » Récompense une fois, identique pour tous les métiers.

### 4.2 Q06 — fabriquer et retirer son travail

**Ouverture :** « Une commande lancée n'est pas un objet dans ton sac. Et un objet dans ton sac ne prouve pas que tu l'as fabriqué. »

1. Présenter les sept métiers ; choisir librement, avec trois places de fabrication. Aucune association obligatoire « herboriste = alchimiste ».
2. Apprendre chez Eolan ou garder un métier déjà connu.
3. Choisir la recette d'initiation correspondante. L'intendant fournit **80 or d'amorçage une seule fois**, avant la branche. Les matériaux de chaque recette doivent coûter au plus 60 or chez un fournisseur fixe accessible ; ne pas dépendre des annonces d'autres joueurs.
4. Acheter ou récolter les ingrédients ; ouvrir Artisanat, sélectionner la recette et lancer une commande. Les ingrédients quittent le sac au lancement.
5. Attendre l'état prêt puis retirer. Le compteur de fabrication valide le retrait, pas le lancement ni une annulation.
6. Répondre au bilan : trois commandes simultanées au maximum ; mode soigné plus lent, restitution partielle arrondie vers le bas ; mode expéditif plus rapide, sans restitution ; karma différent. Annulation seulement avant la fin, avec restitution des ingrédients.

**Recettes d'exercice proposées, toutes niveau métier 1 :** décoction d'essai (alchimiste), pointe d'exercice (forgeron), bande cousue (couturier), boucle de cuivre (bijoutier), rivet large (armurier), ration de marche (cuisinier), cuir travaillé (tanneur, recette existante). Les cinq métiers sans recette débutante adaptée reçoivent une nouvelle recette ; la décoction d'essai permet une restitution visible avec 4 unités d'un ingrédient.

Le métier ne doit pas coûter davantage selon le choix : budget matière comparable, recette de 2 minutes environ pour les nouveaux exercices, ajustement du tanneur à discuter séparément de sa recette existante. On peut conserver ses 5 minutes actuelles et l'annoncer.

**Récompense finale :** 3 000 XP, 80 or, objet fabriqué conservé. Les 80 or d'amorçage sont distincts, donc budget total 160 or. Aucun bonus d'XP métier inventé : l'XP professionnelle vient de la recette.

### 4.3 Q08 — choisir un alignement en connaissance de cause

**Situation commune :** un convoi n'a pas assez de place pour emporter toutes les réserves avant l'hiver.

- Maëline : « Un registre peut oublier quelqu'un. La faim, jamais. » Elle propose de servir d'abord les familles sans protection.
- Varo : « Une route qui ferme affame aussi ceux qui ne l'empruntent pas. » Il veut préserver le transport et ses travailleurs.
- Ysarde : « Une promesse n'arrête pas un pillard. Une porte gardée, si. » Elle veut sécuriser les dépôts et organiser la distribution.

Chaque rencontre expose aussi le prix de cette priorité. Le joueur entend **les trois** avant de répondre à Nelle. Les réponses ne sont pas un test de personnalité qui assigne un camp automatiquement.

**Écran final :** quatre choix explicites, puis confirmation pour un camp : « Je rejoins les Exilés / le cartel / les royalistes » ; « Je garde mon indépendance ». Texte préalable : l'appartenance compte déjà pour les guildes et le feu ami ; elle ne rend pas immunisé aux attaques. L'allégeance visuelle viendra dans Q13.

**Cas indépendant :** même récompense, fin de l'introduction. Pour choisir un camp plus tard, prévoir un dialogue autonome sans nouvelle récompense et gardé côté serveur pour les personnages sans alignement. Ne pas rendre Q08 répétable pour résoudre ce cas.

**Cas déjà aligné :** revoir les doctrines sans changement automatique. Une éventuelle procédure de changement de camp est hors de cette campagne et ne doit pas être créée par accident avec l'effet existant.

### 4.4 Q11 — comprendre le PvP sans attendre un adversaire

**Darel :** « Savoir frapper, c'est ton affaire. Savoir ce que tu déclenches, c'est la mienne. »

Trois scènes dialoguées, questions et corrections incluses :

1. **L'adversaire hors de portée.** Choix correct : se rapprocher et vérifier les PA. Darel rappelle que la cible doit être sur la même carte, vivante et hors protection de réapparition. Un simple choix de camp ne crée pas une zone de guerre spéciale.
2. **Le camarade encombrant.** Choix correct : discuter ou contourner. Attaquer un allié est possible, mais coûte honneur et karma à l'attaquant ; l'achever aggrave le coût, sans récompense de victoire. La victime n'est pas sanctionnée pour la trahison d'autrui.
3. **Le rival qui revient pour la troisième fois.** Choix correct : comprendre que les victoires répétées contre la même victime sont neutralisées par l'anti-farm. Fenêtre actuelle : 6 heures ; texte à garder cohérent avec la configuration. Écraser un personnage beaucoup plus faible peut faire perdre de l'honneur.

Expliquer la mort, le malus d'XP et le retour au cimetière. Donner les potions à la conclusion. Proposer ensuite **verbalement** un combat entre volontaires de camps différents, avec risques normaux explicités ; il ne fait pas partie des conditions de réussite.

**Extension possible après développement :** exercice de duel non létal consensuel. Ni arène protégée, ni consentement technique, ni compteur de victoire de quête ne sont présentés comme déjà disponibles.

### 4.5 Q13 — prêter allégeance et changer de couleur

**Principe :** Q08 choisit une appartenance ; Q13 transforme cette appartenance en engagement public. Les relations de camp existent déjà avant le serment. La couleur est une reconnaissance visuelle, pas une hausse de statistiques.

**Les Exilés — « Personne derrière nous ».** Rencontrer une famille sur le passage → donner 4 bûches pour son abri → vaincre 4 loups de lisière → rapporter son message à Maëline. Dilemme : garder anonyme son lieu de refuge ou annoncer publiquement la réussite ; le dialogue explique pourquoi la discrétion est demandée, sans faire perdre l'allégeance sur une mauvaise première réponse.

Serment : « Je ne promets pas d'être sans peur. Je promets de ne pas faire des oubliés le prix de ma sécurité. » **Couleur bleue**, référence actuelle `#0000FF`.

**Le cartel — « Une parole qui vaut contrat ».** Retrouver le registre d'un chargement → donner 4 bûches pour réparer la charrette → vaincre 4 loups de lisière → remettre la cargaison complète à Varo. Dilemme : déclarer une caisse excédentaire au propriétaire ou tenter de la garder ; la fraude mène à une réparation avant le serment, pas à une impasse permanente.

Serment : « Ma parole ne pèsera pas moins lorsque personne ne tiendra la balance. » **Couleur verte**, référence `#80ed99`.

**Les royalistes — « Garder ceux qui dorment ».** Relever le poste d'un garde blessé par un dialogue → donner 4 bûches pour réparer une barrière → vaincre 4 loups de lisière → remettre un rapport exact à Ysarde. Dilemme : cacher l'erreur d'un supérieur ou la signaler ; le second choix est présenté comme une loyauté envers la fonction, pas une trahison.

Serment : « Je répondrai de ceux que je protège, même lorsque la vérité dérange ceux que je sers. » **Couleur rouge**, référence `#ef233c`.

**Confirmation finale commune :** rappeler le camp et annoncer « Votre personnage portera désormais les couleurs de … ». Boutons « Prêter serment » et « Pas maintenant ». Le second conserve la progression et ne donne rien. Le premier applique une fois le serment, la couleur et la récompense.

**Rendu demandé :** recoloration des vêtements/accessoires du sprite, peau et lisibilité conservées ; silhouette de classe reconnaissable. Un halo ou une icône seuls ne satisfont pas cette demande. Prévoir des masques ou variantes de sprites pour toutes les classes/sexes et un repli visuel pendant le chargement. Affichage identique pour soi et les autres, y compris en instance et après reconnexion.

**Cas limites :** refuser un serment d'un autre camp, un second gain de récompense, ou un appel direct sans étapes terminées. La future procédure de changement d'alignement devra retirer ou invalider l'ancien serment. Les personnages déjà alignés ne sont pas colorés rétroactivement sans avoir fait Q13.

## 5. Cinq enquêtes longues détaillées

### 5.1 Q10 — La facture qui boit l'encre

**Ce qu'on croit :** un batelier a volé du grain. **Ce qu'on découvre :** quelqu'un a utilisé son nom pour masquer une livraison minérale.

1. Orrin remet une facture tachée : vingt sacs de grain, charrette légère, destination Armoire d'Armoise.
2. Au passage, la porteuse Nelle affirme que la charrette avait les essieux renforcés et qu'elle est partie vers les galeries.
3. L'armurier montre le poids de la réparation : l'équivalent de charges minérales, incompatible avec le grain annoncé.
4. Le batelier reconnaît son sceau, mais explique que la matrice a été prêtée à un commis. Il supplie le joueur de ne pas livrer son nom sans preuve.
5. Retour chez Orrin : choisir l'incohérence décisive parmi « couleur de l'encre », « poids et destination », « mauvaise écriture ». La réponse erronée renvoie aux indices ; aucune consommation ni blocage définitif.
6. Conclusion : publier les faits vérifiés ou transmettre un dossier anonymisé. Les deux disculpent le batelier, avec des phrases de conclusion différentes.

**Pourquoi investir :** trois sources à croiser ; aucun monstre ne lâche magiquement la solution. **Implémentation :** séquences de proximité et preuves narratives ; pas de recherche libre de pixels sur la carte. Broche et XP versées seulement après la conclusion.

### 5.2 Q20 — Le banquet des absents

1. Mira découvre vingt repas quotidiens facturés à une maison vide.
2. Le cuisinier parle de paniers emportés, le garde d'un passage nocturne, une déplacée de repas reçus sans inscription.
3. La cache révèle deux livres : l'un paie les rations, l'autre détourne une marge pour acheter du matériel.
4. Choix rapide : remettre les livres à Solan. La fraude est arrêtée ; les familles doivent chercher une autre aide. Récompense de base, karma 0.
5. Choix approfondi : rencontrer Maëline → obtenir l'inscription des familles par dialogue avec le greffier → livrer 4 rations de marche, achetables → remettre les livres avec un plan de continuité. Bonus de 2 000 XP et +4 karma.
6. Les deux chemins révèlent le même fournisseur de pièces ; aucun choix ne ferme Q24.

**Coût assumé :** la voie approfondie prend du temps et les rations, mais ne demande pas d'être cuisinier. Le joueur est prévenu avant de choisir. L'anneau est identique ; on ne rend pas obligatoire le « bon » choix pour optimiser son équipement.

### 5.3 Q24 — Le registre à deux encres

Les pièces déjà découvertes sont **rappelées dans le dialogue**, même si les objets précédents ont été remis : ne pas obliger à conserver sans avertissement un ancien objet vendable.

- Le convoi A est parti avant la crue et transporte du grain réel.
- Le convoi B part après la crue, avec un poids déclaré trop faible pour ses essieux.
- Le convoi C est facturé à une date où le pont est fermé ; il ne peut pas avoir suivi l'itinéraire officiel.

Le joueur répond d'abord « quel convoi dissimule une charge lourde ? » (B), puis « quel trajet est fictif ? » (C). Un mauvais choix mène à un rappel, sans redonner de récompense intermédiaire. La copie authentifiée relie B et C à un même atelier de Dunhill.

Choix de sortie : remettre le dossier au greffe, en distribuer des copies aux émissaires, ou publier via les marchands. Trois vecteurs d'information, mêmes faits et même récompense. Aucune affirmation d'une réputation persistante si seul le texte final est enregistré.

### 5.4 Q28 — La maison qui respire

Trois indices, chacun donnant un élément de la solution : une conduite chaude sort vers la ville ; une conduite froide revient vers le sous-sol ; une vanne porte une marque de racine. Adra fournit un schéma lisible.

Le joueur conclut que le manoir **aspire** de l'énergie et qu'une partie repart vers les quartiers. Il peut :

- **Interrompre le pompage local.** Faire fermer une dérivation par Adra ; le récit décrit une coupure brève et des réserves sollicitées. Accès immédiat à Q30.
- **Préparer un secours.** Livrer 4 minerais de fer puis 2 cuirs travaillés → parler au responsable des réserves → faire fermer la même dérivation sans coupure dans le récit. Bonus indiqué avant acceptation.

Les trois inspections se font par scènes de quête auprès des intervenants, avec repères de lieu. Une version utilisant des interactions persistantes demanderait un suivi dédié des inspections : ne pas confondre un dialogue « j'ai regardé » avec un événement validé.

### 5.5 Q38 — Trois promesses, une forêt

Les camps ne proposent pas simplement leur couleur préférée : ils assument trois risques.

| Solution | Défenseur | Travail demandé | Conséquence racontée |
|---|---|---|---|
| Sceller immédiatement | Maëline | Livrer 6 bois, 4 cuirs ; organiser des réserves civiles avec Petrus | La forêt est soulagée vite ; les villes doivent rationner |
| Rationner sous contrôle public | Ysarde | Livrer 8 fers, 4 bois ; faire contresigner le protocole par les trois émissaires | Transition plus douce ; il faudra surveiller les responsables |
| Démanteler progressivement | Varo | Livrer 4 fers, 4 cuirs ; négocier avec Adra la récupération du matériel | Le monde garde ses outils ; la réparation de la forêt prendra plus longtemps |

Chaque solution exige ensuite le même affrontement de Q39 : le Cœur greffé bloque toute intervention. Le choix est annoncé comme définitif pour cette campagne, avec confirmation. Une branche couvre Q38 puis Q39 et converge vers Q40 ; la conservation de cette décision entre quêtes est un besoin technique explicite.

Aucun camp n'a le monopole du bon choix, aucun bonus de statistiques ne pousse vers une doctrine. La somme versée couvre raisonnablement les matériaux ; les potions préparent le joueur à la finale. Les conséquences restent personnelles/narratives tant qu'un système d'état mondial n'existe pas.

## 6. Contenu à créer et budget des objets

### Personnages

Nelle (éclaireuse), intendant des apprentis (quête, distinct d'Eolan qui conserve son écran métier), Orrin (pêcheur), Maëline, Varo, Ysarde (émissaires), Darel (instructeur), Solan (greffier), Mira (éclusière), Bastian (receleur), Adra (contremaîtresse), Petrus Cimber (à incarner), plus les rôles secondaires : archiviste, voyageur, garde de Dunhill, fontainier, cuisinier, ouvrière et déplacée.

Nelle n'apparaît plus dans Q01 (révisée le 16/11/2026) : sa première scène est désormais Q08, dont le texte doit la présenter.

Limiter les nouveaux visages uniques aux principaux ; les figurants peuvent partager une illustration générique. Ne pas utiliser le PNJ de test comme personnage canonique.

### Bestiaire et butin

- Variantes 1–10 : jeunes psilofrosts (80 PV, puissance 6, pensés pour un gueux), libellule contaminée (180 PV, puissance 12, butin Glande de sève à 100 %) et psilofrosts de lisière ; libellule existante à tester.
- Objets de Q01 : Fiole de sève noire (interaction, sans prix de vente, remise à Dezelle dans Q05) et Glande de sève (butin, remise à Leopold).
- Variantes 11–20 : loup de lisière, éclat d'eau troublée.
- Variantes 21–30 : élémental des canaux, araignée des berges, pillard gobelin, loup affamé.
- Variantes 31–40 : araignée des murs, mercenaire gobelin ; boss Régulateur.
- Variantes 41–50 : élémental de vase ; boss Cœur greffé.

Les variantes peuvent réutiliser les visuels existants si le décor et les libellés permettent de comprendre la différence. Leurs PV/dégâts restent à simuler avec les quatre classes et l'équipement attendu. Réutiliser un sprite n'autorise pas à supposer qu'une nouvelle créature est déjà peinte dans le décor.

Drops de livraison : glandes de sève 100 % (tutoriel), ailes 60 %, fibres 75 %, chapeaux selon la table existante. Aucun objet critique d'enquête à 1 % : preuves données par étapes garanties. Si une quête impose réellement « obtenir en combat », un objet acheté ne suffit pas et un suivi spécifique est nécessaire ; les livraisons de ce dossier autorisent explicitement l'achat.

### Artisanat

Les recettes actuelles vérifiées dans le seed sont : potion de vie mineure (alchimiste niveau 1), cuir travaillé (tanneur niveau 1), arc de l'archer débutant (forgeron niveau 10). Le reste doit être ajouté pour les initiations.

| Branche de Q06/Q21 | Produit d'exercice proposé | Matière dominante | Garde de conception |
|---|---|---|---|
| Alchimiste | Décoction d'essai | 4 sauges | Montrer une restitution possible en mode soigné |
| Forgeron | Pointe d'exercice | 4 fers | Ne pas imposer le niveau métier 10 de l'arc existant |
| Couturier | Bande cousue | 4 fibres communes, nouvelles | Fournisseur fixe nécessaire |
| Bijoutier | Boucle de cuivre | 4 fragments de cuivre, nouveaux | Fournisseur fixe ; ne pas inventer un gisement déjà présent |
| Armurier | Rivet large | 4 fers | Produit distinct de celui du forgeron |
| Cuisinier | Ration de marche | 4 portions de céréales, nouvelles | Fournisseur fixe ; recette accessible niveau 1 |
| Tanneur | Cuir travaillé | 3 peaux existantes | Garder recette actuelle ; expliquer que 30 % de 3 rend 0 |

Les produits d'exercice peuvent être des objets ordinaires utiles aux commandes, pas tous des consommables aux effets nouveaux. La décoction d'essai doit avoir un effet défini si elle est consommable. Fixer les prix des nouveaux ingrédients avant import ; plafond matière 60 or par fabrication et 180 pour Q21.

### Équipements et récompenses garanties

| Quête | Objet proposé | Budget d'équipement visé |
|---|---|---|
| Q10 | Broche de la rive | Accessoire utile niveau 12, bonus modeste |
| Q13 | Insigne de serment | Objet commémoratif, même valeur pour les camps ; couleur séparée |
| Q15 | Série Scintillante | Choix entre quatre profils de classe, budget niveau 18 |
| Q20 | Anneau des témoins | Accessoire niveau 25, même puissance quelle que soit la conclusion |
| Q24 | Cape des comptes ouverts | Pièce niveau 30 |
| Q28 | Amulette du contremaître | Accessoire niveau 35 |
| Q31 | Série du Rouage apaisé | Choix entre quatre profils, budget niveau 39 |
| Q35 | Médaillon des noms rendus | Accessoire niveau 43 |
| Q39 | Série des Racines franches | Choix entre quatre profils, budget niveau 49 ; récompense rare garantie |
| Q40 | Souvenir de la première feuille | Objet ordinaire commémoratif, sans bonus |

Les noms ne garantissent pas qu'un emplacement « broche » ou « médaillon » existe : mapper ces accessoires sur les positions réellement disponibles avant de créer les fiches. Établir les bonus par comparaison avec le catalogue réel ; objectif initial : objet rare au sommet de sa tranche, sans rendre obsolète le palier suivant. Les variantes doivent avoir un budget comparable. Le choix de récompense est explicite ; ne pas donner automatiquement un objet inutilisable à une classe.

Les potions de palier 45 sont à créer et calibrer contre les PV attendus ; les potions mineures, elles, existent. Aucun titre, coffre ouvrable, bonus de sac ou recette déverrouillée n'est annoncé sans mécanisme correspondant.

## 7. Faisabilité avec le moteur actuel

Audit fondé sur `DOCUMENTATION.md`, le code local et `seeds/content-seed.sql`. La base Docker active n'a pas été interrogée : le contenu live peut différer du seed. Les passages anciens de la documentation sont parfois dépassés ; le code a été utilisé pour les points sensibles.

### Déjà pris en charge

- Quêtes avec niveau minimum, un prérequis de quête, alignement, objet ; séquences, choix, sauts et récompenses par action.
- Chasses comptées depuis l'entrée d'étape, récoltes d'interactions et recettes retirées.
- Livraison et possession d'objets, proximité d'un PNJ, présence sur une carte, victoire sur un boss.
- Karma par action, sélection d'alignement, distribution centralisée de récompenses.
- Donjons instanciés, leviers et mécaniques existantes utilisables pour construire de nouvelles rencontres.

### Adaptations indispensables avant intégration

1. **Accès à plusieurs quêtes chez un PNJ.** Le contenu actuel lie un PNJ à une quête ; plusieurs fiches ci-dessus reviennent chez Dezelle ou les émissaires. Prévoir un catalogue de quêtes avec disponibilité/prérequis, ou un routeur de chaîne. Ne pas écraser sa quête précédente pour rendre la suivante visible. Eolan reste un PNJ métier, l'intendant porte les quêtes.
2. **Allégeance distincte.** Le code expose le choix d'alignement, pas l'effet de serment demandé. Ajouter un état serveur cohérent, sa validation et sa projection. `Player.jsx` choisit actuellement son sprite par classe et sexe ; le personnage n'est pas recoloré par l'alignement. Adapter les projections de soi/autrui et le rendu en instance.
3. **Dépeçage personnel.** Vérifier la pratique via une donnée fiable, avec point de départ à l'étape ; ni simple possession ni compteur de récolte de case.
4. **Mémoire des branches entre quêtes.** Les choix sont utilisables dans une quête, mais Q38 doit transmettre sa solution à Q39/Q40. Définir un résultat de quête persistant ou regrouper ces actes dans une seule quête longue. Un objet-preuve échangeable ne doit pas décider seul d'un choix irréversible.
5. **Pas de faux suivi de visites.** `PARLER_PNJ` vérifie la proximité et `VISITER_CARTE` la présence actuelle. Faire valider l'étape au bon endroit ; « y être passé hier » n'est pas automatiquement mémorisé. Les scènes éloignées nécessitent une UI/validation qui fonctionne sur place et des PNJ correctement associés.
6. **Boss déjà vaincus.** `BATTRE_BOSS` repose sur les données existantes du joueur. Accepter explicitement une victoire passée, ou créer une condition « vaincu depuis le début de cette étape » pour Q15/Q31/Q39. Ne pas annoncer une nouvelle victoire sans la vérifier.
7. **PvP.** `KILL_PVP` reste déclaré non implémenté. Q11 est volontairement une initiation aux règles sans cet objectif. Une version pratique demanderait un contrat de duel adapté ; le cumul brut des morts infligées ne garantit ni adversaire pertinent ni absence de farm.
8. **Objets et récompenses multiples.** Une récompense porte des références limitées et une quantité commune. Distribuer les lots de quantités différentes sur des étapes distinctes, gardées contre le double gain, ou étendre proprement le modèle ; ne pas coder une distribution parallèle.
9. **Équiper et changer de classe (Q01).** Aucun `ActionType` ne vérifie qu'un objet est équipé : ajouter `EQUIPER_EQUIPEMENT` ou se contenter d'un guidage (§4.0, étape 4). La barre de sorts est vidée au changement de classe depuis le 16/11/2026 (§4.0).
10. **Preuves et amorçage.** Un objet nécessaire perdu doit pouvoir être récupéré sans nouvelle récompense économique. L'amorçage de Q06 est donné avant les branches et une seule fois. Les changements de branche ne doivent ni redonner l'or ni effacer silencieusement une pratique déjà acquise.

### Ordre de réalisation conseillé après relecture

- Premier lot : catalogue multi-quêtes, Q01–Q07, contenu de débutant, tous les métiers d'initiation.
- Deuxième lot : Q08/Q11/Q13, allégeance et sprites, cas existants et nouveaux personnages.
- Troisième lot : campagne Limuren–Suncho et contrats jusqu'à Q24.
- Quatrième lot : Dunhill, Freiwill, deux nouvelles rencontres et finales.

L'import devra préserver les ids de contenu existants, avoir un mode de contrôle sans écriture, et distinguer le contenu nouveau de la modification de Q05. Après toute modification en base : sauvegarde puis contrôle de jouabilité, et **`./scripts/content-dump.sh`** pour versionner le résultat ; `--push` seulement si la synchronisation est demandée.

## 8. Points à relire en priorité

1. Les doctrines proposées des trois camps correspondent-elles au monde que tu veux raconter ?
2. La corruption par une machine qui avait initialement un usage utile convient-elle au ton du jeu ?
3. Le choix d'alignement au niveau 10 et l'allégeance colorée au niveau 15 arrivent-ils au bon moment ?
4. Le PvP doit-il rester facultatif pour cette campagne ? Ici, oui ; les conflits politiques existent même pour les joueurs PvE.
5. Les quêtes longues doivent-elles culminer en groupe ? Q15, Q31 et Q39 sont pensées pour une expédition ; leur difficulté et leur taille de groupe restent à éprouver.

## 9. Vérifications à faire avant publication en jeu

- Parcours d'un débutant dans chacune des quatre classes, et parcours d'un vétéran déjà artisan/aligné.
- Pas d'objectif sans cible accessible, sans butin configuré, sans fournisseur ou sans recette de la branche choisie.
- Les sept métiers de craft et les quatre de récolte peuvent finir leur initiation sans devoir oublier un métier.
- Les étapes comptées commencent avant la pratique ; le retrait d'un craft est bien nécessaire.
- Refuser une récompense doublée, une livraison sans objets disponibles, un serment hors branche et une reprise qui efface la progression.
- Les choix erronés d'énigme sont récupérables ; aucun objet critique ne peut être perdu définitivement.
- Les routes neutre et trois alignements atteignent toutes Q40 ; Q13 ne devient jamais une obligation cachée de la campagne.
- Les couleurs sont visibles pour tous, sans altérer les traits du personnage ; la classe reste reconnaissable.
- Mesurer temps actif, déplacements, PA et bénéfice net par quête. Ajuster les quantités avant de modifier la régénération globale du jeu.
