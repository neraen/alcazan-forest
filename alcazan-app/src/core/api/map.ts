import http from '../http';
import type { DonneesCarte } from '../types';

/** Port de `services/MapApi.js`. */
export const find = (mapId: number) =>
  http.post<DonneesCarte>('map/cases/data', { mapId }).then((r) => r.data);
