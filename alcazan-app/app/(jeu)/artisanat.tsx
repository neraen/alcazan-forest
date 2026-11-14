import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import * as craftApi from '@/src/core/api/craft';
import type { Atelier, Recette } from '@/src/core/api/craft';
import * as metierApi from '@/src/core/api/metier';
import type { Metier, Progression } from '@/src/core/api/metier';
import { pluriel, sansAccent } from '@/src/core/domain/texte';
import { messageErreur } from '@/src/core/http';
import { imageItem, mediaUrl } from '@/src/core/media';
import { useAppDispatch } from '@/src/core/store';
import { updateJoueurState } from '@/src/core/store/actions';
import MetierCard from '@/src/game/artisanat/MetierCard';
import RecetteCard from '@/src/game/artisanat/RecetteCard';
import Chip from '@/src/ui/Chip';
import GameButton from '@/src/ui/GameButton';
import ModalShell from '@/src/ui/ModalShell';
import SearchField from '@/src/ui/SearchField';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';
import Vignette from '@/src/ui/Vignette';

/**
 * Artisanat — port de `pages/artisanatPage/ArtisanatPage.jsx` : les métiers du joueur et
 * leur progression à gauche, et à droite ce que le métier touché a à montrer.
 *
 * Deux règles reprises telles quelles : **le client ne décide de rien** (`realisable` et
 * les chiffres des modes viennent du serveur, qui revérifie au lancement) et **rien n'est
 * décompté localement**.
 *
 * C'est la FAMILLE du métier qui décide de la colonne de droite : récolte → ses
 * ressources, palier par palier ; fabrication → ses recettes. Les deux occupent la même
 * colonne, d'où un seul état (`selection`). Toute fiche est touchable, même sans rien à
 * montrer : c'est la colonne qui l'annonce, pas un tap muet.
 *
 * Ce qui change par rapport au web, faute de hauteur :
 *  - l'ÉTABLI n'est pas répété ici — c'est un écran à part, ouvert par le bouton de
 *    l'en-tête, qui porte le nombre de fabrications en cours ;
 *  - le MODE de fabrication se choisit une fois pour l'écran, pas carte par carte.
 */
