import { useEffect, useRef, useState } from 'react';

import * as echangeApi from './api/echange';
import { MERCURE_URL } from './config';
import { ouvrirFluxSse, type FluxSse } from './sse';

/** Délais de reconnexion : rapide d'abord (micro-coupure), puis patient (hub éteint). */
const DELAIS_RECONNEXION_MS = [1000, 2000, 5000, 10000, 20000];

/**
 * Abonnement au hub Mercure sur une liste de topics — port de `hooks/useMercure.js`.
 *
 * Trois écarts avec le web, tous imposés par le mobile :
 *
 * 1. Pas d'`EventSource` en React Native → `core/sse` (flux lu sur un XHR). Le JWT
 *    d'abonnement passe toujours en query param `authorization`, comme sur le web.
 * 2. L'adresse du hub vient de `MERCURE_URL` (config de l'app) et NON du `mercureUrl` de
 *    la réponse : le back y répond SA vision du hub (`localhost:5001` en dev), qui ne
 *    désigne pas la machine de développement depuis un vrai téléphone.
 * 3. La reconnexion est faite À LA MAIN (EventSource s'en chargeait), avec un jeton NEUF
 *    à chaque tentative : celui d'avant a pu expirer, ou ne pas couvrir les mêmes topics.
 *
 * Rend `connecte` : l'appelant s'en sert pour savoir s'il doit se rabattre sur un sondage
 * REST. Sans hub, le jeu reste jouable — sans temps réel.
 */
export default function useMercure(
  topics: string[],
  onMessage: (payload: any) => void,
  onReconnect?: () => void,
): boolean {
  // Refs : ne jamais forcer un réabonnement quand seuls les rappels changent.
  const messageRef = useRef(onMessage);
  const reconnectRef = useRef(onReconnect);
  messageRef.current = onMessage;
  reconnectRef.current = onReconnect;

  const [connecte, setConnecte] = useState(false);
  const cle = topics.join('|');

  useEffect(() => {
    if (cle === '') return undefined;

    let annule = false;
    let flux: FluxSse | null = null;
    let minuteur: ReturnType<typeof setTimeout> | null = null;
    let tentative = 0;
    let dejaConnecte = false;

    const reessayer = () => {
      if (annule) return;
      setConnecte(false);
      const delai = DELAIS_RECONNEXION_MS[Math.min(tentative, DELAIS_RECONNEXION_MS.length - 1)];
      tentative += 1;
      minuteur = setTimeout(connecter, delai);
    };

    const connecter = () => {
      echangeApi
        .mercureToken()
        .then(({ token }) => {
          if (annule) return;
          const requete = [
            ...cle.split('|').map((topic) => `topic=${encodeURIComponent(topic)}`),
            `authorization=${encodeURIComponent(token)}`,
          ].join('&');

          flux = ouvrirFluxSse(`${MERCURE_URL}?${requete}`, {
            onOuvert: () => {
              if (annule) return;
              tentative = 0;
              setConnecte(true);
              // Des événements ont pu être manqués pendant la coupure : l'état complet
              // se relit par REST, jamais par rejeu.
              if (dejaConnecte) reconnectRef.current?.();
              dejaConnecte = true;
            },
            onMessage: (data) => {
              try {
                messageRef.current(JSON.parse(data));
              } catch {
                // Payload illisible : ignoré, l'état complet reviendra au prochain événement.
              }
            },
            onFerme: reessayer,
          });
        })
        .catch(reessayer);
    };

    connecter();

    return () => {
      annule = true;
      if (minuteur) clearTimeout(minuteur);
      flux?.fermer();
      setConnecte(false);
    };
  }, [cle]);

  return connecte;
}
