import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

/**
 * Réglages de CONFORT de l'app, propres à l'appareil — pas au compte : ils survivent à
 * une déconnexion et ne montent jamais au serveur. N'a pas d'équivalent web (le web n'a
 * rien à régler : il a un clavier).
 *
 * Volontairement HORS du store Redux, dont la forme est celle du web au champ près
 * (`docs/MOBILE_PLAN.md` §2) : y ajouter une clé mobile casserait la règle qui permet de
 * transposer un correctif d'un dépôt à l'autre sans relecture.
 *
 * Stocké dans `expo-secure-store` faute d'AsyncStorage dans les dépendances : ce n'est
 * pas un secret, mais c'est le seul stockage persistant déjà embarqué, et un booléen ne
 * justifie pas un module natif de plus.
 */
export type Preferences = {
  /** Croix directionnelle affichée sur la carte. */
  croixDirectionnelle: boolean;
};

const DEFAUTS: Preferences = { croixDirectionnelle: true };
const CLE = 'preferences';

let courantes: Preferences = DEFAUTS;
const abonnes = new Set<() => void>();

const publier = () => abonnes.forEach((abonne) => abonne());

const sAbonner = (abonne: () => void) => {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
};

// Lecture unique au chargement du module. Une clé absente ou illisible retombe sur les
// défauts : un réglage de confort ne doit jamais empêcher l'app de démarrer.
SecureStore.getItemAsync(CLE)
  .then((brut) => {
    if (!brut) return;
    courantes = { ...DEFAUTS, ...JSON.parse(brut) };
    publier();
  })
  .catch(() => {});

export function definirPreference<C extends keyof Preferences>(cle: C, valeur: Preferences[C]) {
  courantes = { ...courantes, [cle]: valeur };
  publier();
  SecureStore.setItemAsync(CLE, JSON.stringify(courantes)).catch(() => {});
}

/** Valeur vivante d'un réglage : tout écran qui la lit suit le changement aussitôt. */
export function usePreference<C extends keyof Preferences>(cle: C): Preferences[C] {
  return useSyncExternalStore(sAbonner, () => courantes[cle]);
}
