import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import GameButton from '@/src/ui/GameButton';
import { colors, couleurRarete, fonts, radius, spacing } from '@/src/ui/tokens';

/**
 * Carte d'article MUTUALISÉE entre l'étal du marchand et la revente — même règle que sur
 * le web (`pnj/shopView/itemCard/ItemCard.jsx`) : ne pas redupliquer de markup de carte
 * ailleurs. Seul écart assumé avec le web : l'hôtel des ventes ne s'en sert PAS (il liste
 * des lots en LIGNES, `game/hotel/LigneLot`) — une grille de cartes n'y montrait que
 * quatre annonces à la fois sur 400 pt de haut.
 */
export default function ItemCard({
  name,
  img,
  rarity,
  caracteristiques = [],
  price,
  meta,
  subline,
  actionLabel,
  disabled,
  disabledLabel,
  pending,
  onAction,
}: {
  name: string;
  img?: string;
  rarity?: string;
  caracteristiques?: { nom?: string; valeur?: number }[];
  price?: number;
  meta?: string;
  subline?: string;
  actionLabel: string;
  disabled?: boolean;
  disabledLabel?: string;
  pending?: boolean;
  onAction: () => void;
}) {
  return (
    <View style={[styles.carte, { borderColor: couleurRarete(rarity) }]}>
      <View style={styles.haut}>
        <View style={[styles.vignette, { borderColor: couleurRarete(rarity) }]}>
          {!!img && <Image source={{ uri: img }} style={styles.image} contentFit="contain" />}
        </View>
        <View style={styles.infos}>
          <Text style={[styles.nom, { color: couleurRarete(rarity) }]} numberOfLines={2}>
            {name}
          </Text>
          {!!meta && <Text style={styles.meta}>{meta}</Text>}
          {!!subline && <Text style={styles.meta}>{subline}</Text>}
        </View>
      </View>

      {caracteristiques.length > 0 && (
        <View style={styles.caracs}>
          {caracteristiques.slice(0, 4).map((carac, i) => (
            <Text key={i} style={styles.carac}>
              {carac.nom} {(carac.valeur ?? 0) > 0 ? `+${carac.valeur}` : carac.valeur}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.bas}>
        {price !== undefined && <Text style={styles.prix}>{price} Or</Text>}
        <GameButton
          variant="solid"
          onPress={onAction}
          disabled={disabled}
          loading={pending}
          style={styles.bouton}>
          {disabled && disabledLabel ? disabledLabel : actionLabel}
        </GameButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    width: 232,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    backgroundColor: colors.rowBg,
  },
  haut: { flexDirection: 'row', gap: spacing.md },
  vignette: {
    width: 46,
    height: 46,
    borderRadius: radius.slot,
    borderWidth: 1,
    backgroundColor: colors.spellThumbBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '82%', height: '82%' },
  infos: { flex: 1, gap: 2 },
  nom: { fontFamily: fonts.bodyBold, fontSize: 13 },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  caracs: { gap: 1 },
  carac: { fontFamily: fonts.body, fontSize: 11, color: colors.bonus },
  bas: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  prix: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 12, color: colors.gold },
  bouton: { minHeight: 34, paddingHorizontal: 12 },
});
