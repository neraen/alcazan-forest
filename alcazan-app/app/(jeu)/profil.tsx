import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as inventaireApi from '@/src/core/api/inventaire';
import * as usersApi from '@/src/core/api/users';
import { cumulerCaracteristiquesEquipement } from '@/src/core/domain/caracteristiques';
import { messageErreur } from '@/src/core/http';
import { iconeAlignement, mediaUrl } from '@/src/core/media';
import type { JoueurMinimal } from '@/src/core/types';
import GameButton from '@/src/ui/GameButton';
import GaugeBar from '@/src/ui/GaugeBar';
import ModalShell from '@/src/ui/ModalShell';
import Panel from '@/src/ui/Panel';
import SectionTitle from '@/src/ui/SectionTitle';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

const CARACS = [
  { cle: 'constitution', label: 'Constitution', couleur: colors.statConstitution },
  { cle: 'force', label: 'Force', couleur: colors.statForce },
  { cle: 'dexterite', label: 'Dextérité', couleur: colors.statDexterite },
  { cle: 'intelligence', label: 'Intelligence', couleur: colors.statIntelligence },
  { cle: 'concentration', label: 'Concentration', couleur: colors.statConcentration },
  { cle: 'chance', label: 'Chance', couleur: colors.statChance },
] as const;

type Caracs = Record<string, number>;

/**
 * Fiche de personnage — port de `components/profil/profil`.
 *
 * Répartition des points : le client additionne pour afficher le « reste à placer », mais
 * c'est `POST /joueur/caracteristiques/update` qui tranche. `maxCaracsAllowed` vient du
 * serveur à chaque lecture — ne jamais le recalculer depuis le niveau.
 */
