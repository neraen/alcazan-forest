import { StyleSheet, Text, View } from 'react-native';

import type { Recette } from '@/src/core/api/craft';
import { enClair } from '@/src/core/domain/temps';
import { imageItem } from '@/src/core/media';
import GameButton from '@/src/ui/GameButton';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';
import Vignette from '@/src/ui/Vignette';

/**
 * Carte d'une recette — port de `artisanat/recetteCard/RecetteCard.jsx`.
 *
 * `realisable` vient du serveur et n'autorise rien : `POST /api/craft/lancer` revérifie
 * métier, niveau et matériaux. La carte grisée n'est qu'un confort de lecture.
 *
 * Différence avec le web : pas de menu déroulant de mode PAR CARTE. Le mode se choisit
 * une fois pour l'écran (cf. `artisanat.tsx`) — six menus déroulants de 30 pt dans une
 * liste qu'on fait défiler au pouce, c'est six occasions de changer un réglage en
 * voulant faire défiler.
 */
export default function RecetteCard({
  recette,
  occupe,
  onFabriquer,
}: {
  recette: Recette;
  occupe: boolean;
  onFabriquer: (recette: Recette) => void;
}) {
  const niveauInsuffisant = recette.niveauJoueur < recette.niveauRequis;
  const manque = recette.ingredients.filter((i) => i.disponible < i.requis);
  const empechement = niveauInsuffisant
    ? `${recette.metier} niveau ${recette.niveauRequis} requis (vous êtes niveau ${recette.niveauJoueur})`
    : manque.length > 0
      ? `Il vous manque : ${manque.map((i) => i.nom).join(', ')}`
      : null;

  return (
    <View style={[styles.carte, !recette.realisable && styles.carteBloquee]}>
      <View style={styles.haut}>
        <Vignette src={imageItem(recette.produit)} initiale={recette.nom} taille="lg">
          {!!recette.produit && recette.produit.quantite > 1 && (
            <View style={styles.quantite}>
              <Text style={styles.quantiteLabel}>×{recette.produit.quantite}</Text>
            </View>
          )}
        </Vignette>
        <View style={styles.identite}>
          <Text style={styles.nom} numberOfLines={1}>
            {recette.nom}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            <Text style={niveauInsuffisant && styles.bloque}>
              {recette.metier} · niv. {recette.niveauRequis}
            </Text>
            {'  ·  '}
            {enClair(recette.tempsSecondes)}
            {'  ·  '}+{recette.experienceMetier} XP
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {recette.description || recette.produit?.description || 'Aucune description.'}
          </Text>
        </View>
        <GameButton
          variant="solid"
          disabled={occupe || !recette.realisable}
          onPress={() => onFabriquer(recette)}
          style={styles.bouton}>
          Fabriquer
        </GameButton>
      </View>

      <View style={styles.ingredients}>
        {recette.ingredients.map((ingredient) => {
          const manquant = ingredient.disponible < ingredient.requis;
          return (
            <View
              key={`${ingredient.type}-${ingredient.itemId}`}
              style={[styles.ingredient, manquant && styles.ingredientManquant]}>
              <Vignette src={imageItem(ingredient)} initiale={ingredient.nom} taille="sm" />
              <Text style={styles.ingredientNom} numberOfLines={1}>
                {ingredient.nom}
              </Text>
              <Text style={[styles.ingredientCompte, manquant && styles.bloque]}>
                {ingredient.disponible} / {ingredient.requis}
              </Text>
            </View>
          );
        })}
        {recette.ingredients.length === 0 && (
          <Text style={styles.empechement}>Recette incomplète : aucun ingrédient.</Text>
        )}
      </View>

      {!!empechement && <Text style={styles.empechement}>{empechement}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
  },
  carteBloquee: { borderColor: colors.slotDash },
  haut: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identite: { flex: 1, minWidth: 0, gap: 2 },
  nom: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.textMute },
  description: { fontFamily: fonts.body, fontSize: 11, fontStyle: 'italic', color: colors.textFaint },
  bouton: { minHeight: 38, paddingHorizontal: 14 },
  quantite: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.qtyBadgeBg,
  },
  quantiteLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.text },
  ingredients: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  ingredient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingRight: spacing.sm,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.panelInner,
    maxWidth: '100%',
  },
  ingredientManquant: { borderColor: colors.dangerBorder },
  ingredientNom: { flexShrink: 1, fontFamily: fonts.body, fontSize: 11, color: colors.textSoft },
  ingredientCompte: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.bonus },
  bloque: { color: colors.dangerText },
  empechement: { fontFamily: fonts.body, fontSize: 11, color: colors.dangerText },
});
