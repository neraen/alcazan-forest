import http from '../http';
import type { DonneesCarte } from '../types';

/**
 * Port de `services/MapApi.js`. SANS `mapId`, le serveur répond la carte où se trouve
 * réellement le joueur : c'est la forme à utiliser pour (re)charger le jeu, le client
 * ne pouvant pas savoir qu'il a été téléporté (auberge, mort, éjection de donjon).
 */
export const find = (mapId?: number) =>
  http
    .post<DonneesCarte>('map/cases/data', mapId === undefined ? {} : { mapId })
    .then((r) => r.data);