export default function ProfilScreen() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState<JoueurMinimal | null>(null);
  const [caracs, setCaracs] = useState<Caracs>({});
  const [caracsEnregistrees, setCaracsEnregistrees] = useState<Caracs>({});
  const [maxAutorise, setMaxAutorise] = useState(0);
  const [bonus, setBonus] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [largeurKarma, setLargeurKarma] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [dataUser, caracsInfo, equipes] = await Promise.all([
          usersApi.find(),
          usersApi.getCaracteristiques(),
          inventaireApi.getEquipementEquipe(),
        ]);
        const valeurs: Caracs = {};
        (caracsInfo.caracteristiques ?? []).forEach((c: any) => {
          valeurs[c.nom] = c.points;
        });
        setUser(dataUser);
        setCaracs(valeurs);
        setCaracsEnregistrees(valeurs);
        setMaxAutorise(caracsInfo.maxCaracsAllowed ?? 0);
        setBonus(cumulerCaracteristiquesEquipement(equipes));
      } catch {
        toast.error('Impossible de charger la fiche de personnage.');
      } finally {
        setChargement(false);
      }
      usersApi.getStats().then(setStats).catch(() => setStats(null));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const place = useMemo(
    () => Object.values(caracs).reduce((s, v) => s + (v || 0), 0),
    [caracs],
  );
  const placeEnregistre = useMemo(
    () => Object.values(caracsEnregistrees).reduce((s, v) => s + (v || 0), 0),
    [caracsEnregistrees],
  );
  const restant = maxAutorise - place;
  const enAttente = place > placeEnregistre;

  const ajouter = (cle: string, delta: number) => {
    const valeur = (caracs[cle] ?? 0) + delta;
    // On ne descend jamais sous la valeur DÉJÀ enregistrée : les points dépensés le sont.
    if (valeur < (caracsEnregistrees[cle] ?? 0)) return;
    if (delta > 0 && restant <= 0) return;
    setCaracs({ ...caracs, [cle]: valeur });
  };

  const valider = async () => {
    if (!enAttente || restant < 0) return;
    setEnvoi(true);
    try {
      await usersApi.updateCaracteristiques(caracs);
      setCaracsEnregistrees(caracs);
      toast.success('Les points ont été ajoutés.');
    } catch (erreur) {
      toast.error(messageErreur(erreur, 'La répartition a été refusée.'));
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement || !user) {
    return (
      <ModalShell title="Personnage" onClose={() => router.back()}>
        <View style={styles.centre}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </ModalShell>
    );
  }

  const karma = user.karma;

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/icons/people.png')}
      title={user.pseudo}
      subtitle={`${user.nomClasse.charAt(0).toUpperCase()}${user.nomClasse.slice(1)} · niveau ${user.niveau}`}
      onClose={() => router.back()}>
      <ScrollView contentContainerStyle={styles.corps}>
        <View style={styles.colonnes}>
          {/* Identité */}
          <Panel style={styles.colonne}>
            <SectionTitle size="sm">Identité</SectionTitle>
            <View style={styles.identite}>
              <Image
                source={{ uri: mediaUrl('/img/gui/CharacterPlayer/Avatar.png') }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.identiteTextes}>
                <Text style={styles.pseudo}>{user.pseudo}</Text>
                <Text style={styles.classe}>{user.nomClasse}</Text>
                {!!user.nomGuilde && <Text style={styles.ligne}>Guilde : {user.nomGuilde}</Text>}
                {!!user.nomAlignement && (
                  <View style={styles.alignement}>
                    {!!user.iconeAlignement && (
                      <Image
                        source={{ uri: iconeAlignement(user.iconeAlignement) }}
                        style={styles.iconeAlignement}
                        contentFit="contain"
                      />
                    )}
                    <Text style={styles.ligne}>{user.nomAlignement}</Text>
                  </View>
                )}
              </View>
            </View>

            <GaugeBar variant="hp" label="Santé" value={user.currentLife} max={user.maxLife} />
            <GaugeBar variant="mp" label="Mana" value={user.currentMana} max={user.maxMana} />
            <GaugeBar
              variant="xp"
              label="Expérience"
              value={user.experienceActuelle}
              max={user.experienceMax}
            />

            {!!karma && (
              <View
                style={styles.karma}
                onLayout={(e) => setLargeurKarma(e.nativeEvent.layout.width)}>
                <GaugeBar
                  variant="karma"
                  label="Karma"
                  value={karma.valeur - karma.min}
                  max={karma.max - karma.min}
                  right={<Text style={styles.karmaPalier}>{karma.palier}</Text>}
                  marker={50}
                  // Largeur MESURÉE : le dégradé bipolaire doit couvrir la piste réelle,
                  // qui dépend de la largeur de l'écran.
                  trackWidth={largeurKarma || undefined}
                />
              </View>
            )}
          </Panel>

          {/* Caractéristiques */}
          <Panel style={styles.colonne}>
            <SectionTitle
              size="sm"
              right={
                <Text style={[styles.restant, restant > 0 && styles.restantActif]}>
                  {restant} pt{restant > 1 ? 's' : ''}
                </Text>
              }>
              Caractéristiques
            </SectionTitle>

            {CARACS.map((carac) => {
              const base = caracs[carac.cle] ?? 0;
              const enregistre = caracsEnregistrees[carac.cle] ?? 0;
              const bonusCarac = bonus[carac.cle] ?? 0;
              return (
                <View key={carac.cle} style={styles.ligneCarac}>
                  <Text style={[styles.nomCarac, { color: carac.couleur }]}>{carac.label}</Text>
                  <Text style={styles.valeurCarac}>
                    {base}
                    {base > enregistre ? (
                      <Text style={styles.enAttente}> +{base - enregistre}</Text>
                    ) : null}
                    {bonusCarac ? <Text style={styles.bonus}> (+{bonusCarac})</Text> : null}
                  </Text>
                  <Pressable
                    onPress={() => ajouter(carac.cle, -1)}
                    disabled={base <= enregistre}
                    style={[styles.stepper, base <= enregistre && styles.stepperOff]}>
                    <Text style={styles.stepperLabel}>−</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => ajouter(carac.cle, 1)}
                    disabled={restant <= 0}
                    style={[styles.stepper, restant <= 0 && styles.stepperOff]}>
                    <Text style={styles.stepperLabel}>+</Text>
                  </Pressable>
                </View>
              );
            })}

            <GameButton
              variant="solid"
              onPress={valider}
              disabled={!enAttente || restant < 0}
              loading={envoi}>
              Valider
            </GameButton>
          </Panel>

          {/* Faits d'armes */}
          <Panel style={styles.colonne}>
            <SectionTitle size="sm">Faits d'armes</SectionTitle>
            {!stats && <Text style={styles.vide}>Chargement…</Text>}
            {[...(stats?.faitsDArmes ?? []), ...(stats?.etats ?? [])].map((entree: any) => (
              <View key={entree.cle} style={styles.ligneStat}>
                <Text style={styles.statLabel}>{entree.label}</Text>
                <Text style={styles.statValeur}>
                  {entree.valeur} {entree.unite ?? ''}
                </Text>
              </View>
            ))}
          </Panel>
        </View>
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corps: { padding: spacing.sm },
  colonnes: { flexDirection: 'row', gap: spacing.sm },
  // `minWidth: 0` et surtout PAS un plancher en points : trois colonnes de 260 pt
  // demandaient 830 pt, plus que la largeur utile d'un iPhone une fois l'encoche retirée
  // — la troisième sortait de l'écran.
  colonne: { flex: 1, gap: spacing.sm, minWidth: 0 },
  identite: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.pastilleBg,
  },
  identiteTextes: { flex: 1, gap: 2 },
  pseudo: { fontFamily: fonts.titleBold, fontSize: 16, color: colors.text },
  classe: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textTransform: 'capitalize',
  },
  ligne: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim },
  alignement: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconeAlignement: { width: 14, height: 14 },
  karma: { marginTop: spacing.xs },
  karmaPalier: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.karmaLabel },
  restant: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.textDim3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
  },
  restantActif: { color: colors.level, borderColor: colors.level },
  ligneCarac: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nomCarac: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 12 },
  valeurCarac: { fontFamily: fonts.body, fontSize: 12, color: colors.text, minWidth: 40 },
  enAttente: { color: colors.level },
  bonus: { color: colors.bonus },
  stepper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.bar,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
  },
  stepperOff: { opacity: 0.35 },
  stepperLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
  ligneStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.rowBg,
  },
  // Les deux côtés peuvent rétrécir et passer à la ligne : « Expérience totale gagnée »
  // face à « 4123 point(s) d'expérience » sortait du panneau par la droite.
  statLabel: { flexShrink: 1, fontFamily: fonts.body, fontSize: 12, color: colors.textDim },
  statValeur: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.gold,
  },
  vide: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint },
});
