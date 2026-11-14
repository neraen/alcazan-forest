import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as classementApi from '@/src/core/api/classement';
import type {
  CategorieClassement,
  LigneClassement,
  RangPersonnel,
} from '@/src/core/api/classement';
import { useAuth } from '@/src/core/AuthContext';
import { getUserInfo } from '@/src/core/auth';
import { nombre } from '@/src/core/domain/texte';
import { mediaUrl } from '@/src/core/media';
import Chip from '@/src/ui/Chip';
import ModalShell from '@/src/ui/ModalShell';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';

const formater = (valeur: number | null | undefined, format?: string) =>
  valeur === null || valeur === undefined ? '—' : format === 'or' ? `${nombre(valeur)} po` : nombre(valeur);

/**
 * Classements publics — port de `pages/classementPage/ClassementPage.jsx`.
 *
 * L'écran ne connaît AUCUNE catégorie en dur : il affiche celles que le serveur déclare.
 *
 * Mise en page mobile : le web a deux panneaux dans son rail (les catégories, puis « Mon
 * rang » dans chacune). Ici c'est UNE liste — chaque catégorie porte mon rang à droite de
 * son nom. Même information, moitié moins de hauteur, et le rail tient sans défiler sur
 * les 320 pt qu'un téléphone en paysage laisse sous l'en-tête.
 */
