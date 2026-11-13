import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as inventaireApi from '@/src/core/api/inventaire';
import * as usersApi from '@/src/core/api/users';
import {
  cumulerCaracteristiquesEquipement,
  LIBELLE_CARACTERISTIQUE,
  type NomCaracteristique,
} from '@/src/core/domain/caracteristiques';
import {
  EMPLACEMENTS_EQUIPEMENT,
  LIBELLE_CATEGORIE,
  normaliserEquipement,
  normaliserInventaire,
  type CategorieItem,
  type ItemNormalise,
} from '@/src/core/domain/items';
import { messageErreur } from '@/src/core/http';
import { mediaUrl } from '@/src/core/media';
import { useAppDispatch } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import GameButton from '@/src/ui/GameButton';
import ModalShell from '@/src/ui/ModalShell';
import Slot from '@/src/ui/Slot';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, couleurRarete, fonts, radius, spacing } from '@/src/ui/tokens';

const ONGLETS: { id: 'tous' | CategorieItem; label: string }[] = [
  { id: 'tous', label: 'Tout' },
  { id: 'equipement', label: 'Équip.' },
  { id: 'consommable', label: 'Conso.' },
  { id: 'objet', label: 'Objets' },
];

/**
 * Inventaire — port de `components/inventory/screen/InventoryScreen.jsx`.
 *
 * ⚠️ Équiper / retirer passe UNIQUEMENT par `inventaire/equipement/wear|unwear` :
 * `EquipementEquipeService` fait tout en une transaction (possession, échange avec
 * l'ancien objet, bonus symétriques). Refaire un va-et-vient sac/équipement côté client
 * est exactement ce qui avait dupliqué l'objet équipé sur le web.
 */
