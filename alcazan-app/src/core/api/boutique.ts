import http from '../http';

/**
 * Port de `services/UserActionApi.js` (échoppe + consommables).
 *
 * Le client n'envoie JAMAIS de montant et ne décide pas du stock : le serveur relit le
 * prix sur l'item, revérifie la quantité possédée DANS la transaction, et fait foi sur
 * l'or (`VenteService`, `SacService` étant l'unique point de mutation du sac).
 */
export type TypeItem = 'equipement' | 'consommable' | 'objet';

/** ⚠️ Achat et vente n'ont pas le même payload — c'est ainsi côté serveur. */
export const buyItem = (itemId: number, pnjId: number) =>
  http.post('joueur/buy/shop', { item: itemId, pnjId }).then((r) => r.data);

export const sellItem = (type: TypeItem, itemId: number, quantite = 1) =>
  http.post('joueur/sell/shop', { type, id: itemId, quantite }).then((r) => r.data);

export const takeConsommable = (consommableId: number) =>
  http.post('joueur/use/consommable', { consommableId }).then((r) => r.data);
