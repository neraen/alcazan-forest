import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, gradients, radius } from './tokens';

export type GaugeVariant = 'hp' | 'mp' | 'xp' | 'karma';

const labelColor: Record<GaugeVariant, string> = {
  hp: colors.hpLabel,
  mp: colors.mpLabel,
  xp: colors.gold,
  karma: colors.karmaLabel,
};

/**
 * Jauge du design system (PV / PM / XP / karma) — port de `ui/gaugeBar/GaugeBar.jsx`.
 * Le remplissage reste `value / max`, borné à [0, 100], calculé comme sur le web.
 *
 * Le karma est la seule jauge BIPOLAIRE : son dégradé doit se lire sur la piste ENTIÈRE
 * (rouge à gauche, vert à droite), sinon un pillard et un gardien finiraient sur la même
 * teinte en bout de barre. Le web y arrive par `clip-path` ; en RN on obtient le même
 * effet avec un conteneur de la largeur atteinte, `overflow: hidden`, contenant un
 * dégradé de la largeur de la PISTE.
 */
export default function GaugeBar({
  value,
  max,
  variant = 'hp',
  label,
  showValues = true,
  right,
  marker = null,
  height = 10,
  trackWidth,
  style,
}: {
  value: number;
  max: number;
  variant?: GaugeVariant;
  label?: string;
  showValues?: boolean;
  right?: ReactNode;
  marker?: number | null;
  height?: number;
  /** Largeur de piste, nécessaire au seul mode karma (dégradé figé sur la piste). */
  trackWidth?: number;
  style?: ViewStyle;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const clipped = variant === 'karma';

  return (
    <View style={[styles.gauge, style]}>
      {(label || showValues || right !== undefined) && (
        <View style={styles.header}>
          {!!label && (
            <Text style={[styles.label, { color: labelColor[variant] }]}>{label}</Text>
          )}
          {right !== undefined ? (
            <View style={styles.right}>{right}</View>
          ) : (
            showValues && (
              <Text style={styles.values}>
                {value} / {max}
              </Text>
            )
          )}
        </View>
      )}

      <View style={[styles.track, { height, borderRadius: radius.bar }]}>
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            overflow: 'hidden',
            borderRadius: radius.bar,
          }}>
          <LinearGradient
            colors={[...gradients[variant]] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={clipped && trackWidth ? { width: trackWidth, height: '100%' } : styles.fill}
          />
        </View>
        {marker !== null && (
          <View style={[styles.zeroMark, { left: `${Math.max(0, Math.min(100, marker))}%` }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gauge: { width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  values: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMute,
  },
  right: { flexDirection: 'row', alignItems: 'center' },
  track: {
    width: '100%',
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },
  zeroMark: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 1,
    backgroundColor: colors.textFaint,
  },
});