export default function InventaireScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [chargement, setChargement] = useState(true);
  const [inventaire, setInventaire] = useState<any>({ equipements: [], consommables: [], objets: [] });
  const [equipes, setEquipes] = useState<any[]>([]);
  const [user, setUser] = useState<any>({});
  const [onglet, setOnglet] = useState<'tous' | CategorieItem>('tous');
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState<ItemNormalise | null>(null);

  const toutCharger = useCallback(async () => {
    const [dataInventaire, dataEquipe, dataUser] = await Promise.all([
      inventaireApi.getPlayerInventaire(),
      inventaireApi.getEquipementEquipe(),
      usersApi.find(),
    ]);
    setInventaire(dataInventaire);
    setEquipes(dataEquipe);
    setUser(dataUser);
    setChargement(false);
  }, []);

  const relireItems = useCallback(async () => {
    const [dataInventaire, dataEquipe] = await Promise.all([
      inventaireApi.getPlayerInventaire(),
      inventaireApi.getEquipementEquipe(),
    ]);
    setInventaire(dataInventaire);
    setEquipes(dataEquipe);
  }, []);

  useEffect(() => {
    toutCharger().catch(() => {
      toast.error("Impossible de charger l'inventaire.");
      setChargement(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => normaliserInventaire(inventaire), [inventaire]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let liste = onglet === 'tous' ? items : items.filter((item) => item.cat === onglet);
    if (q) liste = liste.filter((item) => (item.name || '').toLowerCase().includes(q));
    return liste;
  }, [items, onglet, recherche]);

  const portes = useMemo(() => equipes.map((e) => normaliserEquipement(e, true)), [equipes]);
  const bonus = useMemo(() => cumulerCaracteristiquesEquipement(equipes), [equipes]);
  const parPosition = useMemo(() => {
    const index: Record<string, ItemNormalise> = {};
    portes.forEach((item) => {
      if (item.position) index[item.position] = item;
    });
    return index;
  }, [portes]);

  const equiper = async (item: ItemNormalise) => {
    try {
      await inventaireApi.wearEquipement(item.id);
      toast.success(`${item.name} équipé.`);
    } catch (erreur) {
      toast.error(messageErreur(erreur, "Impossible d'équiper cet objet."));
    }
    setSelection(null);
    await relireItems();
    // Les caractéristiques changent : la carte doit relire la fiche du personnage.
    dispatch(updateJoueurState({ needRefresh: true }));
  };

  const retirer = async (item: ItemNormalise) => {
    try {
      await inventaireApi.unwearEquipement(item.id);
      toast.success(`${item.name} retiré.`);
    } catch (erreur) {
      toast.error(messageErreur(erreur, 'Impossible de retirer cet objet.'));
    }
    setSelection(null);
    await relireItems();
    dispatch(updateJoueurState({ needRefresh: true }));
  };

  const placerConsommable = async (item: ItemNormalise, position: 1 | 2) => {
    try {
      await usersApi.equipConsommable(item.id, position);
      toast.success(`${item.name} placé en ${position}.`);
      // Rafraîchit la barre d'action vivante sous la carte.
      dispatch(updateJoueurState({ consommableBarVersion: Date.now() }));
    } catch (erreur) {
      toast.error(messageErreur(erreur, "Impossible de placer cet objet."));
    }
  };

  const total = items.reduce((somme, item) => somme + item.qty, 0);

  if (chargement) {
    return (
      <ModalShell title="Inventaire" onClose={() => router.back()}>
        <View style={styles.centre}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/icons/bag.png')}
      title="Inventaire"
      subtitle={`${total} objets`}
      headerRight={
        <View style={styles.bourses}>
          <Bourse icone="/img/gui/Money03.png" valeur={user.money} couleur={colors.gold} />
          <Bourse icone="/img/gui/10.png" valeur={user.actionPoint} couleur={colors.paLabel} />
          <Bourse icone="/img/gui/36.png" valeur={user.mouvementPoint} couleur={colors.mpLabel} />
        </View>
      }
      onClose={() => router.back()}
      footer={
        selection ? (
          <DetailItem
            item={selection}
            onEquiper={() => equiper(selection)}
            onRetirer={() => retirer(selection)}
            onPlacer={(position) => placerConsommable(selection, position)}
          />
        ) : (
          <Text style={styles.indice}>Touchez un objet pour voir son détail.</Text>
        )
      }>
      <View style={styles.corps}>
        {/* Sac */}
        <View style={styles.sac}>
          <View style={styles.onglets}>
            {ONGLETS.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => setOnglet(o.id)}
                style={[styles.onglet, onglet === o.id && styles.ongletActif]}>
                <Text style={[styles.ongletLabel, onglet === o.id && styles.ongletLabelActif]}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher un objet"
            placeholderTextColor={colors.textDim3}
            style={styles.recherche}
          />

          <ScrollView contentContainerStyle={styles.grille}>
            {filtres.length === 0 && <Text style={styles.vide}>Rien ici.</Text>}
            {filtres.map((item) => (
              <Slot
                key={item.key}
                src={item.img || undefined}
                onPress={() => setSelection(item)}
                selected={selection?.key === item.key}
                style={{ borderColor: couleurRarete(item.rarity) }}>
                {item.qty > 1 && (
                  <View style={styles.quantite}>
                    <Text style={styles.quantiteLabel}>{item.qty}</Text>
                  </View>
                )}
              </Slot>
            ))}
          </ScrollView>
        </View>

        {/* Équipement porté */}
        <ScrollView style={styles.fiche} contentContainerStyle={styles.ficheContenu}>
          <Text style={styles.titreFiche}>Équipement</Text>
          {EMPLACEMENTS_EQUIPEMENT.map((emplacement) => {
            const porte = parPosition[emplacement.position];
            return (
              <Pressable
                key={emplacement.position}
                onPress={() => porte && setSelection(porte)}
                style={styles.ligneEquipement}>
                <Slot src={porte?.img || undefined} size="mini" />
                <View style={styles.ligneTextes}>
                  <Text style={styles.emplacement}>{emplacement.label}</Text>
                  <Text
                    style={[
                      styles.nomPorte,
                      { color: porte ? couleurRarete(porte.rarity) : colors.textDim3 },
                    ]}
                    numberOfLines={1}>
                    {porte?.name ?? '—'}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          <Text style={styles.titreFiche}>Bonus d'équipement</Text>
          <View style={styles.bonus}>
            {(Object.keys(bonus) as NomCaracteristique[])
              .filter((carac) => bonus[carac] !== 0)
              .map((carac) => (
                <Text key={carac} style={styles.bonusLigne}>
                  {LIBELLE_CARACTERISTIQUE[carac]} <Text style={styles.bonusValeur}>+{bonus[carac]}</Text>
                </Text>
              ))}
            {Object.values(bonus).every((v) => v === 0) && (
              <Text style={styles.vide}>Aucun bonus pour le moment.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </ModalShell>
  );
}

function Bourse({ icone, valeur, couleur }: { icone: string; valeur?: number; couleur: string }) {
  return (
    <View style={styles.bourse}>
      <Image source={{ uri: mediaUrl(icone) }} style={styles.bourseIcone} contentFit="contain" />
      <Text style={[styles.bourseValeur, { color: couleur }]}>{valeur ?? 0}</Text>
    </View>
  );
}

function DetailItem({
  item,
  onEquiper,
  onRetirer,
  onPlacer,
}: {
  item: ItemNormalise;
  onEquiper: () => void;
  onRetirer: () => void;
  onPlacer: (position: 1 | 2) => void;
}) {
  return (
    <View style={styles.detail}>
      <Slot src={item.img || undefined} />
      <View style={styles.detailTextes}>
        <Text style={[styles.detailNom, { color: couleurRarete(item.rarity) }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.detailMeta}>
          {LIBELLE_CATEGORIE[item.cat]}
          {item.levelMin ? ` · niveau ${item.levelMin}` : ''}
          {item.value ? ` · ${item.value} Or` : ''}
        </Text>
        {!!item.desc && (
          <Text style={styles.detailDesc} numberOfLines={2}>
            {item.desc}
          </Text>
        )}
      </View>

      <View style={styles.detailActions}>
        {item.equipped && <GameButton variant="danger" onPress={onRetirer}>Retirer</GameButton>}
        {!item.equipped && item.cat === 'equipement' && (
          <GameButton variant="solid" onPress={onEquiper}>
            Équiper
          </GameButton>
        )}
        {item.cat === 'consommable' && (
          <>
            <GameButton onPress={() => onPlacer(1)}>Slot 1</GameButton>
            <GameButton onPress={() => onPlacer(2)}>Slot 2</GameButton>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corps: { flex: 1, flexDirection: 'row' },
  sac: { flex: 1, padding: spacing.md, gap: spacing.sm },
  onglets: { flexDirection: 'row', gap: spacing.xs },
  onglet: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.tab,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
  },
  ongletActif: { backgroundColor: colors.goldSofter, borderColor: colors.gold },
  ongletLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim },
  ongletLabelActif: { fontFamily: fonts.bodyBold, color: colors.gold },
  recherche: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    backgroundColor: colors.panelInner,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm },
  quantite: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.qtyBadgeBg,
  },
  quantiteLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.text },
  fiche: {
    width: 260,
    borderLeftWidth: 1,
    borderLeftColor: colors.goldDivider,
  },
  ficheContenu: { padding: spacing.md, gap: spacing.sm },
  titreFiche: {
    fontFamily: fonts.title,
    fontSize: 12,
    color: colors.gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  ligneEquipement: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ligneTextes: { flex: 1 },
  emplacement: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nomPorte: { fontFamily: fonts.bodyBold, fontSize: 12 },
  bonus: { gap: 2 },
  bonusLigne: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft },
  bonusValeur: { fontFamily: fonts.bodyBold, color: colors.bonus },
  vide: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint },
  indice: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  detailTextes: { flex: 1, gap: 2 },
  detailNom: { fontFamily: fonts.bodyBold, fontSize: 14 },
  detailMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  detailDesc: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim, fontStyle: 'italic' },
  detailActions: { flexDirection: 'row', gap: spacing.sm },
  bourses: { flexDirection: 'row', gap: spacing.md },
  bourse: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bourseIcone: { width: 14, height: 14 },
  bourseValeur: { fontFamily: fonts.bodyBold, fontSize: 12 },
});
