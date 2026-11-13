import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

import { LOGIN_API, USER_API } from './config';
import { setAuthToken } from './http';

/**
 * Port de `services/authAPI.js`. Deux différences avec le web, et une seule est un choix :
 *
 * 1. `localStorage` → `expo-secure-store` (trousseau iOS / Keystore Android). Un JWT de
 *    jeu n'est pas un secret bancaire, mais il tient une session : le stockage chiffré
 *    coûte la même ligne de code.
 * 2. ⚠️ `jwt-decode` v4 et non v3 : la v3 s'appuie sur `atob`, absent du moteur Hermes.
 */

const CLE_TOKEN = 'authToken';

type TokenPayload = {
  exp: number;
  roles: string[];
  pseudo?: string;
  email?: string;
  id?: number;
};

function decode(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

function estValide(token: string | null): boolean {
  if (!token) return false;
  const data = decode(token);
  return !!data && data.exp * 1000 > Date.now();
}

/** Rejoue au démarrage le token stocké. Renvoie le token s'il est encore valide. */
export async function setup(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(CLE_TOKEN);
  if (estValide(token)) {
    setAuthToken(token);
    return token;
  }
  if (token) await SecureStore.deleteItemAsync(CLE_TOKEN);
  setAuthToken(null);
  return null;
}

export async function authenticate(credentials: {
  username: string;
  password: string;
}): Promise<string> {
  // Appel hors instance `http` : pas d'en-tête d'autorisation à envoyer, et surtout pas
  // l'ancien token expiré que l'instance pourrait encore porter.
  const { data } = await axios.post<{ token?: string }>(LOGIN_API, credentials, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  if (!data.token) throw new Error('Réponse de connexion sans token.');
  await SecureStore.setItemAsync(CLE_TOKEN, data.token);
  setAuthToken(data.token);
  return data.token;
}

/**
 * Inscription. Le personnage lui-même est créé côté serveur par
 * `PostRegisterSubscriber` (classe par défaut, équipement de départ, position de spawn :
 * tout vient de `src/Config/GameContent.php`) — il n'y a donc PAS de choix de classe à
 * l'inscription, et il ne faut pas en inventer un ici.
 */
export async function register(user: {
  pseudo: string;
  sexe: 'feminin' | 'masculin';
  email: string;
  password: string;
  passwordConfirm: string;
}): Promise<void> {
  await axios.post(USER_API, user, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });
}

/** Erreurs de validation API Platform : `{violations: [{propertyPath, message}]}`. */
export function violationsDe(error: unknown): Record<string, string> {
  const violations = (
    error as { response?: { data?: { violations?: { propertyPath: string; message: string }[] } } }
  )?.response?.data?.violations;
  const parChamp: Record<string, string> = {};
  (violations ?? []).forEach((v) => {
    parChamp[v.propertyPath] = v.message;
  });
  return parChamp;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(CLE_TOKEN);
  setAuthToken(null);
}

export async function getToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(CLE_TOKEN);
  return estValide(token) ? token : null;
}

export function getUserInfo(token: string | null) {
  const data = token ? decode(token) : null;
  return data ? { pseudo: data.pseudo, email: data.email, id: data.id } : {};
}

export function getRoles(token: string | null): string[] {
  return (token ? decode(token)?.roles : null) ?? ['ROLE_USER'];
}
