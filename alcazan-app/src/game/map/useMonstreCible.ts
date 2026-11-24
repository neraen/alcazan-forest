import {useEffect} from 'react';
import store from '@/src/core/store';
import {getTargetInfos} from '@/src/core/api/target';
import {fetchTargetSuccess} from '@/src/core/store/actions';

// Même suivi que MonstreCible sur le web : la case reste suivie à population zéro.
export function useMonstreCible(id: number | null | undefined, position: string) {
  useEffect(() => {
    if (!id) return;
    let actif = true;
    let enCours = false;
    let arrivee = true;
    const actualiser = async () => {
      const avant = store.getState().data.target;
      if (enCours || (!arrivee && avant.type && avant.type !== 'none' && avant.type !== 'monstre')) return;
      arrivee = false;
      enCours = true;
      try {
        const data = await getTargetInfos(id, 'monstre');
        if (actif && store.getState().data.target === avant) {
          store.dispatch(fetchTargetSuccess({...data, targetId: id, type: 'monstre'}));
        }
      } catch (_) {
        // Conserver l'état connu en cas de panne réseau, puis réessayer.
      } finally {
        enCours = false;
      }
    };
    actualiser();
    const timer = setInterval(actualiser, 5000);
    return () => { actif = false; clearInterval(timer); };
  }, [id, position]);
}
