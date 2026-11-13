import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as interactionApi from '@/src/core/api/interaction';
import * as usersApi from '@/src/core/api/users';
import { messageErreur } from '@/src/core/http';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import {
  openPnjInteraction,
  updateJoueurState,
  updatePlayerTarget,
} from '@/src/core/store/actions';
import type { CaseCarte, JoueurMinimal } from '@/src/core/types';
import ActionBar from '@/src/game/hud/ActionBar';
import MenuDrawer from '@/src/game/hud/MenuDrawer';
import PlayerCard from '@/src/game/hud/PlayerCard';
import TargetCard from '@/src/game/hud/TargetCard';
import TopBar from '@/src/game/hud/TopBar';
import InteractionSheet from '@/src/game/map/InteractionSheet';
import MapCanvas from '@/src/game/map/MapCanvas';
import type { OccupantJoueur } from '@/src/game/map/CaseTile';
import { useCarte } from '@/src/game/map/useCarte';
import Panel from '@/src/ui/Panel';
import { renderGameText } from '@/src/ui/gameText';
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

  const [user, setUser] = useState<JoueurMinimal | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [recentrerSignal, setRecentrerSignal] = useState(0);
  const [interactionOuverte, setInteractionOuverte] = useState<CaseCarte | null>(null);

  const { etat, taperCase, chargerCarte } = useCarte(user);

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

  const tapJoueur = (joueur: OccupantJoueur) => {
    if (joueur.estMoi) return;
    dispatch(updatePlayerTarget({ targetId: joueur.idJoueur, type: 'player' }));
  };

  const tapPnj = (uneCase: CaseCarte) => {
    if (!uneCase.pnjId) return;
    dispatch(
      openPnjInteraction({
        pnjId: uneCase.pnjId,
        abscisse: uneCase.abscisse,
        ordonnee: uneCase.ordonnee,
      }),
    );
    router.push({ pathname: '/(jeu)/pnj/[pnjId]', params: { pnjId: String(uneCase.pnjId) } });
  };

  const tapBoss = (uneCase: CaseCarte) => {
    if (uneCase.bossId) dispatch(updatePlayerTarget({ targetId: uneCase.bossId, type: 'boss' }));
  };

  const executerInteraction = async (
    uneCase: CaseCarte,
    mode: 'ethique' | 'intensive' | null = null,
  ) => {
    try {
      const reponse = await interactionApi.executer(uneCase.carteCarreauId, mode);
      (reponse.messages ?? []).forEach((message: string) => toast.info(message));
      dispatch(updateJoueurState({ pa: reponse.pa, needRefresh: reponse.needRefresh }));
    } catch (erreur) {
      toast.error(messageErreur(erreur, 'Une erreur est survenue.'));
    }
  };

  const tapInteraction = (uneCase: CaseCarte) => {
    const etatCase = etat.interactions?.[String(uneCase.carteCarreauId)];
    // Un gisement qui propose le choix demande d'abord COMMENT prélever. Sur une case
    // indisponible on n'ouvre rien : la requête part, et le serveur donne lui-même la
    // vraie raison du refus.
    if (etatCase?.recolteChoix && etatCase.disponible && etat.modesRecolte.length > 0) {
      setInteractionOuverte(uneCase);
      return;
    }
    executerInteraction(uneCase);
  };

  if (!user || !etat.chargee) {
    return (
      <View style={styles.chargement}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.chargementLabel}>Alcazan Forest</Text>
      </View>
    );
  }

  const message = renderGameText(joueurState.message);

  return (
    <View style={styles.page}>
      <MapCanvas
        cases={etat.cases}
        mapId={etat.mapId}
        abscisseJoueur={etat.abscisseJoueur}
        ordonneeJoueur={etat.ordonneeJoueur}
        casesAccessibles={etat.casesAccessibles}
        interactions={etat.interactions}
        isInstance={etat.isInstance}
        user={user}
        onTapCase={taperCase}
        onTapJoueur={tapJoueur}
        onLongPressJoueur={tapJoueur}
        onTapPnj={tapPnj}
        onTapBoss={tapBoss}
        onTapInteraction={tapInteraction}
        recentrerSignal={recentrerSignal}
      />

      {/* HUD en PAYSAGE : colonne de gauche (bandeau, fiche, cible) et barre d'action en
          bas à droite, le long du bord de la carte. C'est la mise en page du web — une
          colonne latérale et une barre sous la carte — mais en surimpression, l'écran
          d'un téléphone n'ayant pas 340 pt à offrir pour une colonne pleine. */}
      <View
        style={[
          styles.colonne,
          { paddingTop: insets.top + spacing.sm, paddingLeft: insets.left + spacing.md },
        ]}
        pointerEvents="box-none">
        <TopBar
          zoneName={etat.nom}
          onMenu={() => setMenuOuvert(true)}
          onRecentrer={() => setRecentrerSignal((v) => v + 1)}
        />
        <ScrollView
          style={styles.colonneDefilante}
          contentContainerStyle={styles.colonneContenu}
          showsVerticalScrollIndicator={false}>
          <PlayerCard user={user} />
          <TargetCard />
          {!!message && (
            <Panel padding="sm" style={styles.message}>
              <Text style={styles.messageLabel}>{message}</Text>
            </Panel>
          )}
        </ScrollView>
      </View>

      <View
        style={[
          styles.hudBas,
          {
            left: LARGEUR_COLONNE + insets.left + spacing.md,
            right: insets.right + spacing.md,
            bottom: Math.max(insets.bottom, spacing.sm),
          },
        ]}>
        <ActionBar />
      </View>

      {menuOuvert && <MenuDrawer onClose={() => setMenuOuvert(false)} />}

      {!!interactionOuverte && (
        <InteractionSheet
          nom={interactionOuverte.interactionNom ?? ''}
          etat={etat.interactions?.[String(interactionOuverte.carteCarreauId)]}
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

/** Largeur de la colonne de HUD, en paysage. Assez pour les jauges et les ressources,
 *  assez étroit pour laisser respirer la carte sur un iPhone (874 pt de large). */
const LARGEUR_COLONNE = 244;

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
  colonne: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: LARGEUR_COLONNE,
    gap: spacing.sm,
  },
  colonneDefilante: { flex: 1 },
  colonneContenu: { gap: spacing.sm, paddingBottom: spacing.xl, paddingRight: 2 },
  hudBas: { position: 'absolute' },
  message: { backgroundColor: 'rgba(4, 26, 33, 0.94)' },
  messageLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 17,
  },
});
