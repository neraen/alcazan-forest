import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { mediaUrl } from '@/src/core/media';
import { useAppSelector } from '@/src/core/store';
import type { JoueurMinimal } from '@/src/core/types';
import GaugeBar from '@/src/ui/GaugeBar';
import Panel from '@/src/ui/Panel';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

/**
 * Fiche joueur du HUD — port de `UserInterface/usernameBlock` + `userStatsBlock`, fondus
 * en une seule carte : sur un téléphone, les ressources (Or / PA / PM) n'ont pas de place
 * à part, et elles comptent autant que les jauges pour décider d'agir.
 *
 * Repliable, parce qu'elle recouvre la carte : un appui sur l'en-tête n'en laisse que la
 * ligne de vie.
 */
export default function PlayerCard({ user }: { user: JoueurMinimal }) {
  const joueurState = useAppSelector((s) => s.data.joueurState);
  const [replie, setReplie] = useState(false);

  // « Aucune XP gagnée » n'est pas « aucun niveau » : le niveau peut arriver à null dans
  // une réponse d'attaque sans gain. On retombe alors sur celui du personnage chargé.
  const niveau = joueurState.level || user.niveau;
  const vie = joueurState.lifeJoueur || user.currentLife;
  const mana = joueurState.manaJoueur || user.currentMana;

  return (
    <Panel padding="sm" style={styles.card}>
      {/* Le nom de zone vit dans le bandeau supérieur et nulle part ailleurs : l'avoir
          aussi ici le répétait deux fois à trois centimètres d'écart. */}
      <Pressable onPress={() => setReplie((v) => !v)} style={styles.identite}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: mediaUrl('/img/gui/CharacterPlayer/Avatar.png') }}
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={styles.badgeNiveau}>Niv. {niveau}</Text>
        </View>
        <View style={styles.noms}>
          <Text style={styles.pseudo} numberOfLines={1}>
            {user.pseudo}
          </Text>
          <Text style={styles.classe} numberOfLines={1}>
            {user.nomClasse}
          </Text>
        </View>
        <Text style={styles.chevron}>{replie ? '▾' : '▴'}</Text>
      </Pressable>

      <View style={styles.jauges}>
        <GaugeBar variant="hp" label="Santé" value={vie} max={user.maxLife} height={9} />
        {!replie && (
          <GaugeBar variant="mp" label="Mana" value={mana} max={user.maxMana} height={9} />
        )}
      </View>

      {!replie && (
        <View style={styles.ressources}>
          <Ressource icone="/img/gui/Money03.png" valeur={joueurState.money} unite="Or" couleur={colors.gold} />
          <Ressource icone="/img/gui/10.png" valeur={joueurState.pa} unite="PA" couleur={colors.paLabel} />
          <Ressource icone="/img/gui/36.png" valeur={joueurState.pm} unite="PM" couleur={colors.mpLabel} />
        </View>
      )}
    </Panel>
  );
}

function Ressource({
  icone,
  valeur,
  unite,
  couleur,
}: {
  icone: string;
  valeur: number;
  unite: string;
  couleur: string;
}) {
  return (
    <View style={styles.ressource}>
      <Image source={{ uri: mediaUrl(icone) }} style={styles.iconeRessource} contentFit="contain" />
      <Text style={[styles.valeurRessource, { color: couleur }]}>
        {valeur} {unite}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  chevron: { color: colors.goldHalf, fontSize: 12 },
  identite: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { alignItems: 'center' },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.pastilleBg,
  },
  badgeNiveau: {
    marginTop: -7,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.pastilleBg,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.level,
  },
  noms: { flex: 1 },
  pseudo: { fontFamily: fonts.titleBold, fontSize: 14, color: colors.text },
  classe: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textFaint,
    textTransform: 'capitalize',
  },
  jauges: { gap: spacing.xs + 2 },
  ressources: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.goldDivider,
  },
  ressource: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconeRessource: { width: 14, height: 14 },
  valeurRessource: { fontFamily: fonts.bodyBold, fontSize: 11 },
});
