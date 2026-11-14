import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Metier } from '@/src/core/api/metier';
import { iconeMetier } from '@/src/core/media';
import GaugeBar from '@/src/ui/GaugeBar';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import Vignette from '@/src/ui/Vignette';

/**
 * Fiche de progression d'un métier appris — port de `artisanat/metierCard/MetierCard.jsx`.
 *
 * La barre se trace entre les DEUX paliers renvoyés par le serveur
 * (`experienceNiveauCourant` → `experienceProchainNiveau`) : calculée sur 0 → prochain
 * palier, elle repartirait en arrière à chaque montée de niveau.
 */
export default function MetierCard({
  metier,
  actif,
  onPress,
}: {
  metier: Metier;
  actif: boolean;
  onPress: () => void;
}) {
  const acquis = Math.max(0, metier.experience - metier.experienceNiveauCourant);
  const palier = Math.max(1, metier.experienceProchainNiveau - metier.experienceNiveauCourant);
  const auMaximum = metier.niveau >= metier.niveauMax;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: actif }}
      style={({ pressed }) => [styles.carte, actif && styles.carteActive, pressed && styles.presse]}>
      <Vignette src={iconeMetier(metier.icone)} initiale={metier.nom} taille="md" />
      <View style={styles.corps}>
        <View style={styles.entete}>
          <Text style={[styles.nom, actif && styles.nomActif]} numberOfLines={1}>
            {metier.nom}
          </Text>
          <Text style={styles.niveau}>niv. {metier.niveau}</Text>
        </View>
        <GaugeBar
          variant="xp"
          showValues={false}
          value={auMaximum ? palier : acquis}
          max={palier}
          height={6}
        />
        <Text style={styles.chiffres}>
          {auMaximum ? 'Maîtrise complète' : `${acquis} / ${palier} XP`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.sm,
    borderRadius: radius.nav,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  carteActive: { borderColor: colors.gold, backgroundColor: colors.goldSofter },
  presse: { opacity: 0.75 },
  corps: { flex: 1, minWidth: 0, gap: 3 },
  entete: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  nom: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  nomActif: { color: colors.gold },
  niveau: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.level },
  chiffres: { fontFamily: fonts.body, fontSize: 10, color: colors.textFaint },
});
