import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radius, spacing } from './tokens';

/**
 * Puce de filtre / d'onglet. `bloc` l'étire sur toute la largeur de son conteneur (liste
 * verticale d'un rail) ; sans lui c'est une puce en ligne. `compteur` s'aligne à droite.
 *
 * 36 pt de haut au minimum : c'est une cible TACTILE, pas un lien — les puces de 24 pt du
 * web se ratent une fois sur trois au pouce.
 */
export default function Chip({
  label,
  actif = false,
  onPress,
  compteur,
  bloc = false,
  pastille,
  disabled = false,
  style,
}: {
  label: string;
  actif?: boolean;
  onPress?: () => void;
  compteur?: string | number;
  bloc?: boolean;
  /** Couleur d'un point devant le libellé (catégorie du journal). */
  pastille?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: actif }}
      style={({ pressed }) => [
        styles.chip,
        bloc && styles.bloc,
        actif && styles.actif,
        pressed && styles.presse,
        disabled && styles.inactif,
        style,
      ]}>
      {!!pastille && <View style={[styles.pastille, { backgroundColor: pastille }]} />}
      <Text style={[styles.label, bloc && styles.labelBloc, actif && styles.labelActif]} numberOfLines={1}>
        {label}
      </Text>
      {compteur !== undefined && (
        <Text style={[styles.compteur, actif && styles.compteurActif]}>{compteur}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.tab,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    backgroundColor: colors.rowBg,
  },
  bloc: { alignSelf: 'stretch' },
  actif: { backgroundColor: colors.goldSofter, borderColor: colors.gold },
  presse: { opacity: 0.7 },
  inactif: { opacity: 0.45 },
  pastille: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim },
  labelBloc: { flex: 1 },
  labelActif: { fontFamily: fonts.bodyBold, color: colors.gold },
  compteur: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textFaint },
  compteurActif: { color: colors.goldPale },
});
