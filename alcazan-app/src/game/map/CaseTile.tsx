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
import { colors, fonts } from '@/src/ui/tokens';

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
 * case (cf. `useCarte.majCibleMonstre`). Ne pas « corriger » cette absence.
 *
 * Vocabulaire visuel de la carte — volontairement réduit à quatre signes, parce que tout
 * ce qui se pose sur le décor le cache :
 *  - un POINT clair      → case où l'on peut marcher ;
 *  - une PASTILLE or     → quelque chose à qui parler ou à utiliser (PNJ, interaction) ;
 *  - un ANNEAU or au sol → mon personnage (trois archers identiques côte à côte, sinon) ;
 *  - un ANNEAU rouge     → ma cible.
 */
function CaseTile({
  uneCase,
  taille,
  accessible,
  joueur,
  ciblee,
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
  ciblee: boolean;
  etatInteraction?: EtatInteraction;
  onTapCase: (c: CaseCarte) => void;
  onTapJoueur: (j: OccupantJoueur) => void;
  onLongPressJoueur: (j: OccupantJoueur, c: CaseCarte) => void;
  onTapPnj: (c: CaseCarte) => void;
  onTapBoss: (c: CaseCarte) => void;
  onTapInteraction: (c: CaseCarte) => void;
}) {
  const anneau = (couleur: 'moi' | 'cible') => (
    <View
      pointerEvents="none"
      style={[
        styles.anneau,
        { width: taille * 0.94, height: taille * 0.94, borderRadius: taille },
        couleur === 'moi' ? styles.anneauMoi : styles.anneauCible,
      ]}
    />
  );

  const contenu = (() => {
    if (joueur) {
      return (
        <Pressable
          onPress={() => onTapJoueur(joueur)}
          onLongPress={() => onLongPressJoueur(joueur, uneCase)}
          style={styles.remplir}>
          {joueur.estMoi ? anneau('moi') : ciblee ? anneau('cible') : null}
          <Image
            source={{ uri: spriteJoueur(joueur.nomClasse, joueur.sexe) }}
            style={styles.sprite}
            contentFit="contain"
          />
          {!joueur.estMoi && (
            <>
              {/* Présence et alignement en BADGES de coin : logés dans l'étiquette, ils
                  ne laissaient que cinq caractères au pseudo. */}
              <View style={styles.badges} pointerEvents="none">
                {/* `enLigne` arrive en 1/0 OU en "1"/"0" selon l'hydratation DQL : un
                    test de vérité déclarerait tout le monde en ligne, `"0"` étant truthy. */}
                <View
                  style={[
                    styles.presence,
                    Number(joueur.enLigne) === 1 && styles.presenceEnLigne,
                  ]}
                />
                {!!joueur.iconeAlignement && (
                  <Image
                    source={{ uri: urlIconeAlignement(joueur.iconeAlignement) }}
                    style={styles.iconeAlignement}
                    contentFit="contain"
                  />
                )}
              </View>
              {/* L'étiquette tient DANS la case (au pied du sprite). Posée au-dessus de
                  la tête et large de 110 pt, elle recouvrait le voisin du dessus et
                  celles de deux joueurs côte à côte se chevauchaient. */}
              {/* Ciblé, c'est l'ÉTIQUETTE qui rougit : elle recouvre le pied du sprite,
                  donc l'anneau au sol, qui seul ne se voyait pas. */}
              <View
                style={[
                  styles.etiquette,
                  { maxWidth: taille + 8 },
                  ciblee && styles.etiquetteCiblee,
                ]}
                pointerEvents="none">
                <Text style={styles.etiquetteNom} numberOfLines={1}>
                  {joueur.pseudo}
                </Text>
              </View>
            </>
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
          <View style={styles.pastille} pointerEvents="none" />
        </Pressable>
      );
    }

    if (uneCase.bossId && uneCase.bossSkin) {
      return (
        <Pressable onPress={() => onTapBoss(uneCase)} style={styles.remplir}>
          {ciblee && anneau('cible')}
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
      const disponible = etatInteraction?.disponible === true && !etatInteraction.gisementEpuise
        && (!etatInteraction.disponibleAt || new Date(etatInteraction.disponibleAt).getTime() <= Date.now());
      return (
        <Pressable onPress={() => onTapInteraction(uneCase)} style={styles.remplir}>
          {/* La silhouette dorée suit l'alpha du PNG, sans carré lumineux autour. */}
          {disponible && !!uneCase.interactionSkin && (
            <View pointerEvents="none" style={styles.haloRessource}>
              <Image source={{ uri: spriteInteraction(uneCase.interactionSkin) }}
                style={styles.spriteRessource} contentFit="contain" contentPosition="bottom"
                tintColor={colors.gold} blurRadius={3} />
            </View>
          )}
          <View pointerEvents="none" style={styles.visuelRessource}>
            <Image
              source={{ uri: spriteInteraction(uneCase.interactionSkin) }}
              style={[styles.spriteRessource, indisponible && styles.epuise]}
              contentFit="contain" contentPosition="bottom"
            />
          </View>
          {/* Épuisée, la pastille se grise au lieu de disparaître : les sprites
              d'interaction sont souvent absents (le décor est peint dans le fond), et
              sans elle une case en recharge n'existait plus du tout à l'écran. */}
          <View
            style={[styles.pastille, indisponible && styles.pastilleEpuisee]}
            pointerEvents="none"
          />
        </Pressable>
      );
    }

    // Case libre où l'on peut marcher : un point, pas un voile. Huit cases blanchies
    // autour du personnage dessinaient un pavé laiteux qui délavait le décor.
    if (accessible && !uneCase.isWrap) return <View style={styles.pas} pointerEvents="none" />;

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
        // Une case occupée passe DEVANT ses voisines : son étiquette peut déborder de
        // quelques points et ne doit pas se faire rogner par le sprite d'à côté.
        !!joueur && styles.devant,
      ]}>
      {uneCase.isWrap && <View style={styles.passage} pointerEvents="none" />}
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
  devant: { zIndex: 2 },
  /** Passage vers une autre carte : cadre or arrondi, en retrait du bord de la case. */
  passage: {
    position: 'absolute',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.goldBorderStrong,
    backgroundColor: colors.goldSofter,
  },
  pas: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.mapDotBorder,
    backgroundColor: colors.mapDot,
  },
  remplir: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  sprite: { width: '92%', height: '92%' },
  spriteBoss: { width: '130%', height: '130%' },
  // MÊMES chiffres que `.skin` d'`InteractionMap.module.scss` (web) : 120 % × 145 % de la
  // case, posé 4 % sous son pied. Les sprites recadrés occupent presque tout le PNG, donc
  // cette boîte rend une ressource de la taille d'une case. L'ancienne (150 % × 180 %,
  // -18 %) la dessinait sur près de deux cases, à cheval sur la rangée du dessous.
  // Les vues décoratives ne capturent aucun toucher sur les cases voisines.
  visuelRessource: { position: 'absolute', left: '-10%', bottom: '-4%', width: '120%', height: '145%' },
  haloRessource: { position: 'absolute', left: '-10%', bottom: '-4%', width: '120%', height: '145%', opacity: 0.95 },
  spriteRessource: { width: '100%', height: '100%' },
  epuise: { opacity: 0.4 },
  /** Disque aplati pour faire une ellipse AU SOL : `borderRadius` seul sur un rectangle
      donne une gélule, pas une ellipse. */
  anneau: {
    position: 'absolute',
    bottom: '-31%',
    // 4 pt de liseré : l'aplatissement en réduit l'épaisseur visible à ~1,5 pt en haut
    // et en bas de l'ellipse.
    borderWidth: 4,
    transform: [{ scaleY: 0.4 }],
  },
  anneauMoi: { borderColor: colors.gold, backgroundColor: colors.ringMoi },
  anneauCible: { borderColor: colors.danger, backgroundColor: colors.ringCible },
  pastille: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.gold,
  },
  badges: {
    position: 'absolute',
    top: 1,
    left: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pastilleEpuisee: { backgroundColor: colors.textDim3, opacity: 0.8 },
  etiquette: {
    position: 'absolute',
    bottom: -3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: colors.mapLabelBg,
  },
  etiquetteCiblee: { backgroundColor: colors.mapLabelCible },
  etiquetteNom: {
    flexShrink: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    lineHeight: 10,
    color: colors.text,
  },
  iconeAlignement: { width: 10, height: 10 },
  presence: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.presenceHorsLigne,
  },
  presenceEnLigne: { backgroundColor: colors.presenceEnLigne },
});

export default memo(CaseTile);
