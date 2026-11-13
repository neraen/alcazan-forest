import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as boutiqueApi from '@/src/core/api/boutique';
import * as inventaireApi from '@/src/core/api/inventaire';
import { normaliserInventaire, type ItemNormalise } from '@/src/core/domain/items';
import { messageErreur } from '@/src/core/http';
import { iconeEquipement, mediaUrl } from '@/src/core/media';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

import ItemCard from './ItemCard';

type Onglet = 'acheter' | 'vendre';

/**
 * Échoppe — port de `pnj/shopView`. Deux onglets et la bourse du joueur, qui lit
 * `joueurState.money` : le serveur renvoie le solde après chaque opération et c'est LUI
 * qui fait foi, jamais une soustraction côté client.
 */
export default function ShopView({ items, pnjId }: { items: any[]; pnjId: number }) {
  const [onglet, setOnglet] = useState<Onglet>('acheter');
  const money = useAppSelector((s) => s.data.joueurState.money);

  return (
    <View style={styles.conteneur}>
      <View style={styles.barre}>
        <View style={styles.onglets}>
          {(['acheter', 'vendre'] as Onglet[]).map((valeur) => (
            <Pressable
              key={valeur}
              onPress={() => setOnglet(valeur)}
              style={[styles.onglet, onglet === valeur && styles.ongletActif]}>
              <Text style={[styles.ongletLabel, onglet === valeur && styles.ongletLabelActif]}>
                {valeur === 'acheter' ? 'Acheter' : 'Vendre'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.bourse}>
          <Image
            source={{ uri: mediaUrl('/img/gui/Money03.png') }}
            style={styles.piece}
            contentFit="contain"
          />
          <Text style={styles.or}>{money}</Text>
        </View>
      </View>

      {onglet === 'acheter' ? <Acheter items={items} pnjId={pnjId} /> : <Vendre />}
    </View>
  );
}

function Acheter({ items, pnjId }: { items: any[]; pnjId: number }) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const money = useAppSelector((s) => s.data.joueurState.money);
  // Id de l'achat en cours : neutralise les boutons le temps de l'aller-retour, sinon un
  // double appui débite deux fois.
  const [achatEnCours, setAchatEnCours] = useState<number | null>(null);

  const acheter = async (item: any) => {
    if (achatEnCours !== null) return;
    setAchatEnCours(item.idEquipement);
    try {
      const achat = await boutiqueApi.buyItem(item.idEquipement, pnjId);
      dispatch(updateJoueurState({ money: achat.money }));
      toast.success(achat.message || `${item.nomEquipement} acheté.`);
    } catch (erreur) {
      const reponse = (erreur as any)?.response?.data;
      if (reponse?.money !== undefined) dispatch(updateJoueurState({ money: reponse.money }));
      toast.error(messageErreur(erreur, "L'achat n'a pas pu aboutir."));
    } finally {
      setAchatEnCours(null);
    }
  };

  if ((items ?? []).length === 0) {
    return <Text style={styles.vide}>Cet étal est vide pour le moment.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.grille}>
      {items.map((item) => {
        const abordable = Number(money) >= Number(item.prixAchat);
        return (
          <ItemCard
            key={item.idEquipement}
            name={item.nomEquipement}
            img={iconeEquipement(item.icone, item.position)}
            rarity={item.rarityName}
            caracteristiques={item.caracteristiques}
            price={item.prixAchat}
            meta={`Niveau requis : ${item.levelMinEquipement}`}
            actionLabel="Acheter"
            pending={achatEnCours === item.idEquipement}
            disabled={!abordable || achatEnCours !== null}
            disabledLabel={abordable ? undefined : 'Or insuffisant'}
            onAction={() => acheter(item)}
          />
        );
      })}
    </ScrollView>
  );
}

const FILTRES = [
  { id: 'tous', label: 'Tout' },
  { id: 'equipement', label: 'Équip.' },
  { id: 'consommable', label: 'Conso.' },
  { id: 'objet', label: 'Objets' },
] as const;

function Vendre() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [inventaire, setInventaire] = useState<any>({ equipements: [], consommables: [], objets: [] });
  const [filtre, setFiltre] = useState<string>('tous');
  const [venteEnCours, setVenteEnCours] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const charger = () =>
    inventaireApi
      .getPlayerInventaire()
      .then(setInventaire)
      .catch(() => toast.error("Impossible de charger votre inventaire."))
      .finally(() => setChargement(false));

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => normaliserInventaire(inventaire), [inventaire]);
  const filtres = filtre === 'tous' ? items : items.filter((item) => item.cat === filtre);

  const vendre = async (item: ItemNormalise) => {
    if (venteEnCours !== null) return;
    setVenteEnCours(item.key);
    try {
      // Le client n'envoie JAMAIS de montant : le serveur recalcule le prix de revente.
      const vente = await boutiqueApi.sellItem(item.cat, item.id, 1);
      dispatch(updateJoueurState({ money: vente.money }));
      toast.success(vente.message || `${item.name} vendu.`);
      await charger();
    } catch (erreur) {
      toast.error(messageErreur(erreur, "La vente n'a pas pu aboutir."));
    } finally {
      setVenteEnCours(null);
    }
  };

  if (chargement) return <Text style={styles.vide}>Chargement du sac…</Text>;

  return (
    <View style={styles.flex}>
      <View style={styles.filtres}>
        {FILTRES.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFiltre(f.id)}
            style={[styles.filtre, filtre === f.id && styles.filtreActif]}>
            <Text style={[styles.filtreLabel, filtre === f.id && styles.filtreLabelActif]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtres.length === 0 ? (
        <Text style={styles.vide}>Rien à vendre ici.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.grille}>
          {filtres.map((item) => (
            <ItemCard
              key={item.key}
              name={item.name}
              img={item.img}
              rarity={item.rarity}
              caracteristiques={item.caracteristiques}
              price={item.value}
              meta={`Possédé : ${item.qty}`}
              actionLabel="Vendre"
              pending={venteEnCours === item.key}
              disabled={venteEnCours !== null}
              onAction={() => vendre(item)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  flex: { flex: 1 },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  onglets: { flexDirection: 'row', gap: spacing.xs, flex: 1 },
  onglet: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.tab,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
  },
  ongletActif: { backgroundColor: colors.goldSofter, borderColor: colors.gold },
  ongletLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textDim },
  ongletLabelActif: { color: colors.gold },
  bourse: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  piece: { width: 16, height: 16 },
  or: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
  },
  filtres: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg },
  filtre: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.bar,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
  },
  filtreActif: { backgroundColor: colors.goldSofter, borderColor: colors.gold },
  filtreLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim },
  filtreLabelActif: { fontFamily: fonts.bodyBold, color: colors.gold },
  vide: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
