import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { TypeItem } from '@/src/core/api/boutique';
import type { CurseursHotel } from '@/src/core/api/hotelVente';
import * as inventaireApi from '@/src/core/api/inventaire';
import { normaliserInventaire, type CategorieItem, type ItemNormalise } from '@/src/core/domain/items';
import { nombre, sansAccent } from '@/src/core/domain/texte';
import Chip from '@/src/ui/Chip';
import GameButton from '@/src/ui/GameButton';
import SearchField, { champStyle } from '@/src/ui/SearchField';
import Slot from '@/src/ui/Slot';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, couleurRarete, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';

const FILTRES: { id: 'tous' | CategorieItem; label: string }[] = [
  { id: 'tous', label: 'Tout' },
  { id: 'equipement', label: 'Équip.' },
  { id: 'consommable', label: 'Conso.' },
  { id: 'objet', label: 'Objets' },
];

/**
 * Miroir de `HotelVenteConfig::fraisDepot` — pourcentage arrondi au supérieur, jamais sous
 * le plancher. Les DEUX chiffres viennent du serveur : c'est la formule qui est dupliquée,
 * pas l'équilibrage, et le serveur recalcule au dépôt.
 */
function calculerFrais(prix: number, curseurs?: CurseursHotel) {
  if (!curseurs || !(prix > 0)) return 0;
  return Math.max(curseurs.fraisMinimum, Math.ceil(prix * curseurs.tauxFrais));
}

/**
 * Onglet « Vendre » — port de `hotelVenteModal/HotelVendre.jsx` : le sac à gauche, le
 * dépôt à droite.
 *
 * Un équipement PORTÉ n'est pas dans le sac (invariant d'`EquipementEquipeService`) : il
 * n'apparaît donc pas ici, et c'est voulu — il faut le retirer pour le vendre.
 *
 * Deux choix propres au tactile :
 *  - la QUANTITÉ se règle au pas (−/+/Max) plutôt qu'au clavier, parce qu'ouvrir un
 *    clavier pour taper « 3 » recouvre la moitié d'un écran en paysage ;
 *  - le PRIX, lui, se tape, et son champ est tout en haut de la colonne : c'est la seule
 *    partie de l'écran que le clavier ne cache pas.
 */
