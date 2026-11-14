import http from '../http';
import type { TypeItem } from './boutique';

/**
 * Port de `services/CraftApi.js` — recettes accessibles, file de fabrication, retrait.
 *
 * Le client n'envoie que des identifiants et un mode. Métier, niveau, ingrédients
 * disponibles, plafond de commandes et fin de production sont tous arbitrés par le
 * serveur : `realisable` et `prete` n'autorisent rien.
 */
export type ProduitCraft = {
  type: TypeItem;
  itemId: number;
  nom: string;
  description?: string | null;
  image?: string | null;
  position?: string | null;
  quantite: number;
};

export type IngredientRecette = {
  type: TypeItem;
  itemId: number;
  nom: string;
  image?: string | null;
  position?: string | null;
  requis: number;
  disponible: number;
};

export type Recette = {
  id: number;
  nom: string;
  description?: string | null;
  metierId: number;
  metier: string;
  niveauRequis: number;
  niveauJoueur: number;
  difficulte: number;
  tempsSecondes: number;
  experienceMetier: number;
  produit?: ProduitCraft | null;
  ingredients: IngredientRecette[];
  realisable: boolean;
};

export type Commande = {
  id: number;
  recetteId: number;
  nom: string;
  mode: string;
  modeLabel: string;
  /** Dates ATOM du serveur : la durée se RECALCULE depuis elles, jamais décomptée ici. */
  lanceeAt: string;
  pretAt: string;
  prete: boolean;
  produit?: ProduitCraft | null;
};

export type ModeCraft = {
  value: string;
  label: string;
  description: string;
  temps: number;
  recycle: number;
  karma: number;
};

export type Atelier = {
  recettes: Recette[];
  commandes: Commande[];
  commandesMax: number;
  modes: ModeCraft[];
};

export type ReponseCraft = { commandes?: Commande[]; message?: string; messages?: string[] };

export const atelier = () => http.post<Atelier>('craft/atelier', {}).then((r) => r.data);
export const commandes = () =>
  http.post<{ commandes: Commande[] }>('craft/commandes', {}).then((r) => r.data);
export const lancer = (recetteId: number, mode: string) =>
  http.post<ReponseCraft>('craft/lancer', { recetteId, mode }).then((r) => r.data);
export const retirer = (commandeId: number) =>
  http.post<ReponseCraft>('craft/retirer', { commandeId }).then((r) => r.data);
/** ⚠️ Rend les ingrédients mais perd le temps écoulé. Confirmer avant d'appeler. */
export const annuler = (commandeId: number) =>
  http.post<ReponseCraft>('craft/annuler', { commandeId }).then((r) => r.data);
