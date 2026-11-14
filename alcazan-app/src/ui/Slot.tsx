import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius } from './tokens';

export type SlotSize = 'md' | 'mini' | 'lg';

const sizes: Record<SlotSize, { box: number; radius: number }> = {
  mini: { box: 26, radius: radius.bar },
  md: { box: 50, radius: radius.slot },
  lg: { box: 64, radius: radius.slot },
};

/**
 * Slot d'action du design system (sort, potion, buff, objet) — port de `ui/slot/Slot.jsx`.
 * Sans `src` → slot vide (bordure pointillée). `children` = overlays (cooldown, quantité).
 */
export default function Slot({
  src,
  size = 'md',
  onPress,
  onLongPress,
  disabled = false,
  selected = false,
  style,
  children,
}: {
  src?: string | number | null;
  size?: SlotSize;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  style?: ViewStyle;
  children?: ReactNode;
}) {
  const dim = sizes[size];
  const content = (
    <View
      style={[
        styles.slot,
        { width: dim.box, height: dim.box, borderRadius: dim.radius },
        src ? styles.filled : styles.empty,
        disabled && styles.disabled,
        style,
        // APRÈS `style` : l'inventaire y passe la couleur de rareté en bordure, qui
        // écrasait le liseré de sélection — on ne voyait plus quel objet était choisi.
        selected && styles.selected,
      ]}>
      {!!src && (
        <Image
          source={typeof src === 'string' ? { uri: src } : src}
          style={[styles.icon, { borderRadius: dim.radius - 2 }]}
          contentFit="contain"
          transition={120}
        />
      )}
      {children}
    </View>
  );

  if (!onPress && !onLongPress) return content;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filled: {
    backgroundColor: colors.spellThumbBg,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  empty: {
    backgroundColor: colors.slotEmptyBg,
    borderWidth: 1,
    borderColor: colors.slotDash,
    borderStyle: 'dashed',
  },
  selected: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  icon: { width: '88%', height: '88%' },
});
