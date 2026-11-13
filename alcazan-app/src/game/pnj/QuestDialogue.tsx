import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import * as questApi from '@/src/core/api/quest';
import { messageErreur } from '@/src/core/http';
import { avatarPnj } from '@/src/core/media';
import { useAppDispatch } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import GameButton from '@/src/ui/GameButton';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

type Action = {
  actionId: number;
  label: string;
  progress?: { current: number; target: number; unit: string };
};

type Step = { sequenceId: number; dialogue: { paragraphs: string[] }; actions: Action[] };

/**
 * Vue quête d'un PNJ — port de `pnj/questDialogue/QuestDialogue.jsx`.
 *
 * Pilotée de bout en bout par le contrat structuré du back :
 * `available` (accepter) → `step` (dialogue + boutons) → `blocked | step | done`.
 * Aucun HTML : les dialogues arrivent déjà en paragraphes de texte brut.
 */
export default function QuestDialogue({
  pnj,
  quest,
  onClose,
}: {
  pnj: { id: number; name: string; description?: string; avatar?: string };
  quest: any;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [status, setStatus] = useState<string>(quest.status);
  const [step, setStep] = useState<Step | null>(quest.step ?? null);
  const [blocages, setBlocages] = useState<string[]>(quest.lockedReasons ?? []);
  const [enCours, setEnCours] = useState(false);

  const appliquerReponse = (reponse: any) => {
    reponse.feedback?.rewards?.forEach((r: any) =>
      toast.success(`Vous recevez ${r.quantity} ${r.label}`),
    );
    reponse.feedback?.messages?.forEach((m: any) => toast.info(m.text));

    // Le serveur ne renvoie `karma` que si la valeur a RÉELLEMENT bougé (elle est bornée) :
    // la phrase est déjà dans les messages, il reste à faire relire la fiche.
    if (reponse.karma) dispatch(updateJoueurState({ needRefresh: true }));

    if (reponse.playerXp) {
      dispatch(
        updateJoueurState({
          newExperience: reponse.playerXp.experience,
          level: reponse.playerXp.level,
        }),
      );
    }

    if (reponse.needRefresh) dispatch(updateJoueurState({ needRefresh: true }));

    if (reponse.status === 'blocked') {
      setBlocages(reponse.blockedMessages ?? []);
      setStep(reponse.step);
      setStatus('inProgress');
      return;
    }

    setBlocages([]);
    setStep(reponse.step);
    setStatus(reponse.status === 'done' ? 'done' : 'inProgress');
  };

  const appeler = async (appel: () => Promise<any>) => {
    setEnCours(true);
    try {
      appliquerReponse(await appel());
    } catch (erreur) {
      toast.error(messageErreur(erreur, 'Une erreur est survenue.'));
    } finally {
      setEnCours(false);
    }
  };

  const paragraphes = (): string[] => {
    if (status === 'available') {
      const intro: string[] = quest.introduction ?? [];
      return intro.length > 0 ? intro : [pnj.description ?? ''];
    }
    if (status === 'locked') return quest.lockedReasons ?? [];
    if (status === 'done' && (!step || step.dialogue.paragraphs.length === 0)) {
      return ['Vous avez déjà terminé cette quête.'];
    }
    return step?.dialogue.paragraphs ?? [];
  };

  return (
    <View style={styles.corps}>
      <ScrollView contentContainerStyle={styles.dialogue}>
        <View style={styles.entete}>
          {!!pnj.avatar && (
            <Image source={{ uri: avatarPnj(pnj.avatar) }} style={styles.avatar} contentFit="cover" />
          )}
          <View style={styles.textes}>
            {paragraphes().map((paragraphe, i) => (
              <Text key={i} style={styles.paragraphe}>
                {paragraphe}
              </Text>
            ))}
            {status !== 'locked' &&
              blocages.map((message, i) => (
                <Text key={`b-${i}`} style={styles.blocage}>
                  {message}
                </Text>
              ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        {status === 'available' && (
          <>
            <GameButton
              variant="solid"
              loading={enCours}
              onPress={() => appeler(() => questApi.startQuest(pnj.id))}>
              Accepter la quête
            </GameButton>
            <GameButton onPress={onClose}>S'en aller</GameButton>
          </>
        )}

        {status === 'inProgress' &&
          (step?.actions ?? []).map((action) => (
            <GameButton
              key={action.actionId}
              variant="solid"
              loading={enCours}
              onPress={() => appeler(() => questApi.postAction(step!.sequenceId, action.actionId))}>
              {action.label}
              {/* `progress` n'existe que sur les objectifs COMPTÉS (chasse, fabrication,
                  récolte) : le joueur doit voir où il en est sans cliquer pour se faire
                  répondre « pas encore ». L'unité vient du serveur. */}
              {action.progress
                ? ` (${action.progress.current} / ${action.progress.target} ${action.progress.unit})`
                : ''}
            </GameButton>
          ))}

        {(status === 'locked' || status === 'done') && (
          <GameButton onPress={onClose}>S'en aller</GameButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1 },
  dialogue: { padding: spacing.lg, gap: spacing.md },
  entete: { flexDirection: 'row', gap: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.pastilleBg,
  },
  textes: { flex: 1, gap: spacing.sm },
  paragraphe: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textDim,
    lineHeight: 20,
  },
  blocage: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.dangerText,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.goldDivider,
  },
});
