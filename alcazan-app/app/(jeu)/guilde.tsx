import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import * as guildeApi from '@/src/core/api/guilde';
import type { Annuaire, EtatGuilde, Guilde, MembreGuilde } from '@/src/core/api/guilde';
import { useAuth } from '@/src/core/AuthContext';
import { getUserInfo } from '@/src/core/auth';
import { nombre, sansAccent } from '@/src/core/domain/texte';
import { messageErreur } from '@/src/core/http';
import { mediaUrl } from '@/src/core/media';
import { useAppDispatch } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import Chip from '@/src/ui/Chip';
import { confirmer } from '@/src/ui/confirmer';
import GameButton from '@/src/ui/GameButton';
import ModalShell from '@/src/ui/ModalShell';
import Onglets from '@/src/ui/Onglets';
import SearchField, { champStyle } from '@/src/ui/SearchField';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';
import Vignette from '@/src/ui/Vignette';

type Onglet = 'guilde' | 'annuaire' | 'candidatures';

/**
 * Guilde — port de `pages/guildePage/GuildePage.jsx` : appartenance, annuaire,
 * candidatures.
 *
 * Toutes les décisions (qui peut accepter, promouvoir, exclure) viennent du SERVEUR, dans
 * `appartenance.peutGerer` / `peutPromouvoir` / `peutDissoudre`. L'écran ne rejoue pas la
 * règle des grades : il masque ce qui n'est pas permis, le serveur refuse de toute façon.
 * Chaque action renvoie l'état frais et complet — aucun rechargement derrière une
 * transition.
 *
 * Mise en page mobile : le web aligne sur chaque ligne de membre un menu de grade et deux
 * liens (Transmettre, Exclure). Au pouce, trois cibles de 20 pt côte à côte dont une
 * exclut quelqu'un, c'est l'accident garanti. Ici on TOUCHE un membre, et ses actions
 * s'ouvrent dans la colonne de droite, à la place de la fiche de la guilde — de vrais
 * boutons, et une confirmation devant tout ce qui ne se défait pas.
 */
