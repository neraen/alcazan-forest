import React, { useMemo, useState } from "react";

/**
 * InventoryModal — modale d'inventaire Alcazan Forest
 * ---------------------------------------------------
 * Composant React autonome (aucune dépendance externe, styles inline).
 *
 * Intégration :
 *   import InventoryModal from "./InventoryModal";
 *   {open && (
 *     <InventoryModal
 *       character={character}
 *       items={items}
 *       equipment={equipment}
 *       stats={stats}
 *       currencies={currencies}
 *       assetBase="/assets"           // dossier où se trouvent les images (potions, avatar, monnaies…)
 *       onClose={() => setOpen(false)}
 *       onEquip={(item) => ...}
 *       onUse={(item) => ...}
 *       onSell={(item) => ...}
 *       onDrop={(item) => ...}
 *     />
 *   )}
 *
 * Toutes les props de données sont optionnelles : sans elles, des données de
 * démonstration sont affichées. Remplace `item.img` (fichier image, préfixé
 * par assetBase) ou `item.glyph` (icône vectorielle de secours) par tes propres
 * visuels.
 */

/* ------------------------------------------------------------------ */
/* Constantes de style                                                 */
/* ------------------------------------------------------------------ */

const RARITY = {
  common: "#8ba0a6",
  uncommon: "#5fbf6a",
  rare: "#3f8fdd",
  epic: "#b06be6",
  legendary: "#e3b64f",
};
const RARITY_LABEL = {
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
};
const TYPE_LABEL = {
  equipement: "Équipement",
  consommables: "Consommable",
  ressources: "Ressource",
  grimoires: "Grimoire",
};

/* ------------------------------------------------------------------ */
/* Icônes vectorielles                                                 */
/* ------------------------------------------------------------------ */

const GLYPHS = {
  infinity:
    '<path d="M6 8a4 4 0 100 8c3 0 5-8 8-8a4 4 0 110 8c-3 0-5-8-8-8z"/>',
  sword:
    '<path d="M14.5 4.5L20 4l-.5 5.5-8 8"/><path d="M4 20l3.5-3.5"/><path d="M6.5 13.5l4 4"/><path d="M4 17l3 3"/>',
  potion:
    '<path d="M9 3h6"/><path d="M10 3v4l-3.5 8A3.5 3.5 0 0010 20h4a3.5 3.5 0 003.5-5L14 7V3"/><path d="M7.5 14h9"/>',
  material:
    '<path d="M4 8a2.5 4 0 004 0 2.5 4 0 00-4 0z"/><path d="M6 4h9a4 4 0 010 8H6"/><path d="M6 12h9a4 4 0 010 8H6"/>',
  book:
    '<path d="M6 4h9a3 3 0 013 3v13H8a2 2 0 01-2-2z"/><path d="M6 4a2 2 0 00-2 2 2 2 0 002 2"/><path d="M10 9h5M10 13h5"/>',
  bow: '<path d="M5 3c8 3 8 15 0 18"/><path d="M5 3l15 9-15 9"/><path d="M11 12h9"/>',
  ring: '<circle cx="12" cy="15" r="5.5"/><path d="M9 8.5L12 3l3 5.5"/>',
  amulet:
    '<path d="M7 3l5 5 5-5"/><circle cx="12" cy="15" r="4.5"/><path d="M12 12.5v5M9.5 15h5"/>',
  helmet:
    '<path d="M4 15a8 8 0 0116 0v2a1 1 0 01-1 1H5a1 1 0 01-1-1z"/><path d="M12 7v11"/><path d="M8 18l1-3M16 18l-1-3"/>',
  chest: '<path d="M6 4l6 2.5L18 4l1.5 6-3.5 2v7H8v-7l-3.5-2z"/>',
  legs: '<path d="M7 3h10l-.5 8-2 10h-3.5L11 13l-.5 8H7L5 11z"/>',
  boots: '<path d="M7 3h4v9l6.5 4.5V20H7z"/><path d="M7 16h10"/>',
  gloves:
    '<path d="M8 21v-8M8 13a2 2 0 014 0M12 13v-4a2 2 0 014 0v6l3 2v2H8"/>',
  cape: '<path d="M8 3l4 4 4-4 2.5 18h-13z"/><path d="M12 7v13"/>',
  shield:
    '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  belt: '<rect x="3" y="9" width="18" height="6" rx="1.5"/><rect x="9.5" y="9" width="5" height="6" rx="1"/>',
  scroll:
    '<path d="M6 5a2 2 0 012-2h9v14a2 2 0 002 2H8a2 2 0 01-2-2z"/><path d="M17 3a2 2 0 012 2v0a2 2 0 01-2 2"/><path d="M9 8h5M9 12h5"/>',
  gem: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l-3 6 6 12 6-12-3-6"/>',
  food: '<path d="M3 15l13-8 5 3.5V15z"/><circle cx="8" cy="13" r="1"/><circle cx="14" cy="13.5" r="1"/>',
  feather:
    '<path d="M20 4c-9 1-13 7-14 14"/><path d="M6 18C4 12 8 6 20 4c0 6-3 12-9 14z"/><path d="M11 13l4-4"/>',
  snail:
    '<circle cx="14" cy="14" r="5.5"/><path d="M14 14a2 2 0 112.5-2"/><path d="M8.5 19.5H4M4 12l3-2M5 10l1-3"/>',
  heart: '<path d="M12 20C7 16 3 12 3 8a4 4 0 018-1 4 4 0 018 1c0 4-4 8-9 12z"/>',
  speed: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  target:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  strength: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  wisdom:
    '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>',
  luck:
    '<path d="M12 12c-1.2-3-5-3.6-6-.8s2 4.6 6 .8zM12 12c1.2-3 5-3.6 6-.8s-2 4.6-6 .8zM12 12c-3-1.2-3.6-5-.8-6s4.6 2 .8 6zM12 12c-3 1.2-3.6 5-.8 6s4.6-2 .8-6zM12 13.5V20"/>',
};

