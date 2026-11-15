import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import * as echangeApi from '@/src/core/api/echange';
import type { Echange, LigneEchange, OffreEchange } from '@/src/core/api/echange';
import * as inventaireApi from '@/src/core/api/inventaire';
import { normaliserInventaire, type ItemNormalise } from '@/src/core/domain/items';
import { secondesRestantes, useHorloge } from '@/src/core/domain/temps';
import { mediaUrl } from '@/src/core/media';
import { useAppSelector } from '@/src/core/store';
import { useEchange } from '@/src/game/echange/useEchange';
import { confirmer } from '@/src/ui/confirmer';
import GameButton from '@/src/ui/GameButton';
import ModalShell from '@/src/ui/ModalShell';
import Slot from '@/src/ui/Slot';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, couleurRarete, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement } from '@/src/ui/Vide';
import Vignette from '@/src/ui/Vignette';

const deux = (n: number) => String(n).padStart(2, '0');

/**
 * La fenêtre d'échange — port d'`echange/EchangeModal.jsx`, REDESSINÉE pour le paysage.
 *
 * Le web empile « mon offre / son offre » au-dessus du sac ; sur ~260 pt de haut utile ça
 * ne tient pas. Ici trois colonnes côte à côte, lues de gauche à droite dans l'ordre du
 * geste : MON SAC (je touche) → MON OFFRE (ce que ça donne) → SON OFFRE (ce que je reçois).
 * Le champ d'or est EN HAUT de sa colonne : le clavier couvre la moitié basse de l'écran.
 *
 * Interface PESSIMISTE, comme le web : chaque geste envoie une intention avec
 * `expectedVersion`, et rien ne bouge à l'écran avant l'état renvoyé (REST ou Mercure).
 *  - toucher un objet du sac  → UN exemplaire de plus ; appui long → toute la pile ;
 *  - « − » sur une ligne      → un de moins ; ✕ → retirer la ligne ;
 *  - l'or se valide à « OK » du clavier ou en quittant le champ.
 *
 * ✕ de l'en-tête REPLIE l'écran sans annuler (le bandeau de la carte propose de
 * reprendre) : sur le web la croix annule, mais ici elle est sous le pouce et un échange
 * annulé par mégarde oblige les deux joueurs à tout refaire. Annuler est un bouton à part,
 * derrière une confirmation.
 */
