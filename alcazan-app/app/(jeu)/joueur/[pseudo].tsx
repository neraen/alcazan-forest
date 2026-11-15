import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import * as echangeApi from '@/src/core/api/echange';
import * as profilApi from '@/src/core/api/profil';
import * as usersApi from '@/src/core/api/users';
import {
  LIBELLE_CARACTERISTIQUE,
  type NomCaracteristique,
} from '@/src/core/domain/caracteristiques';
import { computeDistance } from '@/src/core/domain/distance';
import {
  EMPLACEMENTS_EQUIPEMENT,
  normaliserEquipement,
  type ItemNormalise,
} from '@/src/core/domain/items';
import { messageErreur } from '@/src/core/http';
import { mediaUrl } from '@/src/core/media';
import { useAppDispatch, useAppSelector } from '@/src/core/store';
import { updateEchange } from '@/src/core/store/actions';
import GameButton from '@/src/ui/GameButton';
import ModalShell from '@/src/ui/ModalShell';
import Slot from '@/src/ui/Slot';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, couleurRarete, fonts, radius, spacing } from '@/src/ui/tokens';
import { Chargement, Vide } from '@/src/ui/Vide';

type Profil = {
  pseudo: string;
  idJoueur: number;
  nomAlignement?: string | null;
  nomGuilde?: string | null;
  nomClasse?: string | null;
  niveau?: number | null;
};

const majuscule = (texte?: string | null) =>
  texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : '';

/**
 * Fiche PUBLIQUE d'un autre joueur — port de `components/profilJoueur/ProfilJoueur.jsx`,
 * ouverte en touchant le portrait de la cible (le web y arrive par le lien `/profil/…`
 * de `Target.jsx`).
 *
 * Deux colonnes : à gauche qui il est et ce qu'on peut lui proposer, à droite ce qu'il
 * porte, avec le détail de la pièce touchée. Tout est en LECTURE SEULE — c'est
 * l'équipement d'autrui.
 *
 * C'est aussi la porte d'entrée de l'échange : le web le propose par un clic droit sur le
 * personnage (`PlayerContextMenu`), geste qui n'existe pas au doigt. Amis et messagerie
 * ne sont pas portés (ils ne le sont nulle part dans l'app).
 */
