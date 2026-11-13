import http from '../http';
import type {
  Buff,
  Consommable,
  JoueurMinimal,
  ReponseChangementCarte,
  ReponseDeplacement,
  ResultatAttaque,
  Sort,
} from '../types';

/**
 * Port de `services/UsersApi.js` — mêmes noms, mêmes payloads, mêmes endpoints.
 * Tout écart ici est un bug : le serveur est la source unique des règles.
 */

export const find = () =>
  http.post<JoueurMinimal>('joueur/data/minimal').then((r) => r.data);

export const findUserByPseudo = (pseudo: string) =>
  http.post('joueur/data/profil', { pseudo }).then((r) => r.data);

export const getExpJoueur = () =>
  http
    .post<{ experienceActuelle: number; experienceMax: number }>('joueur/experience')
    .then((r) => r.data);

export const getPlayerSpells = () => http.post<Sort[]>('joueur/spells').then((r) => r.data);

export const getSpellBook = () => http.post('joueur/spells/book').then((r) => r.data);

export const equipSpell = (spellId: number, position: number) =>
  http.post('joueur/spell/equip', { spellId, position }).then((r) => r.data);

export const unequipSpell = (spellId: number) =>
  http.post('joueur/spell/unequip', { spellId }).then((r) => r.data);

export const getPlayerConsommables = () =>
  http.post<Consommable[]>('joueur/consommables').then((r) => r.data);

export const equipConsommable = (consommableId: number, position: number) =>
  http.post('joueur/consommable/equip', { consommableId, position }).then((r) => r.data);

export const getActiveBuff = () => http.post<Buff[]>('joueur/buffs', {}).then((r) => r.data);

export const getCaracteristiques = () =>
  http.get('joueur/caracteristiques').then((r) => r.data);

export const updateCaracteristiques = (data: unknown) =>
  http.post('joueur/caracteristiques/update', data).then((r) => r.data);

/**
 * Faits d'armes + états de progression. Endpoint DÉDIÉ : ne jamais fusionner avec
 * `find()` (`joueur/data/minimal`), rappelé à chaque déplacement.
 */
export const getStats = () =>
  http
    .post<{ faitsDArmes: unknown[]; etats: unknown[] }>('joueur/stats')
    .then((r) => r.data);

export const applyAttaqueToPlayer = (targetId: number, spellId: number) =>
  http.post<ResultatAttaque>('joueur/attack/joueur', { targetId, spellId }).then((r) => r.data);

export const applyAttaqueToMonster = (targetId: number, spellId: number) =>
  http.post<ResultatAttaque>('joueur/attack/monster', { targetId, spellId }).then((r) => r.data);

export const applyAttaqueToBoss = (targetId: number, spellId: number) =>
  http.post<ResultatAttaque>('joueur/attack/boss', { targetId, spellId }).then((r) => r.data);

export const applySpellAutoFocused = (spellId: number) =>
  http
    .post<{ message?: string; life?: number }>('joueur/spell/self', { spellId })
    .then((r) => r.data);

export const updatePosition = (mapId: number, abscisse: number, ordonnee: number) =>
  http
    .post<ReponseDeplacement>('joueur/case/update_position', {
      mapId,
      caseAbscisse: abscisse,
      caseOrdonnee: ordonnee,
    })
    .then((r) => r.data);

export const changeMap = (targetMapId: number | null, targetWrap: number | null, wrapId: number) =>
  http
    .post<ReponseChangementCarte>('joueur/map/update_position', { targetMapId, targetWrap, wrapId })
    .then((r) => r.data);

export const disableTutorial = () =>
  http.post('joueur/disable/tutorial').then((r) => r.data);
