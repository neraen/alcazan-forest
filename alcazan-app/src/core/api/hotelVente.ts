import http from '../http';
import type { TypeItem } from './boutique';

/**
 * Port de `services/HotelVenteApi.js` — marché ASYNCHRONE entre joueurs.
 *
 * Le client n'envoie que des identifiants, une quantité et un prix. Les frais de dépôt,
 * la disponibilité d'un lot et le montant réellement débité sont arbitrés par le serveur :
 * ce que renvoie `catalogue()` n'autorise rien, et `curseurs` ne sert qu'à afficher.
 *
 * `acheter` peut répondre 409 (`code: "hotel_vente_indisponible"`) quand le lot vient de
 * partir ou que son prix a changé — ce n'est pas une erreur du joueur, son écran était
 * périmé.
 */
export type CurseursHotel = {
  tauxFrais: number;
  fraisMinimum: number;
  dureeHeures: number;
  annoncesMax: number;
  prixMin: number;
  prixMax: number;
  tris: Record<string, string>;
};

export type Annonce = {
  id: number;
  item: {
    type: TypeItem;
    nom: string;
    description?: string | null;
    image?: string | null;
    position?: string | null;
    rarete?: string | null;
  };
  vendeur?: { pseudo: string };
  quantite: number;
  prix: number;
  prixUnitaire: number;
  fraisDepot?: number;
  expiresAt?: string | null;
  estMien?: boolean;
  statut?: string;
  statutLabel?: string;
};

export type Catalogue = {
  annonces: Annonce[];
  total: number;
  page: number;
  pages: number;
  curseurs: CurseursHotel;
  money: number;
};

export type MesVentes = {
  actives: Annonce[];
  historique: Annonce[];
  emplacementsUtilises: number;
  curseurs: CurseursHotel;
  money: number;
};

export const catalogue = ({
  type = null,
  recherche = '',
  tri = null,
  page = 1,
}: {
  type?: TypeItem | null;
  recherche?: string;
  tri?: string | null;
  page?: number;
} = {}) =>
  http.post<Catalogue>('hotel/catalogue', { type, recherche, tri, page }).then((r) => r.data);

export const mesVentes = () => http.post<MesVentes>('hotel/mes-ventes', {}).then((r) => r.data);

/** Prélève les frais de dépôt et sort l'objet du sac, en une fois. */
export const vendre = (type: TypeItem, itemId: number, quantite: number, prix: number) =>
  http.post('hotel/vendre', { type, itemId, quantite, prix }).then((r) => r.data);

/** `prixAttendu` = le prix affiché ; un écart vaut 409 plutôt qu'un achat surprise. */
export const acheter = (annonceId: number, prixAttendu: number) =>
  http.post('hotel/acheter', { annonceId, prixAttendu }).then((r) => r.data);

/** ⚠️ Rend l'objet mais les frais de dépôt restent perdus. Confirmer avant d'appeler. */
export const retirer = (annonceId: number) =>
  http.post('hotel/retirer', { annonceId }).then((r) => r.data);
