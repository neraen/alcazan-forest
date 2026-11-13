import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as boutiqueApi from '@/src/core/api/boutique';
import { messageErreur } from '@/src/core/http';
import { iconeConsommable } from '@/src/core/media';
import { useAppDispatch } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import Slot from '@/src/ui/Slot';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts } from '@/src/ui/tokens';

type ConsommableBarre = {
  id: number;
  nom: string;
  icone: string;
  cooldown?: number;
  quantity?: number;
};

/** Potion de la barre d'action — port de `components/consommable/Consommable.jsx`. */
export default function ConsommableSlotButton({ consommable }: { consommable: ConsommableBarre }) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [restant, setRestant] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => clearInterval(intervalRef.current ?? undefined), []);

  const boire = async () => {
    if (restant > 0) return;
    const duree = (consommable.cooldown ?? 0) * 1000;
    if (duree > 0) {
      setRestant(duree);
      const fin = Date.now() + duree;
      intervalRef.current = setInterval(() => {
        const reste = fin - Date.now();
        if (reste <= 0) {
          clearInterval(intervalRef.current ?? undefined);
          setRestant(0);
        } else setRestant(reste);
      }, 100);
    }

    try {
      const apres = await boutiqueApi.takeConsommable(consommable.id);
      dispatch(updateJoueurState({ lifeJoueur: apres.life, manaJoueur: apres.mana }));
      if (apres.message) toast.info(apres.message);
      // La pile a pu tomber à zéro : la barre se relit (le serveur fait foi sur le stock).
      dispatch(updateJoueurState({ consommableBarVersion: Date.now() }));
    } catch (erreur) {
      toast.error(messageErreur(erreur, "Impossible d'utiliser cet objet."));
    }
  };

  return (
    <Slot src={iconeConsommable(consommable.icone)} onPress={boire} disabled={restant > 0}>
      {!!consommable.quantity && consommable.quantity > 1 && (
        <View style={styles.quantite}>
          <Text style={styles.quantiteLabel}>{consommable.quantity}</Text>
        </View>
      )}
      {restant > 0 && (
        <View style={styles.voile}>
          <Text style={styles.compte}>{(restant / 1000).toFixed(1)}</Text>
        </View>
      )}
    </Slot>
  );
}

const styles = StyleSheet.create({
  voile: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compte: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
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
