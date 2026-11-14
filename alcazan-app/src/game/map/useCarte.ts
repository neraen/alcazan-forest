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

/**
 * Issue d'une tentative de déplacement : un pas fait, une carte changée, ou rien (case
 * inaccessible, refus du serveur, déplacement déjà en cours). La croix directionnelle
 * s'en sert pour savoir si elle peut enchaîner le pas suivant.
 */
export type IssuePas = 'pas' | 'carte' | 'rien';

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

  /** Cible lue par référence : la règle ci-dessous compare, elle ne doit pas recréer
      tous les rappels de la carte à chaque changement de cible. */
  const cibleRef = useRef(target);
  cibleRef.current = target;

  /**
   * Un monstre se cible AUTOMATIQUEMENT parce qu'on est sur sa case, et jamais autrement :
   * il n'est pas dessiné (peint dans l'image de fond). Deux sortes, lues toutes deux SUR
   * LA CASE — donc sur la carte, qui redescend à chaque déplacement — et surtout pas dans
   * l'état de combat, qui ne se rafraîchit qu'au sondage :
   *  - `renfortId`  → monstre d'instance (`Map.majCibleMonstreInstance` du web) ;
   *  - `hasMonstre` → monstre du monde ouvert. Le web fait ce ciblage au MONTAGE du
   *    composant `Player` (prop `hasMonstre`), composant qui n'a pas d'équivalent ici :
   *    sans cette branche, marcher sur un monstre ne ciblait rien.
   *
   * `arrivee` reproduit ce « au montage » : le monstre du monde ouvert n'est ciblé que
   * lorsqu'on ARRIVE sur sa case, pas à chaque rechargement de la carte. Après une mise à
   * mort le web ne recible pas (il faut revenir sur la case) ; un rechargement qui
   * reciblerait changerait la règle du jeu, pas seulement son affichage.
   */
  const majCibleMonstre = useCallback(
    (cases: CaseCarte[], abscisse: number, ordonnee: number, arrivee: boolean) => {
      const maCase = (cases || []).find(
        (c) => c.abscisse === abscisse && c.ordonnee === ordonnee,
      );
      const courante = cibleRef.current;
      const voulue = maCase?.renfortId
        ? { targetId: maCase.renfortId, type: 'renfort' as const }
        : arrivee && maCase?.hasMonstre
          ? { targetId: maCase.hasMonstre, type: 'monstre' as const }
          : null;

      if (voulue) {
        // Déjà la bonne cible (pas refusé, on n'a pas bougé) : ne rien toucher, sinon la
        // fiche perdrait son nom sans que rien ne la fasse relire.
        if (courante.type === voulue.type && courante.targetId === voulue.targetId) return;
        dispatch(removePlayerTarget());
        dispatch(updatePlayerTarget(voulue));
        return;
      }

      // Un monstre ne reste ciblé que tant qu'on est sur sa case : la quitter décible,
      // monde ouvert comme instance. Un renfort disparaît aussi quand il meurt (la case
      // perd son `renfortId`), d'où le test hors arrivée.
      if (courante.type === 'renfort' || (arrivee && courante.type === 'monstre')) {
        dispatch(removePlayerTarget());
      }
    },
    [dispatch],
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
      // Premier chargement, ou position réadoptée ailleurs (téléportation serveur) : on
      // ARRIVE sur la case. Un simple rechargement sur place n'est pas une arrivée.
      const avant = etatRef.current;
      const arrivee =
        !avant.chargee ||
        avant.mapId !== (data.mapId ?? mapId) ||
        avant.abscisseJoueur !== abscisse ||
        avant.ordonneeJoueur !== ordonnee;

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
      majCibleMonstre(cases, abscisse, ordonnee, arrivee);
    } catch (erreur) {
      // Sans ce catch, un échec laisse l'écran sur son chargement indéfiniment : le
      // joueur ne peut même pas savoir que c'est le réseau qui a lâché.
      toast.error(messageErreur(erreur, 'La carte est introuvable pour le moment.'));
    } finally {
      setChargement(false);
    }
  }, [user, joueurState.mapId, dispatch, toast, calculerAccessibles, majCibleMonstre]);

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

  /**
   * Un seul aller-retour de déplacement à la fois. Deux taps rapprochés partaient en
   * parallèle : la seconde réponse pouvait arriver AVANT la première et rendre au joueur
   * une position périmée (le personnage « revenait en arrière » d'une case).
   */
  const enMouvement = useRef(false);

  const seDeplacer = useCallback(
    async (abscisse: number, ordonnee: number): Promise<boolean> => {
      if (enMouvement.current) return false;
      enMouvement.current = true;
      const courant = etatRef.current;
      let data;
      try {
        data = await usersApi.updatePosition(courant.mapId, abscisse, ordonnee);
      } catch (erreur) {
        // Sans ce catch, un refus (plus de PM, case prise entre-temps) ou une coupure
        // réseau était un rejet non géré : le tap ne faisait RIEN de visible.
        toast.error(messageErreur(erreur, 'Déplacement impossible.'));
        return false;
      } finally {
        enMouvement.current = false;
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
      // Décible le monstre quitté ET cible celui sur lequel on arrive, d'un seul geste.
      majCibleMonstre(cases, data.abscisseJoueur, data.ordonneeJoueur, true);
      return true;
    },
    [dispatch, toast, calculerAccessibles, majCibleMonstre],
  );

  const changerDeCarte = useCallback(
    async (
      targetMapId: number | null,
      targetWrap: number | null,
      wrapId: number,
    ): Promise<boolean> => {
      if (enMouvement.current) return false;
      enMouvement.current = true;
      try {
        const position = await usersApi.changeMap(targetMapId, targetWrap, wrapId);

        if (position.message !== undefined && position.mapId === undefined) {
          // Passage REFUSÉ par le serveur (condition de salle, condition de wrap, verrou
          // quotidien…). Sans ce message, le tap sur la porte ne fait RIEN de visible,
          // ce qui se lit comme un bug de la carte.
          toast.error(position.message);
          return false;
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

        // Population d'une salle apparue à l'arrivée du groupe : les monstres n'étant
        // pas dessinés, cette annonce est le SEUL signal qu'il y a quelque chose à
        // nettoyer.
        if (position.annonce) toast.warning(position.annonce);

        majCibleMonstre(cases, abscisse, ordonnee, true);
        return true;
      } catch (erreur) {
        // Même raison que pour un pas : un échec muet se lit comme une porte cassée.
        toast.error(messageErreur(erreur, 'Ce passage est infranchissable pour le moment.'));
        return false;
      } finally {
        enMouvement.current = false;
      }
    },
    [dispatch, toast, calculerAccessibles, majCibleMonstre],
  );

  /**
   * Tap sur une case — port de `handleClick`, mêmes règles, même ordre. L'issue rendue ne
   * sert qu'à la croix directionnelle ; un tap sur la carte l'ignore.
   */
  const taperCase = useCallback(
    async (caseTapee: CaseCarte): Promise<IssuePas> => {
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
            return 'rien';
          }
          const change = await changerDeCarte(
            caseTapee.targetMapId,
            caseTapee.targetWrap,
            caseTapee.carteCarreauId,
          );
          return change ? 'carte' : 'rien';
        }
        return 'rien';
      }

      if (courant.casesAccessibles.includes(caseTapee.carteCarreauId)) {
        return (await seDeplacer(caseTapee.abscisse, caseTapee.ordonnee)) ? 'pas' : 'rien';
      }
      return 'rien';
    },
    [dispatch, changerDeCarte, seDeplacer],
  );

  /**
   * Un pas dans une direction (croix directionnelle) = un TAP sur la case voisine, rien
   * de plus : mêmes cases accessibles, mêmes portes, même arbitrage du serveur. Aucune
   * règle de déplacement ne vit ici, pour que le pouce et le doigt ne puissent jamais
   * diverger.
   */
  const pasVers = useCallback(
    async (dx: number, dy: number): Promise<IssuePas> => {
      const courant = etatRef.current;
      const voisine = courant.cases.find(
        (c) =>
          c.abscisse === courant.abscisseJoueur + dx && c.ordonnee === courant.ordonneeJoueur + dy,
      );
      return voisine ? taperCase(voisine) : 'rien';
    },
    [taperCase],
  );

  return { etat, chargement, taperCase, pasVers, chargerCarte, seDeplacer, changerDeCarte };
}
