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
