import http from '../http';

/**
 * Port de `services/ClassementApi.js`.
 *
 * Les catégories voyagent AVEC la liste : l'écran a besoin des deux au premier rendu.
 * Aucun libellé n'est en dur côté client — ajouter un classement reste une modification
 * back seulement.
 */
export type CategorieClassement = {
  valeur: string;
  label: string;
  intitule: string;
  format: 'entier' | 'or' | string;
  cible: 'joueur' | 'guilde' | string;
};

export type LigneClassement = {
  userId: number;
  pseudo: string;
  niveau?: number | null;
  classe?: string | null;
  membres?: number | null;
  valeur: number;
  /** Calculé par le SERVEUR : les ex æquo le partagent, `index + 1` ne saurait pas. */
  rang: number;
};

export type RangPersonnel = {
  categorie: string;
  label: string;
  format: string;
  rang: number | null;
  valeur: number | null;
};

const post = <T>(chemin: string, payload: object = {}) =>
  http.post<T>('classement/' + chemin, payload).then((r) => r.data);

/** `categorie` omise → le serveur renvoie la première. */
export const liste = (categorie?: string) =>
  post<{
    categories: CategorieClassement[];
    categorie: string;
    classement: LigneClassement[];
    taille: number;
  }>('liste', categorie ? { categorie } : {});

/** Le rang du joueur dans TOUTES les catégories ; `rang` null pour un compte exclu. */
export const moi = () => post<{ rangs: RangPersonnel[]; horsClassement: boolean }>('moi');
