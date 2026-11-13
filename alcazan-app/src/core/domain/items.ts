import { iconeConsommable, iconeEquipement, imageObjet } from '../media';

/**
 * Normalisation des objets d'inventaire — port de
 * `components/inventory/screen/itemUtils.js`.
 *
 * Le serveur renvoie trois familles aux clés différentes (`idEquipement`/`idConsommable`/
 * `idObjet`, `nomEquipement`/…) : on les ramène à UNE forme, consommée par l'inventaire,
 * la vente au marchand et le détail d'objet.
 */

export type CategorieItem = 'equipement' | 'consommable' | 'objet';

export type ItemNormalise = {
  key: string;
  cat: CategorieItem;
  id: number;
  name: string;
  img: string;
  qty: number;
  desc?: string;
  value?: number;
  rarity: string;
  levelMin?: number;
  caracteristiques: { nom?: string; valeur?: number; [k: string]: unknown }[];
  position?: string;
  equipped: boolean;
  raw: Record<string, any>;
};

export const LIBELLE_RARETE: Record<string, string> = {
  commun: 'Commun',
  'peu-commun': 'Peu commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
  heroique: 'Héroïque',
};

export const LIBELLE_CATEGORIE: Record<CategorieItem, string> = {
  equipement: 'Équipement',
  consommable: 'Consommable',
  objet: 'Objet',
};

/** Position d'équipement → libellé court. L'ordre est celui du paperdoll du web. */
export const EMPLACEMENTS_EQUIPEMENT = [
  { position: 'tete', label: 'Tête' },
  { position: 'cou', label: 'Cou' },
  { position: 'corps', label: 'Corps' },
  { position: 'jambes', label: 'Jambes' },
  { position: 'bras-gauche', label: 'Bras G.' },
  { position: 'bras-droit', label: 'Bras D.' },
  { position: 'pieds', label: 'Pieds' },
] as const;

export function normaliserEquipement(e: any, equipped = false): ItemNormalise {
  return {
    key: (equipped ? 'worn-' : 'eq-') + e.idEquipement,
    cat: 'equipement',
    id: e.idEquipement,
    name: e.nomEquipement,
    img: iconeEquipement(e.imageEquipement ?? e.icone, e.position),
    qty: e.quantity || 1,
    desc: e.descriptionEquipement,
    value: e.prixReventeEquipement,
    rarity: e.rarityName || 'commun',
    levelMin: e.levelMinEquipement,
    caracteristiques: e.caracteristiques || [],
    position: e.position,
    equipped,
    raw: e,
  };
}

export function normaliserConsommable(c: any): ItemNormalise {
  return {
    key: 'co-' + c.idConsommable,
    cat: 'consommable',
    id: c.idConsommable,
    name: c.nomConsommable,
    img: iconeConsommable(c.imageConsommable ?? c.icone),
    qty: c.quantity || 1,
    desc: c.descriptionConsommable,
    value: c.prixReventeConsommable,
    rarity: c.rarityName || 'commun',
    caracteristiques: [],
    equipped: false,
    raw: c,
  };
}

export function normaliserObjet(o: any): ItemNormalise {
  return {
    key: 'ob-' + o.idObjet,
    cat: 'objet',
    id: o.idObjet,
    name: o.nomObjet,
    img: imageObjet(o.imageObjet ?? o.image),
    qty: o.quantity || 1,
    desc: o.descriptionObjet,
    value: o.prixReventeObjet,
    rarity: o.rarityName || 'commun',
    caracteristiques: [],
    equipped: false,
    raw: o,
  };
}

export function normaliserInventaire(inventaire: {
  equipements?: any[];
  consommables?: any[];
  objets?: any[];
}): ItemNormalise[] {
  return [
    ...(inventaire.equipements ?? []).map((e) => normaliserEquipement(e)),
    ...(inventaire.consommables ?? []).map(normaliserConsommable),
    ...(inventaire.objets ?? []).map(normaliserObjet),
  ];
}
