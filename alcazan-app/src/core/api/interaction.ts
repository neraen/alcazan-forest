import http from '../http';

/**
 * Port de `services/InteractionApi.js`. Le client n'envoie QUE l'id de la case : le
 * serveur revérifie proximité, conditions (métier, niveau, quête), PA et rechargement.
 *
 * `mode` n'est envoyé que sur les cases qui proposent le choix (`recolte_choix`) ;
 * ailleurs le serveur le REFUSE. Une case à choix sollicitée sans mode est traitée en
 * récolte mesurée (défaut prudent, décidé côté serveur).
 */
export const executer = (carteCarreauId: number, mode: 'ethique' | 'intensive' | null = null) =>
  http
    .post('interaction/executer', mode ? { carteCarreauId, mode } : { carteCarreauId })
    .then((r) => r.data);
