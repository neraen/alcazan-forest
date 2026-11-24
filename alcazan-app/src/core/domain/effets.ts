import type { Buff } from '../types';

/**
 * Lecture des effets actifs (`/joueur/buffs`) — port fidèle de
 * `components/spells/buff/effetsUtils.js`. Ce module ne connaît AUCUN effet en dur :
 * libellés de contrôle, descriptions et caractéristiques viennent du serveur.
 */

/** Places par ligne : le serveur plafonne pareil (`EffetConfig::MAX_BIENFAITS` / `MAX_AFFAIBLISSEMENTS`). */
export const PLACES_PAR_LIGNE = 3;

/** Somme des modifications de caractéristiques, par nom (`{force: 20, armure: -10}`). */
export const bonusParCaracteristique = (
  effets: Pick<Buff, 'caracteristiques'>[] | null | undefined,
) =>
  (effets ?? []).reduce<Record<string, number>>((totaux, effet) => {
    (effet.caracteristiques ?? []).forEach(({ nom, value }) => {
      totaux[nom] = (totaux[nom] ?? 0) + Number(value || 0);
    });
    return totaux;
  }, {});

/** « +20 », « −10 » (vrai signe moins), « 0 ». */
export const signe = (valeur: number) => {
  if (valeur > 0) return `+${valeur}`;
  if (valeur < 0) return `−${Math.abs(valeur)}`;
  return '0';
};

const LIBELLES: Record<string, string> = {
  constitution: 'Constitution',
  force: 'Force',
  dexterite: 'Dextérité',
  intelligence: 'Intelligence',
  concentration: 'Concentration',
  chance: 'Chance',
  armure: 'Armure',
  critique: 'Critique',
};

/** Libellé d'une caractéristique telle que nommée en base (« dexterite » → « Dextérité »). */
export const libelleCarac = (nom?: string | null) =>
  (nom && LIBELLES[nom]) || (nom ? nom.charAt(0).toUpperCase() + nom.slice(1) : '');

/** Durée compacte pour une case de 26 pt : « 9 », « 45 », « 5m ». */
export const dureeCourte = (secondes: number) =>
  secondes >= 100 ? `${Math.ceil(secondes / 60)}m` : `${secondes}`;

/** Durée lisible : « 9 s », « 4 min 05 s ». */
export const dureeLongue = (secondes: number) => {
  if (secondes < 60) return `${secondes} s`;
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  return `${minutes} min ${String(reste).padStart(2, '0')} s`;
};

/** Une ligne de description : le contrôle d'abord (c'est ce qui change le jeu), puis les caracs. */
export const resumeEffet = (effet: Pick<Buff, 'controleDescription' | 'caracteristiques'>) => {
  const parties: string[] = [];
  if (effet.controleDescription) parties.push(effet.controleDescription);
  (effet.caracteristiques ?? []).forEach(({ nom, value }) =>
    parties.push(`${signe(Number(value))} ${libelleCarac(nom)}`),
  );
  return parties.join(' · ');
};

/** Clé React d'un effet : l'APPLICATION (`userBuffId`), l'effet seul pouvant revenir. */
export const cleEffet = (effet: Pick<Buff, 'userBuffId' | 'id'>) =>
  String(effet.userBuffId ?? effet.id);