export default function ClassementScreen() {
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const moiUserId = useMemo(() => getUserInfo(token)?.id ?? null, [token]);

  const [categories, setCategories] = useState<CategorieClassement[]>([]);
  const [categorie, setCategorie] = useState<string | null>(null);
  // La catégorie des lignes AFFICHÉES, distincte de celle qu'on vient de toucher : le temps
  // de la requête, le tableau garde ses anciennes lignes, et les coiffer des nouveaux
  // intitulés afficherait une colonne « Guilde » au-dessus de noms de joueurs.
  const [affichee, setAffichee] = useState<string | null>(null);
  const [classement, setClassement] = useState<LigneClassement[]>([]);
  const [mesRangs, setMesRangs] = useState<{ rangs: RangPersonnel[]; horsClassement: boolean } | null>(null);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(
    (cle?: string) => {
      setChargement(true);
      // La catégorie s'allume TOUT DE SUITE : attendre la réponse laisserait l'ancienne
      // puce active une demi-seconde, et le tap semblerait raté.
      if (cle) setCategorie(cle);
      classementApi
        .liste(cle)
        .then((donnees) => {
          setCategories(donnees.categories);
          setCategorie(donnees.categorie);
          setAffichee(donnees.categorie);
          setClassement(donnees.classement);
        })
        .catch(() => toast.error('Impossible de charger le classement.'))
        .finally(() => setChargement(false));
    },
    [toast],
  );

  useEffect(() => {
    charger();
    classementApi.moi().then(setMesRangs).catch(() => setMesRangs(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = categories.find((item) => item.valeur === categorie);
  const tableau = categories.find((item) => item.valeur === affichee);
  const guildes = tableau?.cible === 'guilde';
  const rangDe = (valeur: string) => mesRangs?.rangs.find((r) => r.categorie === valeur);

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/icons/shild.png')}
      title="Classement"
      subtitle={active ? active.label : "Les meilleurs d'Alcazan"}
      onClose={() => router.back()}>
      <View style={styles.corps}>
        <ScrollView style={styles.rail} contentContainerStyle={styles.railContenu}>
          {categories.map((item) => {
            const rang = rangDe(item.valeur);
            return (
              <Chip
                key={item.valeur}
                bloc
                label={item.label}
                actif={item.valeur === categorie}
                compteur={rang?.rang ? `${rang.rang}ᵉ` : undefined}
                onPress={() => item.valeur !== categorie && charger(item.valeur)}
              />
            );
          })}
          {mesRangs?.horsClassement && (
            <Text style={styles.note}>Ce compte est exclu des classements.</Text>
          )}
        </ScrollView>

        <View style={styles.principal}>
          <View style={styles.entete}>
            <Text style={[styles.colonne, styles.colRang]}>Rang</Text>
            <Text style={[styles.colonne, styles.colNom]}>{guildes ? 'Guilde' : 'Joueur'}</Text>
            <Text style={[styles.colonne, styles.colClasse]}>{guildes ? 'Membres' : 'Classe'}</Text>
            {!guildes && <Text style={[styles.colonne, styles.colNiveau]}>Niv.</Text>}
            <Text style={[styles.colonne, styles.colValeur]}>{tableau?.intitule ?? 'Valeur'}</Text>
          </View>

          {chargement && classement.length === 0 ? (
            <Chargement />
          ) : (
            <FlatList
              data={classement}
              keyExtractor={(ligne) => String(ligne.userId)}
              style={chargement && styles.enRechargement}
              contentContainerStyle={styles.liste}
              ListEmptyComponent={<Vide>Personne n’est encore classé ici.</Vide>}
              renderItem={({ item: ligne }) => {
                const moi = !guildes && ligne.userId === moiUserId;
                return (
                  <View style={[styles.ligne, moi && styles.ligneMoi]}>
                    <View style={styles.colRang}>
                      <View style={[styles.medaille, medailles[ligne.rang]]}>
                        <Text style={[styles.rang, ligne.rang <= 3 && styles.rangPodium]}>
                          {ligne.rang}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.nom, styles.colNom, moi && styles.nomMoi]} numberOfLines={1}>
                      {ligne.pseudo}
                      {moi && <Text style={styles.vous}>  vous</Text>}
                    </Text>
                    <Text style={[styles.cellule, styles.colClasse]} numberOfLines={1}>
                      {guildes ? (ligne.membres ?? '—') : ligne.classe || '—'}
                    </Text>
                    {!guildes && (
                      <Text style={[styles.cellule, styles.colNiveau]}>{ligne.niveau ?? '—'}</Text>
                    )}
                    <Text style={[styles.valeur, styles.colValeur]}>
                      {formater(ligne.valeur, tableau?.format)}
                    </Text>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </ModalShell>
  );
}

const medailles: Record<number, { backgroundColor: string; borderColor: string }> = {
  1: { backgroundColor: colors.gold, borderColor: colors.gold },
  2: { backgroundColor: colors.podiumArgent, borderColor: colors.podiumArgent },
  3: { backgroundColor: colors.podiumBronze, borderColor: colors.podiumBronze },
};

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },
  // `flexGrow: 0` : un ScrollView grandit par défaut et prendrait la moitié de l'écran.
  rail: { flexGrow: 0, width: 218, borderRightWidth: 1, borderRightColor: colors.goldDivider },
  railContenu: { padding: spacing.md, gap: spacing.xs + 2 },
  note: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textFaint,
    paddingTop: spacing.sm,
  },
  principal: { flex: 1, minWidth: 0 },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldDivider,
  },
  colonne: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  colRang: { width: 44 },
  colNom: { flex: 1, minWidth: 0 },
  colClasse: { width: 84 },
  colNiveau: { width: 36, textAlign: 'right' },
  colValeur: { width: 104, textAlign: 'right' },
  liste: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 4 },
  enRechargement: { opacity: 0.5 },
  ligne: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.tab,
    backgroundColor: colors.rowBg,
  },
  ligneMoi: { backgroundColor: colors.goldSofter, borderWidth: 1, borderColor: colors.goldBorder },
  medaille: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rang: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textDim },
  rangPodium: { color: colors.ink },
  nom: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  nomMoi: { color: colors.gold },
  vous: { fontFamily: fonts.body, fontSize: 10, color: colors.goldPale },
  cellule: { fontFamily: fonts.body, fontSize: 12, color: colors.textMute, textTransform: 'capitalize' },
  valeur: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
});
