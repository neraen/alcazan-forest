/**
 * Somme des caractéristiques apportées par l'équipement porté — port de
 * `services/carateristiqueService.js`.
 *
 * La liste des caractéristiques est FERMÉE côté client (le web fait de même via un
 * `switch`) : une caractéristique ajoutée en base n'apparaîtra donc pas ici tant que
 * personne ne l'y aura ajoutée. C'est une limite connue, pas un oubli — les bonus
 * réellement appliqués au personnage sont calculés par le serveur.
 */
export const CARACTERISTIQUES = [
  'armure',
  'force',
  'dexterite',
  'constitution',
  'intelligence',
  'concentration',
  'chance',
  'critique',
] as const;

export type NomCaracteristique = (typeof CARACTERISTIQUES)[number];

export const LIBELLE_CARACTERISTIQUE: Record<NomCaracteristique, string> = {
  armure: 'Armure',
  force: 'Force',
  dexterite: 'Dextérité',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  concentration: 'Concentration',
  chance: 'Chance',
  critique: 'Critique',
};

export function cumulerCaracteristiquesEquipement(
  equipements: { caracteristiques?: { nom: string; valeur: number }[] }[],
): Record<NomCaracteristique, number> {
  const total = Object.fromEntries(CARACTERISTIQUES.map((c) => [c, 0])) as Record<
    NomCaracteristique,
    number
  >;

  (equipements ?? []).forEach((equipement) => {
    (equipement.caracteristiques ?? []).forEach((carac) => {
      if ((CARACTERISTIQUES as readonly string[]).includes(carac.nom)) {
        total[carac.nom as NomCaracteristique] += carac.valeur;
      }
    });
  });

  return total;
}
