/** Comparaison insensible à la casse ET aux accents : « épée » doit sortir sur « epee ». */
export const sansAccent = (texte?: string | null) =>
  (texte || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Nombre à la française (« 343 605 »). Écrit à la main plutôt qu'avec
 * `toLocaleString('fr-FR')` : selon la plateforme et le moteur, `Intl` rend la locale ou
 * retombe sur l'anglais sans prévenir.
 */
export const nombre = (valeur?: number | null) =>
  valeur === null || valeur === undefined
    ? '—'
    : Math.round(valeur)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
