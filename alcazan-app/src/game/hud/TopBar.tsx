import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { mediaUrl } from '@/src/core/media';
import { useAppSelector } from '@/src/core/store';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

/**
 * Les pièces du bandeau supérieur. Ce ne sont plus UNE barre mais trois éléments de coin
 * que l'écran de carte dispose : la carte doit rester visible entre eux.
 */

/** Nom de la zone, au centre. S'efface devant la carte de cible (même emplacement). */
export function ZonePill({ nom }: { nom: string }) {
  if (!nom) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} style={styles.zone}>
      <Text style={styles.zoneLabel} numberOfLines={1}>
        {nom}
      </Text>
    </Animated.View>
  );
}

/** Or, points d'action, points de mouvement — ce qu'on regarde avant d'agir. */
export function Ressources() {
  const money = useAppSelector((s) => s.data.joueurState.money);
  const pa = useAppSelector((s) => s.data.joueurState.pa);
  const pm = useAppSelector((s) => s.data.joueurState.pm);

  return (
    <View style={styles.ressources}>
      <Ressource icone="/img/gui/Money03.png" valeur={money} couleur={colors.gold} />
      <Ressource icone="/img/gui/10.png" valeur={pa} unite="PA" couleur={colors.paLabel} />
      <Ressource icone="/img/gui/36.png" valeur={pm} unite="PM" couleur={colors.mpLabel} />
    </View>
  );
}

function Ressource({
  icone,
  valeur,
  unite,
  couleur,
}: {
  icone: string;
  valeur: number;
  unite?: string;
  couleur: string;
}) {
  return (
    <View style={styles.ressource}>
      <Image source={{ uri: mediaUrl(icone) }} style={styles.iconeRessource} contentFit="contain" />
      <Text style={[styles.valeurRessource, { color: couleur }]}>{valeur ?? 0}</Text>
      {!!unite && <Text style={styles.uniteRessource}>{unite}</Text>}
    </View>
  );
}

/** Bouton rond du HUD (menu, recentrage). 40 pt + `hitSlop` : cible tactile de 48 pt. */
export function BoutonHud({
  glyphe,
  onPress,
  label,
}: {
  glyphe: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.bouton, pressed && styles.boutonPresse]}>
      <Text style={styles.glyphe}>{glyphe}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zone: {
    maxWidth: 220,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hudBorder,
    backgroundColor: colors.hudBg,
  },
  zoneLabel: {
    fontFamily: fonts.title,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  ressources: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.nav,
    borderWidth: 1,
    borderColor: colors.hudBorder,
    backgroundColor: colors.hudBg,
  },
  ressource: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconeRessource: { width: 14, height: 14 },
  valeurRessource: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  uniteRessource: { fontFamily: fonts.bodyBold, fontSize: 8.5, color: colors.textFaint, marginLeft: -1 },
  bouton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.nav,
    borderWidth: 1,
    borderColor: colors.hudBorder,
    backgroundColor: colors.hudBg,
  },
  boutonPresse: { backgroundColor: colors.hudBgStrong, borderColor: colors.goldBorder },
  glyphe: { color: colors.gold, fontSize: 17, lineHeight: 21 },
});
