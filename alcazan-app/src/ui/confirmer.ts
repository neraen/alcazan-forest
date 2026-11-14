import { Alert } from 'react-native';

/**
 * Confirmation native — l'équivalent du `window.confirm` du web. Tout ce qui coûte ou ne
 * se défait pas (dépenser de l'or, exclure, dissoudre, retirer un lot dont les frais sont
 * perdus) passe par ici : sur un écran tactile, un bouton se touche par accident.
 */
export function confirmer(
  titre: string,
  message: string,
  action: () => void,
  { libelle = 'Confirmer', destructif = false }: { libelle?: string; destructif?: boolean } = {},
) {
  Alert.alert(titre, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: libelle, style: destructif ? 'destructive' : 'default', onPress: action },
  ]);
}
