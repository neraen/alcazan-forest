import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import * as usersApi from '@/src/core/api/users';
import { useAppSelector } from '@/src/core/store';
import type { Consommable, Sort } from '@/src/core/types';
import GaugeBar from '@/src/ui/GaugeBar';
import Slot from '@/src/ui/Slot';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

import ConsommableSlotButton from './ConsommableSlotButton';
import SpellSlotButton from './SpellSlotButton';

const NB_SORTS = 8;
const NB_CONSOMMABLES = 2;

/**
 * Barre d'action — port de `UserInterface/spellBar`. Ligne d'XP, puis les huit sorts et
 * les deux potions, en défilement horizontal : dix slots de 54 pt ne tiennent pas sur la
 * largeur d'un téléphone, et les rétrécir les rendrait intapables.
 */
export default function ActionBar({ onCharge }: { onCharge?: () => void }) {
  const joueurState = useAppSelector((s) => s.data.joueurState);
  const [experience, setExperience] = useState({ experienceActuelle: 0, experienceMax: 0 });
  const [spells, setSpells] = useState<Sort[] | null>(null);
  const [consommables, setConsommables] = useState<Consommable[] | null>(null);
  const [tousDesactives, setTousDesactives] = useState(false);
  const niveauPrecedent = useRef(joueurState.level);

  const chargerExperience = useCallback(async () => {
    setExperience(await usersApi.getExpJoueur());
  }, []);

  useEffect(() => {
    (async () => {
      await chargerExperience();
      setSpells(await usersApi.getPlayerSpells());
      setConsommables(await usersApi.getPlayerConsommables());
      onCharge?.();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // À chaque montée de niveau on relit l'XP ET le palier : sans ça le dénominateur de la
  // barre reste figé sur l'ancien niveau (barre affichant le surplus, ex. 184000/12000).
  useEffect(() => {
    if (niveauPrecedent.current !== joueurState.level && (joueurState.level ?? 0) > 0) {
      chargerExperience();
    }
    niveauPrecedent.current = joueurState.level;
  }, [joueurState.level, chargerExperience]);

  useEffect(() => {
    if (joueurState.consommableBarVersion) {
      usersApi.getPlayerConsommables().then(setConsommables);
    }
  }, [joueurState.consommableBarVersion]);

  useEffect(() => {
    if (joueurState.spellBarVersion) {
      usersApi.getPlayerSpells().then(setSpells);
    }
  }, [joueurState.spellBarVersion]);

  /** Place chaque sort sur son emplacement assigné (1-8) ; les autres comblent les trous. */
  const emplacements = (): (Sort | null)[] => {
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
    return slots;
  };

  const experienceAffichee =
    joueurState.newExperience !== 0 ? joueurState.newExperience : experience.experienceActuelle;

  return (
    <View style={styles.barre}>
      <View style={styles.ligneXp}>
        <Text style={styles.labelXp}>XP</Text>
        <GaugeBar
          variant="xp"
          value={experienceAffichee}
          max={experience.experienceMax}
          showValues={false}
          height={7}
          style={styles.jaugeXp}
        />
        <Text style={styles.valeursXp}>
          {experienceAffichee} / {experience.experienceMax}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slots}>
        {emplacements().map((spell, i) =>
          spell ? (
            <SpellSlotButton
              key={spell.id}
              spell={spell}
              tousDesactives={tousDesactives}
              setTousDesactives={setTousDesactives}
            />
          ) : (
            <Slot key={`vide-${i}`} />
          ),
        )}

        <View style={styles.separateur} />

        {(consommables ?? []).map((consommable) => (
          <ConsommableSlotButton key={consommable.id} consommable={consommable} />
        ))}
        {consommables &&
          Array.from({ length: Math.max(0, NB_CONSOMMABLES - consommables.length) }).map((_, i) => (
            <Slot key={`conso-vide-${i}`} />
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Barre FLOTTANTE : en paysage elle ne touche plus les bords de l'écran (la colonne
      de HUD occupe la gauche), elle a donc son propre cadre plutôt qu'un simple filet
      supérieur comme sur le web. */
  barre: {
    backgroundColor: colors.actionBarBg,
    borderWidth: 1,
    borderColor: colors.goldSoft,
    borderRadius: radius.panel,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  ligneXp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  labelXp: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.5,
  },
  jaugeXp: { flex: 1 },
  valeursXp: { fontFamily: fonts.body, fontSize: 10, color: colors.textMute },
  slots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  separateur: {
    width: 1,
    height: 36,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.goldDivider,
  },
});
