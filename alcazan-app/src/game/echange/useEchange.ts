import { useCallback, useRef, useState } from 'react';

import * as echangeApi from '@/src/core/api/echange';
import type { ReponseEchange } from '@/src/core/api/echange';
import * as usersApi from '@/src/core/api/users';
import { messageErreur } from '@/src/core/http';
import store, { useAppDispatch } from '@/src/core/store';
import {
  closeEchange,
  setEchangeInvitations,
  updateEchange,
  updateJoueurState,
} from '@/src/core/store/actions';
import { useToast } from '@/src/ui/toast/ToastProvider';

/**
 * Les deux gestes communs à tout ce qui touche l'échange (l'hôte, le bandeau de la carte,
 * l'écran) — extraits d'`EchangeHost.jsx`, qui les tenait seul parce que sur le web la
 * bannière et la modale sont rendues par le même composant. Ici ce sont trois endroits
 * (une route modale est un écran à part), d'où le hook.
 */
export function useEchange() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const verrou = useRef(false);
  const [enCours, setEnCours] = useState(false);

  /** L'état complet relu par REST : reprise au lancement, après une coupure, en repli. */
  const resynchroniser = useCallback(
    () =>
      echangeApi
        .current()
        .then((donnees) => {
          dispatch(setEchangeInvitations(donnees.invitations ?? []));
          if (donnees.session) {
            dispatch(updateEchange(donnees.session));
            return;
          }
          // Une session OUVERTE a disparu sans qu'on ait vu son dénouement (événement
          // manqué, app en arrière-plan) : on ne sait pas si elle a abouti, donc on
          // relit le sac et l'or plutôt que d'annoncer un résultat qu'on ignore.
          const connue = store.getState().data.echange.etat;
          if (connue?.statut === 'ouvert') {
            toast.info("L'échange est terminé.");
            dispatch(updateJoueurState({ needRefresh: true }));
            usersApi
              .find()
              .then((user) => dispatch(updateJoueurState({ money: user.money })))
              .catch(() => {});
          }
          dispatch(closeEchange());
        })
        .catch(() => {}),
    [dispatch, toast],
  );

  /** Toute action : une requête à la fois, 409 = état frais adopté, erreur = resync. */
  const executer = useCallback(
    async (appel: () => Promise<ReponseEchange | null | void>) => {
      if (verrou.current) return;
      verrou.current = true;
      setEnCours(true);
      try {
        const reponse = await appel();
        if (reponse?.echange) dispatch(updateEchange(reponse.echange));
      } catch (erreur) {
        const reponse = (erreur as { response?: { status?: number; data?: any } })?.response;
        if (reponse?.status === 409 && reponse.data?.echange) {
          dispatch(updateEchange(reponse.data.echange));
          toast.info(reponse.data.error || "L'échange a été modifié entre-temps.");
        } else {
          toast.error(messageErreur(erreur, "L'action n'a pas abouti."));
          await resynchroniser();
        }
      } finally {
        verrou.current = false;
        setEnCours(false);
      }
    },
    [dispatch, toast, resynchroniser],
  );

  return { executer, enCours, resynchroniser };
}
