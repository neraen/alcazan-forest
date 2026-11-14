import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { mediaUrl } from '@/src/core/media';
import { useAppSelector } from '@/src/core/store';
import type { JoueurMinimal } from '@/src/core/types';
import { colors, fonts, gradients, radius, spacing } from '@/src/ui/tokens';

import { useExperience } from './useExperience';

/**
 * Fiche joueur du HUD — port de `UserInterface/usernameBlock` + `userStatsBlock`.
 *
 * Elle était une carte de 244 × 230 pt posée sur la carte ; c'est maintenant un cartouche
 * de coin (≈ 200 × 56) : portrait, nom, niveau, et trois jauges dont les valeurs sont
 * écrites DANS la barre. L'XP y est entrée (elle occupait une ligne entière de la barre
 * d'action), l'or et les PA/PM en sont sortis (groupe de droite du bandeau).
 *
 * Un appui ouvre le Profil : c'est là que vit le détail, inutile de le dupliquer ici.
 */
export default function PlayerCard({ user, onPress }: { user: JoueurMinimal; onPress?: () => void }) {
  const joueurState = useAppSelector((s) => s.data.joueurState);
  const experience = useExperience();

  // « Aucune XP gagnée » n'est pas « aucun niveau » : le niveau peut arriver à null dans
  // une réponse d'attaque sans gain. On retombe alors sur celui du personnage chargé.
  const niveau = joueurState.level || user.niveau;
  // PAS de repli sur `user.currentLife` / `currentMana` : 0 est une valeur réelle (mana
  // vidée, mort), et `0 || max` affichait une jauge pleine à un joueur à sec. Le store
  // est renseigné par `initialiserJoueur` avant le premier rendu de cette carte.
  const vie = joueurState.lifeJoueur ?? user.currentLife;
  const mana = joueurState.manaJoueur ?? user.currentMana;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cartouche, pressed && styles.presse]}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le profil">
      <View style={styles.portrait}>
        <Image
          source={{ uri: mediaUrl('/img/gui/CharacterPlayer/Avatar.png') }}
          style={styles.avatar}
          contentFit="cover"
        />
        <Text style={styles.niveau}>{niveau}</Text>
      </View>

      <View style={styles.corps}>
        <Text style={styles.pseudo} numberOfLines={1}>
          {user.pseudo}
        </Text>
        <Jauge variante="hp" valeur={vie} max={user.maxLife} hauteur={11} />
        <Jauge variante="mp" valeur={mana} max={user.maxMana} hauteur={9} />
        <Jauge variante="xp" valeur={experience.valeur} max={experience.max} hauteur={3} muet />
      </View>
    </Pressable>
  );
}

/**
 * Jauge de HUD : la valeur est écrite DANS la barre. `GaugeBar` (kit) pose son libellé et
 * ses chiffres au-dessus, ce qui triple la hauteur — parfait dans une fiche, trop cher
 * sur la carte.
 */
export function Jauge({
  variante,
  valeur,
  max,
  hauteur,
  muet = false,
}: {
  variante: 'hp' | 'mp' | 'xp';
  valeur: number;
  max: number;
  hauteur: number;
  muet?: boolean;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valeur / max) * 100)) : 0;
  return (
    <View style={[styles.piste, { height: hauteur, borderRadius: hauteur / 2 }]}>
      <LinearGradient
        colors={[...gradients[variante]] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${pct}%`, height: '100%', borderRadius: hauteur / 2 }}
      />
      {!muet && (
        <Text style={[styles.chiffres, { lineHeight: hauteur, fontSize: hauteur - 2.5 }]}>
          {valeur} / {max}
        </Text>
      )}
    </View>
  );
}

const PORTRAIT = 44;

const styles = StyleSheet.create({
  cartouche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: 204,
    padding: 5,
    paddingRight: spacing.md,
    borderRadius: PORTRAIT / 2 + 6,
    borderTopRightRadius: radius.card,
    borderBottomRightRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hudBorder,
    backgroundColor: colors.hudBg,
  },
  presse: { backgroundColor: colors.hudBgStrong },
  portrait: { width: PORTRAIT, height: PORTRAIT },
  avatar: {
    width: PORTRAIT,
    height: PORTRAIT,
    borderRadius: PORTRAIT / 2,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.pastilleBg,
  },
  niveau: {
    position: 'absolute',
    right: -4,
    bottom: -3,
    minWidth: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.pastilleBg,
    overflow: 'hidden',
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    lineHeight: 15,
    color: colors.level,
  },
  corps: { flex: 1, gap: 3 },
  pseudo: {
    fontFamily: fonts.titleBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
    letterSpacing: 0.4,
  },
  piste: { width: '100%', backgroundColor: colors.hudTrack, justifyContent: 'center' },
  chiffres: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    color: colors.text,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 0 },
  },
});
