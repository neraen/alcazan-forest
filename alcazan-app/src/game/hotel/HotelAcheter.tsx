import { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TypeItem } from '@/src/core/api/boutique';
import * as hotelApi from '@/src/core/api/hotelVente';
import type { Annonce, Catalogue } from '@/src/core/api/hotelVente';
import { tempsRestant } from '@/src/core/domain/temps';
import { nombre, pluriel } from '@/src/core/domain/texte';
import Chip from '@/src/ui/Chip';
import { confirmer } from '@/src/ui/confirmer';
import GameButton from '@/src/ui/GameButton';
import SearchField from '@/src/ui/SearchField';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';

import LigneLot from './LigneLot';

const FILTRES: { id: TypeItem | null; label: string }[] = [
  { id: null, label: 'Tout' },
  { id: 'equipement', label: 'Équip.' },
  { id: 'consommable', label: 'Conso.' },
  { id: 'objet', label: 'Objets' },
];

/**
 * Onglet « Acheter » — port de `hotelVenteModal/HotelAcheter.jsx`.
 *
 * Recherche, filtre et tri sont envoyés au SERVEUR (contrairement au catalogue de
 * recettes, filtré côté client) : l'hôtel est alimenté par les joueurs, il n'a pas de
 * taille bornée.
 *
 * Deux ajouts propres au tactile : l'achat se CONFIRME (un bouton se touche par accident,
 * et l'or ne revient pas), et le tri est une liste de puces plutôt qu'un menu déroulant.
 */
