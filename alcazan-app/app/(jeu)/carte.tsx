import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as interactionApi from '@/src/core/api/interaction';
import * as usersApi from '@/src/core/api/users';
import { computeDistance } from '@/src/core/domain/distance';
import { messageErreur } from '@/src/core/http';
import { usePreference } from '@/src/core/preferences';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import {
  openPnjInteraction,
  updateJoueurState,
  updatePlayerTarget,
} from '@/src/core/store/actions';
import type { CaseCarte, EtatInteraction, JoueurMinimal } from '@/src/core/types';
import ActionBar from '@/src/game/hud/ActionBar';
import CroixDirectionnelle from '@/src/game/hud/CroixDirectionnelle';
import MenuDrawer from '@/src/game/hud/MenuDrawer';
import PlayerCard from '@/src/game/hud/PlayerCard';
import TargetCard from '@/src/game/hud/TargetCard';
import { BoutonHud, Ressources, ZonePill } from '@/src/game/hud/TopBar';
import InteractionSheet from '@/src/game/map/InteractionSheet';
import MapCanvas from '@/src/game/map/MapCanvas';
import type { OccupantJoueur } from '@/src/game/map/CaseTile';
import { useCarte } from '@/src/game/map/useCarte';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, spacing } from '@/src/ui/tokens';

/**
 * Écran-hub — port de `pages/mapPage/MapPage.jsx`.
 *
 * Différence de mise en page assumée : le web pose une colonne de 340 pt à gauche (fiche
 * joueur, cible, rail) et la carte à droite. Ici la carte occupe tout l'écran et le HUD
 * la SURVOLE, parce qu'une colonne fixe mangerait 85 % d'un écran de téléphone.
 */
