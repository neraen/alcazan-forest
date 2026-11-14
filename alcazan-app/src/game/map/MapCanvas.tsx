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
import type { CaseCarte, EtatInteraction, JoueurMinimal, TypeCible } from '@/src/core/types';
import { colors } from '@/src/ui/tokens';

import CaseTile, { OccupantJoueur } from './CaseTile';

/** Côté d'une case, en points, AVANT zoom. 48 px est la valeur du web sur un écran 1080p. */
export const CELL = 48;

/**
 * Zoom de départ. À 1 on ne voyait que 18 × 8 cases : le joueur avait le nez sur son
 * personnage et aucune idée de ce qui l'entourait. 0,85 en montre ~21 × 10 tout en
 * laissant une case à 41 pt — la cible tactile recommandée est 44 pt, et une case n'est
 * jamais tapée « de justesse » puisque ses huit voisines sont aussi des cibles valides.
 */
const ZOOM_DEFAUT = 0.85;
const ZOOM_MAX = 1.6;
/** Plancher absolu : en dessous, une case passe sous les 24 pt et devient intapable. */
const ZOOM_PLANCHER = 0.5;

/** Marges du HUD : zone de l'écran où le personnage ne doit JAMAIS se retrouver. */
export type MargesCamera = { haut: number; bas: number; gauche: number; droite: number };

/**
 * Borne une translation sur un axe. `margeDebut`/`margeFin` autorisent la carte à
 * s'écarter du bord d'autant (c'est ce qui laisse sortir le joueur de sous le HUD quand
 * il longe le bord du monde). Une carte plus petite que la zone est simplement centrée.
 */
function borner(
  valeur: number,
  tailleCarte: number,
  tailleVue: number,
  margeDebut: number,
  margeFin: number,
) {
  const max = margeDebut;
  const min = tailleVue - margeFin - tailleCarte;
  if (min > max) return (tailleVue - tailleCarte) / 2;
  return Math.min(max, Math.max(min, valeur));
}