export default function GuildeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { token } = useAuth();
  const moi = useMemo(() => getUserInfo(token)?.pseudo ?? null, [token]);

  const [etat, setEtat] = useState<EtatGuilde | null>(null);
  const [annuaire, setAnnuaire] = useState<Annuaire | null>(null);
  const [onglet, setOnglet] = useState<Onglet>('guilde');
  const [recherche, setRecherche] = useState('');
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [membreOuvert, setMembreOuvert] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([guildeApi.etat(), guildeApi.annuaire()])
      .then(([e, a]) => {
        setEtat(e);
        setAnnuaire(a);
      })
      .catch(() => toast.error('Impossible de charger les guildes.'))
      .finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Exécute une transition. Le serveur renvoie l'état frais, donc on le pose directement ;
   * l'annuaire est relu en plus parce qu'un départ ou une dissolution le change.
   */
  const agir = useCallback(
    async (appel: () => Promise<EtatGuilde>, succes?: string) => {
      setEnCours(true);
      try {
        const frais = await appel();
        setEtat(frais);
        setMembreOuvert(null);
        setAnnuaire(await guildeApi.annuaire());
        if (succes) toast.success(succes);
        // La guilde s'affiche aussi dans la fiche de personnage : on force sa relecture.
        dispatch(updateJoueurState({ needRefresh: true }));
      } catch (erreur) {
        toast.error(messageErreur(erreur, 'Action impossible.'));
      } finally {
        setEnCours(false);
      }
    },
    [dispatch, toast],
  );

  if (chargement || !etat) {
    return (
      <ModalShell iconSrc={mediaUrl('/img/icons/flag.png')} title="Guilde" onClose={() => router.back()}>
        {chargement ? <Chargement /> : <Vide>Les guildes sont inaccessibles pour le moment.</Vide>}
      </ModalShell>
    );
  }

  const { guilde, appartenance } = etat;
  const config = etat.config ?? {};
  const gradesAttribuables = (etat.grades ?? []).filter((g) => g.attribuable);
  const estMembre = appartenance?.statut === 'membre';
  const peutAgirSurMembres = !!appartenance && (appartenance.peutGerer || appartenance.peutPromouvoir);

  const membres = (etat.membres ?? []).filter(
    (m) => !recherche.trim() || sansAccent(m.pseudo).includes(sansAccent(recherche.trim())),
  );
  const membre = etat.membres?.find((m) => m.userId === membreOuvert) ?? null;

  /* ------------------------------------------------------------------ Ma guilde */

  const ficheGuilde = (g: Guilde) => (
    <>
      <View style={styles.identite}>
        <Vignette src={mediaUrl('/img/icons/flag.png')} initiale={g.nom} taille="lg" />
        <View style={styles.identiteTexte}>
          <Text style={styles.nomGuilde} numberOfLines={2}>
            {g.nom}
          </Text>
          <Text style={styles.meta}>
            Niveau {g.niveau} · {g.membres} / {g.placeMax} places
          </Text>
        </View>
      </View>
      {!!g.description && <Text style={styles.devise}>« {g.description} »</Text>}
      <Text style={styles.meta}>
        Votre grade : <Text style={styles.fort}>{appartenance?.gradeLabel}</Text>
        {!estMembre && ' (candidature en attente)'}
      </Text>

      <GameButton
        variant="ghost"
        disabled={enCours}
        onPress={() =>
          confirmer(
            estMembre ? 'Quitter cette guilde ?' : 'Retirer votre candidature ?',
            estMembre ? 'Vous devrez candidater à nouveau pour revenir.' : 'Vous pourrez candidater ailleurs.',
            () => agir(() => guildeApi.quitter(), estMembre ? 'Guilde quittée.' : 'Candidature retirée.'),
            { libelle: estMembre ? 'Quitter' : 'Retirer', destructif: true },
          )
        }>
        {estMembre ? 'Quitter la guilde' : 'Retirer ma candidature'}
      </GameButton>
      {appartenance?.peutDissoudre && (
        <GameButton
          variant="danger"
          disabled={enCours}
          onPress={() =>
            confirmer(
              'Dissoudre la guilde ?',
              "Tous les membres en seront retirés. C'est irréversible.",
              () => agir(() => guildeApi.dissoudre(), 'Guilde dissoute.'),
              { libelle: 'Dissoudre', destructif: true },
            )
          }>
          Dissoudre la guilde
        </GameButton>
      )}
    </>
  );

  const ficheMembre = (m: MembreGuilde) => (
    <>
      <View style={styles.identite}>
        <Vignette initiale={m.pseudo} taille="lg" />
        <View style={styles.identiteTexte}>
          <Text style={styles.nomGuilde} numberOfLines={1}>
            {m.pseudo}
          </Text>
          <Text style={[styles.meta, styles.capitale]}>
            {m.classe || '—'} · niveau {m.niveau ?? '—'}
          </Text>
        </View>
        <Pressable onPress={() => setMembreOuvert(null)} hitSlop={12} accessibilityLabel="Fermer la fiche">
          <Text style={styles.fermer}>✕</Text>
        </Pressable>
      </View>

      {appartenance?.peutPromouvoir && (
        <>
          <Text style={styles.titreSection}>Grade</Text>
          <View style={styles.puces}>
            {gradesAttribuables.map((grade) => (
              <Chip
                key={grade.valeur}
                label={grade.label}
                actif={m.grade === grade.valeur}
                disabled={enCours}
                onPress={() =>
                  m.grade !== grade.valeur &&
                  agir(
                    () => guildeApi.promouvoir(m.userId, grade.valeur),
                    `${m.pseudo} est désormais ${grade.label.toLowerCase()}.`,
                  )
                }
              />
            ))}
          </View>
          <GameButton
            variant="ghost"
            disabled={enCours}
            onPress={() =>
              confirmer(
                `Transmettre la baronnie à ${m.pseudo} ?`,
                'Vous deviendrez officier.',
                () => agir(() => guildeApi.transmettre(m.userId), 'Baronnie transmise.'),
                { libelle: 'Transmettre' },
              )
            }>
            Transmettre la baronnie
          </GameButton>
        </>
      )}
      {appartenance?.peutGerer && (
        <GameButton
          variant="danger"
          disabled={enCours}
          onPress={() =>
            confirmer(
              `Exclure ${m.pseudo} ?`,
              'Il devra candidater à nouveau pour revenir.',
              () => agir(() => guildeApi.exclure(m.userId), `${m.pseudo} a été exclu.`),
              { libelle: 'Exclure', destructif: true },
            )
          }>
          Exclure de la guilde
        </GameButton>
      )}
    </>
  );

  const maGuilde = () =>
    !guilde ? (
      <View style={styles.centre}>
        <Vignette src={mediaUrl('/img/icons/flag.png')} initiale="G" taille="lg" />
        <Text style={styles.videTitre}>Vous n’appartenez à aucune guilde.</Text>
        <Text style={styles.videTexte}>
          Rejoignez-en une depuis l’annuaire, ou fondez la vôtre pour {nombre(config.coutCreation ?? 0)}{' '}
          pièces d’or (niveau {config.niveauMinCreation} requis).
        </Text>
        <GameButton variant="solid" onPress={() => setOnglet('annuaire')}>
          Voir l’annuaire
        </GameButton>
      </View>
    ) : (
      <View style={styles.corps}>
        <View style={styles.principal}>
          <View style={styles.barre}>
            <SearchField
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Rechercher un membre"
              style={styles.remplir}
            />
            <Text style={styles.compteur}>
              {guilde.membres} / {guilde.placeMax}
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.liste}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            {membres.length === 0 && <Vide>Aucun membre ne correspond.</Vide>}
            {membres.map((m) => {
              const cestMoi = m.pseudo === moi;
              const ouvrable = peutAgirSurMembres && !cestMoi;
              return (
                <Pressable
                  key={m.userId}
                  disabled={!ouvrable}
                  onPress={() => setMembreOuvert(membreOuvert === m.userId ? null : m.userId)}
                  style={({ pressed }) => [
                    styles.ligne,
                    cestMoi && styles.ligneMoi,
                    membreOuvert === m.userId && styles.ligneOuverte,
                    pressed && styles.presse,
                  ]}>
                  <Vignette initiale={m.pseudo} taille="sm" />
                  <Text style={[styles.pseudo, cestMoi && styles.pseudoMoi]} numberOfLines={1}>
                    {m.pseudo}
                    {cestMoi && <Text style={styles.vous}>  vous</Text>}
                  </Text>
                  <View style={styles.grade}>
                    <Text style={styles.gradeLabel}>{m.gradeLabel}</Text>
                  </View>
                  <Text style={[styles.cellule, styles.capitale]} numberOfLines={1}>
                    {m.classe || '—'}
                  </Text>
                  <Text style={styles.niveau}>niv. {m.niveau ?? '—'}</Text>
                  {/* Le chevron dit qu'on peut toucher la ligne — et son absence, qu'on
                      n'a aucun droit sur ce membre. */}
                  <Text style={styles.chevron}>{ouvrable ? '›' : ' '}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <ScrollView style={styles.fiche} contentContainerStyle={styles.ficheContenu}>
          {membre ? ficheMembre(membre) : ficheGuilde(guilde)}
        </ScrollView>
      </View>
    );

  /* ------------------------------------------------------------------- Annuaire */

  const pageAnnuaire = () => (
    <View style={styles.corps}>
      <ScrollView style={styles.principal} contentContainerStyle={styles.liste}>
        {!!annuaire?.message && <Text style={styles.videTexte}>{annuaire.message}</Text>}
        {(annuaire?.guildes ?? []).length === 0 && !annuaire?.message && (
          <Vide>Aucune guilde de votre alignement.</Vide>
        )}
        {(annuaire?.guildes ?? []).map((g) => (
          <View key={g.id} style={styles.ligne}>
            <Vignette src={mediaUrl('/img/icons/flag.png')} initiale={g.nom} taille="sm" />
            <View style={styles.remplir}>
              <Text style={styles.pseudoSeul} numberOfLines={1}>
                {g.nom}
              </Text>
              <Text style={styles.sousLigne} numberOfLines={1}>
                Niveau {g.niveau} · {g.membres} / {g.placeMax} membres
                {g.complete ? ' · complète' : ''}
              </Text>
            </View>
            {!guilde && (
              <GameButton
                style={styles.boutonLigne}
                disabled={enCours}
                onPress={() =>
                  agir(() => guildeApi.candidater(g.id), `Candidature envoyée à « ${g.nom} ».`)
                }>
                Candidater
              </GameButton>
            )}
          </View>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.fiche}
        contentContainerStyle={styles.ficheContenu}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {guilde ? (
          <Text style={styles.videTexte}>
            Vous êtes déjà lié à « {guilde.nom} ». Quittez-la pour candidater ailleurs ou fonder la
            vôtre.
          </Text>
        ) : (
          <>
            <Text style={styles.titreSection}>Fonder une guilde</Text>
            {/* Les champs AVANT l'explication : en paysage le clavier mange la moitié
                basse de l'écran, seul le haut de la colonne reste visible en tapant. */}
            <TextInput
              value={nom}
              onChangeText={setNom}
              maxLength={config.nomMax}
              placeholder={`Nom (${config.nomMin ?? 3} à ${config.nomMax ?? 40} caractères)`}
              placeholderTextColor={colors.textDim3}
              returnKeyType="next"
              style={styles.champ}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={config.descriptionMax}
              placeholder="Devise (facultative)"
              placeholderTextColor={colors.textDim3}
              returnKeyType="done"
              style={styles.champ}
            />
            <Text style={styles.sousLigne}>
              {nombre(config.coutCreation ?? 0)} pièces d’or · niveau {config.niveauMinCreation}{' '}
              minimum · un alignement est requis.
            </Text>
            <GameButton
              variant="solid"
              loading={enCours}
              disabled={nom.trim().length < (config.nomMin ?? 3)}
              onPress={() =>
                confirmer(
                  `Fonder « ${nom.trim()} » ?`,
                  `${nombre(config.coutCreation ?? 0)} pièces d'or seront débitées.`,
                  () => agir(() => guildeApi.creer(nom.trim(), description.trim() || null), 'Guilde fondée !'),
                  { libelle: 'Fonder' },
                )
              }>
              Fonder
            </GameButton>
          </>
        )}
      </ScrollView>
    </View>
  );

  /* --------------------------------------------------------------- Candidatures */

  const pageCandidatures = () =>
    !appartenance?.peutGerer ? (
      <Vide>Seuls les officiers et le baron peuvent traiter les candidatures.</Vide>
    ) : etat.candidatures.length === 0 ? (
      <Vide>Aucune candidature en attente.</Vide>
    ) : (
      <ScrollView contentContainerStyle={[styles.liste, styles.listeEtroite]}>
        {etat.candidatures.map((c) => (
          <View key={c.userId} style={styles.ligne}>
            <Vignette initiale={c.pseudo} taille="sm" />
            <View style={styles.remplir}>
              <Text style={styles.pseudoSeul} numberOfLines={1}>
                {c.pseudo}
              </Text>
              <Text style={[styles.sousLigne, styles.capitale]}>
                {c.classe || '—'} · niveau {c.niveau ?? '—'}
              </Text>
            </View>
            <GameButton
              variant="solid"
              style={styles.boutonLigne}
              disabled={enCours}
              onPress={() => agir(() => guildeApi.accepter(c.userId), `${c.pseudo} rejoint la guilde.`)}>
              Accepter
            </GameButton>
            <GameButton
              variant="danger"
              style={styles.boutonLigne}
              disabled={enCours}
              onPress={() => agir(() => guildeApi.refuser(c.userId), 'Candidature refusée.')}>
              Refuser
            </GameButton>
          </View>
        ))}
      </ScrollView>
    );

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/icons/flag.png')}
      title="Guilde"
      subtitle={guilde ? `${guilde.nom} · ${guilde.membres} / ${guilde.placeMax} membres` : 'Aucune guilde'}
      onClose={() => router.back()}>
      <Onglets<Onglet>
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { cle: 'guilde', label: 'Ma guilde' },
          { cle: 'annuaire', label: 'Annuaire' },
          { cle: 'candidatures', label: 'Candidatures', pastille: etat.candidatures?.length || undefined },
        ]}
      />
      {onglet === 'guilde' && maGuilde()}
      {onglet === 'annuaire' && pageAnnuaire()}
      {onglet === 'candidatures' && pageCandidatures()}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },
  principal: { flex: 1, minWidth: 0 },
  remplir: { flex: 1, minWidth: 0 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  videTitre: { fontFamily: fonts.title, fontSize: 15, color: colors.gold, textAlign: 'center' },
  videTexte: {
    maxWidth: 440,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMute,
    textAlign: 'center',
  },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compteur: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMute },
  liste: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs + 1 },
  listeEtroite: { alignSelf: 'center', width: '100%', maxWidth: 620 },
  ligne: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.tab,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.rowBg,
  },
  ligneMoi: { backgroundColor: colors.goldSofter },
  ligneOuverte: { borderColor: colors.gold },
  presse: { opacity: 0.7 },
  pseudo: { flex: 1, minWidth: 0, fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  pseudoSeul: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  pseudoMoi: { color: colors.gold },
  vous: { fontFamily: fonts.body, fontSize: 10, color: colors.goldPale },
  sousLigne: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.textFaint },
  grade: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldMiniBorder,
  },
  gradeLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.gold },
  cellule: { width: 64, fontFamily: fonts.body, fontSize: 11, color: colors.textMute },
  capitale: { textTransform: 'capitalize' },
  niveau: { width: 46, textAlign: 'right', fontFamily: fonts.bodyBold, fontSize: 11, color: colors.level },
  chevron: { width: 10, fontFamily: fonts.bodyBold, fontSize: 18, lineHeight: 20, color: colors.goldHalf },
  boutonLigne: { minHeight: 36, paddingHorizontal: 12 },
  fiche: { flexGrow: 0, width: 286, borderLeftWidth: 1, borderLeftColor: colors.goldDivider },
  ficheContenu: { padding: spacing.md, gap: spacing.sm + 2 },
  identite: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identiteTexte: { flex: 1, minWidth: 0, gap: 2 },
  nomGuilde: { fontFamily: fonts.title, fontSize: 15, color: colors.gold },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMute },
  fort: { fontFamily: fonts.bodyBold, color: colors.text },
  devise: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic', lineHeight: 17, color: colors.textSoft },
  fermer: { fontSize: 16, color: colors.gold, paddingHorizontal: 4 },
  titreSection: {
    fontFamily: fonts.title,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  champ: champStyle,
});
