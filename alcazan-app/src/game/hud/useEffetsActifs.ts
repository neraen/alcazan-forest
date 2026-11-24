import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import * as usersApi from '@/src/core/api/users';
import { useAppSelector } from '@/src/core/store';
import type { Buff } from '@/src/core/types';

/** Intervalle de resynchronisation avec le serveur (le décompte, lui, est local). */
const SONDAGE_MS = 5000;

export type EffetEnCours = Buff & {
  /** Échéance sur l'horloge du TÉLÉPHONE, recalée à chaque réponse du serveur. */
  finLocale: number;
  /** Secondes restantes, arrondies au-dessus (jamais 0 : un effet à 0 est retiré). */
  restant: number;
};

/**
 * Effets actifs du joueur (bienfaits ET affaiblissements) — port de
 * `components/spells/buff/useEffetsActifs.js`, partagé par la grille de la barre d'action
 * et le Profil : une seule règle de calcul, sinon les deux finiraient par annoncer des
 * durées différentes.
 *
 * Le serveur fait foi : à chaque réponse, la fin de chaque effet est RECALÉE sur
 * `secondesRestantes` (et non sur `finAt` comparé à l'horloge du téléphone, qui peut
 * dériver de celle du serveur). Entre deux réponses, un tic d'une seconde fait défiler le
 * compte à rebours et retire un effet arrivé à terme sans attendre le prochain sondage.
 *
 * Deux ajouts propres au mobile : iOS SUSPEND les minuteurs en arrière-plan, donc le
 * sondage s'arrête quand l'app n'est pas active (aucune requête pour rien) et une
 * relecture part IMMÉDIATEMENT au retour au premier plan — sans elle, la grille afficherait
 * jusqu'à 5 s un état d'avant la mise en veille.
 *
 * Rafraîchi aussi à chaque `joueurState.buffVersion` (potion bue, sort lancé sur soi).
 */
export function useEffetsActifs() {
  const buffVersion = useAppSelector((s) => s.data.joueurState.buffVersion);
  const [effets, setEffets] = useState<(Buff & { finLocale: number })[]>([]);
  const [charge, setCharge] = useState(false);
  const [maintenant, setMaintenant] = useState(Date.now());

  useEffect(() => {
    let actif = true;
    let sondage: ReturnType<typeof setInterval> | null = null;

    const charger = async () => {
      try {
        const valeurs = await usersApi.getActiveBuff();
        if (!actif) return;
        const recu = Date.now();
        setEffets(
          (valeurs ?? []).map((effet) => ({
            ...effet,
            finLocale: recu + Math.max(0, effet.secondesRestantes ?? 0) * 1000,
          })),
        );
        setMaintenant(recu);
        setCharge(true);
      } catch {
        // On garde le dernier état : un sondage manqué ne doit rien effacer.
      }
    };

    const demarrer = () => {
      if (sondage) return;
      charger();
      sondage = setInterval(charger, SONDAGE_MS);
    };
    const arreter = () => {
      if (sondage) clearInterval(sondage);
      sondage = null;
    };

    if (AppState.currentState === 'active' || AppState.currentState == null) demarrer();
    const abonnement = AppState.addEventListener('change', (etatApp) => {
      if (etatApp === 'active') demarrer();
      else arreter();
    });

    return () => {
      actif = false;
      arreter();
      abonnement.remove();
    };
  }, [buffVersion]);

  // Le tic ne tourne que s'il y a quelque chose à décompter : une carte sans effet ne doit
  // pas se redessiner chaque seconde pour rien.
  const aDecompter = effets.length > 0;
  useEffect(() => {
    if (!aDecompter) return undefined;
    setMaintenant(Date.now());
    const tic = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(tic);
  }, [aDecompter]);

  return useMemo(() => {
    const enCours: EffetEnCours[] = effets
      .map((effet) => ({ ...effet, restant: Math.ceil((effet.finLocale - maintenant) / 1000) }))
      .filter((effet) => effet.restant > 0);
    return {
      effets: enCours,
      bienfaits: enCours.filter((effet) => !effet.nefaste),
      affaiblissements: enCours.filter((effet) => effet.nefaste),
      charge,
    };
  }, [effets, maintenant, charge]);
}
