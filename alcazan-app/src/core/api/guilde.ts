import http from '../http';

/**
 * Port de `services/GuildeApi.js`.
 *
 * Chaque transition renvoie l'ÉTAT FRAIS et complet : l'écran le pose tel quel, sans
 * recharger derrière une action ni deviner le nouvel état (patron de l'échange). Les
 * permissions (`peutGerer`, `peutPromouvoir`, `peutDissoudre`) et les libellés de grade
 * descendent du serveur : le client masque ce qui n'est pas permis, il ne rejoue pas la
 * règle des grades.
 */
export type Guilde = {
  id: number;
  nom: string;
  description?: string | null;
  niveau: number;
  placeMax: number;
  membres: number;
  complete: boolean;
  alignement?: string | null;
};

export type MembreGuilde = {
  userId: number;
  pseudo: string;
  classe?: string | null;
  niveau?: number | null;
  grade: string;
  gradeLabel: string;
  statut: string;
};

export type EtatGuilde = {
  appartenance: {
    statut: string;
    statutLabel: string;
    grade: string;
    gradeLabel: string;
    peutGerer: boolean;
    peutPromouvoir: boolean;
    peutDissoudre: boolean;
  } | null;
  guilde: Guilde | null;
  membres: MembreGuilde[];
  candidatures: MembreGuilde[];
  config: {
    coutCreation?: number;
    nomMin?: number;
    nomMax?: number;
    descriptionMax?: number;
    niveauMinCreation?: number;
  };
  grades: { valeur: string; label: string; attribuable: boolean }[];
};

export type Annuaire = { guildes: Guilde[]; message: string | null };

const post = <T>(chemin: string, payload: object = {}) =>
  http.post<T>('guilde/' + chemin, payload).then((r) => r.data);

export const etat = () => post<EtatGuilde>('etat');
/** Les guildes du même alignement — les seules rejoignables. */
export const annuaire = () => post<Annuaire>('annuaire');

export const creer = (nom: string, description: string | null) =>
  post<EtatGuilde>('creer', { nom, description });
export const candidater = (guildeId: number) => post<EtatGuilde>('candidater', { guildeId });
export const accepter = (userId: number) => post<EtatGuilde>('accepter', { userId });
export const refuser = (userId: number) => post<EtatGuilde>('refuser', { userId });
export const promouvoir = (userId: number, grade: string) =>
  post<EtatGuilde>('promouvoir', { userId, grade });
export const transmettre = (userId: number) => post<EtatGuilde>('transmettre', { userId });
export const exclure = (userId: number) => post<EtatGuilde>('exclure', { userId });
export const quitter = () => post<EtatGuilde>('quitter');
export const dissoudre = () => post<EtatGuilde>('dissoudre');
