import { Stack } from 'expo-router';

import EchangeHost from '@/src/game/echange/EchangeHost';
import { colors } from '@/src/ui/tokens';

/**
 * Pile du jeu : la carte en plein écran, tout le reste en FEUILLE MODALE par-dessus.
 *
 * C'est la transposition exacte du patron du web, où Inventaire, Profil, Sorts, Établi et
 * Hôtel des ventes sont des `GameModal` superposées à la zone de carte — et non des pages.
 * Ici, `presentation: "modal"` donne en plus le geste natif de fermeture.
 */
export default function JeuLayout() {
  return (
    <>
      {/* Monté ICI et non dans la carte : une invitation d'échange doit arriver aussi
          pendant qu'on est dans l'inventaire, et l'hôte doit survivre à toute la pile. */}
      <EchangeHost />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgBottom },
        }}>
        <Stack.Screen name="carte" />
        <Stack.Screen name="inventaire" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profil" options={{ presentation: 'modal' }} />
        <Stack.Screen name="sorts" options={{ presentation: 'modal' }} />
        <Stack.Screen name="pnj/[pnjId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="etabli" options={{ presentation: 'modal' }} />
        <Stack.Screen name="hotel" options={{ presentation: 'modal' }} />
        <Stack.Screen name="artisanat" options={{ presentation: 'modal' }} />
        <Stack.Screen name="guilde" options={{ presentation: 'modal' }} />
        <Stack.Screen name="quetes" options={{ presentation: 'modal' }} />
        <Stack.Screen name="journal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="classement" options={{ presentation: 'modal' }} />
        <Stack.Screen name="joueur/[pseudo]" options={{ presentation: 'modal' }} />
        {/* Pas de geste de fermeture : une session vivante ne se referme pas par un
            glissement involontaire (✕ replie, « Annuler l'échange » annule). */}
        <Stack.Screen name="echange" options={{ presentation: 'modal', gestureEnabled: false }} />
      </Stack>
    </>
  );
}
