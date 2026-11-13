import * as actions from './actions';
import type { JoueurState } from './actions';
import type { Cible } from '../types';

/**
 * Port de `store/reducers.js`. La FORME de l'état est volontairement identique au web
 * (`state.data.joueurState`, `state.data.target`, …) : un correctif écrit d'un côté se
 * transpose mécaniquement de l'autre. Seule la branche `mapMaker` est absente — l'app
 * n'embarque pas d'éditeur.
 */

export type AppState = {
  data: {
    target: Cible;
    positionJoueur: { abscisse: number; ordonnee: number };
    pnjInteraction: { pnjId: number | null; abscisse: number | null; ordonnee: number | null };
    donjon: { porte: unknown; combat: unknown };
    joueurState: JoueurState;
  };
  loading: boolean;
  error: unknown;
};

const etatInitial: AppState = {
  data: {
    target: { targetId: 0, type: 'none' },
    positionJoueur: { abscisse: 0, ordonnee: 0 },
    pnjInteraction: { pnjId: null, abscisse: null, ordonnee: null },
    donjon: { porte: null, combat: null },
    joueurState: {
      idJoueur: 0,
      experience: 0,
      newExperience: 0,
      maxExperience: 0,
      damage: 0,
      damageReturns: 0,
      droppedItems: '',
      lifeJoueur: 0,
      manaJoueur: 0,
      pa: 0,
      pm: 0,
      money: 0,
      level: 0,
      killMessage: '',
      message: '',
      needRefresh: false,
      consommableBarVersion: 0,
      spellBarVersion: 0,
    },
  },
  loading: false,
  error: null,
};

type AnyAction = { type: string; [k: string]: any };

export function playerStatsReducer(state: AppState = etatInitial, action: AnyAction): AppState {
  switch (action.type) {
    case actions.REQUEST_TARGET:
      return { ...state, loading: true };

    case actions.UPDATE_PLAYER_TARGET:
      return {
        ...state,
        data: { ...state.data, target: { ...state.data.target, ...action.payload } },
        loading: false,
        error: null,
      };

    case actions.FETCH_TARGET_SUCCESS:
      if (action.target) {
        return {
          ...state,
          data: { ...state.data, target: { ...state.data.target, ...action.target } },
          loading: false,
          error: null,
        };
      }
      return { ...state, loading: false };

    case actions.FETCH_TARGET_ERROR:
      return { ...state, loading: false, error: action.error };

    case actions.REMOVE_PLAYER_TARGET:
      return { ...state, data: { ...state.data, target: {} } };

    case actions.UPDATE_POSITION_JOUEUR:
      return { ...state, data: { ...state.data, positionJoueur: action.coordonnees } };

    case actions.UPDATE_JOUEUR_STATE:
      return {
        ...state,
        data: {
          ...state.data,
          joueurState: { ...state.data.joueurState, ...action.joueurState },
        },
      };

    case actions.OPEN_PNJ_INTERACTION:
      return { ...state, data: { ...state.data, pnjInteraction: action.pnjInteraction } };

    case actions.CLOSE_PNJ_INTERACTION:
      return {
        ...state,
        data: {
          ...state.data,
          pnjInteraction: { pnjId: null, abscisse: null, ordonnee: null },
        },
      };

    case actions.OPEN_DONJON_PORTE:
      return {
        ...state,
        data: { ...state.data, donjon: { ...state.data.donjon, porte: action.porte } },
      };

    case actions.CLOSE_DONJON_PORTE:
      return {
        ...state,
        data: { ...state.data, donjon: { ...state.data.donjon, porte: null } },
      };

    case actions.UPDATE_DONJON_COMBAT:
      return {
        ...state,
        data: { ...state.data, donjon: { ...state.data.donjon, combat: action.combat } },
      };

    default:
      return state;
  }
}
