import http from '../http';

/**
 * Port partiel de `services/DonjonApi.js` — seul ce dont le combat a besoin au lot 5
 * (frapper un monstre d'instance). Le reste (groupe, portes, sondage de combat) arrive
 * au lot 10.
 *
 * ⚠️ La réponse de `donjon/renfort/attaquer` a la MÊME forme que celle d'un monstre
 * ordinaire : rien à normaliser côté client.
 */
export const attaquerRenfort = (renfortId: number, spellId: number) =>
  http.post('donjon/renfort/attaquer', { renfortId, spellId }).then((r) => r.data);
