import { Redirect } from 'expo-router';

/** Point d'entrée : la garde de `app/_layout` tranche, ici on ne fait que pointer. */
export default function Index() {
  return <Redirect href="/connexion" />;
}
