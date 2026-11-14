import { usePathname } from 'expo-router';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderGameText } from '../gameText';
import { colors, fonts, radius, spacing } from '../tokens';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  /** Durée d'affichage et échéance : la barre de temps se recale dessus si elle est
      re-montée en cours de route (voir l'hôte iOS). */
  duree: number;
  creeA: number;
  expireA: number;
};

type ToastApi = {
  info: (m: string) => void;
  success: (m: string) => void;
  warning: (m: string) => void;
  error: (m: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLES = 3;
/** Largeur maximale d'un message : assez pour qu'un compte rendu d'attaque tienne sur une
    ou deux lignes au lieu de s'empiler en colonne étroite au milieu de l'écran. */
const LARGEUR_MAX = 620;

/**
 * Un message reste affiché LE TEMPS DE LE LIRE, pas une durée fixe : 4 s pour « Vous
 * n'avez pas de cible. » c'est long, et pour trois lignes de combat c'est court. Un
 * temps de prise en main + ~26 caractères par seconde (lecture courante), borné.
 */
const DUREE_BASE_MS = 1000;
const MS_PAR_CARACTERE = 38;
const DUREE_MIN_MS = 2000;
const DUREE_MAX_MS = 5500;

export const dureeLecture = (message: string) =>
  Math.min(DUREE_MAX_MS, Math.max(DUREE_MIN_MS, DUREE_BASE_MS + message.length * MS_PAR_CARACTERE));

const COULEURS: Record<ToastKind, string> = {
  info: colors.gold,
  success: colors.success,
  warning: colors.paLabel,
  error: colors.danger,
};

/** Un message. Composant à part pour porter sa propre barre de temps. */
function Message({
  toast,
  enHaut,
  largeurMax,
  onFermer,
}: {
  toast: Toast;
  enHaut: boolean;
  largeurMax: number;
  onFermer: (id: number) => void;
}) {
  // Figés au montage : un re-montage en cours d'affichage reprend là où le temps en est.
  const [restant] = useState(() => Math.max(0, toast.expireA - Date.now()));
  const [neuf] = useState(() => Date.now() - toast.creeA < 250);
  const temps = useSharedValue(toast.duree > 0 ? restant / toast.duree : 0);

  useEffect(() => {
    temps.value = withTiming(0, { duration: restant, easing: Easing.linear });
  }, [temps, restant]);

  const styleTemps = useAnimatedStyle(() => ({ width: `${temps.value * 100}%` }));
  const entree = enHaut ? FadeInUp.duration(180) : FadeInDown.duration(180);

  return (
    // Pas d'animation d'entrée pour un message déjà à l'écran qu'on re-monte : il
    // clignoterait à l'arrivée du suivant.
    <Animated.View entering={neuf ? entree : undefined} exiting={FadeOut.duration(150)}>
      <Pressable
        onPress={() => onFermer(toast.id)}
        accessibilityRole="alert"
        style={[styles.toast, kinds[toast.kind], { maxWidth: largeurMax }]}>
        <Text style={styles.message}>{toast.message}</Text>
        {/* Le temps restant se VOIT : un message qui disparaît sans prévenir pendant
            qu'on le lit donne l'impression d'avoir raté quelque chose. */}
        <Animated.View
          style={[styles.temps, { backgroundColor: COULEURS[toast.kind] }, styleTemps]}
        />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Remplaçant natif de `react-toastify`, dont le jeu web se sert pour TOUT ce que le
 * serveur refuse ou annonce : passage de carte refusé, salle qui se peuple, garde-fou de
 * duel, échec de récolte… Ces messages ne sont pas cosmétiques — côté web, les avoir
 * laissés commentés faisait qu'un clic sur une porte « ne faisait rien de visible », ce
 * qui se lit comme un bug de la carte. Le port doit donc en avoir un dès le premier lot.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  // Incrémenté à chaque toast : sert de `key` à l'hôte iOS (voir le rendu).
  const [vague, setVague] = useState(0);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Sur la carte le bas de l'écran appartient aux pouces (croix directionnelle à gauche,
  // barre d'action à droite) : les messages s'y affichent EN HAUT, sous le bandeau, là où
  // l'œil va déjà chercher la vie de la cible. Partout ailleurs (écrans modaux, connexion)
  // le haut porte l'en-tête et les onglets : ils restent en bas.
  const enHaut = usePathname() === '/carte';

  const minuteurs = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const fermer = useCallback((id: number) => {
    const minuteur = minuteurs.current.get(id);
    if (minuteur) clearTimeout(minuteur);
    minuteurs.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, brut: string) => {
      // Les textes du back portent du HTML (`<br/>`, `<b>`) : passés tels quels, les
      // balises s'affichaient en clair dans le toast. Point de conversion unique.
      const message = renderGameText(brut);
      if (!message) return;
      const id = nextId.current++;
      const duree = dureeLecture(message);
      const creeA = Date.now();
      setVague(id);
      setToasts((prev) => {
        // Le même message encore à l'écran (sort relancé sans cible, refus répété) est
        // REMPLACÉ, pas empilé : trois fois la même phrase n'apprend rien de plus.
        const sansDoublon = prev.filter((t) => {
          const doublon = t.kind === kind && t.message === message;
          if (doublon) {
            clearTimeout(minuteurs.current.get(t.id));
            minuteurs.current.delete(t.id);
          }
          return !doublon;
        });
        return [
          ...sansDoublon.slice(-(MAX_VISIBLES - 1)),
          { id, kind, message, duree, creeA, expireA: creeA + duree },
        ];
      });
      minuteurs.current.set(
        id,
        setTimeout(() => fermer(id), duree),
      );
    },
    [fermer],
  );

  const api = useMemo<ToastApi>(
    () => ({
      info: (m) => push('info', m),
      success: (m) => push('success', m),
      warning: (m) => push('warning', m),
      error: (m) => push('error', m),
    }),
    [push],
  );

  const largeurMax = Math.min(LARGEUR_MAX, width - insets.left - insets.right - 2 * spacing.md);

  const hote = (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        enHaut
          ? // Juste sous le bandeau du HUD (cartouche joueur, cible, ressources).
            { top: insets.top + 70 }
          : { bottom: Math.max(insets.bottom, spacing.sm) + spacing.sm },
      ]}>
      {toasts.map((toast) => (
        <Message
          key={toast.id}
          toast={toast}
          enHaut={enHaut}
          largeurMax={largeurMax}
          onFermer={fermer}
        />
      ))}
    </View>
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* ⚠️ Sur iOS une route en `presentation: "modal"` est un contrôleur NATIF présenté
          par-dessus toute la hiérarchie React : un toast rendu ici, même en dernier,
          restait DESSOUS. Inventaire, profil, hôtel des ventes… aucune confirmation ni
          aucun refus ne s'y voyait, on ne les découvrait qu'en refermant l'écran.
          `FullWindowOverlay` remonte l'hôte au niveau de la fenêtre.

          Il est monté À LA DEMANDE et re-monté à chaque toast (`key`) : UIKit empile par
          ordre d'ARRIVÉE, donc un hôte monté au lancement se retrouve sous la première
          modale ouverte après lui — exactement le défaut qu'il devait corriger.

          Android n'en a pas besoin (ses modales vivent dans la même fenêtre) et le
          composant n'y est qu'une `View` ordinaire, qui casserait le positionnement. */}
      {Platform.OS !== 'ios' ? (
        hote
      ) : toasts.length > 0 ? (
        <FullWindowOverlay key={vague}>{hote}</FullWindowOverlay>
      ) : null}
    </ToastContext.Provider>
  );
}

/** Jamais `null` : un composant hors Provider obtiendrait des toasts silencieux. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast() hors de <ToastProvider>');
  return api;
}

const kinds = StyleSheet.create({
  info: { borderColor: colors.goldBorder },
  success: { borderColor: colors.successBorder },
  warning: { borderColor: colors.warningBorder },
  error: { borderColor: colors.dangerBorder },
});

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },

  toast: {
    minWidth: 220,
    overflow: 'hidden',
    backgroundColor: colors.toastBg,
    borderWidth: 1,
    borderRadius: radius.slot,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.text,
    textAlign: 'center',
  },
  temps: { position: 'absolute', left: 0, bottom: 0, height: 2, opacity: 0.7 },
});
