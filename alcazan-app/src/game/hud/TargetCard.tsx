import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { imageMonstre, mediaUrl, spriteBoss } from '@/src/core/media';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import { fetchTargetInfo, removePlayerTarget } from '@/src/core/store/actions';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

import { Jauge } from './PlayerCard';

/**
 * Carte de ciblage — port de `components/target/Target.jsx`.
 *
 * Un monstre d'instance (« renfort ») se présente EXACTEMENT comme un monstre du monde
 * ouvert : `/api/target/renfort` renvoie les mêmes clés, la carte est donc mutualisée.
 *
 * Même gabarit que le cartouche du joueur (portrait + jauges chiffrées dans la barre),
 * liseré rouge : elle se pose au centre du bandeau, face à lui, et non plus dans une
 * colonne qui mangeait le quart gauche de la carte.
 */
export default function TargetCard() {
  const dispatch = useAppDispatch();
  const target = useAppSelector((s) => s.data.target);
  const precedent = useRef<{ type?: string; id?: number }>({});

  // Même déclencheur que le `componentDidUpdate` du web : on ne recharge la cible que
  // lorsque son type OU son id change.
  useEffect(() => {
    if (precedent.current.type === target.type && precedent.current.id === target.targetId) return;
    precedent.current = { type: target.type, id: target.targetId };
    if (target.type && target.type !== 'none' && target.targetId) {
      dispatch(fetchTargetInfo(target.targetId, target.type));
    }
  }, [target.type, target.targetId, dispatch]);

  const affichage = (() => {
    if (target.type === 'player') {
      return {
        nom: target.pseudo ?? '',
        sous: `Niveau ${target.niveau}`,
        image: mediaUrl('/img/gui/CharacterEnemy/AvatarEnemy.png'),
        pv: { valeur: target.currentLife ?? 0, max: target.maxLife ?? 0 },
        mana: { valeur: target.currentMana ?? 0, max: target.maxMana ?? 0 },
      };
    }
    if (target.type === 'monstre' || target.type === 'renfort') {
      return {
        nom: target.nomMonstre ?? '',
        sous: `x ${target.quantiteMonstre ?? 1}`,
        image: imageMonstre(target.imageMonstre),
        pv: { valeur: target.monstreLife ?? 0, max: target.monstreLifeMax ?? 0 },
        mana: null,
      };
    }
    if (target.type === 'boss') {
      return {
        nom: target.bossName ?? '',
        sous: 'Boss',
        image: spriteBoss(target.bossSkin),
        pv: { valeur: target.bossLife ?? 0, max: target.bossMaxLife ?? 0 },
        mana: null,
      };
    }
    return null;
  })();

  if (!affichage) return null;

  // Un monstre ne se décible pas à la main : il n'est ciblé que tant qu'on est sur sa
  // case, et se décible en la quittant.
  const decibable = target.type !== 'monstre' && target.type !== 'renfort';

  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(120)}
      style={styles.cartouche}>
      <Image source={{ uri: affichage.image }} style={styles.portrait} contentFit="contain" />

      <View style={styles.corps}>
        <View style={styles.ligneNom}>
          <Text style={styles.nom} numberOfLines={1}>
            {affichage.nom || '…'}
          </Text>
          <Text style={styles.sous} numberOfLines={1}>
            {affichage.sous}
          </Text>
        </View>
        <Jauge variante="hp" valeur={affichage.pv.valeur} max={affichage.pv.max} hauteur={11} />
        {!!affichage.mana && (
          <Jauge variante="mp" valeur={affichage.mana.valeur} max={affichage.mana.max} hauteur={9} />
        )}
      </View>

      {decibable && (
        <Pressable
          onPress={() => dispatch(removePlayerTarget())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Ne plus cibler"
          style={styles.fermer}>
          <Text style={styles.fermerLabel}>✕</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cartouche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: 216,
    maxWidth: '100%',
    padding: 5,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.hudBg,
  },
  portrait: {
    width: 40,
    height: 40,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.pastilleBg,
  },
  corps: { flex: 1, gap: 3 },
  ligneNom: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  nom: {
    flex: 1,
    fontFamily: fonts.titleBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
    letterSpacing: 0.4,
  },
  sous: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: colors.dangerText },
  fermer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.badgeNeutralBg,
  },
  fermerLabel: { color: colors.textMute, fontSize: 11, lineHeight: 14 },
});
