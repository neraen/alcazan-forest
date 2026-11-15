import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import * as questApi from '@/src/core/api/quest';
import type { FicheQuete, JournalQuetes } from '@/src/core/api/quest';
import { etatQuete } from '@/src/core/domain/quetes';
import { mediaUrl } from '@/src/core/media';
import QueteDetail, { TONS } from '@/src/game/quetes/QueteDetail';
import ModalShell from '@/src/ui/ModalShell';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';

type CleOnglet = keyof JournalQuetes;

const ONGLETS: { cle: CleOnglet; label: string; vide: string; conseil: string }[] = [
  {
    cle: 'enCours',
    label: 'En cours',
    vide: 'Aucune quête en cours.',
    conseil: "L'onglet « Dispo. » vous dit où trouver du travail.",
  },
  {
    cle: 'disponibles',
    label: 'Dispo.',
    vide: 'Aucune quête disponible.',
    conseil: 'Gagnez des niveaux ou terminez vos quêtes : de nouvelles se débloqueront.',
  },
  {
    cle: 'terminees',
    label: 'Finies',
    vide: 'Aucune quête terminée.',
    conseil: "Vos exploits s'inscriront ici.",
  },
];

/**
 * Journal de quêtes — port de `modals/quetesModal/QuetesModal.jsx` : « que dois-je faire,
 * et OÙ ? ».
 *
 * Dessiné pour le PAYSAGE (rail + colonne, cf. `docs/MOBILE_PLAN.md` §5 bis) : le rail
 * porte les trois onglets et la liste, la fiche occupe le reste. Les libellés des onglets
 * sont raccourcis (« Dispo. », « Finies ») parce que trois onglets doivent tenir dans
 * 240 pt sans tronquer. Rechargé à chaque ouverture — la quête a pu avancer dans un
 * dialogue de PNJ entre-temps —, et le serveur fait foi sur tout ce qui est affiché.
 */
export default function QuetesScreen() {
  const router = useRouter();
  const toast = useToast();

  const [journal, setJournal] = useState<JournalQuetes | null>(null);
  const [erreur, setErreur] = useState(false);
  const [onglet, setOnglet] = useState<CleOnglet>('enCours');
  const [selection, setSelection] = useState<number | null>(null);

  useEffect(() => {
    let actif = true;
    questApi
      .getJournal()
      .then((donnees) => {
        if (!actif) return;
        setJournal(donnees);
        // On ouvre là où il y a quelque chose à lire : un onglet vide à l'ouverture se
        // lirait comme un bug.
        const premier = ONGLETS.find((o) => donnees[o.cle]?.length > 0)?.cle ?? 'enCours';
        setOnglet(premier);
        setSelection(donnees[premier]?.[0]?.id ?? null);
      })
      .catch(() => {
        if (!actif) return;
        setErreur(true);
        toast.error('Le journal de quêtes est inaccessible pour le moment.');
      });
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liste: FicheQuete[] = journal?.[onglet] ?? [];
  const fiche = liste.find((q) => q.id === selection) ?? liste[0] ?? null;
  const ongletCourant = ONGLETS.find((o) => o.cle === onglet)!;

  const changerOnglet = (cle: CleOnglet) => {
    setOnglet(cle);
    setSelection(journal?.[cle]?.[0]?.id ?? null);
  };

  const sousTitre = journal
    ? `${journal.enCours.length} en cours · ${journal.terminees.length} terminée${journal.terminees.length > 1 ? 's' : ''}`
    : undefined;

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/icons/parchemin.png')}
      title="Quêtes"
      subtitle={sousTitre}
      onClose={() => router.back()}>
      {!journal ? (
        erreur ? <Vide>Le journal de quêtes est inaccessible pour le moment.</Vide> : <Chargement />
      ) : (
        <View style={styles.corps}>
          <View style={styles.rail}>
            <View style={styles.onglets} accessibilityRole="tablist">
              {ONGLETS.map((o) => {
                const actif = o.cle === onglet;
                return (
                  <Pressable
                    key={o.cle}
                    onPress={() => changerOnglet(o.cle)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: actif }}
                    accessibilityLabel={`${o.label}, ${journal[o.cle].length}`}
                    style={({ pressed }) => [styles.onglet, actif && styles.ongletActif, pressed && !actif && styles.presse]}>
                    <Text style={[styles.ongletLabel, actif && styles.ongletLabelActif]} numberOfLines={1}>
                      {o.label}
                    </Text>
                    <Text style={[styles.ongletCompte, actif && styles.ongletLabelActif]}>
                      {journal[o.cle].length}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <FlatList
              data={liste}
              keyExtractor={(q) => `${onglet}-${q.id}`}
              contentContainerStyle={styles.liste}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.listeVide}>
                  <Text style={styles.listeVideTitre}>{ongletCourant.vide}</Text>
                  <Text style={styles.listeVideTexte}>{ongletCourant.conseil}</Text>
                </View>
              }
              renderItem={({ item }) => (
                <LigneQuete quete={item} active={fiche?.id === item.id} onPress={() => setSelection(item.id)} />
              )}
            />
          </View>

          <View style={styles.colonne}>
            {fiche ? (
              <QueteDetail key={`${onglet}-${fiche.id}`} quete={fiche} />
            ) : (
              <Vide>{ongletCourant.vide}</Vide>
            )}
          </View>
        </View>
      )}
    </ModalShell>
  );
}

/** Une ligne de la liste : liseré d'état, nom (deux lignes au plus), consigne. */
function LigneQuete({ quete, active, onPress }: { quete: FicheQuete; active: boolean; onPress: () => void }) {
  const etat = etatQuete(quete);
  const ton = TONS[etat.ton];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${quete.nom}, ${etat.label}. ${etat.resume}`}
      style={({ pressed }) => [styles.ligne, active && styles.ligneActive, pressed && !active && styles.presse]}>
      <View style={[styles.ligneTrait, { backgroundColor: ton.trait }]} />
      <View style={styles.ligneCorps}>
        <Text style={styles.ligneNom} numberOfLines={2}>
          {quete.nom}
        </Text>
        <Text style={styles.ligneMeta} numberOfLines={1}>
          {etat.resume}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },
  rail: {
    width: 240,
    borderRightWidth: 1,
    borderRightColor: colors.goldDivider,
    paddingTop: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  onglets: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    marginRight: spacing.xs,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    backgroundColor: colors.panelInner,
  },
  onglet: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.tab,
  },
  ongletActif: { backgroundColor: colors.gold },
  presse: { opacity: 0.7 },
  ongletLabel: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textDim },
  ongletCompte: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 16, color: colors.textDim },
  ongletLabelActif: { color: colors.ink },
  liste: { gap: 6, paddingTop: spacing.sm, paddingBottom: spacing.lg, paddingRight: spacing.xs },
  ligne: {
    flexDirection: 'row',
    minHeight: 48,
    overflow: 'hidden',
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  ligneActive: { borderColor: colors.gold, backgroundColor: colors.goldSofter },
  ligneTrait: { width: 4 },
  ligneCorps: { flex: 1, minWidth: 0, gap: 2, paddingVertical: 7, paddingHorizontal: spacing.sm + 2 },
  ligneNom: { fontFamily: fonts.titleBold, fontSize: 12.5, lineHeight: 16, color: colors.text },
  ligneMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  listeVide: {
    marginTop: spacing.xs,
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.slotDash,
  },
  listeVideTitre: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.textDim, textAlign: 'center' },
  listeVideTexte: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: colors.textFaint, textAlign: 'center' },
  colonne: { flex: 1, minWidth: 0 },
});