function Glyph({ name, color, size = "58%" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: size, height: size }}
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] || GLYPHS.material }}
    />
  );
}

function ItemIcon({ item, color, size = "80%", assetBase }) {
  if (item && item.img) {
    return (
      <img
        src={`${assetBase}/${item.img}`}
        alt={item.name}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,.35))",
        }}
      />
    );
  }
  return <Glyph name={item ? item.glyph : "material"} color={color} size={size} />;
}

/* ------------------------------------------------------------------ */
/* Données de démonstration                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_CHARACTER = {
  name: "neraën",
  level: 20,
  cls: "Aventurière",
  avatar: "avatar.png",
};

const DEFAULT_CURRENCIES = [
  { icon: "cur-or.png", value: "6 573", color: "#e3b64f" },
  { icon: "cur-pa.png", value: "600", color: "#f0a95c" },
  { icon: "cur-pm.png", value: "-5 277", color: "#6fb4f0" },
];

const DEFAULT_ITEMS = [
  { id: 1, name: "Arc court en bois", cat: "equipement", rarity: "uncommon", qty: 1, glyph: "bow", value: 12, desc: "Un arc léger, idéal pour débuter la chasse." },
  { id: 2, name: "Potion de vie", cat: "consommables", rarity: "common", qty: 826, img: "potion-red.png", value: 5, desc: "Restaure 50 points de vie." },
  { id: 3, name: "Potion de mana", cat: "consommables", rarity: "rare", qty: 1, img: "potion-blue.png", value: 8, desc: "Restaure 40 points de mana." },
  { id: 4, name: "Plume de corbeau", cat: "ressources", rarity: "common", qty: 28, glyph: "feather", value: 1, desc: "Composant d'alchimie courant." },
  { id: 5, name: "Coquille d'escargot", cat: "ressources", rarity: "common", qty: 13, glyph: "snail", value: 1, desc: "Ingrédient de potion." },
  { id: 6, name: "Gerbe de blé", cat: "ressources", rarity: "common", qty: 24, glyph: "feather", value: 1, desc: "Récolte des champs voisins." },
  { id: 7, name: "Chapeau de champignon bleu", cat: "equipement", rarity: "epic", qty: 91, glyph: "helmet", value: 8, desc: "Chapi chapo… augmente l'intelligence de 4 points." },
  { id: 8, name: "Fromage affiné", cat: "consommables", rarity: "common", qty: 12, glyph: "food", value: 2, desc: "Redonne un peu d'énergie." },
  { id: 9, name: "Amulette de feu", cat: "equipement", rarity: "rare", qty: 1, glyph: "amulet", value: 45, desc: "Confère une résistance au feu de 15%." },
  { id: 10, name: "Tunique du garde", cat: "equipement", rarity: "uncommon", qty: 1, glyph: "chest", value: 30, desc: "Armure de tissu renforcé de cuir." },
  { id: 11, name: "Anneau d'argent", cat: "equipement", rarity: "uncommon", qty: 1, glyph: "ring", value: 22, desc: "+2 en agilité lorsqu'il est porté." },
  { id: 12, name: "Bottes de cuir", cat: "equipement", rarity: "common", qty: 1, glyph: "boots", value: 10, desc: "Chaussures robustes de voyageur." },
  { id: 13, name: "Pantalon de lin", cat: "equipement", rarity: "common", qty: 1, glyph: "legs", value: 9, desc: "Léger et confortable." },
  { id: 14, name: "Grimoire de foudre", cat: "grimoires", rarity: "rare", qty: 1, img: "spell2.png", value: 60, desc: "Apprend le sort Éclair." },
  { id: 15, name: "Grimoire de soin", cat: "grimoires", rarity: "uncommon", qty: 1, img: "spell3.png", value: 40, desc: "Apprend le sort Régénération." },
  { id: 16, name: "Grimoire de flèche", cat: "grimoires", rarity: "common", qty: 1, img: "spell1.png", value: 20, desc: "Apprend le sort Tir précis." },
  { id: 17, name: "Grimoire d'arc long", cat: "grimoires", rarity: "epic", qty: 1, img: "spell4.png", value: 90, desc: "Apprend une salve dévastatrice." },
  { id: 18, name: "Minerai de fer", cat: "ressources", rarity: "common", qty: 42, glyph: "gem", value: 3, desc: "Métal brut à forger." },
  { id: 19, name: "Bûche de chêne", cat: "ressources", rarity: "common", qty: 60, glyph: "material", value: 2, desc: "Bois de construction." },
  { id: 20, name: "Gemme brute", cat: "ressources", rarity: "rare", qty: 3, glyph: "gem", value: 25, desc: "Pierre précieuse à tailler." },
  { id: 21, name: "Dague rouillée", cat: "equipement", rarity: "common", qty: 1, glyph: "sword", value: 4, desc: "Une lame usée mais fonctionnelle." },
  { id: 22, name: "Bouclier de bois", cat: "equipement", rarity: "common", qty: 1, glyph: "shield", value: 8, desc: "Protection de base contre les coups." },
  { id: 23, name: "Gants de toile", cat: "equipement", rarity: "common", qty: 1, glyph: "gloves", value: 6, desc: "Gants souples de tous les jours." },
  { id: 24, name: "Cape voyageuse", cat: "equipement", rarity: "uncommon", qty: 1, glyph: "cape", value: 18, desc: "Protège du froid et du vent." },
  { id: 25, name: "Ceinture cloutée", cat: "equipement", rarity: "common", qty: 1, glyph: "belt", value: 7, desc: "Ceinture de cuir renforcée." },
  { id: 26, name: "Potion d'endurance", cat: "consommables", rarity: "uncommon", qty: 6, glyph: "potion", value: 12, desc: "Augmente l'endurance pendant 5 min." },
  { id: 27, name: "Pain de campagne", cat: "consommables", rarity: "common", qty: 9, glyph: "food", value: 1, desc: "Restaure lentement les points de vie." },
  { id: 28, name: "Parchemin vierge", cat: "ressources", rarity: "common", qty: 15, glyph: "scroll", value: 2, desc: "Support d'écriture pour les scribes." },
];

// Emplacements d'équipement : `itemId` référence un objet de la liste (ou null si vide).
const DEFAULT_EQUIPMENT = {
  left: [
    { label: "Tête", slot: "head", itemId: 7, empty: "helmet" },
    { label: "Amulette", slot: "amulet", itemId: 9, empty: "amulet" },
    { label: "Torse", slot: "chest", itemId: 10, empty: "chest" },
    { label: "Cape", slot: "cape", itemId: null, empty: "cape" },
    { label: "Mains", slot: "hands", itemId: null, empty: "gloves" },
  ],
  right: [
    { label: "Arme", slot: "weapon", itemId: 1, empty: "sword" },
    { label: "Bouclier", slot: "offhand", itemId: null, empty: "shield" },
    { label: "Anneau", slot: "ring", itemId: 11, empty: "ring" },
    { label: "Ceinture", slot: "belt", itemId: null, empty: "belt" },
    { label: "Bottes", slot: "feet", itemId: 12, empty: "boots" },
  ],
};

// Les 6 caractéristiques.
const DEFAULT_STATS = [
  { label: "Constitution", value: "18", glyph: "heart", color: "#e04a39" },
  { label: "Force", value: "22", glyph: "strength", color: "#e3b64f" },
  { label: "Dextérité", value: "31", glyph: "speed", color: "#cbe64f" },
  { label: "Intelligence", value: "27", glyph: "book", color: "#6fb4f0" },
  { label: "Sagesse", value: "19", glyph: "wisdom", color: "#b06be6" },
  { label: "Chance", value: "12", glyph: "luck", color: "#5fbf6a" },
];

const TABS = [
  { id: "tous", label: "Tout", glyph: "infinity" },
  { id: "equipement", label: "Équip.", glyph: "sword" },
  { id: "consommables", label: "Conso.", glyph: "potion" },
  { id: "ressources", label: "Ressources", glyph: "material" },
  { id: "grimoires", label: "Grimoires", glyph: "book" },
];

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

export default function InventoryModal({
  character = DEFAULT_CHARACTER,
  items = DEFAULT_ITEMS,
  equipment = DEFAULT_EQUIPMENT,
  stats = DEFAULT_STATS,
  currencies = DEFAULT_CURRENCIES,
  capacity = { used: 42, total: 60 },
  assetBase = "/assets",
  showBackdrop = true,
  showSearch = true,
  showStats = true,
  backdropImage = "map.png",
  onClose = () => {},
  onEquip = () => {},
  onUse = () => {},
  onSell = () => {},
  onDrop = () => {},
}) {
  const [tab, setTab] = useState("tous");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(items[6]?.id ?? items[0]?.id);

  const byId = (id) => items.find((x) => x.id === id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tab === "tous" ? items : items.filter((x) => x.cat === tab);
    if (q) list = list.filter((x) => x.name.toLowerCase().includes(q));
    return list;
  }, [items, tab, query]);

  const selected = byId(selectedId) || items[0];
  const primaryLabel =
    selected.cat === "consommables"
      ? "Utiliser"
      : selected.cat === "equipement"
      ? "Équiper"
      : "Vendre";
  const onPrimary = () => {
    if (selected.cat === "consommables") onUse(selected);
    else if (selected.cat === "equipement") onEquip(selected);
    else onSell(selected);
  };

  const slotBtn = (def, key) => {
    const it = def.itemId != null ? byId(def.itemId) : null;
    const sel = it && it.id === selectedId;
    return (
      <button
        key={key}
        onClick={it ? () => setSelectedId(it.id) : undefined}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#e3b64f")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = sel
            ? "#e3b64f"
            : it
            ? RARITY[it.rarity]
            : "rgba(159,195,201,.28)")
        }
        style={{
          position: "relative",
          width: 70,
          height: 70,
          borderRadius: 12,
          cursor: it ? "pointer" : "default",
          background: it ? "rgba(243,232,204,.95)" : "rgba(255,255,255,.03)",
          border: `2px solid ${
            sel ? "#e3b64f" : it ? RARITY[it.rarity] : "rgba(159,195,201,.28)"
          }`,
          boxShadow: sel ? "0 0 0 3px rgba(227,182,79,.5)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color .15s",
        }}
      >
        {it ? (
          <ItemIcon item={it} color={RARITY[it.rarity]} size="68%" assetBase={assetBase} />
        ) : (
          <Glyph name={def.empty} color="rgba(159,195,201,.32)" size="50%" />
        )}
        <span
          style={{
            position: "absolute",
            bottom: -7,
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            padding: "1px 7px",
            borderRadius: 7,
            background: "#0a2c36",
            border: "1px solid rgba(227,182,79,.3)",
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: ".04em",
            textTransform: "uppercase",
            color: "#9fc3c9",
          }}
        >
          {def.label}
        </span>
      </button>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Nunito Sans', system-ui, sans-serif",
      }}
    >
      {/* Fond */}
      {showBackdrop && (
        <img
          src={`${assetBase}/${backdropImage}`}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(6px) saturate(.85) brightness(.55)",
          }}
        />
      )}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 90% at 50% 45%, rgba(4,20,26,.72), rgba(4,20,26,.94))",
        }}
      />

      {/* Modale */}
      <div
        style={{
          position: "relative",
          width: 1460,
          maxWidth: "96vw",
          height: 916,
          maxHeight: "96vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          overflow: "hidden",
          background: "linear-gradient(165deg, #0a2c36, #06232b 62%)",
          border: "1px solid rgba(227,182,79,.45)",
          boxShadow:
            "0 40px 120px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)",
        }}
      >
        {/* Header */}
        <header
          style={{
            flexShrink: 0,
            height: 74,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "0 24px",
            background:
              "linear-gradient(180deg, rgba(4,26,33,.9), rgba(4,26,33,.4))",
            borderBottom: "1px solid rgba(227,182,79,.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "1px solid rgba(227,182,79,.5)",
                background: "rgba(227,182,79,.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Glyph name="material" color="#e3b64f" size="24px" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: 27,
                  color: "#e3b64f",
                  letterSpacing: ".04em",
                }}
              >
                Inventaire
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#7fa8ae",
                }}
              >
                {capacity.used} / {capacity.total} emplacements
              </div>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {currencies.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(227,182,79,.22)",
                }}
              >
                <img
                  src={`${assetBase}/${c.icon}`}
                  alt=""
                  style={{ width: 22, height: 22, objectFit: "contain" }}
                />
                <span style={{ fontWeight: 800, fontSize: 15, color: c.color }}>
                  {c.value}
                </span>
              </div>
            ))}
            <button
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(224,74,57,.25)";
                e.currentTarget.style.borderColor = "#e04a39";
                e.currentTarget.style.color = "#ffd9d2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.04)";
                e.currentTarget.style.borderColor = "rgba(227,182,79,.35)";
                e.currentTarget.style.color = "#cfe3e5";
              }}
              style={{
                marginLeft: 6,
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "1px solid rgba(227,182,79,.35)",
                background: "rgba(255,255,255,.04)",
                color: "#cfe3e5",
                fontSize: 20,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all .15s",
              }}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Corps */}
        <div style={{ flex: 1, display: "flex", gap: 20, padding: 20, minHeight: 0 }}>
          {/* Gauche : sac */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Onglets */}
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: 6,
                borderRadius: 14,
                background: "rgba(4,26,33,.6)",
                border: "1px solid rgba(227,182,79,.22)",
              }}
            >
              {TABS.map((t) => {
                const active = tab === t.id;
                const count =
                  t.id === "tous"
                    ? items.length
                    : items.filter((x) => x.cat === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    onMouseEnter={(e) =>
                      !active && (e.currentTarget.style.background = "rgba(227,182,79,.12)")
                    }
                    onMouseLeave={(e) =>
                      !active && (e.currentTarget.style.background = "transparent")
                    }
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      padding: "10px 4px 8px",
                      borderRadius: 10,
                      border: `1px solid ${active ? "#e3b64f" : "transparent"}`,
                      background: active ? "#e3b64f" : "transparent",
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    <span style={{ display: "flex", color: active ? "#06232b" : "#cfe3e5" }}>
                      <Glyph name={t.glyph} color={active ? "#06232b" : "#cfe3e5"} size="22px" />
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: ".04em",
                        textTransform: "uppercase",
                        color: active ? "#06232b" : "#cfe3e5",
                      }}
                    >
                      {t.label}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#6f959b" }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Recherche */}
            {showSearch && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 14px",
                  height: 44,
                  borderRadius: 11,
                  background: "rgba(4,26,33,.55)",
                  border: "1px solid rgba(227,182,79,.22)",
                }}
              >
                <Glyph name="target" color="#6f959b" size="20px" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un objet…"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#eef6f6",
                    fontFamily: "inherit",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                />
              </div>
            )}

            {/* Grille */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 4, borderRadius: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {filtered.map((it) => {
                  const sel = it.id === selectedId;
                  return (
                    <button
                      key={it.id}
                      onClick={() => setSelectedId(it.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = sel
                          ? "0 0 0 3px rgba(227,182,79,.55), 0 8px 22px rgba(0,0,0,.45)"
                          : "0 3px 8px rgba(0,0,0,.28)";
                      }}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        borderRadius: 12,
                        padding: 0,
                        cursor: "pointer",
                        background: "linear-gradient(160deg, #f3e8cc, #e6d3a8)",
                        border: `2.5px solid ${sel ? "#e3b64f" : RARITY[it.rarity]}`,
                        boxShadow: sel
                          ? "0 0 0 3px rgba(227,182,79,.55), 0 8px 22px rgba(0,0,0,.45)"
                          : "0 3px 8px rgba(0,0,0,.28)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform .12s, box-shadow .12s",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 4,
                          left: 4,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: RARITY[it.rarity],
                        }}
                      />
                      <ItemIcon item={it} color={RARITY[it.rarity]} size="72%" assetBase={assetBase} />
                      {it.qty > 1 && (
                        <span
                          style={{
                            position: "absolute",
                            right: 4,
                            bottom: 4,
                            minWidth: 20,
                            padding: "1px 6px",
                            borderRadius: 8,
                            background: "rgba(6,26,33,.92)",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 800,
                            textAlign: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,.4)",
                          }}
                        >
                          {it.qty}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Droite : personnage */}
          <div
            style={{
              width: 588,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              borderRadius: 16,
              background: "rgba(4,26,33,.5)",
              border: "1px solid rgba(227,182,79,.25)",
              padding: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 6, height: 20, borderRadius: 3, background: "#e3b64f" }} />
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#e3b64f",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                Équipement
              </div>
              <div style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#9fc3c9" }}>
                {character.name} · Niv. {character.level}
              </div>
            </div>

            {/* Paperdoll */}
            <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 70px", gap: 12, alignItems: "stretch" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {equipment.left.map((d, i) => slotBtn(d, "l" + i))}
              </div>

              {/* Portrait */}
              <div
                style={{
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  background:
                    "radial-gradient(ellipse 80% 70% at 50% 38%, #12414d, #061c22 78%)",
                  border: "1px solid rgba(227,182,79,.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: "22px 0 14px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 50% 30%, rgba(227,182,79,.14), transparent 55%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "44%",
                    background: "linear-gradient(180deg, transparent, rgba(6,28,34,.9))",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: 176,
                    height: 176,
                    borderRadius: "50%",
                    padding: 4,
                    background: "conic-gradient(from 210deg, #e3b64f, #8a6a22, #e3b64f)",
                    boxShadow: "0 10px 30px rgba(0,0,0,.5)",
                  }}
                >
                  <img
                    src={`${assetBase}/${character.avatar}`}
                    alt={`Portrait de ${character.name}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                      display: "block",
                      border: "3px solid #061c22",
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "relative",
                    marginTop: 14,
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "#eef6f6",
                  }}
                >
                  {character.name}
                </div>
                <div
                  style={{
                    position: "relative",
                    marginTop: 2,
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "#e3b64f",
                  }}
                >
                  {character.cls}
                </div>
                <div
                  style={{
                    position: "relative",
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "4px 14px",
                    borderRadius: 20,
                    background: "rgba(6,28,34,.8)",
                    border: "1px solid rgba(227,182,79,.4)",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "#7fa8ae" }}>
                    NIVEAU
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#cbe64f" }}>
                    {character.level}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {equipment.right.map((d, i) => slotBtn(d, "r" + i))}
              </div>
            </div>

            {/* Caractéristiques */}
            {showStats && (
              <div
                style={{
                  marginTop: "auto",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(227,182,79,.2)",
                }}
              >
                {stats.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      padding: "8px 4px",
                      borderRadius: 11,
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(227,182,79,.16)",
                    }}
                  >
                    <span style={{ display: "flex", color: s.color }}>
                      <Glyph name={s.glyph} color={s.color} size="22px" />
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#eef6f6" }}>
                      {s.value}
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: ".05em",
                        textTransform: "uppercase",
                        color: "#7fa8ae",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Barre de détail */}
        <footer
          style={{
            flexShrink: 0,
            minHeight: 128,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "18px 24px",
            background: "linear-gradient(0deg, rgba(4,26,33,.9), rgba(4,26,33,.35))",
            borderTop: "1px solid rgba(227,182,79,.35)",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 92,
              height: 92,
              borderRadius: 14,
              background: "linear-gradient(160deg, #f3e8cc, #e6d3a8)",
              border: `3px solid ${RARITY[selected.rarity]}`,
              boxShadow: "0 6px 18px rgba(0,0,0,.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ItemIcon item={selected} color={RARITY[selected.rarity]} size="78%" assetBase={assetBase} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "#eef6f6" }}>
                {selected.name}
              </div>
              <span
                style={{
                  padding: "3px 11px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,.05)",
                  border: `1px solid ${RARITY[selected.rarity]}`,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: RARITY[selected.rarity],
                }}
              >
                {RARITY_LABEL[selected.rarity]}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "#7fa8ae",
                }}
              >
                {TYPE_LABEL[selected.cat]}
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#c4dbde", fontStyle: "italic", maxWidth: 720 }}>
              {selected.desc}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <img src={`${assetBase}/cur-or.png`} alt="Or" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#e3b64f" }}>
                {selected.value} Pièces d'or
              </span>
            </div>
          </div>
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={onPrimary}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f2d488")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#e3b64f")}
              style={{
                minWidth: 168,
                padding: "12px 24px",
                borderRadius: 11,
                border: "none",
                cursor: "pointer",
                background: "#e3b64f",
                color: "#06232b",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: ".04em",
                transition: "background .15s",
              }}
            >
              {primaryLabel}
            </button>
            <button
              onClick={() => onDrop(selected)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(224,74,57,.18)";
                e.currentTarget.style.color = "#ffb3a8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#e78a7d";
              }}
              style={{
                minWidth: 168,
                padding: "10px 24px",
                borderRadius: 11,
                border: "1px solid rgba(224,74,57,.5)",
                cursor: "pointer",
                background: "transparent",
                color: "#e78a7d",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                transition: "all .15s",
              }}
            >
              Jeter
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
