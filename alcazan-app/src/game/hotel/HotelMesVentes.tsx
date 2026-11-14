import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Annonce, MesVentes } from '@/src/core/api/hotelVente';
import { tempsRestant } from '@/src/core/domain/temps';
import GameButton from '@/src/ui/GameButton';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';

import LigneLot from './LigneLot';

/**
 * Onglet « Mes ventes » — port de `hotelVenteModal/HotelMesVentes.jsx`.
 *
 * L'historique n'est pas décoratif : c'est le seul endroit où le vendeur apprend qu'un
 * lot s'est vendu pendant qu'il était déconnecté — l'or a été crédité sans notification.
 * Les deux listes sont donc CÔTE À CÔTE, visibles ensemble, plutôt qu'empilées avec
 * l'historique sous la ligne de flottaison.
 */
export default function HotelMesVentes({
  donnees,
  occupe,
  onRetirer,
}: {
  donnees: MesVentes | null;
  occupe: boolean;
  onRetirer: (annonce: Annonce) => void;
}) {
  if (donnees === null) return <Chargement />;

  const { actives, historique } = donnees;

  return (
    <View style={styles.corps}>
      <View style={styles.colonne}>
        <View style={styles.entete}>
          <Text style={styles.titre}>Lots en vente</Text>
          <Text style={styles.compteur}>
            {actives.length} / {donnees.curseurs?.annoncesMax}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.liste}>
          {actives.length === 0 && <Vide>Vous n’avez aucun lot en vente.</Vide>}
          {actives.map((annonce) => (
            <LigneLot
              key={annonce.id}
              annonce={annonce}
              sousLigne={`${tempsRestant(annonce.expiresAt) ?? '—'} restant`}>
              <GameButton
                variant="ghost"
                style={styles.retirer}
                disabled={occupe}
                onPress={() => onRetirer(annonce)}>
                Retirer
              </GameButton>
            </LigneLot>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.colonne, styles.colonneDroite]}>
        <View style={styles.entete}>
          <Text style={styles.titre}>Historique</Text>
        </View>
        <ScrollView contentContainerStyle={styles.liste}>
          {historique.length === 0 && <Vide>Aucune vente conclue pour le moment.</Vide>}
          {historique.map((annonce) => {
            const vendue = annonce.statut === 'vendue';
            return (
              <LigneLot
                key={annonce.id}
                annonce={annonce}
                estompe={!vendue}
                sousLigne={vendue ? 'Or crédité' : 'Objet rendu'}>
                <View style={[styles.badge, vendue && styles.badgeVendue]}>
                  <Text style={[styles.badgeLabel, vendue && styles.badgeLabelVendue]}>
                    {annonce.statutLabel}
                  </Text>
                </View>
              </LigneLot>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },
  colonne: { flex: 1, minWidth: 0 },
  colonneDroite: { borderLeftWidth: 1, borderLeftColor: colors.goldDivider },
  entete: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  titre: {
    fontFamily: fonts.title,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  compteur: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textMute },
  liste: { padding: spacing.md, gap: spacing.xs + 2 },
  retirer: { minHeight: 36, paddingHorizontal: 12 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.slotDash,
  },
  badgeVendue: { borderColor: colors.successBorder, backgroundColor: colors.successBg },
  badgeLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.textFaint },
  badgeLabelVendue: { color: colors.success },
});
