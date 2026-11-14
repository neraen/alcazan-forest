import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';

import type { IssuePas } from '@/src/game/map/useCarte';
import { colors } from '@/src/ui/tokens';

const TAILLE = 124;
const RAYON = TAILLE / 2;
/** Au centre, rien ne part : un pouce posé là n'a pas encore choisi de direction. */
const ZONE_MORTE = RAYON * 0.24;
/** Les quatre flèches sont ce qu'on VOIT : elles prennent 60° chacune, les diagonales 30°. */
const DEMI_SECTEUR_CARDINAL = 30;
const CHEVRON = 13;
const POUCE = 46;

/** Un appui bref = UN pas, toujours : la répétition n'arrive qu'en maintenant. */
const DELAI_REPETITION_MS = 320;
/** Cadence de marche en maintenant (le serveur répond plus vite que ça en local). */
const PERIODE_PAS_MS = 170;

type Direction = { dx: -1 | 0 | 1; dy: -1 | 0 | 1 };

const CARDINALES: { angle: number; direction: Direction }[] = [
  { angle: 0, direction: { dx: 1, dy: 0 } },
  { angle: 90, direction: { dx: 0, dy: 1 } },
  { angle: 180, direction: { dx: -1, dy: 0 } },
  { angle: 270, direction: { dx: 0, dy: -1 } },
];

/** Rotation d'un chevron (deux bords d'un carré) pour qu'il pointe dans chaque sens. */
const FLECHES: { direction: Direction; rotation: string }[] = [
  { direction: { dx: 0, dy: -1 }, rotation: '45deg' },
  { direction: { dx: 1, dy: 0 }, rotation: '135deg' },
  { direction: { dx: 0, dy: 1 }, rotation: '225deg' },
  { direction: { dx: -1, dy: 0 }, rotation: '315deg' },
];

/** Direction désignée par un point du disque (origine en haut à gauche, y vers le bas —
    comme les ordonnées de la carte). */
function directionDepuis(x: number, y: number): Direction | null {
  const vx = x - RAYON;
  const vy = y - RAYON;
  if (Math.hypot(vx, vy) < ZONE_MORTE) return null;

  const angle = ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360;
  for (const cardinale of CARDINALES) {
    const ecart = Math.abs(angle - cardinale.angle);
    if (Math.min(ecart, 360 - ecart) <= DEMI_SECTEUR_CARDINAL) return cardinale.direction;
  }
  return { dx: vx > 0 ? 1 : -1, dy: vy > 0 ? 1 : -1 };
}

const memeDirection = (a: Direction | null, b: Direction | null) =>
  a?.dx === b?.dx && a?.dy === b?.dy;

const attendre = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Croix directionnelle — le pendant tactile des flèches du clavier du web.
 *
 * Elle n'ajoute AUCUNE règle de déplacement : `onPas(dx, dy)` joue exactement ce que
 * ferait un tap sur la case voisine (`useCarte.pasVers`), le serveur arbitre comme
 * d'habitude. Ce composant ne fait que traduire un pouce en direction.
 *
 * C'est UN disque et non quatre boutons : le pouce glisse d'une direction à l'autre sans
 * se relever, et les diagonales (que le jeu autorise, huit cases voisines) tombent
 * naturellement entre deux flèches. Quatre `Pressable` auraient imposé de lever le doigt à
 * chaque virage.
 */
