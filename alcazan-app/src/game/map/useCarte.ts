import { useCallback, useEffect, useRef, useState } from 'react';

import * as mapApi from '@/src/core/api/map';
import * as usersApi from '@/src/core/api/users';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import {
  openDonjonPorte,
  removePlayerTarget,
  updateJoueurState,
  updatePlayerTarget,
  updatePositionJoueur,
} from '@/src/core/store/actions';
import { computeDistance } from '@/src/core/domain/distance';
import type { CaseCarte, EtatInteraction, JoueurMinimal, ModeRecolte } from '@/src/core/types';
import { messageErreur } from '@/src/core/http';
import { useToast } from '@/src/ui/toast/ToastProvider';

type EtatCarte = {
  cases: CaseCarte[];
  nom: string;
  mapId: number;
  isInstance: boolean;
  portesDonjon: Record<string, unknown>;
  interactions: Record<string, EtatInteraction>;
  modesRecolte: ModeRecolte[];
  abscisseJoueur: number;
  ordonneeJoueur: number;
  /**
   * Cases ATTEIGNABLES en un pas. Le web appelle ce tableau `unabledCases` (et sa classe
   * CSS `.unabled-move`) alors qu'il contient exactement l'inverse de ce que le nom
   * suggère : les cases où l'on PEUT aller. Nom corrigé ici ; le comportement, lui, est
   * repris au caractère près.
   */
  casesAccessibles: number[];
  chargee: boolean;
};

const ETAT_VIDE: EtatCarte = {
  cases: [],
  nom: '',
  mapId: 0,
  isInstance: false,
  portesDonjon: {},
  interactions: {},
  modesRecolte: [],
  abscisseJoueur: 0,
  ordonneeJoueur: 0,
  casesAccessibles: [],
  chargee: false,
};

/**
 * Toute la logique de `components/map/map/Map.jsx`, sans son rendu. Elle est ici dans un
 * hook plutôt que dans le composant pour une raison précise : le rendu mobile (caméra,
 * gestes, zoom) est volumineux et aurait noyé des règles de jeu qu'il faut pouvoir
 * comparer ligne à ligne avec le web.
 */
