import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as donjonApi from '@/src/core/api/donjon';
import * as usersApi from '@/src/core/api/users';
import { computeDistance } from '@/src/core/domain/distance';
import { messageErreur } from '@/src/core/http';
import { iconeSort } from '@/src/core/media';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import {
  fetchTargetInfo,
  removePlayerTarget,
  updateJoueurState,
} from '@/src/core/store/actions';
import type { Sort } from '@/src/core/types';
import Slot from '@/src/ui/Slot';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts } from '@/src/ui/tokens';

/**
 * Un sort de la barre d'action — port de `components/spells/spell/Spell.jsx`.
 *
 * ⚠️ Les trois endpoints d'attaque (+ celui des renforts) partagent UN CONTRAT DE RÉPONSE
 * (doc §21.13 bis) : `damage, experience, newExperience, level, lifeJoueur, damageReturns,
 * droppedItems, killMessage, message, pa, needRefresh`. Les accès défensifs ci-dessous
 * (`?.[0] ?? ''`) ne sont pas de la coquetterie : côté web, un accès direct sur une
 * réponse de duel — qui n'a pas de butin — levait un TypeError qui empêchait TOUTE la
 * mise à jour d'état, donc plus de ciblage ni de survols jusqu'au rechargement.
 *
 * `killMessage` est ce qui fait DÉCIBLER après une mise à mort.
 *
 * Le COOLDOWN ne s'applique qu'aux sorts lancés sur soi et contre un autre joueur —
 * jamais contre un monstre, un boss ou un renfort (voir `frapper`).
 */
