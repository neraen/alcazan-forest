import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from './tokens';

/**
 * Onglets d'un écran-modale, en bandeau segmenté sous l'en-tête. Une `pastille` chiffrée
 * signale ce qui attend le joueur dans un onglet qu'il ne regarde pas (candidatures).
 */
export default function Onglets<T extends string>({
  onglets,
  actif,
  onChange,
}: {
  onglets: { cle: T; label: string; pastille?: number }[];
  actif: T;
  onChange: (cle: T) => void;
}) {
  return (
    <View style={styles.bandeau}>
      {onglets.map((onglet) => {
        const estActif = onglet.cle === actif;
        return (
          <Pressable
            key={onglet.cle}
            onPress={() => onChange(onglet.cle)}
            accessibilityRole="tab"
            accessibilityState={{ selected: estActif }}
            style={[styles.onglet, estActif && styles.ongletActif]}>
            <Text style={[styles.label, estActif && styles.labelActif]}>{onglet.label}</Text>
            {!!onglet.pastille && (
              <View style={styles.pastille}>
                <Text style={styles.pastilleLabel}>{onglet.pastille}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldDivider,
  },
  onglet: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.tab,
    borderTopRightRadius: radius.tab,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  ongletActif: { backgroundColor: colors.goldSofter, borderBottomColor: colors.gold },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  labelActif: { color: colors.gold },
  pastille: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastilleLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },
});
