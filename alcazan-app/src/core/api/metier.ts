import http from '../http';

/**
 * Port de `services/MetierApi.js` — progression des métiers APPRIS.
 *
 * `apprendre` et `oublier` existent côté serveur mais passent par un maître de métier
 * (PNJ) : cet écran ne fait que lire.
 */
export type RessourceMetier = {
  id: number;
  nom: string;
  description?: string | null;
  type: 'objet';
  image?: string | null;
  niveauRequis: number;
  /** Niveau du joueur ≥ niveau de la ressource. N'autorise rien : la case arbitre. */
  accessible: boolean;
};

export type Metier = {
  metierId: number;
  nom: string;
  description?: string | null;
  /** SANS extension en base (`CollectionImage::METIER`). */
  icone?: string | null;
  famille: 'recolte' | 'craft';
  familleLabel: string;
  niveau: number;
  niveauMax: number;
  experience: number;
  experienceNiveauCourant: number;
  experienceProchainNiveau: number;
  ressources?: RessourceMetier[];
};

export type Progression = {
  metiers: Metier[];
  placesRestantes: Record<string, number>;
  plafonds: Record<string, number>;
  famillesLabels: Record<string, string>;
};

export const progression = () =>
  http.post<Progression>('metier/progression', {}).then((r) => r.data);