export default function ProfilJoueurScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { pseudo } = useLocalSearchParams<{ pseudo: string }>();

  const monId = useAppSelector((s) => s.data.joueurState.idJoueur);
  const target = useAppSelector((s) => s.data.target);
  const positionJoueur = useAppSelector((s) => s.data.positionJoueur);
  const echange = useAppSelector((s) => s.data.echange.etat);

  const [profil, setProfil] = useState<Profil | null>(null);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [introuvable, setIntrouvable] = useState(false);
  const [selection, setSelection] = useState<ItemNormalise | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const fiche: Profil = await usersApi.findUserByPseudo(String(pseudo));
        if (annule) return;
        if (!fiche?.idJoueur) {
          setIntrouvable(true);
          return;
        }
        setProfil(fiche);
        const portes = await profilApi.getEquipementEquipeJoueur(fiche.idJoueur);
        if (!annule) setEquipes(Array.isArray(portes) ? portes : []);
      } catch {
        if (!annule) setIntrouvable(true);
      }
    })();
    return () => {
      annule = true;
    };
  }, [pseudo]);

  const parPosition = useMemo(() => {
    const index: Record<string, ItemNormalise> = {};
    equipes
      .map((e) => normaliserEquipement(e, true))
      .forEach((item) => {
        if (item.position) index[item.position] = item;
      });
    return index;
  }, [equipes]);

  // Trop loin ? Confort d'affichage UNIQUEMENT, et seulement quand on sait où il est (la
  // fiche vient d'être ouverte depuis la cible). Le serveur revérifie l'adjacence.
  const estMaCible = target.type === 'player' && target.targetId === profil?.idJoueur;
  const tropLoin =
    estMaCible &&
    computeDistance(
      target.abscisseTarget ?? 0,
      target.ordonneeTarget ?? 0,
      positionJoueur.abscisse,
      positionJoueur.ordonnee,
    ) > 1;
  const dejaEnEchange = !!echange && (echange.statut === 'ouvert' || echange.statut === 'en_attente');
  const cEstMoi = !!profil && profil.idJoueur === monId;

  const proposerEchange = async () => {
    if (!profil || envoi) return;
    setEnvoi(true);
    try {
      const reponse = await echangeApi.create(profil.idJoueur);
      dispatch(updateEchange(reponse.echange));
      toast.success(`Invitation d'échange envoyée à ${profil.pseudo}.`);
      // Retour à la carte : c'est là que le bandeau « En attente de … » se voit.
      router.back();
    } catch (erreur) {
      toast.error(messageErreur(erreur, "L'invitation n'a pas pu être envoyée."));
    } finally {
      setEnvoi(false);
    }
  };

  if (introuvable) {
    return (
      <ModalShell title={String(pseudo ?? 'Joueur')} onClose={() => router.back()}>
        <Vide>Ce joueur est introuvable.</Vide>
      </ModalShell>
    );
  }

  if (!profil) {
    return (
      <ModalShell title={String(pseudo ?? 'Joueur')} onClose={() => router.back()}>
        <Chargement />
      </ModalShell>
    );
  }

  return (
    <ModalShell
      iconSrc={mediaUrl('/img/icons/people.png')}
      title={profil.pseudo}
      subtitle={[majuscule(profil.nomClasse), profil.niveau ? `niveau ${profil.niveau}` : '']
        .filter(Boolean)
        .join(' · ')}
      onClose={() => router.back()}>
      <View style={styles.corps}>
        {/* Qui il est, ce qu'on peut lui proposer */}
        <View style={styles.rail}>
          <View style={styles.identite}>
            <Image
              source={{ uri: mediaUrl('/img/gui/CharacterEnemy/AvatarEnemy.png') }}
              style={styles.avatar}
              contentFit="contain"
            />
            <View style={styles.identiteTextes}>
              <Text style={styles.pseudo} numberOfLines={1}>
                {profil.pseudo}
              </Text>
              <Text style={styles.niveau}>Niveau {profil.niveau ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.fiche}>
            <Ligne label="Classe" valeur={majuscule(profil.nomClasse) || '—'} />
            <Ligne label="Guilde" valeur={profil.nomGuilde || 'Aucune'} />
            <Ligne label="Alignement" valeur={profil.nomAlignement || 'Aucun'} />
          </View>

          {!cEstMoi && (
            <View style={styles.actions}>
              <GameButton
                variant="solid"
                loading={envoi}
                disabled={tropLoin || dejaEnEchange}
                onPress={proposerEchange}>
                Proposer un échange
              </GameButton>
              {(tropLoin || dejaEnEchange) && (
                <Text style={styles.motif}>
                  {dejaEnEchange
                    ? 'Vous êtes déjà engagé dans un échange.'
                    : 'Approchez-vous : il faut être sur une case voisine.'}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Ce qu'il porte */}
        <View style={styles.equipement}>
          <Text style={styles.titre}>Équipement porté</Text>
          <ScrollView contentContainerStyle={styles.emplacements}>
            {EMPLACEMENTS_EQUIPEMENT.map((emplacement) => {
              const porte = parPosition[emplacement.position];
              const choisi = !!porte && selection?.key === porte.key;
              return (
                <Pressable
                  key={emplacement.position}
                  disabled={!porte}
                  onPress={() => setSelection(choisi ? null : porte)}
                  style={[styles.emplacement, choisi && styles.emplacementChoisi]}>
                  <Slot
                    src={porte?.img || undefined}
                    size="mini"
                    style={porte ? { borderColor: couleurRarete(porte.rarity) } : undefined}
                  />
                  <View style={styles.emplacementTextes}>
                    <Text style={styles.emplacementLabel}>{emplacement.label}</Text>
                    <Text
                      style={[
                        styles.emplacementNom,
                        { color: porte ? couleurRarete(porte.rarity) : colors.textDim3 },
                      ]}
                      numberOfLines={1}>
                      {porte?.name ?? '—'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Le détail de la pièce touchée — dans la colonne d'à côté, pas dans un pied. */}
        <View style={styles.detail}>
          {selection ? (
            <ScrollView contentContainerStyle={styles.detailContenu}>
              <View style={styles.detailEntete}>
                <Slot
                  src={selection.img || undefined}
                  style={{ borderColor: couleurRarete(selection.rarity) }}
                />
                <View style={styles.identiteTextes}>
                  <Text
                    style={[styles.detailNom, { color: couleurRarete(selection.rarity) }]}
                    numberOfLines={2}>
                    {selection.name}
                  </Text>
                  <Text style={styles.detailMeta}>
                    {majuscule(selection.rarity)}
                    {selection.levelMin ? ` · niveau ${selection.levelMin}` : ''}
                  </Text>
                </View>
              </View>
              {selection.caracteristiques
                .filter((c) => c.valeur)
                .map((c, i) => (
                  <Text key={`${c.nom}-${i}`} style={styles.carac}>
                    {LIBELLE_CARACTERISTIQUE[c.nom as NomCaracteristique] ?? majuscule(String(c.nom ?? ''))}{' '}
                    <Text style={styles.caracValeur}>
                      {(c.valeur ?? 0) > 0 ? '+' : ''}
                      {c.valeur}
                    </Text>
                  </Text>
                ))}
              {!!selection.desc && <Text style={styles.detailDesc}>{selection.desc}</Text>}
            </ScrollView>
          ) : (
            <Text style={styles.indice}>
              {equipes.length === 0
                ? `${profil.pseudo} ne porte aucun équipement.`
                : 'Touchez une pièce pour voir son détail.'}
            </Text>
          )}
        </View>
      </View>
    </ModalShell>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.ligneLabel}>{label}</Text>
      <Text style={styles.ligneValeur} numberOfLines={1}>
        {valeur}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  corps: { flex: 1, flexDirection: 'row' },

  rail: { width: 226, padding: spacing.md, gap: spacing.md },
  identite: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.pastilleBg,
  },
  identiteTextes: { flex: 1, gap: 2 },
  pseudo: { fontFamily: fonts.titleBold, fontSize: 15, color: colors.text, letterSpacing: 0.5 },
  niveau: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.level },
  fiche: {
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldCardBorder,
    backgroundColor: colors.rowBg,
    paddingHorizontal: spacing.md,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 30,
  },
  ligneLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ligneValeur: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textSoft,
  },
  actions: { gap: spacing.xs },
  motif: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint, textAlign: 'center' },

  equipement: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: colors.goldDivider,
  },
  titre: {
    fontFamily: fonts.title,
    fontSize: 12,
    color: colors.gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  emplacements: { gap: 2, paddingBottom: spacing.sm },
  emplacement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.tab,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emplacementChoisi: { borderColor: colors.goldBorder, backgroundColor: colors.goldSofter },
  emplacementTextes: { flex: 1 },
  emplacementLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emplacementNom: { fontFamily: fonts.bodyBold, fontSize: 12 },

  detail: {
    width: 236,
    borderLeftWidth: 1,
    borderLeftColor: colors.goldDivider,
    justifyContent: 'center',
  },
  detailContenu: { padding: spacing.md, gap: spacing.xs },
  detailEntete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  detailNom: { fontFamily: fonts.bodyBold, fontSize: 14 },
  detailMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  detailDesc: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textDim,
    fontStyle: 'italic',
  },
  carac: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft },
  caracValeur: { fontFamily: fonts.bodyBold, color: colors.bonus },
  indice: {
    padding: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
