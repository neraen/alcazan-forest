import { mediaUrl } from './media';

/**
 * Fonds de carte, par id de carte.
 *
 * Metro ne sait pas faire un `require()` DYNAMIQUE : le web peut écrire
 * `require("../img/map/" + mapId + ".png")`, pas nous. D'où cette table statique, générée
 * depuis `assets/images/maps/` (fichiers identiques à `alcazan-front-prod/src/img/map`,
 * même md5).
 *
 * Les embarquer plutôt que les servir en HTTP est un choix : 21 Mo qui ne changent jamais
 * en cours de partie, et un fond manquant rendrait la carte injouable. Le prix, c'est
 * qu'une carte créée par le MapMaker APRÈS la release n'est pas dans cette table — d'où le
 * repli réseau, qui suppose que le PNG ait aussi été déposé dans
 * `alcazan-front-prod/public/img/map/`.
 */
const FONDS: Record<number, number> = {
  1: require('../../assets/images/maps/1.png'),
  2: require('../../assets/images/maps/2.png'),
  3: require('../../assets/images/maps/3.png'),
  4: require('../../assets/images/maps/4.png'),
  5: require('../../assets/images/maps/5.png'),
  6: require('../../assets/images/maps/6.png'),
  7: require('../../assets/images/maps/7.png'),
  8: require('../../assets/images/maps/8.png'),
  9: require('../../assets/images/maps/9.png'),
  10: require('../../assets/images/maps/10.png'),
  11: require('../../assets/images/maps/11.png'),
  12: require('../../assets/images/maps/12.png'),
  13: require('../../assets/images/maps/13.png'),
  14: require('../../assets/images/maps/14.png'),
  15: require('../../assets/images/maps/15.png'),
  16: require('../../assets/images/maps/16.png'),
  17: require('../../assets/images/maps/17.png'),
  18: require('../../assets/images/maps/18.png'),
  19: require('../../assets/images/maps/19.png'),
  20: require('../../assets/images/maps/20.png'),
  21: require('../../assets/images/maps/21.png'),
  22: require('../../assets/images/maps/22.png'),
  23: require('../../assets/images/maps/23.png'),
  24: require('../../assets/images/maps/24.png'),
  25: require('../../assets/images/maps/25.png'),
  26: require('../../assets/images/maps/26.png'),
  27: require('../../assets/images/maps/27.png'),
  28: require('../../assets/images/maps/28.png'),
  29: require('../../assets/images/maps/29.png'),
  30: require('../../assets/images/maps/30.png'),
  31: require('../../assets/images/maps/31.png'),
  32: require('../../assets/images/maps/32.png'),
  33: require('../../assets/images/maps/33.png'),
  34: require('../../assets/images/maps/34.png'),
  35: require('../../assets/images/maps/35.png'),
  36: require('../../assets/images/maps/36.png'),
  37: require('../../assets/images/maps/37.png'),
  38: require('../../assets/images/maps/38.png'),
};

export function fondDeCarte(mapId: number) {
  return FONDS[mapId] ?? { uri: mediaUrl(`/img/map/${mapId}.png`) };
}

export function fondEmbarque(mapId: number): boolean {
  return FONDS[mapId] !== undefined;
}
