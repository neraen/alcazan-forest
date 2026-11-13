import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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
 */
export default function InteractionSheet({
  nom,
  etat,
  modes,
  onChoisir,
  onFermer,
}: {
  nom: string;
  etat?: EtatInteraction;
  modes: ModeRecolte[];
  onChoisir: (mode: 'ethique' | 'intensive') => void;
  onFermer: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onFermer}>
      <Pressable style={styles.backdrop} onPress={onFermer}>
        <Pressable onPress={() => {}}>
          <Panel style={styles.carte}>
            <SectionTitle size="sm">{etat?.nom || nom}</SectionTitle>
            {!!etat?.coutPa && <Text style={styles.cout}>{etat.coutPa} PA</Text>}

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

            <Pressable onPress={onFermer} style={styles.annuler}>
              <Text style={styles.annulerLabel}>Annuler</Text>
            </Pressable>
          </Panel>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(4, 20, 26, 0.86)',
  },
  carte: { width: '100%', maxWidth: 420, gap: spacing.md },
  cout: { fontFamily: fonts.body, fontSize: 12, color: colors.paLabel },
  mode: {
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
