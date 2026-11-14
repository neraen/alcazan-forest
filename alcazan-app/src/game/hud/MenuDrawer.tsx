import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/core/AuthContext';
import { mediaUrl } from '@/src/core/media';
import { definirPreference, usePreference } from '@/src/core/preferences';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

type Entree = { label: string; icone: string; route?: string };

/**
 * Rail de navigation — port de `UserInterface/sideMenu`. Sur le web il occupe une colonne
 * permanente de 340 pt ; ici il se replie, parce que cette largeur mangerait 40 % de
 * l'écran.
 *
 * En paysage un téléphone offre ~400 pt de HAUT : une liste verticale de neuf entrées n'en
 * montrait que cinq et cachait le reste (et la déconnexion) derrière un défilement que
 * rien n'annonçait. D'où une GRILLE de tuiles, entièrement visible d'un coup d'œil, et un
 * panneau qui sort du côté du bouton qui l'ouvre (à droite).
 *
 * Toutes les entrées sont branchées. Le type garde `route` optionnelle et le toast de
 * repli : une future entrée encore à porter doit rester AFFICHÉE et annoncer son absence
 * — la masquer donnerait l'impression que le jeu mobile est amputé.
 */
const ENTREES: Entree[] = [
  { label: 'Inventaire', icone: '/img/icons/bag.png', route: '/(jeu)/inventaire' },
  { label: 'Profil', icone: '/img/icons/people.png', route: '/(jeu)/profil' },
  { label: 'Sorts', icone: '/img/menu/livre.png', route: '/(jeu)/sorts' },
  { label: 'Établi', icone: '/img/menu/epee.png', route: '/(jeu)/etabli' },
  { label: 'Hôtel des ventes', icone: '/img/gui/Money03.png', route: '/(jeu)/hotel' },
  { label: 'Artisanat', icone: '/img/menu/buches.png', route: '/(jeu)/artisanat' },
  { label: 'Guilde', icone: '/img/icons/flag.png', route: '/(jeu)/guilde' },
  { label: 'Journal', icone: '/img/icons/book.png', route: '/(jeu)/journal' },
  { label: 'Classement', icone: '/img/icons/shild.png', route: '/(jeu)/classement' },
];

const COLONNES = 3;
const TUILE = 92;
const ECART = spacing.sm;
// +2 : le liseré gauche du panneau prend 1 pt sur la largeur utile, et une grille
// calculée au point près repassait à deux colonnes.
const LARGEUR = COLONNES * TUILE + (COLONNES - 1) * ECART + 2 * spacing.lg + 2;

export default function MenuDrawer({ zone, onClose }: { zone?: string; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const { seDeconnecter } = useAuth();
  const insets = useSafeAreaInsets();
  const croixActive = usePreference('croixDirectionnelle');

  const ouvrir = (entree: Entree) => {
    if (!entree.route) {
      toast.info(`${entree.label} arrive dans un prochain lot.`);
      return;
    }
    onClose();
    router.push(entree.route as never);
  };

  // Une déconnexion renvoie à la saisie du mot de passe : sur un écran tactile, elle ne
  // doit pas partir d'un appui malheureux à côté d'une tuile.
  const demanderDeconnexion = () =>
    Alert.alert('Se déconnecter ?', 'Il faudra saisir à nouveau vos identifiants.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => seDeconnecter() },
    ]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(140)}
        style={StyleSheet.absoluteFill}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer le menu" />
      </Animated.View>

      <Animated.View
        entering={SlideInRight.duration(180)}
        exiting={SlideOutRight.duration(160)}
        style={[
          styles.panneau,
          {
            // L'encoche est sur un des petits côtés en paysage : sans cette marge elle
            // recouvrait la colonne d'icônes.
            width: LARGEUR + insets.right,
            paddingRight: spacing.lg + insets.right,
            paddingTop: Math.max(insets.top, spacing.md),
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}>
        <View style={styles.entete}>
          <View style={styles.titres}>
            <Text style={styles.titre}>Alcazan Forest</Text>
            {!!zone && (
              <Text style={styles.zone} numberOfLines={1}>
                {zone}
              </Text>
            )}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={styles.fermer}
            accessibilityRole="button"
            accessibilityLabel="Fermer le menu">
            <Text style={styles.fermerLabel}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.grille} showsVerticalScrollIndicator={false}>
          {ENTREES.map((entree) => (
            <Pressable
              key={entree.label}
              onPress={() => ouvrir(entree)}
              style={({ pressed }) => [
                styles.tuile,
                !entree.route && styles.tuileBientot,
                pressed && styles.tuilePressee,
              ]}>
              <Image
                source={{ uri: mediaUrl(entree.icone) }}
                style={[styles.icone, !entree.route && styles.iconeBientot]}
                contentFit="contain"
              />
              <Text
                style={[styles.label, !entree.route && styles.labelBientot]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}>
                {entree.label}
              </Text>
              {!entree.route && <Text style={styles.bientot}>bientôt</Text>}
            </Pressable>
          ))}
        </ScrollView>

        {/* Réglage de confort, sur la ligne entière (pas seulement l'interrupteur) : la
            cible d'un `Switch` seul est trop petite pour un pouce. */}
        <Pressable
          onPress={() => definirPreference('croixDirectionnelle', !croixActive)}
          accessibilityRole="switch"
          accessibilityState={{ checked: croixActive }}
          style={styles.reglage}>
          <Text style={styles.reglageLabel}>Croix directionnelle</Text>
          <Switch
            value={croixActive}
            onValueChange={(valeur) => definirPreference('croixDirectionnelle', valeur)}
            trackColor={{ false: colors.track, true: colors.goldHalf }}
            thumbColor={croixActive ? colors.gold : colors.textMute}
            ios_backgroundColor={colors.track}
            style={styles.interrupteur}
          />
        </Pressable>

        <Pressable
          onPress={demanderDeconnexion}
          hitSlop={8}
          style={({ pressed }) => [styles.deconnexion, pressed && styles.deconnexionPressee]}>
          <Text style={styles.deconnexionLabel}>Se déconnecter</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  panneau: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    paddingLeft: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.panelSolid,
    borderLeftWidth: 1,
    borderLeftColor: colors.goldSoft,
  },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titres: { flex: 1 },
  titre: {
    fontFamily: fonts.title,
    fontSize: 14,
    color: colors.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  zone: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  fermer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  fermerLabel: { color: colors.gold, fontSize: 15, lineHeight: 18 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: ECART },
  tuile: {
    width: TUILE,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.nav,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    backgroundColor: colors.panelInner,
  },
  tuileBientot: { borderColor: 'transparent', backgroundColor: colors.rowBg },
  tuilePressee: { borderColor: colors.gold, backgroundColor: colors.goldSofter },
  icone: { width: 28, height: 28 },
  iconeBientot: { opacity: 0.4 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.text },
  labelBientot: { color: colors.textDim3 },
  bientot: {
    fontFamily: fonts.body,
    fontSize: 7.5,
    lineHeight: 9,
    color: colors.textDim3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reglage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 34,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    backgroundColor: colors.panelInner,
  },
  reglageLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text },
  interrupteur: { transform: [{ scale: 0.75 }] },
  deconnexion: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  deconnexionPressee: { backgroundColor: colors.dangerBgHover },
  deconnexionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.dangerText,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
