import { useCallback, useEffect, useRef, useState } from 'react';

import * as usersApi from '@/src/core/api/users';
import { useAppSelector } from '@/src/core/store';

/**
 * Expérience courante et palier du niveau — logique reprise telle quelle de la barre
 * d'action (`UserInterface/spellBar` côté web), sortie dans un hook parce que la jauge
 * d'XP a quitté cette barre pour la fiche du joueur.
 *
 * À chaque montée de niveau on relit l'XP ET le palier : sans ça le dénominateur reste
 * figé sur l'ancien niveau (barre affichant le surplus, ex. 184000/12000).
 */
export function useExperience() {
  const niveau = useAppSelector((s) => s.data.joueurState.level);
  const nouvelleExperience = useAppSelector((s) => s.data.joueurState.newExperience);
  const [experience, setExperience] = useState({ experienceActuelle: 0, experienceMax: 0 });
  const niveauPrecedent = useRef(niveau);

  const charger = useCallback(async () => {
    try {
      setExperience(await usersApi.getExpJoueur());
    } catch {
      // Jauge cosmétique : un échec ne mérite ni toast ni écran bloqué, la prochaine
      // montée de niveau la relira.
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    if (niveauPrecedent.current !== niveau && (niveau ?? 0) > 0) charger();
    niveauPrecedent.current = niveau;
  }, [niveau, charger]);

  // `||` et non `!== 0` : une réponse d'attaque sans gain peut laisser `newExperience`
  // indéfini, et la jauge affichait alors « undefined / 10000 ».
  return {
    valeur: nouvelleExperience || experience.experienceActuelle,
    max: experience.experienceMax,
  };
}
