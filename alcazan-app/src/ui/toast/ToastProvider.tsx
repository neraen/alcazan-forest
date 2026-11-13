import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '../tokens';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

type Toast = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  info: (m: string) => void;
  success: (m: string) => void;
  warning: (m: string) => void;
  error: (m: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DUREE_MS = 4000;
const MAX_VISIBLES = 3;

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
  const insets = useSafeAreaInsets();

  const push = useCallback((kind: ToastKind, message: string) => {
    if (!message) return;
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLES - 1)), { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DUREE_MS);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      info: (m) => push('info', m),
      success: (m) => push('success', m),
      warning: (m) => push('warning', m),
      error: (m) => push('error', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* En paysage la barre d'action occupe tout le bas de l'écran : les toasts se
          posent AU-DESSUS d'elle, centrés et bornés en largeur. Étalés sur les 874 pt de
          large, ils recouvraient la colonne de HUD. */}
      <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 124 }]}>
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.duration(180)}
            exiting={FadeOut.duration(150)}>
            <Pressable
              onPress={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              style={[styles.toast, kinds[toast.kind]]}>
              <Text style={styles.message}>{toast.message}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
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
  success: { borderColor: 'rgba(110, 214, 154, 0.6)' },
  warning: { borderColor: 'rgba(240, 169, 92, 0.6)' },
  error: { borderColor: colors.dangerBorder },
});

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },

  toast: {
    maxWidth: 440,
    backgroundColor: 'rgba(4, 26, 33, 0.96)',
    borderWidth: 1,
    borderRadius: radius.slot,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  message: { fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 19 },
});
