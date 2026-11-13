import http from '../http';

/** Port de `services/InventaireApi.js`. */
export const getPlayerInventaire = () => http.post('inventaire', {}).then((r) => r.data);

export const getEquipementEquipe = () =>
  http.post('inventaire/equipement/equipe', {}).then((r) => r.data);

export const getAllPlayerItems = () => http.post('inventaire/all', {}).then((r) => r.data);

/**
 * Équiper / retirer. `EquipementEquipeService` est l'UNIQUE point d'entrée côté serveur
 * (transaction unique, contrôle de possession, ancien objet remis au sac) : le client ne
 * fait JAMAIS de va-et-vient sac/équipement lui-même — c'est ce qui avait dupliqué
 * l'objet équipé côté web avant le 23/07/2026.
 */
export const wearEquipement = (idEquipement: number) =>
  http.post('inventaire/equipement/wear', { idEquipement }).then((r) => r.data);

export const unwearEquipement = (idEquipement: number) =>
  http.post('inventaire/equipement/unwear', { idEquipement }).then((r) => r.data);
