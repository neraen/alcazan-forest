import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { EtapeQuete, FicheQuete, ObjectifQuete, PnjQuete, RecompenseQuete } from '@/src/core/api/quest';
import { dateFin, lieuTexte, type TonQuete } from '@/src/core/domain/quetes';
import { avatarPnj, iconeUi, imageItem } from '@/src/core/media';
import Vignette from '@/src/ui/Vignette';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

/** Couleur du liseré et du badge de chaque état — mêmes teintes que le web. */
export const TONS: Record<TonQuete, { trait: string; texte: string; fond: string; bord: string }> = {
  pret: { trait: colors.gold, texte: colors.ink, fond: colors.gold, bord: colors.gold },
  cours: { trait: colors.mpTo, texte: colors.mpLabel, fond: colors.badgeNeutralBg, bord: colors.mpFrom },
  dispo: { trait: colors.level, texte: colors.level, fond: colors.levelSoftBg, bord: colors.levelBorder },
  fini: { trait: colors.success, texte: colors.success, fond: colors.successBg, bord: colors.successBorder },
};

const majuscule = (texte?: string | null) => (texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : '');

/**
 * Fiche d'une quête du journal (colonne de droite) — port de
 * `modals/quetesModal/QueteDetail.jsx`. Même ordre de lecture que le web : OÙ aller,
 * QUOI faire, ce que ça RAPPORTE, puis les paroles du PNJ.
 */
export default function QueteDetail({ quete }: { quete: FicheQuete }) {
  const etape = quete.etape;

  return (
    <ScrollView contentContainerStyle={styles.fiche} showsVerticalScrollIndicator={false}>
      <View style={styles.entete}>
        <View style={styles.badges}>
          {quete.statut === 'enCours' && <Badge ton="pret">{`Étape ${etape?.numero ?? 1}`}</Badge>}
          {quete.statut === 'disponible' && <Badge ton="dispo">Nouvelle quête</Badge>}
          {quete.statut === 'terminee' && <Badge ton="fini">✓ Terminée</Badge>}
          {!!quete.niveauMin && quete.statut !== 'terminee' && (
            <View style={styles.badgeNeutre}>
              <Text style={styles.badgeNeutreTexte}>{`Niveau ${quete.niveauMin} requis`}</Text>
            </View>
          )}
        </View>
        <Text style={styles.titre}>{quete.nom}</Text>
        {quete.statut === 'enCours' && !!etape?.titre && (
          <Text style={styles.sousTitre}>{majuscule(etape.titre)}</Text>
        )}
      </View>

      {quete.statut === 'enCours' && etape && <EtapeEnCours etape={etape} />}
      {quete.statut === 'disponible' && (
        <>
          <Destination
            pnj={quete.donneur}
            etiquette="Pour commencer"
            consigne={`Parlez à ${quete.donneur?.nom ?? 'son commanditaire'}`}
            enAvant
          />
          <Resume introduction={quete.introduction} vide="Son commanditaire vous en dira davantage." />
        </>
      )}
      {quete.statut === 'terminee' && <Terminee quete={quete} />}
    </ScrollView>
  );
}