export default function HotelAcheter({
  occupe,
  onAcheter,
}: {
  occupe: boolean;
  onAcheter: (annonce: Annonce) => Promise<void>;
}) {
  const toast = useToast();
  const [donnees, setDonnees] = useState<Catalogue | null>(null);
  const [type, setType] = useState<TypeItem | null>(null);
  const [recherche, setRecherche] = useState('');
  const [termeEnvoye, setTermeEnvoye] = useState('');
  const [tri, setTri] = useState('recent');
  const [page, setPage] = useState(1);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setDonnees(await hotelApi.catalogue({ type, recherche: termeEnvoye, tri, page }));
    } catch {
      toast.error("L'hôtel des ventes est inaccessible.");
    } finally {
      setChargement(false);
    }
  }, [type, termeEnvoye, tri, page, toast]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Un filtre ou un tri qui change ramène en page 1 : rester en page 4 d'un résultat qui
  // n'en compte plus que 2 afficherait un vide qu'on lirait comme « il n'y a rien ».
  const changer = <T,>(setter: (valeur: T) => void) => (valeur: T) => {
    setter(valeur);
    setPage(1);
  };

  const lancerRecherche = () => {
    setTermeEnvoye(recherche.trim());
    setPage(1);
  };

  // Un champ vidé relance la recherche tout seul : sans ça, effacer le terme laissait
  // l'ancien filtre actif tant qu'on n'avait pas rouvert le clavier pour valider.
  const saisir = (texte: string) => {
    setRecherche(texte);
    if (texte === '' && termeEnvoye !== '') {
      setTermeEnvoye('');
      setPage(1);
    }
  };

  const acheter = (annonce: Annonce) =>
    confirmer(
      `Acheter « ${annonce.item.nom} » ?`,
      `${annonce.quantite > 1 ? `Lot de ${annonce.quantite}, ` : ''}${nombre(annonce.prix)} po seront débités.`,
      async () => {
        await onAcheter(annonce);
        // La liste doit refléter le lot parti — sans quoi le joueur retape dessus.
        await charger();
      },
      { libelle: 'Acheter' },
    );

  const annonces = donnees?.annonces ?? [];
  const tris = Object.entries(donnees?.curseurs?.tris ?? {});

  return (
    <View style={styles.corps}>
      <ScrollView
        style={styles.rail}
        contentContainerStyle={styles.railContenu}
        keyboardShouldPersistTaps="handled">
        <SearchField
          value={recherche}
          onChangeText={saisir}
          onSubmit={lancerRecherche}
          placeholder="Rechercher un objet…"
        />
        {tris.length > 0 && <Text style={styles.titreRail}>Trier par</Text>}
        {tris.map(([valeur, label]) => (
          <Chip
            key={valeur}
            bloc
            label={label}
            actif={tri === valeur}
            onPress={() => changer(setTri)(valeur)}
          />
        ))}
      </ScrollView>

      <View style={styles.principal}>
        {/* Les catégories au-dessus de la LISTE et non dans le rail : quatre puces n'y
            tenaient pas sur une ligne, et le rail (recherche + tris) défilait pour ça. */}
        <View style={styles.puces}>
          {FILTRES.map((filtre) => (
            <Chip
              key={filtre.id ?? 'tous'}
              label={filtre.label}
              actif={type === filtre.id}
              onPress={() => changer(setType)(filtre.id)}
            />
          ))}
          {!!donnees && (
            <Text style={styles.total}>{pluriel(donnees.total, 'lot')}</Text>
          )}
        </View>
        {chargement && donnees === null ? (
          <Chargement />
        ) : (
          <FlatList
            data={annonces}
            keyExtractor={(annonce) => String(annonce.id)}
            contentContainerStyle={styles.liste}
            // Tirer pour rafraîchir : sur un marché asynchrone, des lots apparaissent et
            // disparaissent pendant qu'on regarde.
            refreshing={chargement}
            onRefresh={charger}
            ListEmptyComponent={
              // Trois vides bien distincts : un hôtel désert ne se lit pas comme une
              // recherche infructueuse.
              <Vide>
                {termeEnvoye
                  ? 'Aucun lot ne correspond à votre recherche.'
                  : type
                    ? "Aucun lot de cette catégorie n'est en vente."
                    : "L'hôtel des ventes est vide pour le moment."}
              </Vide>
            }
            ListFooterComponent={
              donnees && donnees.pages > 1 ? (
                <View style={styles.pagination}>
                  <GameButton
                    variant="ghost"
                    style={styles.pageBouton}
                    disabled={page <= 1 || chargement}
                    onPress={() => setPage(page - 1)}>
                    Précédent
                  </GameButton>
                  <Text style={styles.pageEtat}>
                    Page {donnees.page} / {donnees.pages} · {pluriel(donnees.total, 'lot')}
                  </Text>
                  <GameButton
                    variant="ghost"
                    style={styles.pageBouton}
                    disabled={page >= donnees.pages || chargement}
                    onPress={() => setPage(page + 1)}>
                    Suivant
                  </GameButton>
                </View>
              ) : null
            }
            renderItem={({ item: annonce }) => (
              <LigneLot
                annonce={annonce}
                sousLigne={`${annonce.vendeur?.pseudo ?? '—'} · ${tempsRestant(annonce.expiresAt) ?? ''}`}>
                {annonce.estMien ? (
                  <Text style={styles.mien}>Votre lot</Text>
                ) : (
                  <GameButton
                    variant="solid"
                    style={styles.acheter}
                    disabled={occupe}
                    onPress={() => acheter(annonce)}>
                    Acheter
                  </GameButton>
                )}
              </LigneLot>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },
  rail: { flexGrow: 0, width: 218, borderRightWidth: 1, borderRightColor: colors.goldDivider },
  railContenu: { padding: spacing.md, gap: spacing.xs + 2 },
  puces: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  total: { flex: 1, textAlign: 'right', fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  titreRail: {
    fontFamily: fonts.title,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
    marginTop: spacing.xs,
  },
  principal: { flex: 1, minWidth: 0 },
  liste: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.xs + 2 },
  acheter: { minHeight: 38, paddingHorizontal: 14 },
  mien: { width: 86, textAlign: 'center', fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  pageBouton: { minHeight: 36, paddingHorizontal: 12 },
  pageEtat: { fontFamily: fonts.body, fontSize: 11, color: colors.textMute },
});
