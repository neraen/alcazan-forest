/**
 * Port exact de `services/distanceCalculator.js` — distance euclidienne ARRONDIE.
 *
 * Ce n'est pas une distance de Tchebychev ni de Manhattan, et l'arrondi est significatif :
 * une diagonale vaut 1 (√2 ≈ 1,41 → 1), donc les huit cases autour du joueur sont toutes
 * « adjacentes ». Changer cette formule changerait l'adjacence des PNJ, des portes et des
 * échanges. De toute façon le serveur revérifie : côté client, c'est du confort
 * d'affichage (griser un sort hors de portée), jamais une autorisation.
 */
export function computeDistance(
  abscisseTarget: number,
  ordonneeTarget: number,
  abscisseJoueur: number,
  ordonneeJoueur: number,
): number {
  const distanceOrdonnee = Math.abs(ordonneeTarget - ordonneeJoueur);
  const distanceAbscisse = Math.abs(abscisseTarget - abscisseJoueur);
  return Math.round(Math.sqrt(distanceAbscisse ** 2 + distanceOrdonnee ** 2));
}
