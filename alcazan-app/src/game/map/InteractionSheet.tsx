import { Image } from 'expo-image';
import { spriteInteraction } from '@/src/core/media';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { EtatInteraction, ModeRecolte } from '@/src/core/types';
import Panel from '@/src/ui/Panel';
import SectionTitle from '@/src/ui/SectionTitle';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

/**
 * Choix du mode de récolte — port de `actionMap/ChoixRecolte`.
 *
 * Les chiffres (quantité, cooldown, épuisement, karma) viennent de `modesRecolte`, que la
 * carte descend depuis `Config\RecolteConfig` : AUCUN n'est en dur côté client. C'est ce
 * qui permet d'ajuster l'équilibrage sans toucher à l'app.
 *
 * ⚠️ Voile en `absoluteFill` et NON `<Modal>` de React Native : sur iOS une `Modal` ne
 * connaît que le portrait tant qu'on ne lui passe pas `supportedOrientations`, et l'app
 * est verrouillée en paysage — le panneau sortait couché. L'écran de carte le rend en
 * dernier, il recouvre donc bien le HUD (même patron que `MenuDrawer`).
 */
export default function InteractionSheet({
  nom,
  skin,
  etat,
  modes,
  onChoisir,
  onFermer,
}: {
  nom: string;
  skin?: string | null;
  etat?: EtatInteraction;
  modes: ModeRecolte[];
  onChoisir: (mode: 'ethique' | 'intensive' | null) => void;
  onFermer: () => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      exiting={FadeOut.duration(140)}
      style={StyleSheet.absoluteFill}>
      <Pressable style={styles.backdrop} onPress={onFermer}>
        <Pressable onPress={() => {}}>
          <Panel style={styles.carte}>
            <View style={styles.entete}>
              {!!skin && <Image source={{ uri: spriteInteraction(skin) }} style={styles.apercu} contentFit="contain" />}
              <View style={styles.description}>
                <SectionTitle size="sm">{etat?.nom || nom}</SectionTitle>
                <Text style={styles.modeDescription}>
                  {etat?.gisementEpuise ? 'Gisement épuisé' : etat?.disponible === false ? 'Indisponible' : 'Disponible'}
                </Text>
                {!!etat?.raison && <Text style={styles.modeDescription}>{etat.raison}</Text>}
              </View>
            </View>
            {!!etat?.coutPa && <Text style={styles.cout}>{etat.coutPa} PA</Text>}

            {/* Côte à côte : empilés, deux modes + titre + annulation dépassaient les
                ~400 pt de haut d'un téléphone en paysage. */}
            {etat?.recolteChoix && etat.disponible && modes.length > 0 ? <View style={styles.modes}>
            {modes.map((mode) => (
              <Pressable
                key={mode.value}
                onPress={() => onChoisir(mode.value)}
                style={({ pressed }) => [styles.mode, pressed && styles.modePresse]}>
                <Text style={styles.modeLabel}>{mode.label}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
                <View style={styles.chiffres}>
                  <Text style={styles.chiffre}>×{mode.quantite}</Text>
                  <Text style={styles.chiffre}>
                    {mode.cooldown >= 1 ? `${mode.cooldown} h` : `${mode.cooldown * 60} min`}
                  </Text>
                  <Text
                    style={[
                      styles.chiffre,
                      { color: mode.karma >= 0 ? colors.bonus : colors.dangerText },
                    ]}>
                    karma {mode.karma > 0 ? `+${mode.karma}` : mode.karma}
                  </Text>
                </View>
              </Pressable>
            ))}
            </View> : <Pressable accessibilityRole="button" onPress={() => onChoisir(null)} style={[styles.mode, { flex: 0 }]}>
              <Text style={styles.modeLabel}>{etat?.verbe || 'Interagir'}</Text>
            </Pressable>}

            <Pressable onPress={onFermer} style={styles.annuler}>
              <Text style={styles.annulerLabel}>Annuler</Text>
            </Pressable>
          </Panel>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.scrim,
  },
  carte: { width: 560, maxWidth: '100%', gap: spacing.md },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  apercu: { width: 56, height: 56 },
  description: { flex: 1, gap: spacing.xs },
  modes: { flexDirection: 'row', gap: spacing.md },
  cout: { fontFamily: fonts.body, fontSize: 12, color: colors.paLabel },
  mode: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  modePresse: { borderColor: colors.gold, backgroundColor: colors.goldSofter },
  modeLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
  modeDescription: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim, lineHeight: 17 },
  chiffres: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  chiffre: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textMute },
  annuler: { alignSelf: 'center', paddingVertical: spacing.sm },
  annulerLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textDim },
});
