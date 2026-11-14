import { StyleSheet, Text, View } from 'react-native';

import type { Commande } from '@/src/core/api/craft';
import { avancement, enClair, secondesRestantes, useHorloge } from '@/src/core/domain/temps';
import { imageItem } from '@/src/core/media';
import GameButton from '@/src/ui/GameButton';
import GaugeBar from '@/src/ui/GaugeBar';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import { Vide } from '@/src/ui/Vide';
import Vignette from '@/src/ui/Vignette';

/**
 * La file de fabrication du joueur — port de `artisanat/fileFabrication/FileFabrication.jsx`.
 *
 * Aucune règle de jeu ici : `prete` vient du serveur, qui revérifie au retrait. Le compte
 * à rebours et la barre sont recalculés depuis `lanceeAt`/`pretAt` (horloge serveur),
 * jamais décomptés.
 */
export default function FileFabrication({
  commandes,
  commandesMax,
  occupe = false,
  onRetirer,
  onAnnuler,
}: {
  commandes: Commande[];
  commandesMax?: number;
  occupe?: boolean;
  onRetirer: (commande: Commande) => void;
  onAnnuler: (commande: Commande) => void;
}) {
  useHorloge(commandes.length > 0);

  if (commandes.length === 0) {
    return <Vide>Votre établi est vide : lancez une fabrication pour l’occuper.</Vide>;
  }

  return (
    <View style={styles.liste}>
      {commandes.map((commande) => {
        const restant = secondesRestantes(commande.pretAt);
        const prete = commande.prete || restant <= 0;
        return (
          <View key={commande.id} style={[styles.ligne, prete && styles.lignePrete]}>
            <Vignette
              src={imageItem(commande.produit)}
              initiale={commande.nom}
              taille="lg"
            />
            <View style={styles.corps}>
              <View style={styles.entete}>
                <Text style={styles.nom} numberOfLines={1}>
                  {commande.nom}
                  {commande.produit && commande.produit.quantite > 1
                    ? `  ×${commande.produit.quantite}`
                    : ''}
                </Text>
                <Text style={[styles.etat, prete && styles.etatPret]}>
                  {prete ? 'Prête' : enClair(restant)}
                </Text>
              </View>
              <GaugeBar
                variant="xp"
                showValues={false}
                value={prete ? 100 : avancement(commande.lanceeAt, commande.pretAt)}
                max={100}
                height={8}
              />
              <Text style={styles.mode} numberOfLines={1}>
                {commande.modeLabel}
              </Text>
            </View>
            {prete ? (
              <GameButton variant="solid" disabled={occupe} onPress={() => onRetirer(commande)}>
                Retirer
              </GameButton>
            ) : (
              <GameButton variant="ghost" disabled={occupe} onPress={() => onAnnuler(commande)}>
                Annuler
              </GameButton>
            )}
          </View>
        );
      })}
      {!!commandesMax && commandes.length >= commandesMax && (
        <Text style={styles.plafond}>
          Établi complet ({commandes.length} / {commandesMax}) : retirez une fabrication pour en
          lancer une autre.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  liste: { gap: spacing.sm },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  lignePrete: { borderColor: colors.successBorder, backgroundColor: colors.successBg },
  corps: { flex: 1, minWidth: 0, gap: 5 },
  entete: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  nom: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  etat: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMute },
  etatPret: { color: colors.success },
  mode: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  plafond: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.paLabel,
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
});