export default function ArtisanatScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const [atelier, setAtelier] = useState<Atelier | null>(null);
  const [progression, setProgression] = useState<Progression | null>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState<{ id: number; famille: string } | null>(null);
  const [realisablesSeulement, setRealisablesSeulement] = useState(false);
  const [modeChoisi, setModeChoisi] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const [donneesAtelier, donneesMetiers] = await Promise.all([
        craftApi.atelier(),
        metierApi.progression(),
      ]);
      setAtelier(donneesAtelier);
      setProgression(donneesMetiers);
    } catch {
      toast.error("L'artisanat est inaccessible pour le moment.");
    } finally {
      setChargement(false);
    }
  }, [toast]);

  // Au retour de l'établi, la file a pu changer (retrait, annulation) : on relit.
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const modes = atelier?.modes ?? [];
  const mode = modeChoisi ?? modes[0]?.value ?? '';
  const modeActif = modes.find((m) => m.value === mode);
  const commandes = atelier?.commandes ?? [];
  const recettes = useMemo(() => atelier?.recettes ?? [], [atelier]);
  const metiers = useMemo(() => progression?.metiers ?? [], [progression]);

  const fabriquer = async (recette: Recette) => {
    setOccupe(true);
    try {
      const reponse = await craftApi.lancer(recette.id, mode);
      (reponse.messages || [reponse.message]).filter(Boolean).forEach((m) => toast.info(m as string));
      await charger();
      // Le sac a bougé (ingrédients débités) : la carte se resynchronise.
      dispatch(updateJoueurState({ needRefresh: true }));
    } catch (erreur) {
      toast.error(messageErreur(erreur, 'Une erreur est survenue.'));
    } finally {
      setOccupe(false);
    }
  };

  const metierOuvert = selection ? metiers.find((m) => m.metierId === selection.id) ?? null : null;
  const metierRecolte = metierOuvert?.famille === 'recolte' ? metierOuvert : null;
  const filtreMetier = metierOuvert?.famille === 'craft' ? metierOuvert.metierId : null;

  /** Les recettes du métier ouvert, AVANT recherche : sans elles, « rien à afficher » ne
      distingue pas « ce métier n'a aucune recette » de « votre recherche ne donne rien ». */
  const recettesDuMetier = useMemo(
    () => (filtreMetier === null ? recettes : recettes.filter((r) => r.metierId === filtreMetier)),
    [recettes, filtreMetier],
  );

  const recettesFiltrees = useMemo(() => {
    const terme = sansAccent(recherche.trim());
    return recettesDuMetier.filter((recette) => {
      if (realisablesSeulement && !recette.realisable) return false;
      if (!terme) return true;
      // La recherche porte sur tout ce que la carte affiche, ingrédients compris :
      // « que puis-je faire avec du cuir ? » est la question la plus fréquente.
      return [
        recette.nom,
        recette.description,
        recette.metier,
        recette.produit?.nom,
        ...recette.ingredients.map((i) => i.nom),
      ].some((texte) => sansAccent(texte).includes(terme));
    });
  }, [recettesDuMetier, recherche, realisablesSeulement]);

  const basculer = (metier: Metier) =>
    setSelection((precedent) =>
      precedent?.id === metier.metierId ? null : { id: metier.metierId, famille: metier.famille },
    );

  const rail = () => {
    const famillesLabels = progression?.famillesLabels ?? {};
    const places = progression?.placesRestantes ?? {};
    return Object.entries(famillesLabels).map(([famille, label]) => {
      const duGroupe = metiers.filter((m) => m.famille === famille);
      const restantes = places[famille] ?? 0;
      return (
        <View key={famille} style={styles.famille}>
          <View style={styles.familleEntete}>
            <Text style={styles.titreRail}>{label}</Text>
            <Text style={styles.compteur}>
              {restantes > 0 ? `${pluriel(restantes, 'place')} libre${restantes > 1 ? 's' : ''}` : 'complet'}
            </Text>
          </View>
          {duGroupe.length === 0 ? (
            <Text style={styles.aucunMetier}>
              Aucun métier de {label.toLowerCase()}. Trouvez un maître de métier sur la carte.
            </Text>
          ) : (
            duGroupe.map((metier) => (
              <MetierCard
                key={metier.metierId}
                metier={metier}
                actif={selection?.id === metier.metierId}
                onPress={() => basculer(metier)}
              />
            ))
          )}
        </View>
      );
    });
  };

  /**
   * Fiche d'un métier de RÉCOLTE. Les paliers hors de portée restent affichés, grisés :
   * c'est là que le joueur lit ce que son prochain niveau lui ouvrira.
   */
  const ressources = (metier: Metier) => {
    const liste = metier.ressources ?? [];
    return (
      <ScrollView contentContainerStyle={styles.colonne}>
        <Text style={styles.aide}>
          Niveau {metier.niveau} en {metier.nom} ·{' '}
          {liste.filter((r) => r.accessible).length} / {liste.length} ressources à votre portée, à
          ramasser sur les cases de récolte du monde.
        </Text>
        {liste.length === 0 ? (
          <Vide>Aucune ressource n’est encore rattachée à ce métier.</Vide>
        ) : (
          <View style={styles.grilleRessources}>
            {liste.map((ressource) => (
              <View
                key={ressource.id}
                style={[styles.ressource, !ressource.accessible && styles.ressourceBloquee]}>
                <Vignette src={imageItem(ressource)} initiale={ressource.nom} taille="md" />
                <View style={styles.ressourceCorps}>
                  <View style={styles.ressourceTete}>
                    <Text style={styles.ressourceNom} numberOfLines={1}>
                      {ressource.nom}
                    </Text>
                    <Text style={[styles.ressourceNiveau, !ressource.accessible && styles.bloque]}>
                      niv. {ressource.niveauRequis}
                    </Text>
                  </View>
                  <Text style={styles.ressourceDescription} numberOfLines={2}>
                    {ressource.accessible
                      ? ressource.description || 'Aucune description.'
                      : `Niveau ${ressource.niveauRequis} requis pour la récolter.`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const catalogue = () => (
    <View style={styles.remplir}>
      <View style={styles.barre}>
        <SearchField
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Recette, matériau…"
          style={styles.recherche}
        />
        <Chip
          label="Réalisables"
          actif={realisablesSeulement}
          onPress={() => setRealisablesSeulement((v) => !v)}
        />
        {modes.map((m) => (
          <Chip
            key={m.value}
            label={m.label}
            actif={m.value === mode}
            onPress={() => setModeChoisi(m.value)}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.colonne}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {/* Les chiffres du mode viennent du serveur : aucun n'est écrit ici. */}
        {!!modeActif && (
          <Text style={styles.aide}>
            <Text style={styles.aideTitre}>{modeActif.label}</Text> — {modeActif.description} (temps ×
            {modeActif.temps},{' '}
            {modeActif.recycle > 0 ? `${modeActif.recycle} % des ingrédients rendus` : 'rien de rendu'},
            karma {modeActif.karma > 0 ? `+${modeActif.karma}` : modeActif.karma})
          </Text>
        )}

        {/* Trois vides bien distincts : aucun métier de fabrication, un métier sans
            aucune recette, ou une recherche qui ne donne rien. */}
        {recettes.length === 0 ? (
          <Vide>
            Vous n’exercez aucun métier de fabrication : apprenez-en un auprès d’un maître pour voir
            ses recettes ici.
          </Vide>
        ) : recettesDuMetier.length === 0 ? (
          <Vide>Aucune recette disponible pour ce métier.</Vide>
        ) : recettesFiltrees.length === 0 ? (
          <Vide>Aucune recette ne correspond à votre recherche.</Vide>
        ) : (
          recettesFiltrees.map((recette) => (
            <RecetteCard key={recette.id} recette={recette} occupe={occupe} onFabriquer={fabriquer} />
          ))
        )}
      </ScrollView>
    </View>
  );

  const pretes = commandes.filter((c) => c.prete).length;

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/menu/buches.png')}
      title="Artisanat"
      subtitle={
        chargement
          ? undefined
          : metierOuvert
            ? `${metierOuvert.nom} · ${metierOuvert.familleLabel}`
            : `${pluriel(metiers.length, 'métier')} · ${pluriel(recettes.length, 'recette')}`
      }
      headerRight={
        !chargement && (
          <GameButton
            variant={pretes > 0 ? 'solid' : 'gold'}
            style={styles.boutonEtabli}
            onPress={() => router.push('/(jeu)/etabli?depuis=artisanat' as never)}>
            {`Établi ${commandes.length}/${atelier?.commandesMax ?? '–'}`}
          </GameButton>
        )
      }
      onClose={() => router.back()}>
      {chargement ? (
        <Chargement />
      ) : (
        <View style={styles.corps}>
          <ScrollView style={styles.rail} contentContainerStyle={styles.railContenu}>
            {rail()}
          </ScrollView>
          <View style={styles.principal}>
            {metierRecolte ? ressources(metierRecolte) : catalogue()}
          </View>
        </View>
      )}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },
  remplir: { flex: 1 },
  rail: { flexGrow: 0, width: 232, borderRightWidth: 1, borderRightColor: colors.goldDivider },
  railContenu: { padding: spacing.md, gap: spacing.md },
  famille: { gap: spacing.xs + 2 },
  familleEntete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  titreRail: {
    fontFamily: fonts.title,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  compteur: { fontFamily: fonts.body, fontSize: 10, color: colors.textFaint },
  aucunMetier: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.textFaint },
  principal: { flex: 1, minWidth: 0 },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recherche: { flex: 1, minWidth: 110 },
  colonne: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  aide: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.textFaint },
  aideTitre: { fontFamily: fonts.bodyBold, color: colors.goldPale },
  boutonEtabli: { minHeight: 34, paddingHorizontal: 14 },
  grilleRessources: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ressource: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.sm,
    borderRadius: radius.nav,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  ressourceBloquee: { opacity: 0.55 },
  ressourceCorps: { flex: 1, minWidth: 0, gap: 2 },
  ressourceTete: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  ressourceNom: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text },
  ressourceNiveau: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.level },
  ressourceDescription: { fontFamily: fonts.body, fontSize: 11, lineHeight: 14, color: colors.textFaint },
  bloque: { color: colors.dangerText },
});
