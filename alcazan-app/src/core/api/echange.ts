import http from '../http';
import type { TypeItem } from './boutique';

/**
 * Port de `services/EchangeApi.js` — mêmes noms, mêmes payloads.
 *
 * Toutes les mutations portent `expectedVersion` : le serveur répond 409 avec l'état frais
 * si l'autre joueur a agi entre-temps, et l'appelant remplace alors son état (voir
 * `useEchange`). Le client ne décide jamais rien : quantités, or et confirmations sont
 * revalidés côté serveur (`EchangeService`, unique machine à états).
 */

export type StatutEchange = 'en_attente' | 'ouvert' | 'complete' | 'annule' | 'expire';

export type LigneEchange = {
  ligneId: number;
  type: TypeItem;
  itemId: number;
  nom: string;
  /** Chemin COMPLET (`/img/objet/…`) : seul endpoint du jeu où le back le compose. */
  icone: string | null;
  quantite: number;
};

export type OffreEchange = {
  joueur: { id: number; pseudo: string };
  or: number;
  confirme: boolean;
  lignes: LigneEchange[];
};

export type Echange = {
  id: number;
  version: number;
  statut: StatutEchange;
  /** Date ISO : l'échéance appartient au serveur, on ne fait que l'afficher. */
  expiresAt: string;
  annulePar: number | null;
  joueurUn: OffreEchange;
  joueurDeux: OffreEchange;
};

export type ReponseEchange = { echange: Echange };
export type EtatCourant = { session: Echange | null; invitations: Echange[] };

export const STATUTS_TERMINAUX: StatutEchange[] = ['complete', 'annule', 'expire'];

export const current = () => http.post<EtatCourant>('echange/current', {}).then((r) => r.data);

export const create = (cibleId: number) =>
  http.post<ReponseEchange>('echange/create', { cibleId }).then((r) => r.data);

export const accept = (echangeId: number) =>
  http.post<ReponseEchange>('echange/accept', { echangeId }).then((r) => r.data);

export const decline = (echangeId: number) =>
  http.post<ReponseEchange>('echange/decline', { echangeId }).then((r) => r.data);

export const addItem = (type: TypeItem, itemId: number, quantite: number, expectedVersion: number) =>
  http
    .post<ReponseEchange>('echange/item/add', { type, itemId, quantite, expectedVersion })
    .then((r) => r.data);

export const removeItem = (ligneId: number, expectedVersion: number) =>
  http.post<ReponseEchange>('echange/item/remove', { ligneId, expectedVersion }).then((r) => r.data);

export const updateOr = (montant: number, expectedVersion: number) =>
  http.post<ReponseEchange>('echange/or', { montant, expectedVersion }).then((r) => r.data);

export const confirm = (expectedVersion: number) =>
  http.post<ReponseEchange>('echange/confirm', { expectedVersion }).then((r) => r.data);

export const cancel = () => http.post<ReponseEchange>('echange/cancel', {}).then((r) => r.data);

/** JWT d'abonnement Mercure du joueur courant (topics `user/{id}` + échange actif). */
export const mercureToken = () =>
  http
    .post<{ token: string; mercureUrl: string; topics: string[]; expiresAt: number }>(
      'mercure/token',
      {},
    )
    .then((r) => r.data);
