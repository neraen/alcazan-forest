import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from './tokens';

/**
 * Cadre standard des écrans-modales de jeu — port de `ui/gameModal/ModalShell.jsx`.
 *
 * Côté web, `GameModal` superpose la ZONE DE CARTE via le portal `#game-modal-root`, et
 * c'est tout l'intérêt du patron (la modale ne recouvre pas le HUD latéral). En mobile
 * l'écran n'a pas de « zone de carte » distincte : la modale est une route expo-router en
 * `presentation: "modal"`, donc une feuille native plein écran. Il ne reste de l'original
 * que le CADRE (en-tête icône / titre Cinzel / sous-titre / ✕, corps, pied).
 */
export default function ModalShell({
  iconSrc,
  title,
  subtitle,
  headerRight,
  footer,
  onClose,
  children,
}: {
  iconSrc?: string | number;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  // En PAYSAGE l'encoche est sur un petit côté : sans ces marges elle recouvrait la
  // première colonne de l'inventaire, le portrait du profil, les icônes des listes.
  const lateral = { paddingLeft: insets.left, paddingRight: insets.right };
  const lateralBande = {
    paddingLeft: Math.max(insets.left, spacing.lg),
    paddingRight: Math.max(insets.right, spacing.lg),
  };

  return (
    <LinearGradient colors={['#0a2c36', '#06232b']} style={styles.shell}>
      <View style={[styles.header, lateralBande, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        {!!iconSrc && (
          <View style={styles.iconBox}>
            <Image
              source={typeof iconSrc === 'string' ? { uri: iconSrc } : iconSrc}
              style={styles.icon}
              contentFit="contain"
            />
          </View>
        )}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {headerRight}
        {!!onClose && (
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <Text style={styles.closeLabel}>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.body, lateral]}>{children}</View>

      {!!footer && (
        <View
          style={[
            styles.footer,
            lateralBande,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}>
          {footer}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(227, 182, 79, 0.35)',
    backgroundColor: colors.headerBg,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.pastilleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 26, height: 26 },
  titles: { flex: 1 },
  title: {
    fontFamily: fonts.title,
    fontSize: 19,
    color: colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textMute },
  close: {
    width: 34,
    height: 34,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: { color: colors.gold, fontSize: 15, lineHeight: 18 },
  body: { flex: 1 },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(227, 182, 79, 0.35)',
    backgroundColor: colors.headerBg,
  },
});
