import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { STATUTS_TERMINAUX } from '@/src/core/api/echange';
import * as usersApi from '@/src/core/api/users';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import {
  closeEchange,
  setEchangeInvitations,
  updateEchange,
  updateJoueurState,
} from '@/src/core/store/actions';
import useMercure from '@/src/core/useMercure';
import { useToast } from '@/src/ui/toast/ToastProvider';

import { useEchange } from './useEchange';

/**
 * Sondage de repli : serré pendant une session, lâche sinon — et un filet très lâche même
 * quand le flux est ouvert. Un flux OUVERT ne prouve pas que les publications arrivent
 * (publication échouée côté serveur, proxy qui retient les octets) : sans ce filet, une
 * invitation ratée n'apparaissait jamais.
 */
const SONDAGE_SESSION_MS = 4000;
const SONDAGE_VEILLE_MS = 20000;
const SONDAGE_CONNECTE_MS = 30000;

/**
 * L'unique hôte du système d'échange — port d'`echange/EchangeHost.jsx`, SANS son rendu.
 *
 * Il est monté UNE fois, dans le layout du jeu et non dans l'écran de carte : une
 * invitation peut arriver pendant qu'on est dans l'inventaire, et une route modale
 * recouvre la carte sans la démonter. Il tient la resynchronisation REST, l'abonnement
 * Mercure (topic personnel + topic de la session active), le dénouement d'une session et
 * l'ouverture de l'écran d'échange. Ce qui se VOIT est ailleurs : `EchangeBandeau` sur la
 * carte, `app/(jeu)/echange` pour la session ouverte.
 *
 * Deux ajouts propres au mobile :
 *  - un SONDAGE DE REPLI, serré tant que le hub n'est pas joint (réseau mobile, proxy qui
 *    coupe les flux longs), lâche sinon (le web fait désormais de même) ;
 *  - une resynchronisation au RETOUR AU PREMIER PLAN : iOS suspend le flux d'une app en
 *    arrière-plan, et une session d'échange n'y survit que cinq minutes.
 */
export default function EchangeHost() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const monId = useAppSelector((s) => s.data.joueurState.idJoueur);
  const etat = useAppSelector((s) => s.data.echange.etat);
  const invitations = useAppSelector((s) => s.data.echange.invitations);
  const { resynchroniser } = useEchange();

  const invitationsRef = useRef(invitations);
  invitationsRef.current = invitations;

  // Reprise au lancement (session en cours, invitations manquées).
  useEffect(() => {
    if (monId) resynchroniser();
  }, [monId, resynchroniser]);

  const sessionVivante = !!etat && !STATUTS_TERMINAUX.includes(etat.statut);

  // Topics : le mien toujours, celui de la session tant qu'elle vit. Changer la liste
  // redemande un jeton (le topic de session doit être couvert par le JWT d'abonnement).
  const topics: string[] = [];
  if (monId) topics.push(`user/${monId}`);
  if (etat && sessionVivante) topics.push(`echange/${etat.id}`);

  const connecte = useMercure(
    topics,
    (payload) => {
      if (!payload?.echange) return;
      if (payload.type === 'echange.invitation') {
        if (payload.echange.joueurDeux.joueur.id === monId) {
          const autres = invitationsRef.current.filter((i) => i.id !== payload.echange.id);
          dispatch(setEchangeInvitations([...autres, payload.echange]));
          toast.info(`${payload.echange.joueurUn.joueur.pseudo} vous propose un échange.`);
        }
        return;
      }
      dispatch(updateEchange(payload.echange));
      if (STATUTS_TERMINAUX.includes(payload.echange.statut)) {
        dispatch(
          setEchangeInvitations(invitationsRef.current.filter((i) => i.id !== payload.echange.id)),
        );
      }
    },
    resynchroniser,
  );

  useEffect(() => {
    if (!monId) return undefined;
    const periode = connecte
      ? SONDAGE_CONNECTE_MS
      : sessionVivante
        ? SONDAGE_SESSION_MS
        : SONDAGE_VEILLE_MS;
    const minuteur = setInterval(resynchroniser, periode);
    return () => clearInterval(minuteur);
  }, [monId, connecte, sessionVivante, resynchroniser]);

  useEffect(() => {
    const abonnement = AppState.addEventListener('change', (etatApp) => {
      if (etatApp === 'active' && monId) resynchroniser();
    });
    return () => abonnement.remove();
  }, [monId, resynchroniser]);

  // Fin de session : message + rafraîchissement des ressources, puis fermeture.
  useEffect(() => {
    if (!etat || !STATUTS_TERMINAUX.includes(etat.statut)) return;
    if (etat.statut === 'complete') {
      toast.success('Échange conclu !');
      dispatch(updateJoueurState({ needRefresh: true }));
      usersApi
        .find()
        .then((user) => dispatch(updateJoueurState({ money: user.money })))
        .catch(() => {});
    } else if (etat.statut === 'expire') {
      toast.info("L'échange a expiré.");
    } else if (etat.annulePar !== monId) {
      toast.info("L'échange a été annulé par l'autre joueur.");
    }
    dispatch(closeEchange());
  }, [etat, monId, dispatch, toast]);

  // Une session qui S'OUVRE amène l'écran d'échange, où qu'on soit (l'autre a accepté
  // pendant qu'on fouillait son sac). Déclenché par l'ouverture et non par la route :
  // si le joueur referme l'écran sans annuler, le bandeau de la carte le lui repropose
  // au lieu de le lui réimposer en boucle.
  const idOuvert = etat?.statut === 'ouvert' ? etat.id : null;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  useEffect(() => {
    if (idOuvert && pathnameRef.current !== '/echange') router.push('/(jeu)/echange' as never);
  }, [idOuvert, router]);

  return null;
}
