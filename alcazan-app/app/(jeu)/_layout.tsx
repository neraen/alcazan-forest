import { Stack } from 'expo-router';

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
    </Stack>
  );
}
