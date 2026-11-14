import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from './tokens';

/** Message d'un écran ou d'une liste sans contenu. */
export function Vide({ children }: { children: ReactNode }) {
  return <Text style={styles.vide}>{children}</Text>;
}

/** Chargement centré d'un corps de modale. */
export function Chargement() {
  return (
    <View style={styles.centre}>
      <ActivityIndicator color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  vide: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