function EtapeEnCours({ etape }: { etape: EtapeQuete }) {
  const objectifs = etape.objectifs ?? [];
  const nomPnj = etape.pnj?.nom ?? 'votre contact';
  // Chaque objectif porte déjà sa récompense quand elle dépend du choix : la section
  // « Récompenses » ne ferait que la redire.
  const recompensesParObjectif = etape.objectifsAuChoix && etape.recompensesVariables;
  const retour =
    objectifs.length === 1
      ? `Une fois fait, retournez voir ${nomPnj} et choisissez « ${objectifs[0].bouton} ».`
      : `Dès que l'un d'eux est rempli, retournez voir ${nomPnj}.`;

  return (
    <>
      {etape.pret ? (
        <Destination
          pnj={etape.pnj}
          etiquette="Prochaine étape"
          consigne={objectifs.length ? `Retournez voir ${nomPnj}` : `Parlez à ${nomPnj}`}
          enAvant
        />
      ) : (
        <Destination pnj={etape.pnj} etiquette="Votre contact" consigne={nomPnj} />
      )}

      <Section titre="Objectifs" note={etape.objectifsAuChoix ? 'Un seul suffit' : undefined}>
        {objectifs.map((objectif) => (
          <Objectif key={objectif.actionId} objectif={objectif} montrerRecompenses={recompensesParObjectif} />
        ))}
        {objectifs.length === 0 && (
          <View style={styles.objectif}>
            <View style={[styles.coche, styles.cocheContact]}>
              <Text style={styles.cocheContactTexte}>!</Text>
            </View>
            <View style={styles.objectifCorps}>
              <Text style={styles.objectifLibelle}>{`Parler à ${nomPnj}`}</Text>
              <Text style={styles.objectifSous}>
                {etape.decision
                  ? 'Une décision vous attend dans ce dialogue.'
                  : "La suite de l'histoire vous attend dans ce dialogue."}
              </Text>
            </View>
          </View>
        )}
        {objectifs.length > 0 && !etape.pret && <Text style={styles.note}>{retour}</Text>}
        {etape.decision && objectifs.length > 0 && (
          <Text style={styles.note}>{`Une décision vous attendra auprès de ${nomPnj}.`}</Text>
        )}
      </Section>

      {!recompensesParObjectif && (etape.recompenses.length > 0 || etape.recompensesVariables) && (
        <Section titre="Récompenses">
          {etape.recompenses.length > 0 ? (
            <View style={styles.recompenses}>
              {etape.recompenses.map((r, i) => (
                <RecompenseChip key={i} recompense={r} />
              ))}
            </View>
          ) : (
            <Text style={styles.note}>La récompense dépendra de votre choix.</Text>
          )}
        </Section>
      )}

      {etape.paroles.length > 0 && (
        <Section titre="Ses dernières paroles">
          <View style={styles.paroles}>
            {etape.paroles.map((paragraphe, index) => (
              <Text key={index} style={styles.parolesTexte}>
                {paragraphe}
              </Text>
            ))}
            {!!etape.pnj && <Text style={styles.parolesAuteur}>{`— ${etape.pnj.nom}`}</Text>}
          </View>
        </Section>
      )}
    </>
  );
}

function Terminee({ quete }: { quete: FicheQuete }) {
  const fin = dateFin(quete.termineeLe);
  return (
    <>
      <View style={styles.accomplie}>
        <View style={styles.sceau}>
          <Text style={styles.sceauTexte}>✓</Text>
        </View>
        <View style={styles.accomplieCorps}>
          <Text style={styles.accomplieTitre}>Quête accomplie</Text>
          <Text style={styles.accomplieTexte}>
            {fin ? `Achevée le ${fin}` : 'Achevée il y a longtemps déjà'}
            {quete.donneur ? ` · confiée par ${quete.donneur.nom}` : ''}
          </Text>
        </View>
      </View>
      <Resume introduction={quete.introduction} vide="Une page tournée de votre aventure." />
    </>
  );
}

function Resume({ introduction, vide }: { introduction: string[]; vide: string }) {
  return (
    <Section titre="Résumé">
      {introduction.length > 0 ? (
        introduction.map((p, i) => (
          <Text key={i} style={styles.resume}>
            {p}
          </Text>
        ))
      ) : (
        <Text style={styles.note}>{vide}</Text>
      )}
    </Section>
  );
}

