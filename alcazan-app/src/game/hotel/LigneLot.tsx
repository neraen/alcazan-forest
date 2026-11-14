import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Annonce } from '@/src/core/api/hotelVente';
import { nombre } from '@/src/core/domain/texte';
import { imageItem } from '@/src/core/media';
import { colors, couleurRarete, fonts, radius, spacing } from '@/src/ui/tokens';
import Vignette from '@/src/ui/Vignette';

/**
 * Un lot de l'hôtel des ventes, en LIGNE : vignette, nom, sous-ligne, prix, action.
 *
 * Le web réutilise la carte d'article de l'échoppe en grille. Sur un téléphone en paysage
 * une grille ne montre que quatre lots à la fois ; or un marché se LIT — on compare des
 * prix dans une colonne. D'où une ligne de 56 pt, cinq lots visibles sans défiler, le
 * prix toujours au même endroit.
 */
export default function LigneLot({
  annonce,
  sousLigne,
  estompe = false,
  children,
}: {
  annonce: Annonce;
  sousLigne?: string | null;
  estompe?: boolean;
  /** Zone d'action à droite du prix (bouton, pastille de statut). */
  children?: ReactNode;
}) {
  const couleur = couleurRarete(annonce.item.rarete);
  return (
    <View style={[styles.ligne, estompe && styles.estompe]}>
      <Vignette src={imageItem(annonce.item)} initiale={annonce.item.nom} couleur={couleur}>
        {annonce.quantite > 1 && (
          <View style={styles.quantite}>
            <Text style={styles.quantiteLabel}>{annonce.quantite}</Text>
          </View>
        )}
      </Vignette>
      <View style={styles.corps}>
        <Text style={[styles.nom, { color: couleur }]} numberOfLines={1}>
          {annonce.item.nom}
        </Text>
        {!!sousLigne && (
          <Text style={styles.sousLigne} numberOfLines={1}>
            {sousLigne}
          </Text>
        )}
      </View>
      <View style={styles.prix}>
        <Text style={styles.prixTotal}>{nombre(annonce.prix)} po</Text>
        {annonce.quantite > 1 && (
          <Text style={styles.prixUnite}>{nombre(annonce.prixUnitaire)} po l’unité</Text>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.nav,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  estompe: { opacity: 0.7 },
  corps: { flex: 1, minWidth: 0, gap: 2 },
  nom: { fontFamily: fonts.bodyBold, fontSize: 13 },
  sousLigne: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  prix: { alignItems: 'flex-end' },
  prixTotal: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  prixUnite: { fontFamily: fonts.body, fontSize: 10, color: colors.textFaint },
  quantite: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.qtyBadgeBg,
  },
  quantiteLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.text },
});