export default function SpellSlotButton({
  spell,
  tousDesactives,
  setTousDesactives,
}: {
  spell: Sort;
  tousDesactives: boolean;
  setTousDesactives: (v: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const target = useAppSelector((s) => s.data.target);
  const positionJoueur = useAppSelector((s) => s.data.positionJoueur);

  const [restant, setRestant] = useState(0); // ms de cooldown restants
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enVol = useRef(false);

  useEffect(() => () => clearInterval(intervalRef.current ?? undefined), []);

  // Hors de portée : confort d'affichage UNIQUEMENT. Le serveur revérifie la portée, les
  // PA, la carte, le feu ami et la réapparition — un refus revient en 400.
  const horsDePortee = (() => {
    if (target.type !== 'player') return false;
    if (spell.portee === 0) return false;
    const distance = computeDistance(
      target.abscisseTarget ?? 0,
      target.ordonneeTarget ?? 0,
      positionJoueur.abscisse,
      positionJoueur.ordonnee,
    );
    return spell.portee < distance;
  })();

  const enCooldown = restant > 0;
  const desactive = horsDePortee || tousDesactives || enCooldown;

  const lancerCooldown = () => {
    const duree = (spell.cooldown ?? 0) * 1000;
    if (duree <= 0) return;
    setTousDesactives(true);
    setRestant(duree);
    const fin = Date.now() + duree;
    clearInterval(intervalRef.current ?? undefined);
    // 10 Hz et non 60 : la seule information utile est le chiffre au dixième, et un
    // setState à 60 Hz sur huit sorts ferait ramer la carte.
    intervalRef.current = setInterval(() => {
      const reste = fin - Date.now();
      if (reste <= 0) {
        clearInterval(intervalRef.current ?? undefined);
        setRestant(0);
        setTousDesactives(false);
      } else {
        setRestant(reste);
      }
    }, 100);
  };

  const lancerSortSurSoi = async () => {
    let resultat;
    try {
      resultat = await usersApi.applySpellAutoFocused(spell.id);
    } catch (erreur) {
      // Les trois branches d'attaque avaient leur catch, pas celle-ci : un soin refusé
      // (mana, PA) partait en rejet non géré, sans un mot pour le joueur.
      toast.error(messageErreur(erreur, 'Impossible de lancer ce sort.'));
      return;
    }
    dispatch(
      updateJoueurState({
        message: resultat.message ?? '',
        lifeJoueur: resultat.life,
        needRefresh: true,
      }),
    );
    if (resultat.message) toast.info(resultat.message);
  };

  const lancerAttaque = async () => {
    let resultat;

    if (target.type === 'player') {
      try {
        resultat = await usersApi.applyAttaqueToPlayer(target.targetId!, spell.id);
      } catch (erreur) {
        toast.error(messageErreur(erreur, 'Impossible de viser ce joueur.'));
        return;
      }
    } else if (target.type === 'monstre') {
      if (spell.type === 'soin') return;
      try {
        resultat = await usersApi.applyAttaqueToMonster(target.targetId!, spell.id);
      } catch (erreur) {
        toast.error(messageErreur(erreur, 'Impossible de frapper cette cible.'));
        return;
      }
    } else if (target.type === 'boss') {
      try {
        resultat = await usersApi.applyAttaqueToBoss(target.targetId!, spell.id);
      } catch (erreur) {
        toast.error(messageErreur(erreur, 'Impossible de frapper ce boss.'));
        return;
      }
    } else if (target.type === 'renfort') {
      // Monstre d'instance : endpoint dédié, mais réponse de MÊME forme qu'un monstre
      // ordinaire. Son absence de cette liste rendait les monstres de salle
      // inattaquables EN SILENCE côté web.
      if (spell.type === 'soin') return;
      try {
        resultat = await donjonApi.attaquerRenfort(target.targetId!, spell.id);
      } catch (erreur) {
        toast.error(messageErreur(erreur, 'Impossible de frapper cette cible.'));
        return;
      }
    } else {
      return;
    }

    if (target.targetId && target.type) {
      dispatch(fetchTargetInfo(target.targetId, target.type));
    }

    dispatch(
      updateJoueurState({
        experience: resultat.experience,
        damage: resultat.damage,
        newExperience: resultat.newExperience,
        lifeJoueur: resultat.lifeJoueur,
        damageReturns: resultat.damageReturns,
        droppedItems: resultat.droppedItems?.[0] ?? '',
        level: resultat.level,
        killMessage: resultat.killMessage ?? '',
        message: resultat.message ?? '',
        pa: resultat.pa,
        // Le serveur a pu DÉPLACER le joueur pendant l'échange (mort → cimetière) : sans
        // reprendre sa carte, le rechargement redemanderait l'ancienne.
        ...(resultat.mapId !== undefined ? { mapId: resultat.mapId } : {}),
        needRefresh: true,
      }),
    );

    if (resultat.message) toast.info(resultat.message);
    if (resultat.killMessage) {
      toast.success(resultat.killMessage);
      dispatch(removePlayerTarget());
    }
  };

  const frapper = async () => {
    if (desactive || enVol.current) return;
    enVol.current = true;
    try {
      if (spell.portee === 0) {
        lancerCooldown();
        await lancerSortSurSoi();
        return;
      }
      if (!target.type || target.type === 'none') {
        toast.info("Vous n'avez pas de cible.");
        return;
      }
      // Le cooldown est une notion de PvP : il ne part que contre un JOUEUR (et sur soi,
      // plus haut). Contre un monstre, un boss ou un renfort on enchaîne librement, comme
      // sur le web (`Spell.handleAttack` n'appelle `activateSkill` que pour `player`) —
      // ce sont les PA qui bornent le rythme, et `enVol` empêche deux envois simultanés.
      if (target.type === 'player') lancerCooldown();
      await lancerAttaque();
    } finally {
      enVol.current = false;
    }
  };

  return (
    <Slot src={iconeSort(spell.icone)} onPress={frapper} disabled={desactive}>
      {enCooldown && (
        <View style={styles.voile}>
          <Text style={styles.compte}>{(restant / 1000).toFixed(1)}</Text>
        </View>
      )}
      {horsDePortee && !enCooldown && <View style={styles.horsPortee} />}
    </Slot>
  );
}

const styles = StyleSheet.create({
  /** Le web dessine un `conic-gradient` qui se vide ; en RN on garde l'information utile
      (le chiffre) sur un voile sombre — un arc SVG animé coûterait huit vues animées
      au-dessus de la carte pour le même service. */
  voile: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compte: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  horsPortee: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(224, 74, 57, 0.35)',
  },
});
