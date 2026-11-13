import { MEDIA_URL } from './config';

/**
 * POINT UNIQUE de construction des chemins d'image — même règle que `itemUtils.itemImage()`
 * côté web : le back renvoie un NOM DE FICHIER brut (parfois sans extension), jamais un
 * chemin, et c'est au client de savoir dans quel dossier il vit.
 *
 * ⚠️ L'enum `App\Enum\CollectionImage` dit, PAR CHAMP, si la base stocke le nom avec ou
 * sans extension. Les helpers ci-dessous recollent `.png` là où elle ne la stocke pas :
 * `pnj.skin`, `monstre.image`, `boss.skin`, `interaction.skin` sont SANS extension ;
 * `pnj.avatar`, `objet.image`, `spell.icone`, `equipement.icone`, `alignement.icone` sont
 * AVEC. Se tromper donne un carré vide, pas une erreur.
 */
export function mediaUrl(chemin: string): string {
  if (!chemin) return '';
  if (chemin.startsWith('http://') || chemin.startsWith('https://')) return chemin;
  return `${MEDIA_URL}${chemin.startsWith('/') ? '' : '/'}${chemin}`;
}

/** `classe.nom` + `user.sexe` → sprite de joueur sur la carte (ex. archer_feminin.png). */
export const spriteJoueur = (nomClasse?: string | null, sexe?: string | null) =>
  nomClasse ? mediaUrl(`/img/classes/${nomClasse}_${sexe ?? 'feminin'}.png`) : '';

/** `pnj.skin` — SANS extension en base. */
export const spritePnj = (skin?: string | null) => (skin ? mediaUrl(`/img/pnj/${skin}.png`) : '');

/** `pnj.avatar` — AVEC extension en base. */
export const avatarPnj = (avatar?: string | null) => (avatar ? mediaUrl(`/img/pnj/${avatar}`) : '');

/** `boss.skin` — SANS extension. */
export const spriteBoss = (skin?: string | null) => (skin ? mediaUrl(`/img/boss/${skin}.png`) : '');

/** `monstre.image` — SANS extension (convention `/img/monstre/<skin>.png`). */
export const imageMonstre = (image?: string | null) =>
  image ? mediaUrl(`/img/monstre/${image}.png`) : '';

/** `interaction.skin` — SANS extension. */
export const spriteInteraction = (skin?: string | null) =>
  skin ? mediaUrl(`/img/interaction/${skin}.png`) : '';

/** `spell.icone` / `consommable.icone` — AVEC extension. */
export const iconeSort = (icone?: string | null) => (icone ? mediaUrl(`/img/spell/${icone}`) : '');
/** ⚠️ Dossier au PLURIEL (`consommables`), contrairement à tous les autres. */
export const iconeConsommable = (icone?: string | null) =>
  icone ? mediaUrl(`/img/consommables/${icone}`) : '';

/** `objet.image` — AVEC extension. */
export const imageObjet = (image?: string | null) => (image ? mediaUrl(`/img/objet/${image}`) : '');

/** `equipement.icone` — AVEC extension, rangée dans le sous-dossier de la POSITION. */
export const iconeEquipement = (icone?: string | null, position?: string | null) =>
  icone ? mediaUrl(`/img/equipement/${position ?? ''}/${icone}`.replace('//', '/')) : '';

/** `alignement.icone` — AVEC extension. */
export const iconeAlignement = (icone?: string | null) =>
  icone ? mediaUrl(`/img/alignement/${icone}`) : '';

/** Icônes d'interface (fichiers fixes du front web, pas de la base). */
export const iconeUi = (chemin: string) => mediaUrl(chemin);
