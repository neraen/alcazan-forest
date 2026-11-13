import http from '../http';
import type { Cible, TypeCible } from '../types';

/**
 * Port de `services/GameApi.js`. `/api/target/renfort` renvoie EXACTEMENT les clés de
 * `/api/target/monstre` : la carte de cible est mutualisée, il n'y a rien à normaliser.
 */
export const getTargetInfos = (targetId: number, type: TypeCible) =>
  http.post<Cible>(`target/${type}`, { targetId }).then((r) => r.data);
