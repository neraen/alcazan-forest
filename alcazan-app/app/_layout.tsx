import { Cinzel_600SemiBold, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { NunitoSans_400Regular, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/core/AuthContext';
import store from '@/src/core/store';
import { colors } from '@/src/ui/tokens';
import { ToastProvider } from '@/src/ui/toast/ToastProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Garde d'authentification. Elle vit DANS le layout racine (et pas dans un composant
 * `PrivateRoute` par écran comme sur le web) parce qu'expo-router monte les routes avant
 * de laisser quiconque décider : rediriger depuis l'écran lui-même ferait clignoter la
 * carte avant l'écran de connexion.
 */
function GardeAuth() {
  const { pret, connecte } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!pret) return;
    SplashScreen.hideAsync().catch(() => {});

    const dansLeJeu = segments[0] === '(jeu)';
    if (!connecte && dansLeJeu) {
      router.replace('/connexion');
    } else if (connecte && !dansLeJeu) {
      router.replace('/(jeu)/carte');
    }
  }, [pret, connecte, segments, router]);

  return <Slot />;
}

/**
 * Verrouillage en PAYSAGE.
 *
 * `orientation: "landscape"` dans app.json ne suffit pas en développement : Expo Go lit sa
 * propre configuration native et ignore ce champ du manifeste. Le verrou runtime, lui,
 * vaut dans les deux cas (Expo Go comme build autonome), et c'est aussi le seul moyen de
 * changer d'avis plus tard écran par écran.
 *
 * Le paysage n'est pas qu'un goût : la grille fait 24×16 cases, soit un rapport 3:2. En
 * portrait on ne voit qu'une fente verticale du monde, et le HUD mange la moitié de la
 * hauteur utile.
 */
function useVerrouPaysage() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, []);
}

export default function RootLayout() {
  useVerrouPaysage();
  const [policesChargees] = useFonts({
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    NunitoSans_400Regular,
    NunitoSans_700Bold,
  });

  // Rien n'est rendu avant les polices : un premier rendu en police système suivi d'un
  // re-rendu en Cinzel fait sauter toute la mise en page (les titres sont en majuscules
  // espacées, donc très sensibles à la métrique).
  if (!policesChargees) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgBottom }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AuthProvider>
            <ToastProvider>
              <StatusBar style="light" />
              <GardeAuth />
            </ToastProvider>
          </AuthProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
