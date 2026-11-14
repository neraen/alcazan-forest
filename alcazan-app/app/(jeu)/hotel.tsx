import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as hotelApi from '@/src/core/api/hotelVente';
import type { Annonce, MesVentes } from '@/src/core/api/hotelVente';
import { nombre } from '@/src/core/domain/texte';
import { mediaUrl } from '@/src/core/media';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import HotelAcheter from '@/src/game/hotel/HotelAcheter';
import HotelMesVentes from '@/src/game/hotel/HotelMesVentes';
import HotelVendre from '@/src/game/hotel/HotelVendre';
import { confirmer } from '@/src/ui/confirmer';
import ModalShell from '@/src/ui/ModalShell';
import Onglets from '@/src/ui/Onglets';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts } from '@/src/ui/tokens';

type Onglet = 'acheter' | 'vendre' | 'mesventes';

/**
 * Hôtel des ventes — port de `modals/hotelVenteModal/HotelVenteModal.jsx` : marché
 * ASYNCHRONE entre joueurs, on dépose un lot et on repart.
 *
 * Aucune règle de jeu ici. Les frais, la disponibilité d'un lot et l'or débité sont
 * arbitrés par le serveur ; l'écran affiche ce qu'il renvoie et se resynchronise après
 * chaque action. Pas de Mercure et c'est un choix : la course entre deux acheteurs est
 * déjà réglée par le 409. Pas de slice Redux non plus — personne d'autre que cet écran
 * n'a besoin de cet état.
 */
export default function HotelScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const money = useAppSelector((s) => s.data.joueurState.money);

  const [onglet, setOnglet] = useState<Onglet>('acheter');
  const [mesVentes, setMesVentes] = useState<MesVentes | null>(null);
  const [enCours, setEnCours] = useState(false);
  const verrou = useRef(false);

  const chargerMesVentes = useCallback(
    () =>
      hotelApi
        .mesVentes()
        .then((donnees) => {
          setMesVentes(donnees);
          // L'or a pu changer sans nous : un lot vendu pendant qu'on était ailleurs.
          dispatch(updateJoueurState({ money: donnees.money }));
        })
        .catch(() => toast.error("L'hôtel des ventes est inaccessible.")),
    [dispatch, toast],
  );

  // Rechargé à l'ouverture ET à chaque changement d'onglet : un lot a pu se vendre.
  useEffect(() => {
    chargerMesVentes();
  }, [onglet, chargerMesVentes]);

  /**
   * Toute action passe par ici : une requête à la fois, l'or vient du serveur, et le sac
   * est marqué à rafraîchir. Un 409 n'est pas une erreur du joueur — son écran était
   * périmé, on l'en informe sans dramatiser et l'appelant recharge sa liste.
   */
  const agir = async (appel: () => Promise<{ message?: string; money?: number }>) => {
    if (verrou.current) return;
    verrou.current = true;
    setEnCours(true);
    try {
      const reponse = await appel();
      if (reponse.message) toast.success(reponse.message);
      dispatch(updateJoueurState({ money: reponse.money, needRefresh: true }));
      await chargerMesVentes();
    } catch (erreur) {
      const reponse = (erreur as { response?: { status?: number; data?: { error?: string } } }).response;
      if (reponse?.status === 409) {
        toast.info(reponse.data?.error || 'Ce lot vient de changer de main.');
      } else {
        toast.error(reponse?.data?.error || "L'opération n'a pas abouti.");
      }
      await chargerMesVentes();
    } finally {
      verrou.current = false;
      setEnCours(false);
    }
  };

  const retirer = (annonce: Annonce) =>
    confirmer(
      `Retirer « ${annonce.item.nom} » de la vente ?`,
      `L'objet vous sera rendu, mais les ${annonce.fraisDepot ?? 0} po de frais de dépôt ne sont pas remboursés.`,
      () => agir(() => hotelApi.retirer(annonce.id)),
      { libelle: 'Retirer', destructif: true },
    );

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/gui/Money03.png')}
      title="Hôtel des ventes"
      subtitle={
        mesVentes
          ? `${mesVentes.emplacementsUtilises} / ${mesVentes.curseurs.annoncesMax} lots en vente`
          : 'Marché entre aventuriers'
      }
      headerRight={
        <View style={styles.bourse}>
          <Image source={{ uri: mediaUrl('/img/gui/Money03.png') }} style={styles.piece} contentFit="contain" />
          <Text style={styles.or}>{nombre(money)}</Text>
        </View>
      }
      onClose={() => router.back()}>
      <Onglets<Onglet>
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { cle: 'acheter', label: 'Acheter' },
          { cle: 'vendre', label: 'Vendre' },
          { cle: 'mesventes', label: 'Mes ventes', pastille: mesVentes?.actives.length || undefined },
        ]}
      />
      {onglet === 'acheter' && (
        <HotelAcheter
          occupe={enCours}
          onAcheter={(annonce) => agir(() => hotelApi.acheter(annonce.id, annonce.prix))}
        />
      )}
      {onglet === 'vendre' && (
        <HotelVendre
          curseurs={mesVentes?.curseurs}
          emplacementsUtilises={mesVentes?.emplacementsUtilises ?? 0}
          occupe={enCours}
          onVendre={(type, itemId, quantite, prix) =>
            agir(() => hotelApi.vendre(type, itemId, quantite, prix))
          }
        />
      )}
      {onglet === 'mesventes' && (
        <HotelMesVentes donnees={mesVentes} occupe={enCours} onRetirer={retirer} />
      )}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  bourse: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  piece: { width: 16, height: 16 },
  or: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
});