/**
 * La carte, sa caméra et ses gestes.
 *
 * Le web affiche les 24×16 cases d'un coup (`100.8vh × 67.2vh`). Sur un téléphone ce
 * serait 21 pt par case, sous la cible tactile : on montre donc une FENÊTRE de la carte,
 * centrée sur le joueur, qu'on peut déplacer et zoomer.
 *
 * Trois règles de caméra :
 *  1. Elle suit le joueur, SAUF s'il vient de déplacer la vue à la main. Sans ce drapeau,
 *     chaque pas reprendrait la main sur le doigt.
 *  2. Elle ne montre pas de vide : la vue s'arrête au bord du monde au lieu de centrer le
 *     joueur sur du noir — sauf si ce bord l'enverrait SOUS le HUD (`marges`).
 *  3. Le zoom s'ancre sous les doigts. Ancré sur le coin haut-gauche de la carte, comme
 *     le fait un `scale` nu, le décor fuyait pendant le pincement.
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
  cible,
  marges,
  onTapCase,
  onTapJoueur,
  onLongPressJoueur,
  onTapPnj,
  onTapBoss,
  onTapInteraction,
  onVueLibre,
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
  /** Cible courante, pour l'entourer sur la carte. */
  cible: { type?: TypeCible; id?: number };
  marges: MargesCamera;
  onTapCase: (c: CaseCarte) => void;
  onTapJoueur: (j: OccupantJoueur) => void;
  onLongPressJoueur: (j: OccupantJoueur, c: CaseCarte) => void;
  onTapPnj: (c: CaseCarte) => void;
  onTapBoss: (c: CaseCarte) => void;
  onTapInteraction: (c: CaseCarte) => void;
  /** `true` dès que le joueur déplace la vue à la main, `false` quand elle le resuit. */
  onVueLibre?: (libre: boolean) => void;
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

  // Zoom minimal = celui où la carte COUVRE encore l'écran : dézoomer plus loin ne
  // montrerait que du vide autour d'un timbre-poste.
  const zoomMin = useMemo(() => {
    if (!viewport.largeur || !viewport.hauteur) return ZOOM_PLANCHER;
    const couvre = Math.max(viewport.largeur / largeurCarte, viewport.hauteur / hauteurCarte);
    return Math.min(ZOOM_MAX, Math.max(ZOOM_PLANCHER, couvre));
  }, [viewport, largeurCarte, hauteurCarte]);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const echelle = useSharedValue(ZOOM_DEFAUT);
  const txDebut = useSharedValue(0);
  const tyDebut = useSharedValue(0);
  // Point du MONDE sous les doigts au début du pincement : il doit y rester.
  const ancreMondeX = useSharedValue(0);
  const ancreMondeY = useSharedValue(0);
  const echelleDebut = useSharedValue(ZOOM_DEFAUT);
  const panManuel = useRef(false);
  const zoomInitialise = useRef(false);

  const { haut, bas, gauche, droite } = marges;

  /** Translation qui centre le joueur au zoom `z`, règles 2 comprises. */
  const cameraSurJoueur = useCallback(
    (z: number) => {
      const demi = (CELL * z) / 2 + 6;
      const axe = (
        position: number,
        tailleCarte: number,
        tailleVue: number,
        margeDebut: number,
        margeFin: number,
      ) => {
        const centreMonde = (position + 0.5) * CELL * z;
        // Centré, puis ramené au bord du monde (aucune marge : pas de vide gratuit).
        let t = borner(tailleVue / 2 - centreMonde, tailleCarte * z, tailleVue, 0, 0);
        // …sauf si ce bord cache le personnage sous le HUD : on le dégage du minimum.
        const ecran = t + centreMonde;
        if (ecran - demi < margeDebut) t += margeDebut - (ecran - demi);
        else if (ecran + demi > tailleVue - margeFin) t -= ecran + demi - (tailleVue - margeFin);
        return t;
      };
      return {
        x: axe(abscisseJoueur, largeurCarte, viewport.largeur, gauche, droite),
        y: axe(ordonneeJoueur, hauteurCarte, viewport.hauteur, haut, bas),
      };
    },
    [abscisseJoueur, ordonneeJoueur, largeurCarte, hauteurCarte, viewport, haut, bas, gauche, droite],
  );

  const centrerSurJoueur = useCallback(
    (anime = true) => {
      if (!viewport.largeur || !viewport.hauteur) return;
      const camera = cameraSurJoueur(echelle.value);
      if (anime) {
        tx.value = withTiming(camera.x, { duration: 220 });
        ty.value = withTiming(camera.y, { duration: 220 });
      } else {
        tx.value = camera.x;
        ty.value = camera.y;
      }
    },
    [viewport, cameraSurJoueur, tx, ty, echelle],
  );

  const libererVue = useCallback(
    (libre: boolean) => {
      if (panManuel.current === libre) return;
      panManuel.current = libre;
      onVueLibre?.(libre);
    },
    [onVueLibre],
  );

  // Suivi du joueur. `panManuel` est remis à zéro par le bouton « Recentrer » du HUD.
  useEffect(() => {
    if (!panManuel.current) centrerSurJoueur(true);
  }, [abscisseJoueur, ordonneeJoueur, centrerSurJoueur]);

  // Changement de carte ou premier affichage : recadrage sec, sans animation (une
  // translation animée depuis la carte précédente n'aurait aucun sens).
  useEffect(() => {
    if (!viewport.largeur || !viewport.hauteur) return;
    if (!zoomInitialise.current) {
      zoomInitialise.current = true;
      echelle.value = Math.max(ZOOM_DEFAUT, zoomMin);
    } else if (echelle.value < zoomMin) {
      // La nouvelle carte est plus petite : le zoom gardé de la précédente la laisserait
      // flotter dans le vide.
      echelle.value = zoomMin;
    }
    libererVue(false);
    centrerSurJoueur(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId, viewport.largeur, viewport.hauteur, zoomMin]);

  useEffect(() => {
    if (recentrerSignal > 0) {
      libererVue(false);
      centrerSurJoueur(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentrerSignal]);

  /** Bornes d'une vue déplacée À LA MAIN : le monde peut s'écarter des bords d'une marge. */
  const bornerVue = useCallback(
    (x: number, y: number, z: number) => ({
      x: borner(x, largeurCarte * z, viewport.largeur, gauche, droite),
      y: borner(y, hauteurCarte * z, viewport.hauteur, haut, bas),
    }),
    [largeurCarte, hauteurCarte, viewport, haut, bas, gauche, droite],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        // Un seul doigt : à deux, c'est le pincement qui déplace la vue (par son point
        // focal). Les deux gestes écrivant la même translation, les laisser tourner
        // ensemble faisait trembler la carte.
        .maxPointers(1)
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
          libererVue(true);
        })
        .onUpdate((e) => {
          const vue = bornerVue(
            txDebut.value + e.translationX,
            tyDebut.value + e.translationY,
            echelle.value,
          );
          tx.value = vue.x;
          ty.value = vue.y;
        }),
    [tx, ty, txDebut, tyDebut, echelle, libererVue, bornerVue],
  );

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onStart((e) => {
          echelleDebut.value = echelle.value;
          ancreMondeX.value = (e.focalX - tx.value) / echelle.value;
          ancreMondeY.value = (e.focalY - ty.value) / echelle.value;
          libererVue(true);
        })
        .onUpdate((e) => {
          const z = Math.min(ZOOM_MAX, Math.max(zoomMin, echelleDebut.value * e.scale));
          const vue = bornerVue(
            e.focalX - ancreMondeX.value * z,
            e.focalY - ancreMondeY.value * z,
            z,
          );
          echelle.value = z;
          tx.value = vue.x;
          ty.value = vue.y;
        }),
    [echelle, echelleDebut, ancreMondeX, ancreMondeY, tx, ty, zoomMin, libererVue, bornerVue],
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

  /** La case porte-t-elle la cible courante ? (joueur ou boss — un monstre n'est pas dessiné) */
  const estCiblee = useCallback(
    (c: CaseCarte, occupant: OccupantJoueur | null) => {
      if (!cible.id) return false;
      if (cible.type === 'player') return !!occupant && !occupant.estMoi && occupant.idJoueur === cible.id;
      if (cible.type === 'boss') return c.bossId === cible.id;
      return false;
    },
    [cible.type, cible.id],
  );

  return (
    // Les gestes sont posés sur la FENÊTRE, pas sur le monde : sinon un doigt posé sur
    // le vide laissé par un bord de carte ne déplaçait rien.
    <GestureDetector gesture={gestes}>
      <View style={styles.viewport} onLayout={mesurer} collapsable={false}>
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
          {cases.map((c) => {
            const occupant = occupantDe(c);
            return (
              <CaseTile
                key={c.carteCarreauId}
                uneCase={c}
                taille={CELL}
                accessible={accessibles.has(c.carteCarreauId)}
                joueur={occupant}
                ciblee={estCiblee(c, occupant)}
                etatInteraction={interactions?.[String(c.carteCarreauId)]}
                onTapCase={onTapCase}
                onTapJoueur={onTapJoueur}
                onLongPressJoueur={onLongPressJoueur}
                onTapPnj={onTapPnj}
                onTapBoss={onTapBoss}
                onTapInteraction={onTapInteraction}
              />
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: colors.bgBottom },
  monde: { position: 'absolute', top: 0, left: 0, transformOrigin: 'top left' },
});
