import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, fonts, radius } from './tokens';

type Variant = 'gold' | 'solid' | 'danger' | 'ghost';

/** Bouton du design system — port de `ui/gameButton/GameButton.jsx`. */
export default function GameButton({
  children,
  onPress,
  variant = 'gold',
  disabled = false,
  loading = false,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        variants[variant],
        pressed && !off && styles.pressed,
        off && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? colors.ink : colors.gold} />
      ) : (
        <Text style={[styles.label, labels[variant]]}>{children}</Text>
      )}
    </Pressable>
  );
}

const variants: Record<Variant, ViewStyle> = {
  gold: { borderColor: colors.goldBorderStrong, backgroundColor: 'transparent' },
  solid: { borderColor: colors.gold, backgroundColor: colors.gold },
  danger: { borderColor: colors.dangerBorder, backgroundColor: colors.dangerBgHover },
  ghost: { borderColor: colors.goldCardBorder, backgroundColor: colors.rowBg },
};

const labels = StyleSheet.create({
  gold: { color: colors.gold },
  solid: { color: colors.ink },
  danger: { color: colors.dangerText },
  ghost: { color: colors.textDim },
});

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: radius.slot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
});
