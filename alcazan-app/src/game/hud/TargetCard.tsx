import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { imageMonstre, mediaUrl, spriteBoss } from '@/src/core/media';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import { fetchTargetInfo, removePlayerTarget } from '@/src/core/store/actions';
import GaugeBar from '@/src/ui/GaugeBar';
import Panel from '@/src/ui/Panel';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

/**
 * Carte de ciblage — port de `components/target/Target.jsx`.
 *
 * Un monstre d'instance (« renfort ») se présente EXACTEMENT comme un monstre du monde
 * ouvert : `/api/target/renfort` renvoie les mêmes clés, la carte est donc mutualisée.
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
    <Panel padding="sm" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.tag}>Cible</Text>
        {decibable && (
          <Pressable onPress={() => dispatch(removePlayerTarget())} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.identite}>
        <Image source={{ uri: affichage.image }} style={styles.avatar} contentFit="contain" />
        <View style={styles.noms}>
          <Text style={styles.nom} numberOfLines={1}>
            {affichage.nom}
          </Text>
          <Text style={styles.sous}>{affichage.sous}</Text>
        </View>
      </View>

      <GaugeBar variant="hp" label="Santé" value={affichage.pv.valeur} max={affichage.pv.max} height={9} />
      {!!affichage.mana && (
        <GaugeBar
          variant="mp"
          label="Mana"
          value={affichage.mana.valeur}
          max={affichage.mana.max}
          height={9}
        />
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, borderColor: colors.dangerBorder },
  header: { flexDirection: 'row', alignItems: 'center' },
  tag: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.dangerText,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  close: { color: colors.textMute, fontSize: 13 },
  identite: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.pastilleBg,
  },
  noms: { flex: 1 },
  nom: { fontFamily: fonts.titleBold, fontSize: 14, color: colors.text },
  sous: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
});
