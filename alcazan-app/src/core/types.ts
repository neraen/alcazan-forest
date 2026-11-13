/**
 * Formes renvoyées par le back, telles qu'elles arrivent. Elles ne sont PAS un contrat
 * négocié : ce sont des constats, relevés sur les réponses réelles de l'API. Tout champ
 * ajouté côté serveur apparaîtra ici en premier.
 */

export type Sexe = 'feminin' | 'masculin';

/** `POST /api/joueur/data/minimal` — chemin CHAUD, rappelé à chaque déplacement. */
export type JoueurMinimal = {
  userId: number;
  pseudo: string;
  sexe: Sexe;
  niveau: number;
  nomClasse: string;
  classId: number;
  currentLife: number;
  maxLife: number;
  currentMana: number;
  maxMana: number;
  actionPoint: number;
  mouvementPoint: number;
  money: number;
  mapId: number;
  caseAbscisse: number;
  caseOrdonnee: number;
  experienceActuelle: number;
  experienceMax: number;
  tutorialActive: boolean;
  karma?: { valeur: number; palier: string; min: number; max: number };
  nomAlignement?: string | null;
  iconeAlignement?: string | null;
  idAlignement?: number | null;
  nomGuilde?: string | null;
};

/** Une case de la grille, telle que `POST /api/map/cases/data` la renvoie. */
export type CaseCarte = {
  carteId: number;
  carteCarreauId: number;
  abscisse: number;
  ordonnee: number;
  isUsable: boolean;
  isWrap: boolean;
  typeCarreau: string;
  targetMapId: number | null;
  targetWrap: number | null;

  // occupant joueur
  userId: number | null;
  pseudo: string | null;
  sexe: Sexe | null;
  nomClasse: string | null;
  niveau: number | null;
  nomAlignement: string | null;
  iconeAlignement: string | null;
  nomGuilde: string | null;
  enLigne: number | string;

  // contenu
  hasMonstre: number | null;
  renfortId?: number | null;
  pnjId: number | null;
  pnjName: string | null;
  pnjSkin: string | null;
  pnjAvatar: string | null;
  pnjDescription: string | null;
  bossId: number | null;
  bossName: string | null;
  bossSkin: string | null;
  actionId: number | null;
  actionName: string | null;
  interactionId: number | null;
  interactionNom: string | null;
  interactionSkin: string | null;
  interactionType: string | null;
};

export type ModeRecolte = {
  value: 'ethique' | 'intensive';
  label: string;
  description: string;
  quantite: number;
  cooldown: number;
  epuisement: number;
  karma: number;
};

/**
 * État d'une case interactive, tel que la carte le descend (`interactions[carreauId]`).
 * Purement INFORMATIF : le serveur revérifie métier, niveau, PA, proximité et
 * rechargement. `disponibleAt` est une date SERVEUR — le compte à rebours s'en recalcule,
 * il ne se décompte jamais localement.
 */
export type EtatInteraction = {
  nom?: string;
  verbe?: string;
  disponible?: boolean;
  disponibleAt?: string | null;
  raison?: string | null;
  coutPa?: number;
  recolteChoix?: boolean;
  gisementEpuise?: boolean;
};

export type DonneesCarte = {
  cases: CaseCarte[];
  mapInfo: { carteId: number; nom: string; isInstance: boolean };
  mapId: number;
  instanceId: number | null;
  portesDonjon: Record<string, unknown>;
  interactions: Record<string, EtatInteraction>;
  modesRecolte: ModeRecolte[];
  abscisseJoueur?: number;
  ordonneeJoueur?: number;
};

/** `POST /api/joueur/case/update_position` */
export type ReponseDeplacement = {
  cases: CaseCarte[];
  mapId: number;
  abscisseJoueur: number;
  ordonneeJoueur: number;
  life: number;
  mana: number;
  pm: number;
};

/** `POST /api/joueur/map/update_position` — un refus n'a QUE `message`. */
export type ReponseChangementCarte = {
  mapId?: number;
  abscisse?: number;
  ordonnee?: number;
  message?: string;
  annonce?: string;
};

export type Sort = {
  id: number;
  nom: string;
  icone: string;
  portee: number;
  cooldown: number;
  type: string;
  ordre?: number;
  description?: string;
  coutPa?: number;
  coutMana?: number;
};

export type Consommable = {
  id: number;
  nom: string;
  icone: string;
  quantity?: number;
  description?: string;
};

export type Buff = {
  id: number;
  nom: string;
  icone: string;
  finAt?: string;
};

/**
 * ⚠️ CONTRAT PARTAGÉ par les trois endpoints d'attaque (+ `donjon/renfort/attaquer`),
 * doc §21.13 bis. Une clé manquante ne dégrade pas l'affichage, elle le CASSE : côté web,
 * un accès direct à `droppedItems[0]` sur une réponse de duel (qui n'a pas de butin)
 * levait un TypeError qui empêchait toute la mise à jour d'état — ciblage mort jusqu'au
 * rechargement. D'où l'optionnalité assumée ci-dessous ET les accès défensifs côté appelant.
 */
export type ResultatAttaque = {
  damage?: number;
  experience?: number;
  newExperience?: number;
  level?: number | null;
  lifeJoueur?: number;
  damageReturns?: number;
  droppedItems?: string[];
  killMessage?: string;
  message?: string;
  pa?: number;
  mapId?: number;
  needRefresh?: boolean;
};

export type TypeCible = 'player' | 'monstre' | 'boss' | 'renfort' | 'none';

/** Union plate : le back renvoie des clés différentes selon le type, le front les lit. */
export type Cible = {
  targetId?: number;
  type?: TypeCible;
  abscisseTarget?: number;
  ordonneeTarget?: number;

  pseudo?: string;
  niveau?: number;
  currentLife?: number;
  maxLife?: number;
  currentMana?: number;
  maxMana?: number;

  nomMonstre?: string;
  imageMonstre?: string;
  quantiteMonstre?: number;
  monstreLife?: number;
  monstreLifeMax?: number;

  bossName?: string;
  bossSkin?: string;
  bossLife?: number;
  bossMaxLife?: number;
};
