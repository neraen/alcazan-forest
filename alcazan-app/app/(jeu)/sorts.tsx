import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as usersApi from '@/src/core/api/users';
import { messageErreur } from '@/src/core/http';
import { iconeSort, mediaUrl } from '@/src/core/media';
import { useAppDispatch } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import type { Sort } from '@/src/core/types';
import GameButton from '@/src/ui/GameButton';
import ModalShell from '@/src/ui/ModalShell';
import Panel from '@/src/ui/Panel';
import SectionTitle from '@/src/ui/SectionTitle';
import Slot from '@/src/ui/Slot';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

const NB_SLOTS = 8;

const LIBELLE_TYPE: Record<string, string> = {
  attack: 'Attaque',
  soin: 'Soin',
  buff: 'Buff',
};

const libelleCooldown = (c: number) => (c > 0 ? `${c} s` : 'Instantané');
const libellePortee = (p: number) => (p > 0 ? `${p} case${p > 1 ? 's' : ''}` : 'Personnel');

/**
 * Grimoire et barre de sorts — port de `components/spells/screen/SpellsScreen.jsx`.
 *
 * L'assignation est persistée par `/joueur/spell/equip|unequip`, qui renvoient le
 * GRIMOIRE À JOUR : on l'adopte tel quel plutôt que de recalculer l'ordre côté client.
 * Le bump de `spellBarVersion` fait relire la barre d'action vivante sous la carte.
 */
export default function SortsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [grimoire, setGrimoire] = useState<Sort[] | null>(null);
  const [selectionId, setSelectionId] = useState<number | null>(null);

  useEffect(() => {
    usersApi
      .getSpellBook()
      .then((sorts: Sort[]) => {
        setGrimoire(sorts);
        if (sorts.length > 0) setSelectionId(sorts[0].id);
      })
      .catch(() => toast.error('Impossible de charger le grimoire.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Emplacements effectifs : assignés à leur position, sinon les premiers du grimoire —
  // c'est le comportement par défaut du jeu, pas une invention du client.
  const emplacements = useMemo(() => {
    const resultat: (Sort | null)[] = Array(NB_SLOTS).fill(null);
    if (!grimoire) return resultat;
    const assignes = grimoire.filter((s) => s.ordre && s.ordre >= 1 && s.ordre <= NB_SLOTS);
    if (assignes.length > 0) {
      assignes.forEach((s) => {
        if (!resultat[s.ordre! - 1]) resultat[s.ordre! - 1] = s;
      });
      return resultat;
    }
    grimoire.slice(0, NB_SLOTS).forEach((s, i) => {
      resultat[i] = s;
    });
    return resultat;
  }, [grimoire]);

  const adopter = (nouveau: Sort[]) => {
    setGrimoire(nouveau);
    dispatch(updateJoueurState({ spellBarVersion: Date.now() }));
  };

  const selection = grimoire?.find((s) => s.id === selectionId) ?? grimoire?.[0] ?? null;

  const assigner = async (position: number) => {
    if (!selection) return;
    try {
      adopter(await usersApi.equipSpell(selection.id, position));
      toast.success(`${selection.nom} placé en ${position}.`);
    } catch (erreur) {
      toast.error(messageErreur(erreur, "Impossible de placer ce sort."));
    }
  };

  const retirer = async () => {
    if (!selection) return;
    try {
      adopter(await usersApi.unequipSpell(selection.id));
    } catch (erreur) {
      toast.error(messageErreur(erreur, "Impossible de retirer ce sort."));
    }
  };

  const positionDe = (sort: Sort) => {
    const index = emplacements.findIndex((s) => s && s.id === sort.id);
    return index >= 0 ? index + 1 : null;
  };

  if (!grimoire) {
    return (
      <ModalShell title="Sortilèges" onClose={() => router.back()}>
        <View style={styles.centre}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/menu/livre.png')}
      title="Sortilèges"
      subtitle={`${grimoire.length} sort${grimoire.length > 1 ? 's connus' : ' connu'}`}
      onClose={() => router.back()}
      footer={
        <View style={styles.barre}>
          {emplacements.map((sort, i) => (
            // 26 pt de côté : `hitSlop` porte la cible à ~42 pt sans agrandir la rangée.
            <Pressable key={i} onPress={() => assigner(i + 1)} hitSlop={8}>
              <Slot src={sort ? iconeSort(sort.icone) : undefined} size="mini">
                <Text style={styles.numero}>{i + 1}</Text>
              </Slot>
            </Pressable>
          ))}
        </View>
      }>
      <View style={styles.corps}>
        <ScrollView style={styles.liste} contentContainerStyle={styles.listeContenu}>
          {grimoire.map((sort) => {
            const position = positionDe(sort);
            return (
              <Pressable
                key={sort.id}
                onPress={() => setSelectionId(sort.id)}
                style={[styles.ligne, selectionId === sort.id && styles.ligneActive]}>
                <Slot src={iconeSort(sort.icone)} size="mini" />
                <View style={styles.ligneTextes}>
                  <Text style={styles.nom} numberOfLines={1}>
                    {sort.nom}
                  </Text>
                  <Text style={styles.meta}>
                    {LIBELLE_TYPE[sort.type] ?? sort.type} · {libellePortee(sort.portee)}
                  </Text>
                </View>
                {position && <Text style={styles.position}>{position}</Text>}
              </Pressable>
            );
          })}
        </ScrollView>

        <Panel style={styles.detail}>
          {!selection ? (
            <Text style={styles.vide}>Aucun sort connu.</Text>
          ) : (
            <>
              <SectionTitle size="sm">{selection.nom}</SectionTitle>
              <View style={styles.detailLignes}>
                <Detail label="Type" valeur={LIBELLE_TYPE[selection.type] ?? selection.type} />
                <Detail label="Portée" valeur={libellePortee(selection.portee)} />
                <Detail label="Récupération" valeur={libelleCooldown(selection.cooldown)} />
                {selection.coutPa !== undefined && (
                  <Detail label="Coût" valeur={`${selection.coutPa} PA`} />
                )}
              </View>
              {!!selection.description && (
                <Text style={styles.description}>{selection.description}</Text>
              )}
              <Text style={styles.indice}>
                Touchez un emplacement de la barre, en bas, pour y placer ce sort.
              </Text>
              {positionDe(selection) && (
                <GameButton variant="danger" onPress={retirer}>
                  Retirer de la barre
                </GameButton>
              )}
            </>
          )}
        </Panel>
      </View>
    </ModalShell>
  );
}

function Detail({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.detailLigne}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValeur}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corps: { flex: 1, flexDirection: 'row' },
  liste: { flex: 1 },
  listeContenu: { padding: spacing.md, gap: spacing.xs },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ligneActive: { borderColor: colors.gold, backgroundColor: colors.goldSofter },
  ligneTextes: { flex: 1 },
  nom: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  position: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  detail: { width: 280, margin: spacing.md, gap: spacing.sm },
  detailLignes: { gap: 2 },
  detailLigne: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint },
  detailValeur: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textDim },
  description: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  indice: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim2 },
  vide: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint },
  barre: { flexDirection: 'row', gap: spacing.lg, justifyContent: 'center' },
  numero: {
    position: 'absolute',
    bottom: 1,
    right: 3,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.goldHalf,
  },
});
