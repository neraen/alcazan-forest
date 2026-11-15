import http from '../http';

/**
 * Port de `services/questApi.js`. Réponses structurées :
 * `{status: "step"|"blocked"|"done"|"locked", quest, step, blockedMessages,
 *   feedback: {rewards, messages}, needRefresh}` — AUCUN HTML, les dialogues sont des
 * paragraphes texte.
 */

/** Ouverture d'un PNJ : lecture pure, la réponse est discriminée par `view`. */
export const getInteraction = (pnjId: number) =>
  http.post('pnj/interaction', { pnjId }).then((r) => r.data);

export const startQuest = (pnjId: number) =>
  http.post('quest/start', { pnjId }).then((r) => r.data);

/** L'UNIQUE endpoint d'action de quête, tous types confondus. */
export const postAction = (sequenceId: number, actionId: number) =>
  http.post('quest/action', { sequenceId, actionId }).then((r) => r.data);

/** Action posée sur une case de la carte (effet scripté). */
export const postMapAction = (actionId: number) =>
  http.post('map/action', { actionId }).then((r) => r.data);

/* ------------------------------------------------------------------ */
/* Journal de quêtes — port de `services/questApi.getJournal`.          */
/* ------------------------------------------------------------------ */

export type LieuQuete = {
  carteId: number;
  carte: string;
  /** Case du PNJ ; null pour un objectif « se rendre à une carte ». */
  x: number | null;
  y: number | null;
  /** Le joueur se tient déjà sur cette carte. */
  ici: boolean;
};

export type PnjQuete = {
  id: number;
  nom: string;
  /** Nom de fichier BRUT (`img/pnj/<avatar>`), avec extension. */
  avatar: string | null;
  /** null = posé sur aucune carte : on le dit, on n'invente pas de lieu. */
  lieu: LieuQuete | null;
};

export type RecompenseQuete = {
  type: 'or' | 'experience' | 'objet' | 'equipement' | 'consommable';
  id: number | null;
  label: string;
  quantity: number;
  image: string | null;
  position: string | null;
};

export type ObjectifQuete = {
  actionId: number;
  type: string;
  libelle: string;
  /** Libellé du bouton à choisir dans le dialogue du PNJ. */
  bouton: string;
  /** null = le serveur ne sait pas l'affirmer (type réservé). */
  fait: boolean | null;
  progress: { current: number; target: number; unit: string } | null;
  item: { type: string; image: string | null; position: string | null } | null;
  lieu: LieuQuete | null;
  recompenses: RecompenseQuete[];
};

export type EtapeQuete = {
  sequenceId: number;
  numero: number;
  titre: string;
  paroles: string[];
  pnj: PnjQuete | null;
  objectifs: ObjectifQuete[];
  /** Plusieurs objectifs = des ALTERNATIVES : un seul suffit. */
  objectifsAuChoix: boolean;
  /** Il ne reste qu'à aller parler au PNJ. */
  pret: boolean;
  decision: boolean;
  recompenses: RecompenseQuete[];
  recompensesVariables: boolean;
};

export type FicheQuete = {
  id: number;
  nom: string;
  statut: 'enCours' | 'disponible' | 'terminee';
  introduction: string[];
  niveauMin: number | null;
  donneur: PnjQuete | null;
  etape?: EtapeQuete | null;
  /** ISO 8601 ; null pour une quête finie avant le journal d'événements. */
  termineeLe?: string | null;
};

export type JournalQuetes = {
  enCours: FicheQuete[];
  disponibles: FicheQuete[];
  terminees: FicheQuete[];
};

/** Lecture pure : le serveur fait foi sur l'étape, la progression et les récompenses. */
export const getJournal = () =>
  http.post<JournalQuetes>('quest/journal', {}).then((r) => r.data);
