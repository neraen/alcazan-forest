import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, spacing } from './tokens';

type Variant = 'default' | 'solid' | 'soft';
type Padding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Panneau / carte du design system — équivalent natif de `ui/panel/Panel.jsx`.
 *
 * Le web pose `backdrop-filter: blur(20px)` sur un fond translucide ; en RN il faudrait un
 * `BlurView`, qui coûte cher dès qu'on en empile (le HUD de carte en affiche trois en
 * permanence). On garde donc le fond translucide SANS flou : au-dessus de la carte, le
 * contraste vient surtout de l'opacité et de la bordure or. `BlurView` reste réservé aux
 * fonds de modale, où il n'y en a qu'un.
 */
export default function Panel({
  children,
  variant = 'default',
  padding = 'md',
  radiusSize = 'md',
  style,
}: {
  children?: ReactNode;
  variant?: Variant;
  padding?: Padding;
  radiusSize?: 'md' | 'lg';
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <View
      style={[
        styles.panel,
        variant === 'solid' && styles.solid,
        variant === 'soft' && styles.soft,
        paddings[padding],
        { borderRadius: radiusSize === 'lg' ? radius.panelLg : radius.panel },
        style as ViewStyle,
      ]}>
      {children}
    </View>
  );
}

const paddings: Record<Padding, ViewStyle> = {
  none: { padding: 0 },
  sm: { padding: spacing.sm + 2 },
  md: { padding: spacing.lg },
  lg: { padding: spacing.xl },
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  solid: {
    backgroundColor: colors.panelSolid,
    overflow: 'hidden',
  },
  soft: {
    backgroundColor: colors.panelSoft,
    borderColor: colors.goldCardBorder,
  },
});