export default function EchangeScreen() {
  const router = useRouter();
  const toast = useToast();
  const monId = useAppSelector((s) => s.data.joueurState.idJoueur);
  const monOr = useAppSelector((s) => s.data.joueurState.money);
  const etatVivant = useAppSelector((s) => s.data.echange.etat);
  const { executer, enCours, resynchroniser } = useEchange();

  // Le dernier état OUVERT connu reste affiché pendant l'animation de fermeture : sans
  // lui l'écran se viderait une demi-seconde avant de disparaître.
  const dernier = useRef<Echange | null>(null);
  const ouvert = etatVivant?.statut === 'ouvert';
  if (ouvert) dernier.current = etatVivant;
  const etat = dernier.current;

  const [inventaire, setInventaire] = useState<any>(null);
  // null = le champ suit l'état serveur ; chaîne = saisie en cours.
  const [orSaisi, setOrSaisi] = useState<string | null>(null);
  const [noteReset, setNoteReset] = useState(false);
  const etatPrecedent = useRef<Echange | null>(etat);

  useEffect(() => {
    inventaireApi
      .getPlayerInventaire()
      .then(setInventaire)
      .catch(() => toast.error('Impossible de charger votre inventaire.'));
  }, [toast]);

  // Plus de session ouverte (conclue, annulée, expirée, ou écran ouvert à tort) : on sort.
  // C'est `EchangeHost` qui a dit pourquoi, par un message.
  useEffect(() => {
    if (ouvert) return;
    if (router.canGoBack()) router.back();
    else router.replace('/(jeu)/carte' as never);
  }, [ouvert, router]);

  // « Confirmations réinitialisées » quand une modification les a annulées.
  useEffect(() => {
    const precedent = etatPrecedent.current;
    etatPrecedent.current = etat;
    if (!etat || !precedent) return undefined;
    const etaitConfirme = precedent.joueurUn.confirme || precedent.joueurDeux.confirme;
    const plusConfirme = !etat.joueurUn.confirme && !etat.joueurDeux.confirme;
    if (etat.version !== precedent.version && etaitConfirme && plusConfirme) {
      setNoteReset(true);
      const minuteur = setTimeout(() => setNoteReset(false), 4000);
      return () => clearTimeout(minuteur);
    }
    return undefined;
  }, [etat]);

  // L'échéance appartient au serveur : on l'AFFICHE, recalculée depuis `expiresAt`. À
  // zéro on redemande l'état (l'expiration est paresseuse côté serveur) — une seule fois.
  useHorloge(ouvert);
  const restant = secondesRestantes(etat?.expiresAt);
  const expirationDemandee = useRef<number | null>(null);
  useEffect(() => {
    if (!ouvert || !etat || restant > 0 || expirationDemandee.current === etat.id) return;
    expirationDemandee.current = etat.id;
    resynchroniser();
  }, [ouvert, etat, restant, resynchroniser]);

  const itemsSac = useMemo(
    () => (inventaire ? normaliserInventaire(inventaire) : []),
    [inventaire],
  );

  if (!etat) return <ModalShell title="Échange" />;

  const mienne = etat.joueurUn.joueur.id === monId ? etat.joueurUn : etat.joueurDeux;
  const sienne = etat.joueurUn.joueur.id === monId ? etat.joueurDeux : etat.joueurUn;
  const version = etat.version;

  const proposeDe = (item: ItemNormalise) =>
    mienne.lignes.find((l) => l.type === item.cat && l.itemId === item.id)?.quantite ?? 0;

  const proposer = (item: ItemNormalise, quantite: number) => {
    if (proposeDe(item) >= item.qty) {
      toast.info('Vous avez déjà proposé tous vos exemplaires.');
      return;
    }
    executer(() => echangeApi.addItem(item.cat, item.id, Math.min(quantite, item.qty), version));
  };

  const retirerUn = (ligne: LigneEchange) =>
    executer(() =>
      ligne.quantite <= 1
        ? echangeApi.removeItem(ligne.ligneId, version)
        : echangeApi.addItem(ligne.type, ligne.itemId, ligne.quantite - 1, version),
    );

  const validerOr = () => {
    if (orSaisi === null) return;
    const montant = Math.max(0, Math.floor(Number(orSaisi)) || 0);
    setOrSaisi(null);
    if (montant !== mienne.or) executer(() => echangeApi.updateOr(montant, version));
  };

  const annuler = () =>
    confirmer(
      "Annuler l'échange ?",
      `Rien ne sera échangé avec ${sienne.joueur.pseudo}, et chacun garde ses objets.`,
      () => executer(() => echangeApi.cancel()),
      { libelle: "Annuler l'échange", destructif: true },
    );

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/gui/Money03.png')}
      title={`Échange avec ${sienne.joueur.pseudo}`}
      subtitle="Touchez un objet du sac pour le proposer · appui long : toute la pile"
      headerRight={
        <View style={[styles.echeance, restant <= 30 && styles.echeanceUrgente]}>
          <Text style={[styles.echeanceLabel, restant <= 30 && styles.echeanceLabelUrgent]}>
            {Math.floor(restant / 60)}:{deux(restant % 60)}
          </Text>
        </View>
      }
      onClose={() => router.back()}
      footer={
        <View style={styles.pied}>
          <Text style={[styles.note, noteReset && styles.noteReset]} numberOfLines={2}>
            {noteReset
              ? "L'offre a été modifiée : les confirmations ont été réinitialisées."
              : 'Les deux joueurs doivent confirmer pour conclure l’échange.'}
          </Text>
          <GameButton variant="danger" style={styles.boutonPied} onPress={annuler}>
            Annuler l’échange
          </GameButton>
          <GameButton
            variant="solid"
            style={styles.boutonPied}
            disabled={mienne.confirme || enCours}
            onPress={() => executer(() => echangeApi.confirm(version))}>
            {mienne.confirme ? '✓ Confirmé' : 'Confirmer'}
          </GameButton>
        </View>
      }>
      <View style={styles.corps}>
        {/* 1 — Mon sac */}
        <View style={styles.sac}>
          <Text style={styles.titre}>Votre sac</Text>
          {inventaire === null ? (
            <Chargement />
          ) : (
            <ScrollView contentContainerStyle={styles.grille} keyboardShouldPersistTaps="handled">
              {itemsSac.length === 0 && <Text style={styles.vide}>Votre sac est vide.</Text>}
              {itemsSac.map((item) => {
                const propose = proposeDe(item);
                const reste = item.qty - propose;
                return (
                  <Slot
                    key={item.key}
                    src={item.img || undefined}
                    selected={propose > 0}
                    onPress={() => proposer(item, propose + 1)}
                    onLongPress={() => proposer(item, item.qty)}
                    style={{
                      borderColor: couleurRarete(item.rarity),
                      ...(reste <= 0 ? styles.epuise : null),
                    }}>
                    {propose > 0 && (
                      <View style={styles.pastillePropose}>
                        <Text style={styles.pastilleProposeLabel}>{propose}</Text>
                      </View>
                    )}
                    {item.qty > 1 && (
                      <View style={styles.quantite}>
                        <Text style={styles.quantiteLabel}>{reste}</Text>
                      </View>
                    )}
                  </Slot>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 2 — Mon offre */}
        <View style={[styles.offre, styles.offreMienne]}>
          <EnteteOffre titre="Votre offre" confirme={mienne.confirme} />
          <View style={styles.ligneOr}>
            <Text style={styles.orLabel}>Or</Text>
            <TextInput
              value={orSaisi ?? String(mienne.or)}
              onChangeText={(texte) => setOrSaisi(texte.replace(/[^0-9]/g, ''))}
              onSubmitEditing={validerOr}
              onBlur={validerOr}
              editable={!enCours}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              selectTextOnFocus
              maxLength={9}
              style={styles.orChamp}
            />
            <Text style={styles.orMax} numberOfLines={1}>
              / {monOr ?? 0}
            </Text>
          </View>
          <Lignes
            offre={mienne}
            actions={(ligne) => (
              <>
                <BoutonLigne
                  label="−"
                  accessibilite="Un de moins"
                  disabled={enCours}
                  onPress={() => retirerUn(ligne)}
                />
                <BoutonLigne
                  label="✕"
                  accessibilite="Retirer"
                  disabled={enCours}
                  onPress={() => executer(() => echangeApi.removeItem(ligne.ligneId, version))}
                />
              </>
            )}
          />
        </View>

        {/* 3 — Son offre */}
        <View style={styles.offre}>
          <EnteteOffre titre={`Offre de ${sienne.joueur.pseudo}`} confirme={sienne.confirme} />
          <View style={styles.ligneOr}>
            <Text style={styles.orLabel}>Or</Text>
            <Text style={styles.orRecu}>{sienne.or}</Text>
          </View>
          <Lignes offre={sienne} />
        </View>
      </View>
    </ModalShell>
  );
}

function EnteteOffre({ titre, confirme }: { titre: string; confirme: boolean }) {
  return (
    <View style={styles.entete}>
      <Text style={[styles.titre, styles.titreOffre]} numberOfLines={1}>
        {titre}
      </Text>
      <View style={[styles.badge, confirme && styles.badgeConfirme]}>
        <Text style={[styles.badgeLabel, confirme && styles.badgeLabelConfirme]}>
          {confirme ? '✓ Confirmé' : 'En attente'}
        </Text>
      </View>
    </View>
  );
}

function Lignes({
  offre,
  actions,
}: {
  offre: OffreEchange;
  actions?: (ligne: LigneEchange) => React.ReactNode;
}) {
  return (
    <ScrollView contentContainerStyle={styles.lignes} keyboardShouldPersistTaps="handled">
      {offre.lignes.length === 0 && <Text style={styles.vide}>Aucun objet proposé</Text>}
      {offre.lignes.map((ligne) => (
        <View key={ligne.ligneId} style={styles.ligne}>
          <Vignette
            src={ligne.icone ? mediaUrl(ligne.icone) : null}
            initiale={ligne.nom}
            taille="sm"
          />
          <Text style={styles.ligneNom} numberOfLines={1}>
            {ligne.nom}
          </Text>
          <Text style={styles.ligneQuantite}>×{ligne.quantite}</Text>
          {actions?.(ligne)}
        </View>
      ))}
    </ScrollView>
  );
}

function BoutonLigne({
  label,
  accessibilite,
  disabled,
  onPress,
}: {
  label: string;
  accessibilite: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilite}
      // Pas de grisé pendant l'envoi : chaque geste part en ~100 ms, toute la colonne
      // clignoterait. Le verrou de `executer` suffit à écarter le double appui.
      style={({ pressed }) => [styles.boutonLigne, pressed && styles.boutonLignePresse]}>
      <Text style={styles.boutonLigneLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },

  sac: { flex: 1, padding: spacing.md, gap: spacing.sm },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.sm },
  epuise: { opacity: 0.4 },
  quantite: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    backgroundColor: colors.qtyBadgeBg,
  },
  quantiteLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.text },
  pastillePropose: {
    position: 'absolute',
    left: 2,
    top: 2,
    minWidth: 16,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
  },
  pastilleProposeLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },

  offre: {
    width: 212,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: colors.goldDivider,
  },
  offreMienne: { width: 250 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titre: {
    fontFamily: fonts.title,
    fontSize: 12,
    color: colors.gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  titreOffre: { flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.badgeNeutralBg,
  },
  badgeConfirme: { borderColor: colors.successBorder, backgroundColor: colors.successBg },
  badgeLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.textFaint },
  badgeLabelConfirme: { color: colors.success },

  ligneOr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    backgroundColor: colors.panelInner,
  },
  orLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  orChamp: {
    flex: 1,
    minHeight: 36,
    paddingVertical: 0,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.gold,
  },
  orMax: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim3 },
  orRecu: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.gold },

  lignes: { gap: spacing.xs, paddingBottom: spacing.sm },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 4,
    borderRadius: radius.tab,
    backgroundColor: colors.rowBg,
  },
  ligneNom: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.text },
  ligneQuantite: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textDim },
  boutonLigne: {
    width: 30,
    height: 30,
    borderRadius: radius.tab,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonLignePresse: { backgroundColor: colors.goldBgHover },
  boutonLigneLabel: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 17, color: colors.gold },
  vide: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint },

  echeance: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
  },
  echeanceUrgente: { borderColor: colors.dangerBorder, backgroundColor: colors.dangerBgHover },
  echeanceLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textDim },
  echeanceLabelUrgent: { color: colors.dangerText },

  pied: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  note: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.textFaint },
  noteReset: { fontFamily: fonts.bodyBold, color: colors.paLabel },
  boutonPied: { minHeight: 40 },
});
