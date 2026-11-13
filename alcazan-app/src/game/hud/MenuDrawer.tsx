import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/core/AuthContext';
import { mediaUrl } from '@/src/core/media';
import GameButton from '@/src/ui/GameButton';
import SectionTitle from '@/src/ui/SectionTitle';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

type Entree = { label: string; icone: string; route?: string };

/**
 * Rail de navigation — port de `UserInterface/sideMenu`. Sur le web il occupe une colonne
 * permanente de 340 pt ; ici il se replie, parce que cette largeur mangerait 85 % de
 * l'écran.
 *
 * Les entrées sans `route` sont les lots à venir : elles restent AFFICHÉES et annoncent
 * leur absence. Les masquer donnerait l'impression que le jeu mobile est amputé, alors
 * qu'il est en cours de portage.
 */
const ENTREES: Entree[] = [
  { label: 'Inventaire', icone: '/img/icons/bag.png', route: '/(jeu)/inventaire' },
  { label: 'Profil', icone: '/img/icons/people.png', route: '/(jeu)/profil' },
  { label: 'Sorts', icone: '/img/menu/livre.png', route: '/(jeu)/sorts' },
  { label: 'Établi', icone: '/img/icons/bag.png' },
  { label: 'Hôtel des ventes', icone: '/img/gui/Money03.png' },
  { label: 'Artisanat', icone: '/img/menu/buches.png' },
  { label: 'Guilde', icone: '/img/icons/flag.png' },
  { label: 'Journal', icone: '/img/icons/book.png' },
  { label: 'Classement', icone: '/img/icons/shild.png' },
];

export default function MenuDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const { seDeconnecter } = useAuth();
  const insets = useSafeAreaInsets();

  const ouvrir = (entree: Entree) => {
    if (!entree.route) {
      toast.info(`${entree.label} arrive dans un prochain lot.`);
      return;
    }
    onClose();
    router.push(entree.route as never);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(140)}>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </Animated.View>

      <Animated.View
        entering={SlideInLeft.duration(180)}
        exiting={SlideOutLeft.duration(160)}
        style={[styles.panneau, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
        <SectionTitle size="sm">Alcazan Forest</SectionTitle>

        <ScrollView contentContainerStyle={styles.liste} showsVerticalScrollIndicator={false}>
          {ENTREES.map((entree) => (
            <Pressable
              key={entree.label}
              onPress={() => ouvrir(entree)}
              style={({ pressed }) => [styles.entree, pressed && styles.entreePressee]}>
              <Image
                source={{ uri: mediaUrl(entree.icone) }}
                style={styles.icone}
                contentFit="contain"
              />
              <Text style={[styles.label, !entree.route && styles.labelBientot]}>
                {entree.label}
              </Text>
              {!entree.route && <Text style={styles.bientot}>bientôt</Text>}
            </Pressable>
          ))}
        </ScrollView>

        <GameButton variant="danger" onPress={() => seDeconnecter()}>
          Déconnexion
        </GameButton>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { width: '100%', height: '100%', backgroundColor: 'rgba(4, 20, 26, 0.72)' },
  panneau: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.panelSolid,
    borderRightWidth: 1,
    borderRightColor: colors.goldSoft,
  },
  liste: { gap: spacing.xs, paddingVertical: spacing.sm },
  entree: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.slot,
  },
  entreePressee: { backgroundColor: colors.goldSofter },
  icone: { width: 26, height: 26 },
  label: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  labelBientot: { color: colors.textDim3 },
  bientot: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.textDim3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
