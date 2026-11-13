import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  iconeAlignement as urlIconeAlignement,
  spriteBoss,
  spriteInteraction,
  spriteJoueur,
  spritePnj,
} from '@/src/core/media';
import type { CaseCarte, EtatInteraction } from '@/src/core/types';
import { colors, fonts, radius } from '@/src/ui/tokens';

export type OccupantJoueur = {
  idJoueur: number;
  pseudo: string;
  nomClasse: string;
  sexe: string | null;
  niveau: number | null;
  nomAlignement?: string | null;
  iconeAlignement?: string | null;
  enLigne: number | string;
  estMoi: boolean;
};

/**
 * Une case de la grille. Les MONSTRES n'y sont volontairement pas dessinés : comme dans
 * tout le jeu, ils sont peints dans l'image de fond et se ciblent en marchant sur leur
 * case (cf. `useCarte.majCibleMonstreInstance`). Ne pas « corriger » cette absence.
 */
function CaseTile({
  uneCase,
  taille,
  accessible,
  joueur,
  etatInteraction,
  onTapCase,
  onTapJoueur,
  onLongPressJoueur,
  onTapPnj,
  onTapBoss,
  onTapInteraction,
}: {
  uneCase: CaseCarte;
  taille: number;
  accessible: boolean;
  joueur: OccupantJoueur | null;
  etatInteraction?: EtatInteraction;
  onTapCase: (c: CaseCarte) => void;
  onTapJoueur: (j: OccupantJoueur) => void;
  onLongPressJoueur: (j: OccupantJoueur, c: CaseCarte) => void;
  onTapPnj: (c: CaseCarte) => void;
  onTapBoss: (c: CaseCarte) => void;
  onTapInteraction: (c: CaseCarte) => void;
}) {
  const contenu = (() => {
    if (joueur) {
      return (
        <Pressable
          onPress={() => onTapJoueur(joueur)}
          onLongPress={() => onLongPressJoueur(joueur, uneCase)}
          style={styles.remplir}>
          <Image
            source={{ uri: spriteJoueur(joueur.nomClasse, joueur.sexe) }}
            style={styles.sprite}
            contentFit="contain"
          />
          {!joueur.estMoi && (
            <View style={styles.etiquette} pointerEvents="none">
              <Text style={styles.etiquetteNom} numberOfLines={1}>
                {joueur.pseudo}
              </Text>
              {!!joueur.iconeAlignement && (
                <Image
                  source={{ uri: urlIconeAlignement(joueur.iconeAlignement) }}
                  style={styles.iconeAlignement}
                  contentFit="contain"
                />
              )}
              {/* `enLigne` arrive en 1/0 OU en "1"/"0" selon l'hydratation DQL : un test
                  de vérité déclarerait tout le monde en ligne, `"0"` étant truthy. */}
              <View
                style={[
                  styles.presence,
                  Number(joueur.enLigne) === 1 && styles.presenceEnLigne,
                ]}
              />
            </View>
          )}
        </Pressable>
      );
    }

    if (uneCase.pnjId && uneCase.pnjSkin) {
      return (
        <Pressable onPress={() => onTapPnj(uneCase)} style={styles.remplir}>
          <Image
            source={{ uri: spritePnj(uneCase.pnjSkin) }}
            style={styles.sprite}
            contentFit="contain"
          />
        </Pressable>
      );
    }

    if (uneCase.bossId && uneCase.bossSkin) {
      return (
        <Pressable onPress={() => onTapBoss(uneCase)} style={styles.remplir}>
          <Image
            source={{ uri: spriteBoss(uneCase.bossSkin) }}
            style={styles.spriteBoss}
            contentFit="contain"
          />
        </Pressable>
      );
    }

    if (uneCase.interactionId) {
      const indisponible = etatInteraction?.disponible === false;
      return (
        <Pressable onPress={() => onTapInteraction(uneCase)} style={styles.remplir}>
          <Image
            source={{ uri: spriteInteraction(uneCase.interactionSkin) }}
            style={[styles.sprite, indisponible && styles.epuise]}
            contentFit="contain"
          />
          {!indisponible && <View style={styles.pastilleInteraction} />}
        </Pressable>
      );
    }

    return null;
  })();

  return (
    <Pressable
      onPress={() => onTapCase(uneCase)}
      style={[
        styles.case,
        {
          width: taille,
          height: taille,
          left: uneCase.abscisse * taille,
          top: uneCase.ordonnee * taille,
        },
        accessible && styles.accessible,
        uneCase.isWrap && styles.passage,
      ]}>
      {contenu}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** ⚠️ `position: relative` implicite en RN, mais les enfants en `absolute` s'ancrent
      bien ici : c'est le pendant de la règle « `.case` DOIT rester position: relative »
      du web, où un enfant mal ancré débordait sur toute la grille et interceptait les
      taps de déplacement. */
  case: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  /** Case atteignable en un pas. Le web la peint en blanc à 60 % ; on reste dans la
      palette du jeu (voile clair + liseré or) pour ne pas délaver le décor. */
  accessible: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: colors.goldSofter,
  },
  passage: {
    borderWidth: 1,
    borderColor: colors.goldHalf,
    backgroundColor: 'rgba(227, 182, 79, 0.12)',
  },
  remplir: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  sprite: { width: '92%', height: '92%' },
  spriteBoss: { width: '130%', height: '130%' },
  epuise: { opacity: 0.4 },
  pastilleInteraction: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  etiquette: {
    position: 'absolute',
    top: -15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 110,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.bar,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    backgroundColor: 'rgba(4, 26, 33, 0.92)',
  },
  etiquetteNom: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.gold },
  iconeAlignement: { width: 9, height: 9 },
  presence: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.presenceHorsLigne },
  presenceEnLigne: { backgroundColor: colors.presenceEnLigne },
});

export default memo(CaseTile);
