import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { fondDeCarte } from '@/src/core/mapBackgrounds';
import type { CaseCarte, EtatInteraction, JoueurMinimal } from '@/src/core/types';
import { colors } from '@/src/ui/tokens';

import CaseTile, { OccupantJoueur } from './CaseTile';

/** Côté d'une case, en points. 48 px est la valeur du web sur un écran 1080p. */
export const CELL = 48;
const ZOOM_MIN = 0.55;
const ZOOM_MAX = 2;

export type MapCanvasHandle = { recentrer: () => void };

/**
 * La carte, sa caméra et ses gestes.
 *
 * Le web affiche les 24×16 cases d'un coup (`100.8vh × 67.2vh`). Sur un téléphone ce
 * serait 21 pt par case, sous la cible tactile de 44 pt : on montre donc une FENÊTRE de
 * la carte, centrée sur le joueur, qu'on peut déplacer et zoomer.
 *
 * Règle de la caméra : elle suit le joueur, SAUF si le joueur vient de déplacer la vue à
 * la main. Sans ce drapeau, chaque pas reprendrait la main sur le doigt — on ne pourrait
 * jamais regarder ailleurs que sous ses pieds.
 */
export default function MapCanvas({
  cases,
  mapId,
  abscisseJoueur,
  ordonneeJoueur,
  casesAccessibles,
  interactions,
  isInstance,
  user,
  onTapCase,
  onTapJoueur,
  onLongPressJoueur,
  onTapPnj,
  onTapBoss,
  onTapInteraction,
  onPanManuel,
  recentrerSignal,
}: {
  cases: CaseCarte[];
  mapId: number;
  abscisseJoueur: number;
  ordonneeJoueur: number;
  casesAccessibles: number[];
  interactions: Record<string, EtatInteraction>;
  isInstance: boolean;
  user: JoueurMinimal;
  onTapCase: (c: CaseCarte) => void;
  onTapJoueur: (j: OccupantJoueur) => void;
  onLongPressJoueur: (j: OccupantJoueur, c: CaseCarte) => void;
  onTapPnj: (c: CaseCarte) => void;
  onTapBoss: (c: CaseCarte) => void;
  onTapInteraction: (c: CaseCarte) => void;
  onPanManuel?: () => void;
  /** Incrémenté par le HUD pour forcer un recentrage (bouton « Recentrer »). */
  recentrerSignal: number;
}) {
  const [viewport, setViewport] = useState({ largeur: 0, hauteur: 0 });

  // Dimensions LUES des données, jamais supposées : le MapMaker pourrait un jour produire
  // une carte d'une autre taille, et 24×16 en dur deviendrait un bug silencieux.
  const { colonnes, lignes } = useMemo(() => {
    let maxA = 0;
    let maxO = 0;
    for (const c of cases) {
      if (c.abscisse > maxA) maxA = c.abscisse;
      if (c.ordonnee > maxO) maxO = c.ordonnee;
    }
    return { colonnes: maxA + 1, lignes: maxO + 1 };
  }, [cases]);

  const largeurCarte = colonnes * CELL;
  const hauteurCarte = lignes * CELL;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const echelle = useSharedValue(1);
  const txDebut = useSharedValue(0);
  const tyDebut = useSharedValue(0);
  const echelleDebut = useSharedValue(1);
  const panManuel = useRef(false);

  const centrerSurJoueur = useCallback(
    (anime = true) => {
      if (!viewport.largeur || !viewport.hauteur) return;
      const z = echelle.value;
      const cibleX = viewport.largeur / 2 - (abscisseJoueur + 0.5) * CELL * z;
      const cibleY = viewport.hauteur / 2 - (ordonneeJoueur + 0.5) * CELL * z;
      if (anime) {
        tx.value = withTiming(cibleX, { duration: 220 });
        ty.value = withTiming(cibleY, { duration: 220 });
      } else {
        tx.value = cibleX;
        ty.value = cibleY;
      }
    },
    [viewport, abscisseJoueur, ordonneeJoueur, tx, ty, echelle],
  );

  // Suivi du joueur. `panManuel` est remis à zéro par le bouton « Recentrer » du HUD.
  useEffect(() => {
    if (!panManuel.current) centrerSurJoueur(true);
  }, [abscisseJoueur, ordonneeJoueur, centrerSurJoueur]);

  // Changement de carte ou premier affichage : recadrage sec, sans animation (une
  // translation animée depuis la carte précédente n'aurait aucun sens).
  useEffect(() => {
    panManuel.current = false;
    centrerSurJoueur(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId, viewport.largeur, viewport.hauteur]);

  useEffect(() => {
    if (recentrerSignal > 0) {
      panManuel.current = false;
      centrerSurJoueur(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentrerSignal]);

  const marquerPanManuel = useCallback(() => {
    panManuel.current = true;
    onPanManuel?.();
  }, [onPanManuel]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        // Le seuil laisse passer les taps vers les cases : sans lui, le moindre
        // tremblement du doigt transformerait un déplacement en panoramique.
        // Il sert AUSSI à poser `panManuel` au bon moment : marquer la vue comme
        // « déplacée à la main » dès le premier contact (onTouchesDown) la marquerait à
        // chaque tap sur une case, et la caméra cesserait définitivement de suivre.
        .activeOffsetX([-10, 10])
        .activeOffsetY([-10, 10])
        .runOnJS(true)
        .onStart(() => {
          txDebut.value = tx.value;
          tyDebut.value = ty.value;
          marquerPanManuel();
        })
        .onUpdate((e) => {
          tx.value = txDebut.value + e.translationX;
          ty.value = tyDebut.value + e.translationY;
        }),
    [tx, ty, txDebut, tyDebut, marquerPanManuel],
  );

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart(() => {
          echelleDebut.value = echelle.value;
          marquerPanManuel();
        })
        .onUpdate((e) => {
          const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, echelleDebut.value * e.scale));
          echelle.value = z;
        }),
    [echelle, echelleDebut, marquerPanManuel],
  );

  const gestes = useMemo(() => Gesture.Simultaneous(pan, pinch), [pan, pinch]);

  const styleCamera = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: echelle.value },
    ],
  }));

  const mesurer = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewport({ largeur: width, hauteur: height });
  };

  const accessibles = useMemo(() => new Set(casesAccessibles), [casesAccessibles]);

  /**
   * ⚠️ Projection identique à `Map.getJoueur()` du web, et c'est un CONTRAT : pour soi on
   * renvoie les données complètes du joueur courant, pour autrui un objet reconstruit
   * depuis la case. Tout champ oublié ici n'existerait que sur son propre personnage — ce
   * qui se lit comme une donnée manquante côté serveur (c'est ce qui avait fait
   * disparaître l'icône d'alignement d'autrui).
   */
  const occupantDe = useCallback(
    (c: CaseCarte): OccupantJoueur | null => {
      if (c.abscisse === abscisseJoueur && c.ordonnee === ordonneeJoueur) {
        return {
          idJoueur: user.userId,
          pseudo: user.pseudo,
          nomClasse: user.nomClasse,
          sexe: user.sexe,
          niveau: user.niveau,
          nomAlignement: user.nomAlignement,
          iconeAlignement: user.iconeAlignement,
          // Tautologie : c'est cet appareil qui affiche la page.
          enLigne: 1,
          estMoi: true,
        };
      }
      // En instance, `carte_carreau.joueur_id` n'est NI lu NI écrit (colonne globale) :
      // l'occupation y est reconstruite depuis les membres présents, pas depuis la case.
      if (!isInstance && c.userId) {
        return {
          idJoueur: c.userId,
          pseudo: c.pseudo ?? '',
          nomClasse: c.nomClasse ?? '',
          sexe: c.sexe,
          niveau: c.niveau,
          nomAlignement: c.nomAlignement,
          iconeAlignement: c.iconeAlignement,
          enLigne: c.enLigne,
          estMoi: false,
        };
      }
      return null;
    },
    [abscisseJoueur, ordonneeJoueur, isInstance, user],
  );

  return (
    <View style={styles.viewport} onLayout={mesurer}>
      <GestureDetector gesture={gestes}>
        <Animated.View
          style={[
            styles.monde,
            { width: largeurCarte, height: hauteurCarte },
            styleCamera,
          ]}>
          <Image
            source={fondDeCarte(mapId)}
            style={StyleSheet.absoluteFill}
            contentFit="fill"
            transition={150}
          />
          {cases.map((c) => (
            <CaseTile
              key={c.carteCarreauId}
              uneCase={c}
              taille={CELL}
              accessible={accessibles.has(c.carteCarreauId)}
              joueur={occupantDe(c)}
              etatInteraction={interactions?.[String(c.carteCarreauId)]}
              onTapCase={onTapCase}
              onTapJoueur={onTapJoueur}
              onLongPressJoueur={onLongPressJoueur}
              onTapPnj={onTapPnj}
              onTapBoss={onTapBoss}
              onTapInteraction={onTapInteraction}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: colors.bgBottom },
  monde: { position: 'absolute', top: 0, left: 0, transformOrigin: 'top left' },
});
