import type { Echange } from '../api/echange';
import * as targetApi from '../api/target';
import type { Cible, TypeCible } from '../types';

/**
 * Port de `store/actions.js`. Les constantes gardent leur VALEUR littérale d'origine
 * (« update player target »…) : c'est ce qui permet de transposer un correctif d'un
 * dépôt à l'autre sans le relire. Les actions d'administration (MapMaker) ne sont pas
 * portées — l'app n'a pas d'éditeur.
 */

export const UPDATE_PLAYER_TARGET = 'update player target';
export const REMOVE_PLAYER_TARGET = 'remove player target';
export const REQUEST_TARGET = 'request target';
export const FETCH_TARGET_SUCCESS = 'fetch target success';
export const FETCH_TARGET_ERROR = 'fetch target error';
export const UPDATE_POSITION_JOUEUR = 'update position joueur';
export const UPDATE_JOUEUR_STATE = 'update joueur state';
export const OPEN_PNJ_INTERACTION = 'open pnj interaction';
export const CLOSE_PNJ_INTERACTION = 'close pnj interaction';
export const OPEN_DONJON_PORTE = 'open donjon porte';
export const CLOSE_DONJON_PORTE = 'close donjon porte';
export const UPDATE_DONJON_COMBAT = 'update donjon combat';
export const UPDATE_ECHANGE = 'update echange';
export const CLOSE_ECHANGE = 'close echange';
export const SET_ECHANGE_INVITATIONS = 'set echange invitations';

export type JoueurState = {
  idJoueur: number;
  experience: number;
  newExperience: number;
  maxExperience: number;
  damage: number;
  damageReturns: number;
  droppedItems: string;
  lifeJoueur: number;
  manaJoueur: number;
  pa: number;
  pm: number;
  money: number;
  level: number | null;
  killMessage: string;
  message: string;
  needRefresh: boolean;
  mapId?: number;
  consommableBarVersion: number;
  spellBarVersion: number;
};

export const updatePlayerTarget = (payload: { targetId: number; type: TypeCible }) =>
  ({ type: UPDATE_PLAYER_TARGET, payload }) as const;

export const removePlayerTarget = () => ({ type: REMOVE_PLAYER_TARGET }) as const;

export const requestTarget = () => ({ type: REQUEST_TARGET }) as const;

export const fetchTargetSuccess = (target: Cible) =>
  ({ type: FETCH_TARGET_SUCCESS, target }) as const;

export const fetchTargetError = (error: unknown) =>
  ({ type: FETCH_TARGET_ERROR, error }) as const;

/** Thunk : même séquence requête → succès/erreur que le web. */
export const fetchTargetInfo =
  (targetId: number, type: TypeCible) =>
  async (dispatch: (action: unknown) => void) => {
    dispatch(requestTarget());
    try {
      dispatch(fetchTargetSuccess(await targetApi.getTargetInfos(targetId, type)));
    } catch (error) {
      dispatch(fetchTargetError(error));
    }
  };

export const updatePositionJoueur = (coordonnees: { abscisse: number; ordonnee: number }) =>
  ({ type: UPDATE_POSITION_JOUEUR, coordonnees }) as const;

export const updateJoueurState = (joueurState: Partial<JoueurState>) =>
  ({ type: UPDATE_JOUEUR_STATE, joueurState }) as const;

/* L'interaction PNJ active (une seule à la fois) : l'écran de dialogue est monté UNE
   fois, les tuiles ne font que dispatch — patron `PnjInteractionHost` du web. */
export const openPnjInteraction = (p: { pnjId: number; abscisse: number; ordonnee: number }) =>
  ({ type: OPEN_PNJ_INTERACTION, pnjInteraction: p }) as const;

export const closePnjInteraction = () => ({ type: CLOSE_PNJ_INTERACTION }) as const;

export const openDonjonPorte = (porte: {
  carteCarreauId: number;
  targetMapId: number | null;
  targetWrap: number | null;
}) => ({ type: OPEN_DONJON_PORTE, porte }) as const;

export const closeDonjonPorte = () => ({ type: CLOSE_DONJON_PORTE }) as const;

/* TOUJOURS le payload du serveur : le tick est joué côté back, le client ne simule rien —
   en particulier il ne décompte pas les zones lui-même, il affiche `resoudreAt`. */
export const updateDonjonCombat = (combat: unknown) =>
  ({ type: UPDATE_DONJON_COMBAT, combat }) as const;

/* Échange joueur-à-joueur : `etat` = session active (ou null), `invitations` = reçues en
   attente. L'état est TOUJOURS le payload normalisé du serveur (REST ou Mercure) : jamais
   une modification optimiste côté client. */
export const updateEchange = (etat: Echange) => ({ type: UPDATE_ECHANGE, etat }) as const;

export const closeEchange = () => ({ type: CLOSE_ECHANGE }) as const;

export const setEchangeInvitations = (invitations: Echange[]) =>
  ({ type: SET_ECHANGE_INVITATIONS, invitations }) as const;
