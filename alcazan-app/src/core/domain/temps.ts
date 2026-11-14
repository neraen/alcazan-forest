import { useEffect, useState } from 'react';

/**
 * Durées et dates — port de `components/artisanat/craftUtils.js` et de
 * `modals/hotelVenteModal/tempsRestant.js`.
 *
 * Règle de fond, la même que sur le web : **rien n'est décompté localement**. Le serveur
 * envoie des dates ABSOLUES, l'écran les compare à l'horloge à chaque rendu. Un compteur
 * décrémenté à la main dériverait dès que l'app passe en arrière-plan et afficherait
 * « prête » sur une commande qui ne l'est pas.
 */

/** Secondes restantes avant `pretAt`, recalculées depuis l'horloge. */
export const secondesRestantes = (pretAt?: string | null) =>
  pretAt ? Math.max(0, Math.ceil((new Date(pretAt).getTime() - Date.now()) / 1000)) : 0;

/** Avancement d'une commande en pourcentage, borné à [0, 100]. */
export function avancement(lanceeAt?: string | null, pretAt?: string | null) {
  if (!lanceeAt || !pretAt) return 0;
  const debut = new Date(lanceeAt).getTime();
  const fin = new Date(pretAt).getTime();
  if (fin <= debut) return 100;
  return Math.max(0, Math.min(100, ((Date.now() - debut) / (fin - debut)) * 100));
}

/** Durée en toutes lettres : « 2 h 5 min », « 12 min », « 30 s ». */
export function enClair(secondes: number) {
  if (secondes >= 3600) {
    return `${Math.floor(secondes / 3600)} h ${Math.ceil((secondes % 3600) / 60)} min`;
  }
  if (secondes >= 60) return `${Math.ceil(secondes / 60)} min`;
  return `${secondes} s`;
}

/** Temps restant avant une échéance (« 1 j 3 h », « 11 h 20 », « 4 min », « expiré »). */
export function tempsRestant(dateIso?: string | null): string | null {
  if (!dateIso) return null;
  const restant = new Date(dateIso).getTime() - Date.now();
  if (Number.isNaN(restant)) return null;
  if (restant <= 0) return 'expiré';
  const minutes = Math.floor(restant / 60000);
  const heures = Math.floor(minutes / 60);
  if (heures >= 24) return `${Math.floor(heures / 24)} j ${heures % 24} h`;
  if (heures >= 1) return `${heures} h ${String(minutes % 60).padStart(2, '0')}`;
  return `${Math.max(1, minutes)} min`;
}

/**
 * Horloge d'AFFICHAGE : force un rendu chaque seconde tant que `actif` est vrai. Elle ne
 * porte aucune valeur — les durées restent recalculées depuis les dates serveur.
 */
export function useHorloge(actif: boolean) {
  const [, forcerRendu] = useState(0);
  useEffect(() => {
    if (!actif) return undefined;
    const minuteur = setInterval(() => forcerRendu((v) => v + 1), 1000);
    return () => clearInterval(minuteur);
  }, [actif]);
}

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const deux = (n: number) => String(n).padStart(2, '0');

/**
 * « 2026-11-14 10:55:00 » (heure du serveur, sans fuseau) → Date. Découpée À LA MAIN : le
 * format n'est pas de l'ISO, et son interprétation par `new Date()` varie d'un moteur
 * JavaScript à l'autre (Hermes le refuse là où un navigateur le tolère).
 */
export function dateServeur(texte?: string | null): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(texte || '');
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
}

/** Clé de regroupement par jour, en heure LOCALE (pas en UTC : minuit décalerait). */
export const cleJour = (date: Date) =>
  `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;

export function libelleJour(date: Date) {
  const aujourdhui = new Date();
  const hier = new Date(aujourdhui.getTime() - 86400000);
  if (cleJour(date) === cleJour(aujourdhui)) return "Aujourd'hui";
  if (cleJour(date) === cleJour(hier)) return 'Hier';
  return `${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

export const heureCourte = (date: Date) => `${deux(date.getHours())}:${deux(date.getMinutes())}`;