export default function CroixDirectionnelle({
  onPas,
}: {
  onPas: (dx: number, dy: number) => Promise<IssuePas>;
}) {
  const [direction, setDirection] = useState<Direction | null>(null);
  const directionRef = useRef<Direction | null>(null);
  /** Coin haut-gauche du disque à l'écran, relevé à la pose du pouce : `locationX` n'est
      fiable qu'à cet instant (ensuite il dépend de la vue survolée). */
  const origine = useRef({ x: 0, y: 0 });
  const enMarche = useRef(false);
  const onPasRef = useRef(onPas);
  onPasRef.current = onPas;

  const marcher = useCallback(async () => {
    if (enMarche.current) return;
    enMarche.current = true;
    const debut = Date.now();
    let premier = true;
    try {
      while (directionRef.current) {
        const depart = Date.now();
        const { dx, dy } = directionRef.current;
        const issue = await onPasRef.current(dx, dy);
        // Mur, refus du serveur ou changement de carte : on s'ARRÊTE. Continuer
        // empilerait les refus (un toast par tentative) ou ferait retraverser la porte
        // qu'on vient de franchir. Il faut relâcher, ou changer de direction.
        if (issue !== 'pas') break;

        const pause = premier
          ? DELAI_REPETITION_MS - (Date.now() - debut)
          : PERIODE_PAS_MS - (Date.now() - depart);
        premier = false;
        if (pause > 0) await attendre(pause);
      }
    } finally {
      enMarche.current = false;
    }
  }, []);

  const viser = useCallback(
    (evenement: GestureResponderEvent) => {
      const { pageX, pageY } = evenement.nativeEvent;
      const suivante = directionDepuis(pageX - origine.current.x, pageY - origine.current.y);
      if (memeDirection(suivante, directionRef.current)) return;
      directionRef.current = suivante;
      setDirection(suivante);
      if (suivante) {
        Haptics.selectionAsync().catch(() => {});
        marcher();
      }
    },
    [marcher],
  );

  const lacher = useCallback(() => {
    directionRef.current = null;
    setDirection(null);
  }, []);

  // Écran quitté le pouce encore posé : la boucle ne doit pas continuer à marcher.
  useEffect(() => lacher, [lacher]);

  const allumee = (fleche: Direction) =>
    !!direction &&
    ((fleche.dx !== 0 && fleche.dx === direction.dx) ||
      (fleche.dy !== 0 && fleche.dy === direction.dy));

  // Le témoin suit la direction, diagonales comprises (normalisées pour rester à la même
  // distance du centre).
  const norme = direction ? Math.hypot(direction.dx, direction.dy) : 1;
  const pouce = direction && {
    left: RAYON + (direction.dx / norme) * RAYON * 0.52 - POUCE / 2,
    top: RAYON + (direction.dy / norme) * RAYON * 0.52 - POUCE / 2,
  };

  return (
    <View
      accessibilityLabel="Croix directionnelle"
      style={[styles.socle, !!direction && styles.socleActif]}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(evenement) => {
        const { pageX, pageY, locationX, locationY } = evenement.nativeEvent;
        origine.current = { x: pageX - locationX, y: pageY - locationY };
        viser(evenement);
      }}
      onResponderMove={viser}
      onResponderRelease={lacher}
      onResponderTerminate={lacher}>
      {/* Tout le décor est en `pointerEvents: none` : c'est le DISQUE qui reçoit le
          toucher, sinon `locationX` serait mesuré depuis une flèche. */}
      {!!pouce && <View pointerEvents="none" style={[styles.pouce, pouce]} />}
      <View pointerEvents="none" style={styles.moyeu} />
      {FLECHES.map((fleche) => (
        <View
          key={fleche.rotation}
          pointerEvents="none"
          style={[
            styles.chevron,
            {
              left: RAYON + fleche.direction.dx * RAYON * 0.6 - CHEVRON / 2,
              top: RAYON + fleche.direction.dy * RAYON * 0.6 - CHEVRON / 2,
              transform: [{ rotate: fleche.rotation }],
            },
            allumee(fleche.direction) && styles.chevronAllume,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  socle: {
    width: TAILLE,
    height: TAILLE,
    borderRadius: RAYON,
    borderWidth: 1,
    borderColor: colors.padBorder,
    backgroundColor: colors.padBg,
  },
  socleActif: { borderColor: colors.goldBorderStrong, backgroundColor: colors.padBgActif },
  moyeu: {
    position: 'absolute',
    left: RAYON - 9,
    top: RAYON - 9,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.padBorder,
  },
  chevron: {
    position: 'absolute',
    width: CHEVRON,
    height: CHEVRON,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 2,
    borderColor: colors.padGlyph,
  },
  chevronAllume: { borderColor: colors.goldHover },
  pouce: {
    position: 'absolute',
    width: POUCE,
    height: POUCE,
    borderRadius: POUCE / 2,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.padThumb,
  },
});