export default function CarteScreen() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const joueurState = useAppSelector((s) => s.data.joueurState);
  const target = useAppSelector((s) => s.data.target);
  const positionJoueur = useAppSelector((s) => s.data.positionJoueur);

  const [user, setUser] = useState<JoueurMinimal | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [recentrerSignal, setRecentrerSignal] = useState(0);
  const [vueLibre, setVueLibre] = useState(false);
  const [interactionOuverte, setInteractionOuverte] = useState<CaseCarte | null>(null);

  const { etat, taperCase, pasVers } = useCarte(user);
  const croixActive = usePreference('croixDirectionnelle');

  /** Port de `MapPage.initialisePlayerState` : le store suit le personnage chargé. */
  const initialiserJoueur = useCallback(async () => {
    let data: JoueurMinimal;
    try {
      data = await usersApi.find();
    } catch (erreur) {
      toast.error(messageErreur(erreur, 'Impossible de charger votre personnage.'));
      return;
    }
    setUser(data);
    dispatch(
      updateJoueurState({
        idJoueur: data.userId,
        lifeJoueur: data.currentLife,
        manaJoueur: data.currentMana,
        experience: 0,
        newExperience: data.experienceActuelle,
        maxExperience: data.experienceMax,
        damage: 0,
        damageReturns: 0,
        droppedItems: '',
        money: data.money,
        pa: data.actionPoint,
        pm: data.mouvementPoint,
        level: data.niveau,
      }),
    );
  }, [dispatch, toast]);

  useEffect(() => {
    initialiserJoueur();
  }, [initialiserJoueur]);

  // Une mort, une téléportation ou une montée de niveau change les maxima : on relit la
  // fiche quand le serveur annonce un rafraîchissement (`needRefresh` est consommé par
  // `useCarte`, on se contente ici de suivre le même signal).
  useEffect(() => {
    if (joueurState.needRefresh) initialiserJoueur();
  }, [joueurState.needRefresh, initialiserJoueur]);

  // Tous ces gestionnaires sont MÉMOÏSÉS : `CaseTile` est un `memo`, et des fonctions
  // recréées à chaque rendu le rendaient inopérant — les 384 cases se redessinaient à
  // la moindre variation de PV, de PA ou de cible.
  const tapJoueur = useCallback(
    (joueur: OccupantJoueur) => {
      if (joueur.estMoi) return;
      dispatch(updatePlayerTarget({ targetId: joueur.idJoueur, type: 'player' }));
    },
    [dispatch],
  );

  const positionRef = useRef(positionJoueur);
  positionRef.current = positionJoueur;

  const tapPnj = useCallback(
    (uneCase: CaseCarte) => {
      if (!uneCase.pnjId) return;
      // Même garde que `Pnj.jsx` côté web (distance < 2). Sans elle la modale s'ouvrait
      // pour un PNJ lointain puis se refermait aussitôt d'elle-même : un flash d'écran.
      const distance = computeDistance(
        uneCase.abscisse,
        uneCase.ordonnee,
        positionRef.current.abscisse,
        positionRef.current.ordonnee,
      );
      if (distance >= 2) {
        toast.info(`Approchez-vous de ${uneCase.pnjName ?? 'ce personnage'} pour lui parler.`);
        return;
      }
      dispatch(
        openPnjInteraction({
          pnjId: uneCase.pnjId,
          abscisse: uneCase.abscisse,
          ordonnee: uneCase.ordonnee,
        }),
      );
      router.push({ pathname: '/(jeu)/pnj/[pnjId]', params: { pnjId: String(uneCase.pnjId) } });
    },
    [dispatch, router, toast],
  );

  const tapBoss = useCallback(
    (uneCase: CaseCarte) => {
      if (uneCase.bossId) dispatch(updatePlayerTarget({ targetId: uneCase.bossId, type: 'boss' }));
    },
    [dispatch],
  );

  /**
   * État des cases interactives = celui de la carte, CORRIGÉ par la dernière réponse du
   * serveur pour chaque case (`reponse.etat`). Le web tient ce correctif dans
   * `InteractionMap` (`etatLocal`) ; il manquait ici, et une ressource qu'on venait de
   * récolter restait affichée disponible tant que la carte n'était pas rechargée.
   * Un rechargement de carte reprend la main, comme côté web.
   */
  const [etatsLocaux, setEtatsLocaux] = useState<Record<string, EtatInteraction>>({});
  useEffect(() => setEtatsLocaux({}), [etat.interactions]);
  const interactions = useMemo(
    () => ({ ...etat.interactions, ...etatsLocaux }),
    [etat.interactions, etatsLocaux],
  );

  // Une seule exécution à la fois (garde `enCours` du web) : deux taps rapprochés sur un
  // gisement partaient en double et dépensaient deux fois les PA.
  const interactionEnCours = useRef(false);

  const executerInteraction = useCallback(
    async (uneCase: CaseCarte, mode: 'ethique' | 'intensive' | null = null) => {
      if (interactionEnCours.current) return;
      interactionEnCours.current = true;
      try {
        const reponse = await interactionApi.executer(uneCase.carteCarreauId, mode);
        (reponse.messages ?? []).forEach((message: string) => toast.info(message));
        if (reponse.etat) {
          setEtatsLocaux((prev) => ({ ...prev, [String(uneCase.carteCarreauId)]: reponse.etat }));
        }
        dispatch(updateJoueurState({ pa: reponse.pa, needRefresh: reponse.needRefresh }));
      } catch (erreur) {
        toast.error(messageErreur(erreur, 'Une erreur est survenue.'));
      } finally {
        interactionEnCours.current = false;
      }
    },
    [dispatch, toast],
  );

  const aDesModes = etat.modesRecolte.length > 0;
  const tapInteraction = useCallback(
    (uneCase: CaseCarte) => {
      const etatCase = interactions?.[String(uneCase.carteCarreauId)];
      // Un gisement qui propose le choix demande d'abord COMMENT prélever. Sur une case
      // indisponible on n'ouvre rien : la requête part, et le serveur donne lui-même la
      // vraie raison du refus.
      if (etatCase?.recolteChoix && etatCase.disponible && aDesModes) {
        setInteractionOuverte(uneCase);
        return;
      }
      executerInteraction(uneCase);
    },
    [interactions, aDesModes, executerInteraction],
  );

  const cible = useMemo(
    () => ({ type: target.type, id: target.targetId }),
    [target.type, target.targetId],
  );

  // Zone où le personnage ne doit jamais se retrouver (sous le bandeau ou la barre
  // d'action). Mémoïsée : c'est une dépendance de la caméra.
  const marges = useMemo(
    () => ({
      haut: insets.top + 66,
      bas: Math.max(insets.bottom, spacing.sm) + 70,
      gauche: insets.left + spacing.sm,
      droite: insets.right + spacing.sm,
    }),
    [insets.top, insets.bottom, insets.left, insets.right],
  );

  if (!user || !etat.chargee) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.chargementLabel}>Alcazan Forest</Text>
      </View>
    );
  }

  const aUneCible = !!target.type && target.type !== 'none';

  return (
    <View style={styles.page}>
      <MapCanvas
        cases={etat.cases}
        mapId={etat.mapId}
        abscisseJoueur={etat.abscisseJoueur}
        ordonneeJoueur={etat.ordonneeJoueur}
        casesAccessibles={etat.casesAccessibles}
        interactions={interactions}
        isInstance={etat.isInstance}
        user={user}
        cible={cible}
        marges={marges}
        onTapCase={taperCase}
        onTapJoueur={tapJoueur}
        onLongPressJoueur={tapJoueur}
        onTapPnj={tapPnj}
        onTapBoss={tapBoss}
        onTapInteraction={tapInteraction}
        onVueLibre={setVueLibre}
        recentrerSignal={recentrerSignal}
      />

      {/* HUD : trois éléments de COIN au lieu d'une colonne. Cartouche du joueur à
          gauche, zone ou cible au centre, ressources et menu à droite ; la barre
          d'action reste en bas à droite. Tout le reste de l'écran est de la carte. */}
      <View
        style={[
          styles.bandeau,
          {
            top: insets.top + spacing.sm,
            left: insets.left + spacing.sm,
            right: insets.right + spacing.sm,
          },
        ]}
        pointerEvents="box-none">
        <PlayerCard user={user} onPress={() => router.push('/(jeu)/profil')} />

        <View style={styles.centre} pointerEvents="box-none">
          <TargetCard />
          {!aUneCible && <ZonePill nom={etat.nom} />}
        </View>

        <View style={styles.droite} pointerEvents="box-none">
          <View style={styles.ligneDroite}>
            <Ressources />
            <BoutonHud glyphe="☰" label="Ouvrir le menu" onPress={() => setMenuOuvert(true)} />
          </View>
          {/* Le recentrage n'existe que quand il sert : vue déplacée à la main. */}
          {vueLibre && (
            <BoutonHud
              glyphe="◎"
              label="Recentrer sur mon personnage"
              onPress={() => setRecentrerSignal((v) => v + 1)}
            />
          )}
        </View>
      </View>

      <View
        style={[
          styles.hudBas,
          {
            left: insets.left + spacing.sm,
            right: insets.right + spacing.sm,
            bottom: Math.max(insets.bottom, spacing.sm),
          },
        ]}
        pointerEvents="box-none">
        <ActionBar />
      </View>

      {/* Croix directionnelle, coin bas-gauche (le seul coin libre, et celui du pouce
          gauche). Désactivable depuis le menu ; le tap sur la carte marche toujours. */}
      {croixActive && (
        <View
          style={[
            styles.croix,
            { left: insets.left + spacing.sm, bottom: Math.max(insets.bottom, spacing.sm) },
          ]}
          pointerEvents="box-none">
          <CroixDirectionnelle onPas={pasVers} />
        </View>
      )}

      {menuOuvert && <MenuDrawer zone={etat.nom} onClose={() => setMenuOuvert(false)} />}

      {!!interactionOuverte && (
        <InteractionSheet
          nom={interactionOuverte.interactionNom ?? ''}
          etat={interactions?.[String(interactionOuverte.carteCarreauId)]}
          modes={etat.modesRecolte}
          onChoisir={(mode) => {
            const uneCase = interactionOuverte;
            setInteractionOuverte(null);
            executerInteraction(uneCase, mode);
          }}
          onFermer={() => setInteractionOuverte(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bgBottom },
  chargement: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.bgBottom,
  },
  chargementLabel: {
    fontFamily: fonts.title,
    fontSize: 14,
    color: colors.goldHalf,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  bandeau: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  centre: { flex: 1, alignItems: 'center' },
  droite: { alignItems: 'flex-end', gap: spacing.sm },
  ligneDroite: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hudBas: { position: 'absolute', alignItems: 'flex-end' },
  croix: { position: 'absolute' },
});
