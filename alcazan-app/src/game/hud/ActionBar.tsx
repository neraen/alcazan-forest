import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import * as usersApi from '@/src/core/api/users';
import { useAppSelector } from '@/src/core/store';
import type { Consommable, Sort } from '@/src/core/types';
import { colors, radius, spacing } from '@/src/ui/tokens';

import ConsommableSlotButton from './ConsommableSlotButton';
import SpellSlotButton from './SpellSlotButton';

const NB_SORTS = 8;

/**
 * Barre d'action — port de `UserInterface/spellBar`.
 *
 * Deux écarts assumés avec le web, tous deux pour rendre de la carte au joueur :
 *  - les emplacements VIDES ne sont pas dessinés. Sur le web ils servent de cibles au
 *    glisser-déposer ; ici l'assignation se fait dans l'écran Sorts, et sept cadres
 *    pointillés pour un débutant qui connaît un sort couvraient un tiers de l'écran.
 *    L'ORDRE des emplacements (1-8) reste celui choisi par le joueur.
 *  - la jauge d'XP a rejoint le cartouche du joueur (`useExperience`).
 *
 * La barre se cale donc à droite et ne fait que la largeur de ce qu'elle contient ; elle
 * défile si un jour les dix emplacements ne tiennent plus.
 */
export default function ActionBar() {
  const consommableBarVersion = useAppSelector((s) => s.data.joueurState.consommableBarVersion);
  const spellBarVersion = useAppSelector((s) => s.data.joueurState.spellBarVersion);
  const [spells, setSpells] = useState<Sort[] | null>(null);
  const [consommables, setConsommables] = useState<Consommable[] | null>(null);
  const [tousDesactives, setTousDesactives] = useState(false);

  // Les `.catch` ne sont pas décoratifs : sans eux un échec réseau au montage devenait
  // un rejet de promesse non géré — écran rouge en développement, silence en production.
  // Une barre vide se relit au prochain changement de version (Sorts, Inventaire).
  useEffect(() => {
    usersApi.getPlayerSpells().then(setSpells).catch(() => setSpells([]));
  }, [spellBarVersion]);

  useEffect(() => {
    usersApi.getPlayerConsommables().then(setConsommables).catch(() => setConsommables([]));
  }, [consommableBarVersion]);

  /** Place chaque sort sur son emplacement assigné (1-8) ; les autres comblent les trous. */
  const sortsOrdonnes = (): Sort[] => {
    const slots: (Sort | null)[] = Array(NB_SORTS).fill(null);
    const sansPlace: Sort[] = [];
    (spells ?? []).forEach((spell) => {
      const index = spell.ordre && spell.ordre >= 1 && spell.ordre <= NB_SORTS ? spell.ordre - 1 : -1;
      if (index >= 0 && !slots[index]) slots[index] = spell;
      else sansPlace.push(spell);
    });
    sansPlace.forEach((spell) => {
      const libre = slots.findIndex((s) => s === null);
      if (libre >= 0) slots[libre] = spell;
    });
    return slots.filter((s): s is Sort => s !== null);
  };

  const sorts = sortsOrdonnes();
  const potions = consommables ?? [];
  if (sorts.length === 0 && potions.length === 0) return null;

  return (
    <View style={styles.barre}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slots}>
        {sorts.map((spell) => (
          <SpellSlotButton
            key={spell.id}
            spell={spell}
            tousDesactives={tousDesactives}
            setTousDesactives={setTousDesactives}
          />
        ))}

        {sorts.length > 0 && potions.length > 0 && <View style={styles.separateur} />}

        {potions.map((consommable) => (
          <ConsommableSlotButton key={consommable.id} consommable={consommable} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /** `maxWidth: 100%` + `flexShrink` : la barre épouse son contenu, et ne déborde pas de
      la zone que lui laisse l'écran de carte (elle défile alors). */
  barre: {
    maxWidth: '100%',
    flexShrink: 1,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.hudBorder,
    backgroundColor: colors.hudBg,
  },
  slots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  separateur: {
    width: 1,
    height: 32,
    marginHorizontal: spacing.xxs,
    backgroundColor: colors.goldDivider,
  },
});
