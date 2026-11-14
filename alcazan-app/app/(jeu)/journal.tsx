import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import * as historiqueApi from '@/src/core/api/historique';
import type { LigneJournal } from '@/src/core/api/historique';
import { cleJour, dateServeur, heureCourte, libelleJour } from '@/src/core/domain/temps';
import { pluriel, sansAccent } from '@/src/core/domain/texte';
import { mediaUrl } from '@/src/core/media';
import Chip from '@/src/ui/Chip';
import ModalShell from '@/src/ui/ModalShell';
import SearchField from '@/src/ui/SearchField';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';

type Nature = 'tout' | 'actions' | 'subis';

const NATURES: { cle: Nature; label: string; couleur: string }[] = [
  { cle: 'tout', label: 'Tout', couleur: colors.gold },
  { cle: 'actions', label: 'Mes actions', couleur: colors.success },
  { cle: 'subis', label: 'Subis', couleur: colors.danger },
];

/**
 * Journal d'aventure — port de `pages/historyPage/HistoryPage.jsx`.
 *
 * ⚠️ Les catégories viennent du SERVEUR, « Archives » comprise (les anciennes lignes
 * libres, conservées telles quelles : elles n'ont pas de `typeLabel`). Aucune n'est en
 * dur ici.
 *
 * Mise en page mobile : les quatre tuiles de résumé du web sont devenues les COMPTEURS
 * des filtres (Tout / Mes actions / Subis portent déjà les mêmes nombres) — les afficher
 * deux fois coûtait une hauteur que l'écran n'a pas. La chronologie garde toute la
 * colonne de droite, une ligne par événement, le liseré disant action ou subi.
 */
export default function JournalScreen() {
  const router = useRouter();
  const toast = useToast();

  const [chargement, setChargement] = useState(true);
  const [lignes, setLignes] = useState<LigneJournal[]>([]);
  const [categories, setCategories] = useState<{ valeur: string; label: string }[]>([]);
  const [nature, setNature] = useState<Nature>('tout');
  const [categorie, setCategorie] = useState('toutes');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    historiqueApi
      .fetchHistoryData()
      .then((donnees) => {
        setLignes(donnees.rows || []);
        setCategories(donnees.categories || []);
      })
      .catch(() => toast.error('Le journal est inaccessible pour le moment.'))
      .finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const compteNature = (cle: Nature) =>
    cle === 'tout'
      ? lignes.length
      : lignes.filter((l) => (cle === 'actions' ? !l.subi : l.subi)).length;

  const sections = useMemo(() => {
    const terme = sansAccent(recherche.trim());
    const groupes: { cle: string; titre: string; data: LigneJournal[] }[] = [];
    lignes.forEach((ligne) => {
      if (nature === 'actions' && ligne.subi) return;
      if (nature === 'subis' && !ligne.subi) return;
      if (categorie !== 'toutes' && ligne.categorie !== categorie) return;
      if (terme && !sansAccent(ligne.phrase).includes(terme)) return;
      const date = dateServeur(ligne.date);
      const cle = date ? cleJour(date) : 'inconnu';
      let groupe = groupes.find((g) => g.cle === cle);
      if (!groupe) {
        groupe = { cle, titre: date ? libelleJour(date) : 'Date inconnue', data: [] };
        groupes.push(groupe);
      }
      groupe.data.push(ligne);
    });
    return groupes;
  }, [lignes, nature, categorie, recherche]);

  const total = sections.reduce((somme, s) => somme + s.data.length, 0);
  // Seules les catégories qui ont au moins une ligne : huit puces dont cinq à zéro
  // faisaient défiler le rail pour rien.
  const categoriesUtiles = categories.filter((c) => lignes.some((l) => l.categorie === c.valeur));

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/icons/book.png')}
      title="Journal"
      subtitle={chargement ? undefined : `${pluriel(lignes.length, 'événement')} consigné${lignes.length > 1 ? 's' : ''}`}
      onClose={() => router.back()}>
      {chargement ? (
        <Chargement />
      ) : (
        <View style={styles.corps}>
          <ScrollView style={styles.rail} contentContainerStyle={styles.railContenu}>
            {NATURES.map((n) => (
              <Chip
                key={n.cle}
                bloc
                label={n.label}
                pastille={n.couleur}
                compteur={compteNature(n.cle)}
                actif={nature === n.cle}
                onPress={() => setNature(n.cle)}
              />
            ))}

            {categoriesUtiles.length > 0 && (
              <>
                <Text style={styles.titreRail}>Catégorie</Text>
                <View style={styles.puces}>
                  <Chip
                    label="Toutes"
                    actif={categorie === 'toutes'}
                    onPress={() => setCategorie('toutes')}
                  />
                  {categoriesUtiles.map((c) => (
                    <Chip
                      key={c.valeur}
                      label={c.label}
                      compteur={lignes.filter((l) => l.categorie === c.valeur).length}
                      actif={categorie === c.valeur}
                      onPress={() => setCategorie(c.valeur)}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.principal}>
            <View style={styles.barre}>
              <SearchField
                value={recherche}
                onChangeText={setRecherche}
                placeholder="Rechercher dans le journal"
                style={styles.recherche}
              />
              <Text style={styles.compte}>{pluriel(total, 'entrée')}</Text>
            </View>

            <SectionList
              sections={sections}
              keyExtractor={(ligne) => ligne.id}
              stickySectionHeadersEnabled={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.liste}
              ListEmptyComponent={<Vide>Aucun événement dans votre journal.</Vide>}
              renderSectionHeader={({ section }) => (
                <View style={styles.jour}>
                  <Text style={styles.jourLabel}>{section.titre}</Text>
                  <View style={styles.jourTrait} />
                  <Text style={styles.jourCompte}>{section.data.length} évén.</Text>
                </View>
              )}
              renderItem={({ item: ligne }) => {
                const date = dateServeur(ligne.date);
                return (
                  <View style={[styles.evenement, ligne.subi ? styles.subi : styles.action]}>
                    <Text style={styles.heure}>{date ? heureCourte(date) : ''}</Text>
                    <View style={styles.evenementCorps}>
                      <Text style={styles.phrase}>{ligne.phrase}</Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {ligne.subi ? 'Subi' : 'Action'} · {ligne.categorieLabel}
                        {/* Le type précis n'existe pas pour les lignes héritées. */}
                        {ligne.typeLabel ? ` · ${ligne.typeLabel}` : ''}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>
      )}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },
  rail: { flexGrow: 0, width: 218, borderRightWidth: 1, borderRightColor: colors.goldDivider },
  railContenu: { padding: spacing.md, gap: spacing.xs + 2 },
  titreRail: {
    fontFamily: fonts.title,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
    marginTop: spacing.sm,
  },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  principal: { flex: 1, minWidth: 0 },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recherche: { flex: 1 },
  compte: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  liste: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: 5 },
  jour: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: 2 },
  jourLabel: {
    fontFamily: fonts.title,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  jourTrait: { flex: 1, height: 1, backgroundColor: colors.goldDivider },
  jourCompte: { fontFamily: fonts.body, fontSize: 10, color: colors.textFaint },
  evenement: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.tab,
    borderLeftWidth: 3,
    backgroundColor: colors.rowBg,
  },
  action: { borderLeftColor: colors.success },
  subi: { borderLeftColor: colors.danger },
  heure: { width: 38, fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 18, color: colors.textFaint },
  evenementCorps: { flex: 1, minWidth: 0, gap: 1 },
  phrase: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 10, color: colors.textFaint },
});
