import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import * as echangeApi from '@/src/core/api/echange';
import type { Echange } from '@/src/core/api/echange';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import { setEchangeInvitations } from '@/src/core/store/actions';
import GameButton from '@/src/ui/GameButton';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

import { useEchange } from './useEchange';

/**
 * Ce que l'échange montre SUR LA CARTE — la bannière d'`EchangeHost.jsx`, réduite à UNE
 * ligne posée en bas au centre, entre la croix directionnelle et la barre d'action (le
 * haut de l'écran est pris par le HUD et les messages).
 *
 * Trois états, jamais deux à la fois :
 *  - une invitation reçue        → Accepter / Refuser ;
 *  - mon invitation en attente   → Annuler ;
 *  - une session ouverte dont l'écran a été refermé → Reprendre (filet : sans lui, un
 *    geste de fermeture laissait une session vivante sans aucun moyen d'y revenir).
 */
export default function EchangeBandeau() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const monId = useAppSelector((s) => s.data.joueurState.idJoueur);
  const etat = useAppSelector((s) => s.data.echange.etat);
  const invitations = useAppSelector((s) => s.data.echange.invitations);
  const { executer, enCours } = useEchange();

  const sessionOuverte = etat?.statut === 'ouvert';
  const invitationEnvoyee = etat?.statut === 'en_attente' && etat.joueurUn.joueur.id === monId;

  const sans = (invitation: Echange) => invitations.filter((i) => i.id !== invitation.id);

  const accepter = (invitation: Echange) =>
    executer(async () => {
      const reponse = await echangeApi.accept(invitation.id);
      dispatch(setEchangeInvitations(sans(invitation)));
      return reponse;
    });

  const refuser = (invitation: Echange) =>
    executer(async () => {
      await echangeApi.decline(invitation.id);
      dispatch(setEchangeInvitations(sans(invitation)));
      return null; // pas de session à adopter : on a juste décliné
    });

  let contenu: React.ReactNode = null;

  if (sessionOuverte && etat) {
    const autre = etat.joueurUn.joueur.id === monId ? etat.joueurDeux : etat.joueurUn;
    contenu = (
      <>
        <Text style={styles.texte} numberOfLines={1}>
          Échange en cours avec <Text style={styles.pseudo}>{autre.joueur.pseudo}</Text>
        </Text>
        <GameButton
          variant="solid"
          style={styles.bouton}
          onPress={() => router.push('/(jeu)/echange' as never)}>
          Reprendre
        </GameButton>
      </>
    );
  } else if (invitationEnvoyee && etat) {
    contenu = (
      <>
        <Text style={styles.texte} numberOfLines={1}>
          En attente de <Text style={styles.pseudo}>{etat.joueurDeux.joueur.pseudo}</Text>…
        </Text>
        <GameButton
          variant="ghost"
          style={styles.bouton}
          disabled={enCours}
          onPress={() => executer(() => echangeApi.cancel())}>
          Annuler
        </GameButton>
      </>
    );
  } else if (invitations.length > 0) {
    // Une seule à la fois : empilées, elles recouvriraient la carte. Les suivantes
    // apparaissent quand celle-ci est traitée.
    const invitation = invitations[0];
    contenu = (
      <>
        <Text style={styles.texte} numberOfLines={1}>
          <Text style={styles.pseudo}>{invitation.joueurUn.joueur.pseudo}</Text> propose un échange
          {invitations.length > 1 ? ` (+${invitations.length - 1})` : ''}
        </Text>
        <GameButton
          variant="solid"
          style={styles.bouton}
          disabled={enCours}
          onPress={() => accepter(invitation)}>
          Accepter
        </GameButton>
        <GameButton
          variant="ghost"
          style={styles.bouton}
          disabled={enCours}
          onPress={() => refuser(invitation)}>
          Refuser
        </GameButton>
      </>
    );
  }

  if (!contenu) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOut.duration(140)}
      style={styles.bandeau}>
      {contenu}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 470,
    paddingVertical: 6,
    paddingLeft: spacing.md,
    paddingRight: 6,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.hudBgStrong,
  },
  texte: { flexShrink: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.text },
  pseudo: { fontFamily: fonts.bodyBold, color: colors.gold },
  bouton: { minHeight: 34, paddingVertical: 6, paddingHorizontal: spacing.md },
});
