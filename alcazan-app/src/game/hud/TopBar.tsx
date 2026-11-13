import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

/** Bandeau supérieur : ouverture du menu, nom de zone, recentrage de la caméra. */
export default function TopBar({
  zoneName,
  onMenu,
  onRecentrer,
}: {
  zoneName: string;
  onMenu: () => void;
  onRecentrer: () => void;
}) {
  return (
    <View style={styles.barre}>
      <Pressable onPress={onMenu} style={styles.bouton} hitSlop={8}>
        <Text style={styles.glyphe}>☰</Text>
      </Pressable>

      <Text style={styles.zone} numberOfLines={1}>
        {zoneName || '…'}
      </Text>

      <Pressable onPress={onRecentrer} style={styles.bouton} hitSlop={8}>
        <Text style={styles.glyphe}>◎</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bouton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: colors.panel,
  },
  glyphe: { color: colors.gold, fontSize: 17, lineHeight: 21 },
  zone: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.title,
    fontSize: 13,
    color: colors.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