function Section({ titre, note, children }: { titre: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitre}>
        <Text style={styles.sectionTitreTexte}>{titre}</Text>
        <View style={styles.sectionTrait} />
        {!!note && (
          <View style={styles.sectionNote}>
            <Text style={styles.sectionNoteTexte}>{note}</Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

function Badge({ ton, children }: { ton: TonQuete; children: string }) {
  const t = TONS[ton];
  return (
    <View style={[styles.badge, { backgroundColor: t.fond, borderColor: t.bord }]}>
      <Text style={[styles.badgeTexte, { color: t.texte }]}>{children}</Text>
    </View>
  );
}

/** Carte « où aller » : le PNJ, la carte, la case, et si on y est déjà. */
function Destination({
  pnj,
  etiquette,
  consigne,
  enAvant = false,
}: {
  pnj: PnjQuete | null;
  etiquette: string;
  consigne: string;
  enAvant?: boolean;
}) {
  return (
    <View style={[styles.destination, enAvant && styles.destinationEnAvant]}>
      <Portrait pnj={pnj} />
      <View style={styles.destinationCorps}>
        <Text style={styles.destinationEtiquette}>{etiquette}</Text>
        <Text style={styles.destinationConsigne}>{consigne}</Text>
        {pnj?.lieu ? (
          <View style={styles.lieu}>
            <Image source={{ uri: iconeUi('/img/icons/map.png') }} style={styles.lieuIcone} contentFit="contain" />
            <Text style={styles.lieuTexte}>{lieuTexte(pnj.lieu)}</Text>
            {pnj.lieu.ici && (
              <View style={styles.ici}>
                <Text style={styles.iciTexte}>Vous y êtes</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.lieuInconnu}>Lieu inconnu</Text>
        )}
      </View>
    </View>
  );
}

function Portrait({ pnj }: { pnj: PnjQuete | null }) {
  const [casse, setCasse] = useState(false);
  useEffect(() => setCasse(false), [pnj?.avatar]);
  const source = avatarPnj(pnj?.avatar);

  return (
    <View style={styles.portrait}>
      {source && !casse ? (
        <Image
          source={{ uri: source }}
          style={styles.portraitImage}
          contentFit="contain"
          onError={() => setCasse(true)}
        />
      ) : (
        <Text style={styles.portraitInitiale}>{(pnj?.nom || '?').charAt(0)}</Text>
      )}
    </View>
  );
}

function Objectif({ objectif, montrerRecompenses }: { objectif: ObjectifQuete; montrerRecompenses: boolean }) {
  const { progress, fait, lieu } = objectif;
  const fini = fait === true;
  const pct = progress && progress.target > 0 ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : 0;

  return (
    <View style={[styles.objectif, fini && styles.objectifFait]}>
      <View style={[styles.coche, fini && styles.cocheFaite]}>{fini && <Text style={styles.cocheTexte}>✓</Text>}</View>
      {!!objectif.item && <Vignette src={imageItem(objectif.item)} initiale={objectif.libelle} taille="sm" />}
      <View style={styles.objectifCorps}>
        <Text style={[styles.objectifLibelle, fini && styles.objectifLibelleFait]}>{objectif.libelle}</Text>
        {!!lieu && (
          <Text style={styles.objectifSous}>
            {lieuTexte(lieu)}
            {lieu.ici ? ' · vous y êtes' : ''}
          </Text>
        )}
        {!!progress && (
          <View style={styles.progression}>
            <View style={styles.piste}>
              <View style={[styles.remplissage, fini && styles.remplissageFait, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.compte}>
              {`${progress.current} / ${progress.target}`}
              <Text style={styles.unite}>{` ${progress.unit}`}</Text>
            </Text>
          </View>
        )}
        {montrerRecompenses && objectif.recompenses.length > 0 && (
          <View style={styles.recompenses}>
            {objectif.recompenses.map((r, i) => (
              <RecompenseChip key={i} recompense={r} compacte />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function RecompenseChip({ recompense, compacte = false }: { recompense: RecompenseQuete; compacte?: boolean }) {
  const cote = compacte ? 20 : 26;
  const texte =
    recompense.type === 'or'
      ? `${recompense.quantity} po`
      : recompense.type === 'experience'
        ? `${recompense.quantity}`
        : recompense.quantity > 1
          ? `${recompense.quantity} × ${recompense.label}`
          : recompense.label;

  let icone: ReactNode;
  if (recompense.type === 'or') {
    icone = (
      <Image source={{ uri: iconeUi('/img/gui/Money03.png') }} style={{ width: cote, height: cote }} contentFit="contain" />
    );
  } else if (recompense.type === 'experience') {
    // Pastille dessinée : le sprite `gui/Xp.png` est un texte gris illisible sur fond sombre.
    icone = (
      <View style={[styles.xp, { width: cote, height: cote, borderRadius: cote / 2 }]}>
        <Text style={[styles.xpTexte, compacte && styles.xpTexteCompact]}>XP</Text>
      </View>
    );
  } else {
    icone = (
      <Vignette
        src={imageItem(recompense)}
        initiale={recompense.label}
        taille="sm"
        style={{ width: cote, height: cote, borderRadius: radius.bar }}
      />
    );
  }

  return (
    <View style={[styles.recompense, compacte && styles.recompenseCompacte]}>
      {icone}
      <Text style={[styles.recompenseTexte, compacte && styles.recompenseTexteCompact]} numberOfLines={1}>
        {texte}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fiche: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  entete: { gap: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.bar, borderWidth: 1 },
  badgeTexte: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  badgeNeutre: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.bar,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.badgeNeutralBg,
  },
  badgeNeutreTexte: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textDim,
  },
  titre: { fontFamily: fonts.titleBold, fontSize: 20, lineHeight: 26, color: colors.gold, letterSpacing: 0.5 },
  sousTitre: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic', color: colors.textMute },

  section: { gap: spacing.sm },
  sectionTitre: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitreTexte: {
    fontFamily: fonts.titleBold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  sectionTrait: { flex: 1, height: 1, backgroundColor: colors.goldDivider },
  sectionNote: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.bar,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.badgeNeutralBg,
  },
  sectionNoteTexte: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.paLabel },
  note: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, fontStyle: 'italic', color: colors.textMute },

  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  destinationEnAvant: { borderColor: colors.goldBorder, backgroundColor: colors.goldSofter },
  portrait: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldMiniBorder,
    backgroundColor: colors.pastilleBg,
  },
  portraitImage: { width: '100%', height: '100%' },
  portraitInitiale: { fontFamily: fonts.title, fontSize: 24, color: colors.gold },
  destinationCorps: { flex: 1, minWidth: 0, gap: 2 },
  destinationEtiquette: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  destinationConsigne: { fontFamily: fonts.titleBold, fontSize: 15, lineHeight: 20, color: colors.text },
  lieu: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lieuIcone: { width: 14, height: 14 },
  lieuTexte: { flexShrink: 1, fontFamily: fonts.body, fontSize: 12, color: colors.textDim },
  lieuInconnu: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic', color: colors.textDim3 },
  ici: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.bar,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
  },
  iciTexte: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.success },

  objectif: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  objectifFait: { borderColor: colors.successBorder, backgroundColor: colors.successBg },
  coche: {
    width: 20,
    height: 20,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.slotDash,
  },
  cocheFaite: { borderColor: colors.success, backgroundColor: colors.success },
  cocheTexte: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 14, color: colors.ink },
  cocheContact: { borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: colors.goldSofter },
  cocheContactTexte: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 14, color: colors.gold },
  objectifCorps: { flex: 1, minWidth: 0, gap: 5 },
  objectifLibelle: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18, color: colors.text },
  objectifLibelleFait: { color: colors.success },
  objectifSous: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  progression: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  piste: { flex: 1, height: 7, overflow: 'hidden', borderRadius: radius.bar, backgroundColor: colors.track },
  remplissage: { height: '100%', borderRadius: radius.bar, backgroundColor: colors.xpTo },
  remplissageFait: { backgroundColor: colors.success },
  compte: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text },
  unite: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },

  recompenses: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  recompense: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: spacing.sm + 2,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.badgeNeutralBg,
  },
  recompenseCompacte: { paddingVertical: 2, paddingLeft: 2, paddingRight: spacing.sm, gap: 5 },
  recompenseTexte: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: 12, color: colors.goldPale },
  recompenseTexteCompact: { fontSize: 11 },
  xp: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.xpTo },
  xpTexte: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: colors.ink },
  xpTexteCompact: { fontSize: 7.5 },

  paroles: {
    gap: 6,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.goldHalf,
    borderTopRightRadius: radius.slot,
    borderBottomRightRadius: radius.slot,
    backgroundColor: colors.rowBg,
  },
  parolesTexte: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, fontStyle: 'italic', color: colors.textDim },
  parolesAuteur: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.textFaint, textAlign: 'right' },
  resume: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textDim },

  accomplie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
  },
  sceau: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
  },
  sceauTexte: { fontFamily: fonts.bodyBold, fontSize: 18, lineHeight: 22, color: colors.ink },
  accomplieCorps: { flex: 1, minWidth: 0, gap: 2 },
  accomplieTitre: { fontFamily: fonts.titleBold, fontSize: 15, color: colors.success },
  accomplieTexte: { fontFamily: fonts.body, fontSize: 12, color: colors.textDim },
});
