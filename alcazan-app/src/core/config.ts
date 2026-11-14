import Constants from 'expo-constants';

/**
 * Où vit le serveur de jeu.
 *
 * ⚠️ `localhost` ne veut pas dire la même chose selon l'appareil : le simulateur iOS
 * atteint la machine hôte sur `localhost`, un téléphone physique non. On déduit donc
 * l'adresse par défaut de l'URL du serveur Metro (`hostUri`, du genre
 * `192.168.1.20:8081`) : elle pointe forcément vers la machine de développement, qu'on
 * soit en simulateur ou sur un vrai appareil du même réseau.
 *
 * Les builds installés et les mises à jour EAS visent le serveur public en HTTPS.
 * Metro conserve les services locaux. Les variables EXPO_PUBLIC_* peuvent surcharger
 * les deux modes (elles sont incorporées au bundle lors du build ou de l'update).
 */
function hoteDeDeveloppement(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const hote = hostUri.split(':')[0];
  return hote || 'localhost';
}

const HOTE = hoteDeDeveloppement();
const SERVEUR_PUBLIC = 'https://alcazan-forest.com';

/** Base de l'API Symfony — garde le `/` final, comme `config.js` côté web. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL
  ?? (__DEV__ ? `http://${HOTE}:8080/api/` : `${SERVEUR_PUBLIC}/api/`);

/**
 * Base des images servies en statique (`/img/...`). Ce sont les fichiers de
 * `alcazan-front-prod/public/img`, donc le serveur du front — jamais l'API.
 */
export const MEDIA_URL = process.env.EXPO_PUBLIC_MEDIA_URL
  ?? (__DEV__ ? `http://${HOTE}:3000` : SERVEUR_PUBLIC);

/** Hub Mercure (temps réel). Port hôte 5001 : macOS squatte 5000 avec AirPlay. */
export const MERCURE_URL = process.env.EXPO_PUBLIC_MERCURE_URL
  ?? (__DEV__ ? `http://${HOTE}:5001/.well-known/mercure` : `${SERVEUR_PUBLIC}/.well-known/mercure`);

export const LOGIN_API = API_URL + 'login_check';
export const USER_API = API_URL + 'users';