export default function HotelVendre({
  curseurs,
  occupe,
  emplacementsUtilises,
  onVendre,
}: {
  curseurs?: CurseursHotel;
  occupe: boolean;
  emplacementsUtilises: number;
  onVendre: (type: TypeItem, itemId: number, quantite: number, prix: number) => Promise<void>;
}) {
  const toast = useToast();
  const [inventaire, setInventaire] = useState<ItemNormalise[] | null>(null);
  const [filtre, setFiltre] = useState<'tous' | CategorieItem>('tous');
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState<ItemNormalise | null>(null);
  const [quantite, setQuantite] = useState(1);
  // « null = le champ suit le prix suggéré, chaîne = saisie en cours » : sans ça, taper
  // « 1 » puis « 2 » se ferait écraser à chaque rendu.
  const [prixSaisi, setPrixSaisi] = useState<string | null>(null);

  const charger = useCallback(
    () =>
      inventaireApi
        .getPlayerInventaire()
        .then((reponse) => setInventaire(normaliserInventaire(reponse).filter((item) => item.qty > 0)))
        .catch(() => toast.error('Votre sac est inaccessible.')),
    [toast],
  );

  useEffect(() => {
    charger();
  }, [charger]);

  const items = useMemo(
    () =>
      (inventaire ?? []).filter(
        (item) =>
          (filtre === 'tous' || item.cat === filtre) &&
          sansAccent(item.name).includes(sansAccent(recherche)),
      ),
    [inventaire, filtre, recherche],
  );

  // La sélection doit suivre le sac : après un dépôt, la pile a fondu ou disparu.
  useEffect(() => {
    if (selection === null || inventaire === null) return;
    const frais = inventaire.find((item) => item.key === selection.key);
    if (frais === undefined) {
      setSelection(null);
    } else if (frais.qty !== selection.qty) {
      setSelection(frais);
      setQuantite((courante) => Math.min(courante, frais.qty));
    }
  }, [inventaire, selection]);

  const choisir = (item: ItemNormalise) => {
    setSelection((precedente) => (precedente?.key === item.key ? null : item));
    setQuantite(1);
    // Prix de départ suggéré : ce qu'en donnerait le marchand. Un repère, pas une
    // contrainte — le vendeur décide, le marché tranche.
    setPrixSaisi(null);
  };

  const prixDefaut = selection ? Math.max(1, (selection.value || 1) * quantite) : 1;
  const prix = prixSaisi === null ? prixDefaut : Math.floor(Number(prixSaisi) || 0);
  const frais = calculerFrais(prix, curseurs);
  const prixValide = prix >= (curseurs?.prixMin ?? 1) && prix <= (curseurs?.prixMax ?? Infinity);
  const plafondAtteint = emplacementsUtilises >= (curseurs?.annoncesMax ?? Infinity);

  const deposer = async () => {
    if (!selection) return;
    await onVendre(selection.cat, selection.id, quantite, prix);
    await charger();
    setPrixSaisi(null);
  };

  if (inventaire === null) return <Chargement />;

  return (
    <View style={styles.corps}>
      <View style={styles.sac}>
        <View style={styles.barre}>
          <SearchField
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Chercher…"
            style={styles.recherche}
          />
          {FILTRES.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              actif={filtre === item.id}
              onPress={() => setFiltre(item.id)}
            />
          ))}
        </View>
        <ScrollView
          contentContainerStyle={styles.grille}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {items.length === 0 && (
            <Vide>
              {inventaire.length === 0 ? 'Votre sac est vide.' : 'Aucun objet du sac ne correspond.'}
            </Vide>
          )}
          {items.map((item) => (
            <Slot
              key={item.key}
              src={item.img || undefined}
              onPress={() => choisir(item)}
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

      <ScrollView
        style={styles.depot}
        contentContainerStyle={styles.depotContenu}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {selection === null ? (
          <Vide>Touchez un objet de votre sac pour le mettre en vente.</Vide>
        ) : (
          <>
            <Text style={[styles.nom, { color: couleurRarete(selection.rarity) }]} numberOfLines={1}>
              {selection.name}
            </Text>

            <View style={styles.rangee}>
              <View style={styles.champPrix}>
                <Text style={styles.label}>Prix du lot</Text>
                <TextInput
                  value={prixSaisi === null ? String(prixDefaut) : prixSaisi}
                  onChangeText={(texte) => setPrixSaisi(texte.replace(/[^0-9]/g, ''))}
                  // `numbers-and-punctuation` et non `number-pad` : le pavé numérique
                  // d'iOS n'a PAS de touche de validation, le clavier restait ouvert
                  // par-dessus le bouton « Mettre en vente ».
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  selectTextOnFocus
                  editable={!occupe}
                  style={styles.saisie}
                />
              </View>
              <View style={styles.champ}>
                <Text style={styles.label}>Quantité (sur {selection.qty})</Text>
                <View style={styles.pas}>
                  <Pas signe="−" inactif={occupe || quantite <= 1} onPress={() => setQuantite(quantite - 1)} />
                  <Text style={styles.pasValeur}>{quantite}</Text>
                  <Pas
                    signe="+"
                    inactif={occupe || quantite >= selection.qty}
                    onPress={() => setQuantite(quantite + 1)}
                  />
                  {selection.qty > 2 && (
                    <Pas
                      signe="Max"
                      inactif={occupe || quantite >= selection.qty}
                      onPress={() => setQuantite(selection.qty)}
                    />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.recap}>
              <View style={styles.recapLigne}>
                <Text style={styles.recapLabel}>Frais de dépôt</Text>
                <Text style={styles.recapFrais}>−{nombre(frais)} po</Text>
              </View>
              <View style={styles.recapLigne}>
                <Text style={styles.recapLabel}>Si le lot se vend</Text>
                <Text style={styles.recapGain}>+{nombre(prix)} po</Text>
              </View>
            </View>

            {plafondAtteint ? (
              <Text style={styles.alerte}>
                Vous avez déjà {curseurs?.annoncesMax} lots en vente : retirez-en un pour en déposer
                un autre.
              </Text>
            ) : (
              <Text style={styles.note}>
                Les frais sont prélevés maintenant et ne sont pas remboursés. Le lot reste en vente{' '}
                {curseurs?.dureeHeures ?? 48} h, après quoi l’invendu vous revient.
              </Text>
            )}

            <GameButton
              variant="solid"
              disabled={!prixValide || plafondAtteint}
              loading={occupe}
              onPress={deposer}>
              Mettre en vente
            </GameButton>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Pas({ signe, inactif, onPress }: { signe: string; inactif: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={inactif}
      hitSlop={4}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pasBouton,
        signe.length > 1 && styles.pasBoutonLarge,
        pressed && styles.presse,
        inactif && styles.inactif,
      ]}>
      <Text style={[styles.pasSigne, signe.length > 1 && styles.pasSigneTexte]}>{signe}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },
  sac: { flex: 1, minWidth: 0 },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recherche: { flex: 1, minWidth: 100 },
  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  quantite: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.qtyBadgeBg,
  },
  quantiteLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.text },
  depot: { flexGrow: 0, width: 318, borderLeftWidth: 1, borderLeftColor: colors.goldDivider },
  depotContenu: { padding: spacing.md, gap: spacing.sm + 2 },
  nom: { fontFamily: fonts.bodyBold, fontSize: 15 },
  rangee: { flexDirection: 'row', gap: spacing.md },
  champ: { flex: 1, gap: 4 },
  // Largeur FIXE pour le prix : à parts égales, le pas de quantité (− n + Max) débordait
  // de la colonne et « Max » sortait de l'écran.
  champPrix: { width: 96, gap: 4 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  saisie: { ...champStyle, minHeight: 40, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.gold },
  pas: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pasBouton: {
    width: 40,
    height: 40,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasBoutonLarge: { width: 46 },
  pasSigne: { fontFamily: fonts.bodyBold, fontSize: 18, lineHeight: 22, color: colors.gold },
  pasSigneTexte: { fontSize: 11, lineHeight: 14, letterSpacing: 0.5 },
  pasValeur: {
    minWidth: 30,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  presse: { opacity: 0.7 },
  inactif: { opacity: 0.35 },
  recap: {
    gap: 4,
    padding: spacing.sm + 2,
    borderRadius: radius.slot,
    backgroundColor: colors.panelInner,
  },
  recapLigne: { flexDirection: 'row', justifyContent: 'space-between' },
  recapLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMute },
  recapFrais: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.dangerText },
  recapGain: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.success },
  note: { fontFamily: fonts.body, fontSize: 10, lineHeight: 14, color: colors.textFaint },
  alerte: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.paLabel },
});
