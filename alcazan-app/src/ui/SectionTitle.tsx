import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radius } from './tokens';

/** Titre de section : barre or verticale + titre Cinzel — port de `ui/sectionTitle`. */
export default function SectionTitle({
  children,
  size = 'md',
  right,
  style,
}: {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  right?: ReactNode;
  style?: ViewStyle;
}) {
  const h = size === 'lg' ? 24 : size === 'sm' ? 14 : 18;
  const f = size === 'lg' ? 20 : size === 'sm' ? 13 : 16;

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.bar, { height: h }]} />
      <Text style={[styles.title, { fontSize: f }]} numberOfLines={1}>
        {children}
      </Text>
      {!!right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { width: 3, borderRadius: radius.bar, backgroundColor: colors.gold },
  title: {
    flex: 1,
    fontFamily: fonts.title,
    color: colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  right: { marginLeft: 'auto' },
});
