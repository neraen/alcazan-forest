/**
 * Client Server-Sent Events minimal. React Native n'a PAS d'`EventSource` : le web s'en
 * sert pour Mercure, ici on lit le flux à la main sur un `XMLHttpRequest`, dont
 * `responseText` grossit au fil de l'eau (c'est aussi ce que font les bibliothèques du
 * genre — une centaine de lignes ne justifiait pas une dépendance).
 *
 * Volontairement réduit à ce que Mercure envoie : des blocs séparés par une ligne vide,
 * des lignes `data:` (concaténées), des commentaires `:` (battements de cœur, ignorés).
 * Pas de reprise par `Last-Event-ID` : l'appelant resynchronise son état par REST après
 * une coupure, ce qui est plus sûr qu'un rejeu d'événements.
 */
export type FluxSse = { fermer: () => void };

export function ouvrirFluxSse(
  url: string,
  rappels: {
    onOuvert?: () => void;
    onMessage: (data: string) => void;
    /** Flux terminé ou en erreur — appelé UNE fois, jamais après `fermer()`. */
    onFerme?: () => void;
  },
): FluxSse {
  const xhr = new XMLHttpRequest();
  let lu = 0; // caractères de `responseText` déjà consommés
  let tampon = '';
  let ouvert = false;
  let termine = false;

  const finir = () => {
    if (termine) return;
    termine = true;
    rappels.onFerme?.();
  };

  const consommer = () => {
    const texte = xhr.responseText ?? '';
    if (texte.length <= lu) return;
    tampon += texte.slice(lu).replace(/\r\n?/g, '\n');
    lu = texte.length;

    let fin = tampon.indexOf('\n\n');
    while (fin !== -1) {
      const bloc = tampon.slice(0, fin);
      tampon = tampon.slice(fin + 2);
      const data = bloc
        .split('\n')
        .filter((ligne) => ligne.startsWith('data:'))
        .map((ligne) => ligne.slice(5).replace(/^ /, ''))
        .join('\n');
      if (data && !termine) rappels.onMessage(data);
      fin = tampon.indexOf('\n\n');
    }
  };

  xhr.open('GET', url, true);
  xhr.setRequestHeader('Accept', 'text/event-stream');
  xhr.setRequestHeader('Cache-Control', 'no-cache');
  // ⚠️ C'est la présence de ce gestionnaire qui fait remonter les données AU FIL DE L'EAU
  // en React Native ; sans lui, `responseText` n'arrive qu'à la fermeture du flux —
  // c'est-à-dire jamais.
  xhr.onreadystatechange = () => {
    if (termine) return;
    if (xhr.readyState >= 2 && !ouvert) {
      if (xhr.status !== 200) {
        xhr.abort();
        finir();
        return;
      }
      ouvert = true;
      rappels.onOuvert?.();
    }
    if (xhr.readyState >= 3) consommer();
    if (xhr.readyState === 4) finir();
  };
  xhr.onerror = finir;
  xhr.ontimeout = finir;
  xhr.send();

  return {
    fermer: () => {
      termine = true; // avant `abort()`, qui déclenche un dernier readystatechange
      xhr.abort();
    },
  };
}
