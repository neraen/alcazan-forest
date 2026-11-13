import { applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { useDispatch, useSelector } from 'react-redux';

import { playerStatsReducer, type AppState } from './reducers';

/**
 * Store unique, port de `store/index.js`. Pas de `redux-logger` ni de devtools-extension :
 * le premier noie la console Metro à chaque déplacement, la seconde n'existe pas ici.
 *
 * `legacy_createStore` plutôt que `configureStore` : le réducteur est repris TEL QUEL du
 * web (il mute zéro état mais n'utilise pas Immer), et les contrôles stricts de RTK
 * n'apporteraient rien qu'un avertissement de plus.
 */
const store = createStore(playerStatsReducer, applyMiddleware(thunk));

export type AppDispatch = typeof store.dispatch;

/** Hooks typés : `useAppSelector(s => s.data.joueurState)` sans annotation à chaque appel. */
export const useAppSelector = useSelector.withTypes<AppState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export default store;
