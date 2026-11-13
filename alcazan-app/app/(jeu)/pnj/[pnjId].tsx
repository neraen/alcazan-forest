import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as questApi from '@/src/core/api/quest';
import { computeDistance } from '@/src/core/domain/distance';
import { avatarPnj, mediaUrl } from '@/src/core/media';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import { closePnjInteraction } from '@/src/core/store/actions';
import QuestDialogue from '@/src/game/pnj/QuestDialogue';
import ShopView from '@/src/game/pnj/ShopView';
import GameButton from '@/src/ui/GameButton';
import ModalShell from '@/src/ui/ModalShell';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

/**
 * Interaction avec un PNJ — port de `pnj/pnjInteractionHost`.
 *
 * Comme sur le web, la vue est DISCRIMINÉE par `interaction.view` renvoyé par
 * `POST /api/pnj/interaction` : quête, échoppe, guilde, métier ou simple dialogue. Le
 * client ne devine rien ; il affiche ce que le serveur annonce.
 */
export default function PnjScreen() {
  const { pnjId } = useLocalSearchParams<{ pnjId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const positionJoueur = useAppSelector((s) => s.data.positionJoueur);
  const pnjInteraction = useAppSelector((s) => s.data.pnjInteraction);

  const [interaction, setInteraction] = useState<any>(null);

  const fermer = () => {
    dispatch(closePnjInteraction());
    router.back();
  };

  useEffect(() => {
    let annule = false;
    questApi
      .getInteraction(Number(pnjId))
      .then((data) => {
        if (!annule) setInteraction(data);
      })
      .catch(() => {
        toast.error('Impossible de parler à ce PNJ.');
        fermer();
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnjId]);

  // Fermeture automatique quand le joueur s'éloigne — même règle que le web, à un seul
  // endroit : le PNJ ne doit pas rester « au téléphone » à trois cases de distance.
  useEffect(() => {
    if (pnjInteraction.abscisse === null || pnjInteraction.ordonnee === null) return;
    const distance = computeDistance(
      pnjInteraction.abscisse,
      pnjInteraction.ordonnee,
      positionJoueur.abscisse,
      positionJoueur.ordonnee,
    );
    if (distance >= 2) fermer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnjInteraction, positionJoueur]);

  const titre = () => {
    if (!interaction) return '…';
    if (interaction.view === 'quest') return interaction.quest.name;
    if (interaction.view === 'shop') return interaction.shop.title || interaction.pnj.name;
    return interaction.pnj.name;
  };

  const sousTitre = () => {
    if (!interaction) return '';
    const nom = interaction.pnj.name;
    switch (interaction.view) {
      case 'quest':
        return `Quête · ${nom}`;
      case 'shop':
        return `Échoppe · ${nom}`;
      case 'guilde':
        return `Guildes · ${nom}`;
      case 'metier':
        return `Métiers · ${nom}`;
      default:
        return nom;
    }
  };

  const vue = () => {
    if (!interaction) {
      return (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.gold} />
        </View>
      );
    }

    switch (interaction.view) {
      case 'quest':
        return <QuestDialogue pnj={interaction.pnj} quest={interaction.quest} onClose={fermer} />;
      case 'shop':
        return <ShopView items={interaction.shop.items} pnjId={interaction.pnj.id} />;
      case 'guilde':
      case 'metier':
        // Lots 9 et 10. On le DIT, plutôt que d'afficher un écran vide : un PNJ muet se
        // lit comme un bug, pas comme une fonctionnalité à venir.
        return (
          <Dialogue
            pnj={interaction.pnj}
            paragraphes={[
              interaction.pnj.description ?? '',
              interaction.view === 'guilde'
                ? "Les guildes ne sont pas encore accessibles depuis l'application mobile."
                : "L'apprentissage des métiers n'est pas encore accessible depuis l'application mobile.",
            ]}
            onClose={fermer}
          />
        );
      default:
        return (
          <Dialogue
            pnj={interaction.pnj}
            paragraphes={interaction.dialogue?.paragraphs ?? [interaction.pnj.description ?? '']}
            onClose={fermer}
          />
        );
    }
  };

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/icons/people.png')}
      title={titre()}
      subtitle={sousTitre()}
      onClose={fermer}>
      {vue()}
    </ModalShell>
  );
}

function Dialogue({
  pnj,
  paragraphes,
  onClose,
}: {
  pnj: { name: string; avatar?: string };
  paragraphes: string[];
  onClose: () => void;
}) {
  return (
    <View style={styles.corps}>
      <ScrollView contentContainerStyle={styles.dialogue}>
        <View style={styles.entete}>
          {!!pnj.avatar && (
            <Image source={{ uri: avatarPnj(pnj.avatar) }} style={styles.avatar} contentFit="cover" />
          )}
          <View style={styles.textes}>
            {paragraphes.filter(Boolean).map((paragraphe, i) => (
              <Text key={i} style={styles.paragraphe}>
                {paragraphe}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <GameButton onPress={onClose}>S'en aller</GameButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corps: { flex: 1 },
  dialogue: { padding: spacing.lg },
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
  actions: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.goldDivider,
  },
});
