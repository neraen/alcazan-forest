import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import * as craftApi from '@/src/core/api/craft';
import type { Commande, ReponseCraft } from '@/src/core/api/craft';
import { messageErreur } from '@/src/core/http';
import { mediaUrl } from '@/src/core/media';
import { useAppDispatch } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import FileFabrication from '@/src/game/artisanat/FileFabrication';
import { confirmer } from '@/src/ui/confirmer';
import GameButton from '@/src/ui/GameButton';
import ModalShell from '@/src/ui/ModalShell';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { spacing } from '@/src/ui/tokens';
import { Chargement } from '@/src/ui/Vide';

/**
 * Établi de poche — port de `modals/atelierModal/AtelierModal.jsx` : la file de
 * fabrication, sans le catalogue (qui vit sur l'écran Artisanat). Deux écrans, une seule
 * liste : `FileFabrication`.
 */
export default function EtabliScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  // Ouvert DEPUIS l'artisanat, le bouton « Ouvrir l'artisanat » ramène en arrière au lieu
  // d'empiler un second écran Artisanat par-dessus le premier.
  const { depuis } = useLocalSearchParams<{ depuis?: string }>();

  const [commandes, setCommandes] = useState<Commande[] | null>(null);
  const [enCours, setEnCours] = useState(false);

  useFocusEffect(
    useCallback(() => {
      craftApi
        .commandes()
        .then((reponse) => setCommandes(reponse.commandes || []))
        .catch(() => toast.error("L'établi est inaccessible."));
    }, [toast]),
  );

  const agir = async (appel: () => Promise<ReponseCraft>) => {
    setEnCours(true);
    try {
      const reponse = await appel();
      (reponse.messages || [reponse.message]).filter(Boolean).forEach((m) => toast.info(m as string));
      setCommandes(reponse.commandes || []);
      // Le sac a bougé (objet produit, matériaux rendus) : la carte se resynchronise.
      dispatch(updateJoueurState({ needRefresh: true }));
    } catch (erreur) {
      toast.error(messageErreur(erreur, 'Une erreur est survenue.'));
    } finally {
      setEnCours(false);
    }
  };

  const annuler = (commande: Commande) =>
    confirmer(
      `Annuler « ${commande.nom} » ?`,
      'Les matériaux vous seront rendus, mais le temps déjà passé est perdu.',
      () => agir(() => craftApi.annuler(commande.id)),
      { libelle: 'Annuler la fabrication', destructif: true },
    );

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/menu/epee.png')}
      title="Établi"
      subtitle="Fabrications en cours"
      headerRight={
        <GameButton
          variant="ghost"
          style={styles.lien}
          onPress={() =>
            depuis === 'artisanat' ? router.back() : router.replace('/(jeu)/artisanat' as never)
          }>
          Artisanat
        </GameButton>
      }
      onClose={() => router.back()}>
      {commandes === null ? (
        <Chargement />
      ) : (
        <ScrollView contentContainerStyle={styles.corps}>
          <FileFabrication
            commandes={commandes}
            occupe={enCours}
            onRetirer={(commande) => agir(() => craftApi.retirer(commande.id))}
            onAnnuler={annuler}
          />
        </ScrollView>
      )}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  corps: { padding: spacing.lg, alignSelf: 'center', width: '100%', maxWidth: 640 },
  lien: { minHeight: 34, paddingHorizontal: 14 },
});
