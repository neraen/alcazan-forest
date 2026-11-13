import axios from 'axios';

import { API_URL } from './config';

/**
 * Client HTTP unique de l'app — équivalent du `axios.defaults` global du web, mais sur une
 * instance dédiée : en RN, l'instance globale d'axios est partagée avec les bibliothèques
 * tierces, et poser un `Authorization` dessus l'enverrait à n'importe quel hôte.
 *
 * `baseURL` porte déjà le `/api/` final, donc tous les appels s'écrivent en chemin relatif
 * (`http.post('joueur/data/minimal')`), exactement comme `API_URL + "..."` côté web.
 */
const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}

/**
 * Le back n'a PAS de refresh token et le JWT expire au bout d'une heure : il n'y a rien à
 * renouveler, seulement à constater. Un 401 déclenche donc le rappel posé ici (la garde
 * d'auth renvoie vers l'écran de connexion) plutôt qu'une cascade d'erreurs muettes dans
 * chaque écran.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/**
 * Message d'erreur destiné au joueur. Le back répond ses refus en 400 avec `{message}`
 * (garde-fous de duel, de passage…) ou `{error}` (échange, donjon, hôtel des ventes) :
 * les deux formes existent, il faut lire les deux.
 */
export function messageErreur(error: unknown, defaut: string): string {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  return data?.message || data?.error || defaut;
}

export default http;
