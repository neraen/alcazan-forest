import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  cleEffet,
  dureeCourte,
  dureeLongue,
  libelleCarac,
  PLACES_PAR_LIGNE,
  signe,
} from '@/src/core/domain/effets';
import { iconeSort } from '@/src/core/media';
import Slot from '@/src/ui/Slot';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

import type { EffetEnCours } from './useEffetsActifs';

/**
 * Grille 3 × 2 des effets actifs, au bout de la barre d'action — port de
 * `components/spells/buff/Buff.jsx` (même place : à droite des potions).
 *
 * Ligne du HAUT = bienfaits, ligne du BAS = affaiblissements. La séparation suit la règle
 * serveur — deux plafonds distincts de 3 — et se lit d'un coup d'œil : du rouge en bas,
 * c'est qu'on vous a eu. Les emplacements vides SONT dessinés (contrairement aux sorts) :
 * sans eux, un affaiblissement seul remonterait sur la ligne du haut et se lirait comme un
 * bienfait. La barre ne montre la grille que lorsqu'au moins un effet est actif.
 *
 * Le doigt n'a pas de survol : un appui sur une case ouvre son détail (`DetailEffet`), un
 * second appui le referme.
 */
export default function GrilleEffets({
  bienfaits,
  affaiblissements,
  selection,
  onSelection,
}: {
  bienfaits: EffetEnCours[];
  affaiblissements: EffetEnCours[];
  selection: string | null;
  onSelection: (cle: string | null) => void;
}) {
  const ligne = (effets: EffetEnCours[], nefaste: boolean) => {
    const visibles = effets.slice(0, PLACES_PAR_LIGNE);
    return (
      <View style={styles.ligne}>
        {visibles.map((effet) => {
          const cle = cleEffet(effet);
          return (
            <CaseEffet
              key={cle}
              effet={effet}
              selectionne={selection === cle}
              onPress={() => onSelection(selection === cle ? null : cle)}
            />
          );
        })}
        {Array.from({ length: PLACES_PAR_LIGNE - visibles.length }, (_, i) => (
          <Slot
            key={(nefaste ? 'a' : 'b') + i}
            size="mini"
            style={nefaste ? styles.videNefaste : undefined}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.grille} accessibilityLabel="Effets actifs">
      {ligne(bienfaits, false)}
      {ligne(affaiblissements, true)}
    </View>
  );
}

function CaseEffet({
  effet,
  selectionne,
  onPress,
}: {
  effet: EffetEnCours;
  selectionne: boolean;
  onPress: () => void;
}) {
  const nature = effet.nefaste ? 'affaiblissement' : 'bienfait';
  return (
    <Pressable
      onPress={onPress}
      // Une case fait 26 pt : on élargit la zone de toucher jusqu'à la moitié de
      // l'espacement, sans déborder sur la voisine.
      hitSlop={2}
      accessibilityRole="button"
      accessibilityLabel={`${effet.name}, ${nature}${effet.controleLabel ? `, ${effet.controleLabel}` : ''}, encore ${dureeLongue(effet.restant)}`}>
      <Slot size="mini" src={iconeSort(effet.icone)}>
        <View
          pointerEvents="none"
          style={[
            styles.lisere,
            { borderColor: effet.nefaste ? colors.danger : colors.bonus },
            selectionne && styles.lisereSelection,
          ]}
        />
        {!!effet.controle && <Pulsation />}
        <View style={styles.compteur} pointerEvents="none">
          <Text style={[styles.compteurLabel, effet.nefaste && styles.compteurNefaste]}>
            {dureeCourte(effet.restant)}
          </Text>
        </View>
      </Slot>
    </Pressable>
  );
}

/**
 * Un contrôle (immobilisation…) change le jeu : il pulse, une teinte fixe se perd sur la
 * carte. Animation d'OPACITÉ seulement (pilote natif, aucun rendu React par image) ;
 * cadre fixe et épais si l'utilisateur a demandé de réduire les animations.
 */
function Pulsation() {
  const opacite = useRef(new Animated.Value(0)).current;
  const [reduite, setReduite] = useState(false);

  useEffect(() => {
    let vivant = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valeur) => vivant && setReduite(valeur))
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, []);

  useEffect(() => {
    if (reduite) return undefined;
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacite, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacite, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [opacite, reduite]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulsation, { opacity: reduite ? 1 : opacite }]}
    />
  );
}

/**
 * Détail d'un effet, au-dessus de la barre — l'infobulle du web. Il suit le compte à
 * rebours en direct et disparaît de lui-même quand l'effet se termine (l'appelant ne le
 * rend plus). Un appui le referme.
 */
export function DetailEffet({ effet, onFermer }: { effet: EffetEnCours; onFermer: () => void }) {
  return (
    <Pressable
      onPress={onFermer}
      style={[styles.detail, effet.nefaste && styles.detailNefaste]}
      accessibilityRole="button"
      accessibilityLabel="Fermer le détail de l'effet">
      <View style={styles.detailTete}>
        <Text style={styles.detailNom} numberOfLines={1}>
          {effet.name}
        </Text>
        <Text style={[styles.tag, effet.nefaste ? styles.tagNefaste : styles.tagBienfait]}>
          {effet.nefaste ? 'Affaiblissement' : 'Bienfait'}
        </Text>
      </View>
      {!!effet.controleLabel && (
        <Text style={styles.detailControle}>
          <Text style={styles.gras}>{effet.controleLabel}</Text>
          {effet.controleDescription ? ` — ${effet.controleDescription}` : ''}
        </Text>
      )}
      {(effet.caracteristiques ?? []).map(({ nom, value }) => (
        <Text key={nom} style={Number(value) < 0 ? styles.malus : styles.bonus}>
          {signe(Number(value))} {libelleCarac(nom)}
        </Text>
      ))}
      <Text style={styles.detailTemps}>Encore {dureeLongue(effet.restant)}</Text>
    </Pressable>
  );
}

const ECART = 4;

const styles = StyleSheet.create({
  /** 2 × 26 + 4 = 56 pt, quand les sorts en font 50 : la marge négative mange 3 pt du
      rembourrage de la barre en haut et en bas, sinon la barre grandissait d'un coup à
      l'apparition du premier effet. */
  grille: { gap: ECART, marginVertical: -3 },
  ligne: { flexDirection: 'row', gap: ECART },
  /** Emplacements vides de la ligne des affaiblissements : un soupçon de rouge suffit à
      dire « cette ligne-là, c'est ce qu'on subit ». */
  videNefaste: { borderColor: colors.dangerBorder },
  /** Le liseré dit la nature de l'effet ; posé PAR-DESSUS le slot, dont la bordure or
      reste celle du kit. */
  lisere: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: radius.bar,
  },
  lisereSelection: { borderWidth: 2, borderColor: colors.gold },
  pulsation: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: radius.bar,
    borderColor: colors.danger,
    backgroundColor: 'rgba(224, 74, 57, 0.22)',
  },
  compteur: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    minWidth: 12,
    paddingHorizontal: 2,
    borderTopLeftRadius: 4,
    backgroundColor: colors.hudBgStrong,
  },
  compteurLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    lineHeight: 11,
    color: colors.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  compteurNefaste: { color: colors.dangerText },
  detail: {
    width: 220,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    borderRadius: radius.bar,
    borderWidth: 1,
    borderColor: colors.hudBorder,
    backgroundColor: colors.hudBgStrong,
  },
  detailNefaste: { borderColor: colors.dangerBorder },
  detailTete: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  detailNom: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text },
  tag: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tagBienfait: { color: colors.bonus },
  tagNefaste: { color: colors.dangerText },
  detailControle: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.dangerText,
  },
  gras: { fontFamily: fonts.bodyBold },
  bonus: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.bonus },
  malus: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.dangerText },
  detailTemps: { marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
});