export function useCarte(user: JoueurMinimal | null) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const target = useAppSelector((s) => s.data.target);
  const joueurState = useAppSelector((s) => s.data.joueurState);

  const [etat, setEtat] = useState<EtatCarte>(ETAT_VIDE);
  const [chargement, setChargement] = useState(false);
  const etatRef = useRef(etat);
  etatRef.current = etat;

  /**
   * Cases atteignables : les 8 voisines (plus la sienne, filtrée ensuite), utilisables,
   * libres de tout joueur et de tout PNJ. Port exact de `getUnabledMove()`.
   */
  const calculerAccessibles = useCallback(
    (cases: CaseCarte[], abscisse: number, ordonnee: number) =>
      cases
        .filter(
          (c) =>
            [abscisse - 1, abscisse, abscisse + 1].includes(c.abscisse) &&
            [ordonnee - 1, ordonnee, ordonnee + 1].includes(c.ordonnee) &&
            c.isUsable &&
            !((c.abscisse === abscisse && c.ordonnee === ordonnee) ||
              c.userId !== null ||
              c.pnjId !== null),
        )
        .map((c) => c.carteCarreauId),
    [],
  );

  /**
   * Un monstre d'instance se cible AUTOMATIQUEMENT parce qu'on est sur sa case, et jamais
   * autrement : il n'est pas dessiné (comme tous les monstres du jeu, peints dans l'image
   * de fond). On lit `renfortId` DE LA CASE — donc de la carte, qui redescend à chaque
   * déplacement — et surtout pas l'état de combat, qui ne se rafraîchit qu'au sondage.
   */
  const majCibleMonstreInstance = useCallback(
    (cases: CaseCarte[], abscisse: number, ordonnee: number) => {
      const maCase = (cases || []).find(
        (c) => c.abscisse === abscisse && c.ordonnee === ordonnee,
      );
      const renfortId = maCase?.renfortId ?? null;
      if (renfortId) {
        dispatch(updatePlayerTarget({ targetId: renfortId, type: 'renfort' }));
      } else if (target.type === 'renfort') {
        dispatch(removePlayerTarget());
      }
    },
    [dispatch, target.type],
  );

  const chargerCarte = useCallback(async () => {
    if (!user) return;
    // `||` et NON `??` : l'état part à `mapId: 0`, qui n'est ni null ni undefined — un
    // `??` le retiendrait et demanderait la carte 0, que le serveur refuse en 500.
    const mapId = joueurState.mapId || etatRef.current.mapId || user.mapId;
    setChargement(true);
    try {
      const data = await mapApi.find(mapId);
      // La carte a pu être rechargée après une téléportation décidée par le SERVEUR
      // (entrée en donjon, éjection d'une instance expirée, mort) : la position est donc
      // RÉADOPTÉE depuis la réponse, jamais devinée ici.
      const abscisse = data.abscisseJoueur ?? etatRef.current.abscisseJoueur;
      const ordonnee = data.ordonneeJoueur ?? etatRef.current.ordonneeJoueur;
      const cases = data.cases ?? [];

      setEtat({
        cases,
        nom: data.mapInfo?.nom ?? '',
        isInstance: !!data.mapInfo?.isInstance,
        mapId: data.mapId ?? mapId,
        portesDonjon: data.portesDonjon ?? {},
        interactions: data.interactions ?? {},
        modesRecolte: data.modesRecolte ?? [],
        abscisseJoueur: abscisse,
        ordonneeJoueur: ordonnee,
        casesAccessibles: calculerAccessibles(cases, abscisse, ordonnee),
        chargee: true,
      });
      dispatch(updatePositionJoueur({ abscisse, ordonnee }));
      majCibleMonstreInstance(cases, abscisse, ordonnee);
    } catch (erreur) {
      // Sans ce catch, un échec laisse l'écran sur son chargement indéfiniment : le
      // joueur ne peut même pas savoir que c'est le réseau qui a lâché.
      toast.error(messageErreur(erreur, 'La carte est introuvable pour le moment.'));
    } finally {
      setChargement(false);
    }
  }, [user, joueurState.mapId, dispatch, toast, calculerAccessibles, majCibleMonstreInstance]);

  // Premier chargement.
  useEffect(() => {
    if (user && !etatRef.current.chargee) chargerCarte();
  }, [user, chargerCarte]);

  // Rechargement demandé par une action (attaque, quête, récolte…). Uniquement sur le
  // FRONT MONTANT : la remise à false ci-dessous redéclencherait sinon un second fetch.
  const refreshPrecedent = useRef(false);
  useEffect(() => {
    if (!refreshPrecedent.current && joueurState.needRefresh) {
      chargerCarte();
      dispatch(updateJoueurState({ needRefresh: false }));
    }
    refreshPrecedent.current = joueurState.needRefresh;
  }, [joueurState.needRefresh, chargerCarte, dispatch]);

  const seDeplacer = useCallback(
    async (abscisse: number, ordonnee: number) => {
      const courant = etatRef.current;
      const data = await usersApi.updatePosition(courant.mapId, abscisse, ordonnee);

      // Un monstre ne reste ciblé que tant qu'on est sur sa case : quitter la case
      // décible, monde ouvert comme instance.
      if (target.type === 'monstre' || target.type === 'renfort') {
        dispatch(removePlayerTarget());
      }

      const cases = data.cases ?? courant.cases;
      setEtat((prev) => ({
        ...prev,
        cases,
        mapId: data.mapId,
        abscisseJoueur: data.abscisseJoueur,
        ordonneeJoueur: data.ordonneeJoueur,
        casesAccessibles: calculerAccessibles(cases, data.abscisseJoueur, data.ordonneeJoueur),
      }));
      dispatch(updatePositionJoueur({ abscisse: data.abscisseJoueur, ordonnee: data.ordonneeJoueur }));
      dispatch(updateJoueurState({ lifeJoueur: data.life, manaJoueur: data.mana, pm: data.pm }));
      majCibleMonstreInstance(cases, data.abscisseJoueur, data.ordonneeJoueur);
    },
    [dispatch, target.type, calculerAccessibles, majCibleMonstreInstance],
  );

  const changerDeCarte = useCallback(
    async (targetMapId: number | null, targetWrap: number | null, wrapId: number) => {
      const position = await usersApi.changeMap(targetMapId, targetWrap, wrapId);

      if (position.message !== undefined && position.mapId === undefined) {
        // Passage REFUSÉ par le serveur (condition de salle, condition de wrap, verrou
        // quotidien…). Sans ce message, le tap sur la porte ne fait RIEN de visible, ce
        // qui se lit comme un bug de la carte.
        toast.error(position.message);
        return;
      }

      const data = await mapApi.find(position.mapId!);
      const cases = data.cases ?? [];
      const abscisse = position.abscisse!;
      const ordonnee = position.ordonnee!;

      setEtat({
        cases,
        nom: data.mapInfo?.nom ?? '',
        isInstance: !!data.mapInfo?.isInstance,
        mapId: data.mapId,
        portesDonjon: data.portesDonjon ?? {},
        interactions: data.interactions ?? {},
        modesRecolte: data.modesRecolte ?? [],
        abscisseJoueur: abscisse,
        ordonneeJoueur: ordonnee,
        casesAccessibles: calculerAccessibles(cases, abscisse, ordonnee),
        chargee: true,
      });

      dispatch(updateJoueurState({ mapId: data.mapId }));
      dispatch(updatePositionJoueur({ abscisse, ordonnee }));
      dispatch(removePlayerTarget());

      // Population d'une salle apparue à l'arrivée du groupe : les monstres n'étant pas
      // dessinés, cette annonce est le SEUL signal qu'il y a quelque chose à nettoyer.
      if (position.annonce) toast.warning(position.annonce);

      majCibleMonstreInstance(cases, abscisse, ordonnee);
    },
    [dispatch, toast, calculerAccessibles, majCibleMonstreInstance],
  );

  /** Tap sur une case — port de `handleClick`, mêmes règles, même ordre. */
  const taperCase = useCallback(
    (caseTapee: CaseCarte) => {
      const courant = etatRef.current;

      if (caseTapee.isWrap) {
        const distance = computeDistance(
          caseTapee.abscisse,
          caseTapee.ordonnee,
          courant.abscisseJoueur,
          courant.ordonneeJoueur,
        );
        if (distance <= 1) {
          // Une porte de donjon ouvre la modale de groupe au lieu de franchir directement :
          // c'est là qu'on choisit d'y aller seul ou accompagné. Le serveur revérifie tout.
          if (courant.portesDonjon?.[String(caseTapee.carteCarreauId)]) {
            dispatch(
              openDonjonPorte({
                carteCarreauId: caseTapee.carteCarreauId,
                targetMapId: caseTapee.targetMapId,
                targetWrap: caseTapee.targetWrap,
              }),
            );
            return;
          }
          changerDeCarte(caseTapee.targetMapId, caseTapee.targetWrap, caseTapee.carteCarreauId);
        }
        return;
      }

      if (courant.casesAccessibles.includes(caseTapee.carteCarreauId)) {
        seDeplacer(caseTapee.abscisse, caseTapee.ordonnee);
      }
    },
    [dispatch, changerDeCarte, seDeplacer],
  );

  return { etat, chargement, taperCase, chargerCarte, seDeplacer, changerDeCarte };
}
