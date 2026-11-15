import http from '../http';

/** Port de `services/ProfilAPI.js` : l'équipement PORTÉ par un joueur, lecture seule. */
export const getEquipementEquipeJoueur = (userId: number) =>
  http.post<any[]>('profil/joueur/equipement', { userId }).then((r) => r.data);
