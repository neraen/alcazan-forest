import http from '../http';

/**
 * Port de `services/HistoriqueApi.js`. Les entrées sont des ÉVÉNEMENTS TYPÉS
 * (`evenement_jeu`) ; les catégories viennent du serveur, « Archives » comprise (les
 * anciennes lignes libres, conservées telles quelles — `typeLabel` y est absent).
 */
export type LigneJournal = {
  id: string;
  /** « 2026-11-14 10:55:00 », heure du serveur, sans fuseau. */
  date: string;
  phrase: string;
  categorie: string;
  categorieLabel: string;
  type?: string | null;
  typeLabel?: string | null;
  subi: boolean;
};

export const fetchHistoryData = () =>
  http
    .post<{ rows: LigneJournal[]; categories: { valeur: string; label: string }[] }>(
      'historique/infos',
      {},
    )
    .then((r) => r.data);
