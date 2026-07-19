import React from "react";

/**
 * MainGamePage — Écran principal du jeu "Alcazan Forest" (MMORPG médiéval).
 *
 * Design de référence recréé depuis une maquette HTML (version "Cadre structuré").
 * Composant autonome, sans dépendance externe (styles inline).
 *
 * Intégration :
 *   - Remplacer les valeurs codées en dur par des props (voir `defaultData`).
 *   - Les assets (`/assets/*.png`) doivent être servis depuis le dossier public
 *     ou importés via le bundler. Ajuste `assetBase` selon ton setup.
 *   - Les polices Cinzel + Nunito Sans doivent être chargées globalement
 *     (Google Fonts ou self-hosted). Voir README.
 *
 * @param {object}   props
 * @param {string}   [props.assetBase="/assets"]   Préfixe des chemins d'images.
 * @param {object}   [props.player]                Données joueur (voir defaultData.player).
 * @param {object}   [props.resources]             Or / PA / PM (voir defaultData.resources).
 * @param {object}   [props.experience]            { current, max }.
 * @param {string[]} [props.spells]                4 slots de sorts (chemins d'icônes).
 * @param {object}   [props.potions]               { health, mana } chemins d'icônes.
 * @param {string[]} [props.miniSpells]            3 icônes de la grille compacte.
 * @param {string}   [props.zoneName="Tutoriel boisé"]
 * @param {string}   [props.mapImage]              Chemin de l'image de carte.
 * @param {string}   [props.activeNav="Carte"]     Onglet de nav actif.
 * @param {(item:string)=>void} [props.onNavClick]
 * @param {(index:number)=>void} [props.onRailClick]
 * @param {(index:number)=>void} [props.onSpellClick]
 * @param {()=>void}            [props.onLogout]
 */

// ---- Palette (design tokens) --------------------------------------------
const C = {
  bgTop: "#06303b",
  bgBottom: "#041e26",
  panel: "rgba(8,40,50,0.85)",
  panelSolid: "#08222a",
  header: "rgba(4,26,33,0.6)",
  actionBar: "rgba(4,26,33,0.95)",
  gold: "#e3b64f",
  goldHover: "#f2d488",
  goldSoft: "rgba(227,182,79,0.3)",
  goldSofter: "rgba(227,182,79,0.12)",
  ink: "#05242c",
  text: "#eef6f6",
  textDim: "#b7d2d6",
  textMute: "#9fc3c9",
  textFaint: "#7fa8ae",
  track: "rgba(255,255,255,0.08)",
  hp1: "#a91f1c",
  hp2: "#e04a39",
  hpLabel: "#ef7b6d",
  mp1: "#1d5fa8",
  mp2: "#3f8fdd",
  mpLabel: "#6fb4f0",
  xp1: "#b8892e",
  xp2: "#e3b64f",
  paLabel: "#f0a95c",
  divider: "rgba(227,182,79,0.25)",
  slotDash: "rgba(159,195,201,0.3)",
};
const FONT_TITLE = "'Cinzel', serif";
const FONT_BODY = "'Nunito Sans', sans-serif";

// ---- Données de démonstration -------------------------------------------
export const defaultData = {
  zoneName: "Tutoriel boisé",
  player: {
    name: "neraën",
    title: "Aventurière",
    level: 20,
    health: { current: 300, max: 780 },
    mana: { current: 250, max: 250 },
    avatar: "avatar.png",
  },
  experience: { current: 9430, max: 12081 },
  resources: { gold: 6573, pa: 600, pm: -5277 },
  navItems: ["Carte", "Profil", "Inventaire", "Administration"],
  railItems: [
    { label: "Carte", icon: "icon-carte.png" },
    { label: "Inventaire", icon: "icon-inventaire.png" },
    { label: "Profil", icon: "icon-profil.png" },
    { label: "Guilde", icon: "icon-guilde.png" },
    { label: "Journal", icon: "icon-journal.png" },
    { label: "Classement", icon: "icon-classement.png" },
  ],
  spells: ["spell1.png", "spell2.png", "spell3.png", "spell4.png"],
  emptySpellSlots: 4,
  potions: { health: "potion-red.png", mana: "potion-blue.png" },
  miniSpells: ["spell1.png", "spell2.png", "spell4.png"],
  mapImage: "map.png",
  currencyIcons: { gold: "cur-or.png", pa: "cur-pa.png", pm: "cur-pm.png" },
};

// ---- Sous-composants -----------------------------------------------------
function Bar({ pct, from, to, radius = 6, height = 12 }) {
  return (
    <div style={{ position: "relative", height, borderRadius: radius, background: C.track, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})`, borderRadius: radius }} />
    </div>
  );
}

function Slot({ src, alt, size = 54, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, borderRadius: 10, overflow: "hidden",
        border: `1px solid ${hover ? C.gold : "rgba(227,182,79,0.45)"}`,
        background: C.panelSolid, transition: "all .15s",
        transform: hover ? "translateY(-2px)" : "none",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

function EmptySlot({ size = 54 }) {
  return <div style={{ width: size, height: size, borderRadius: 10, border: `1px dashed ${C.slotDash}`, background: "rgba(255,255,255,0.03)" }} />;
}

function Divider() {
  return <div style={{ width: 1, alignSelf: "stretch", background: C.divider }} />;
}

// ---- Composant principal -------------------------------------------------
export default function MainGamePage({
  assetBase = "/assets",
  player = defaultData.player,
  resources = defaultData.resources,
  experience = defaultData.experience,
  navItems = defaultData.navItems,
  railItems = defaultData.railItems,
  spells = defaultData.spells,
  emptySpellSlots = defaultData.emptySpellSlots,
  potions = defaultData.potions,
  miniSpells = defaultData.miniSpells,
  currencyIcons = defaultData.currencyIcons,
  zoneName = defaultData.zoneName,
  mapImage = defaultData.mapImage,
  activeNav = "Carte",
  onNavClick,
  onRailClick,
  onSpellClick,
  onLogout,
} = {}) {
  const asset = (p) => `${assetBase}/${p}`;
  const hpPct = Math.round((player.health.current / player.health.max) * 100);
  const mpPct = Math.round((player.mana.current / player.mana.max) * 100);
  const xpPct = Math.round((experience.current / experience.max) * 100);
  const usedSpells = spells.filter(Boolean);
  const emptyCount = Math.max(0, emptySpellSlots - (spells.length - usedSpells.length ? 0 : 0));

  return (
    <div
      style={{
        width: 1920, height: 1080, position: "relative", overflow: "hidden",
        borderRadius: 14, display: "flex", flexDirection: "column",
        fontFamily: FONT_BODY,
        background: `linear-gradient(160deg, ${C.bgTop}, ${C.bgBottom} 70%)`,
        boxShadow: "0 20px 60px rgba(0,0,0,.5)",
      }}
    >
      {/* ===== Header ===== */}
      <header style={{ height: 72, flexShrink: 0, display: "flex", alignItems: "center", gap: 32, padding: "0 28px", borderBottom: `1px solid ${C.goldSoft}`, background: C.header }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={asset("logo.png")} alt="Logo Alcazan Forest" style={{ width: 46, height: 46, borderRadius: 12, border: "1px solid rgba(227,182,79,0.5)", objectFit: "cover" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 22, color: C.gold, letterSpacing: ".04em", lineHeight: 1.1 }}>Alcazan Forest</div>
            <div style={{ color: C.textFaint, fontSize: 11.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>MMORPG médiéval</div>
          </div>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 20, padding: 5, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(227,182,79,0.2)" }}>
          {navItems.map((item) => {
            const active = item === activeNav;
            return (
              <button
                key={item}
                onClick={() => onNavClick?.(item)}
                style={{
                  border: "none", cursor: "pointer", font: "inherit",
                  color: active ? C.ink : C.textDim, background: active ? C.gold : "transparent",
                  fontWeight: active ? 800 : 700, fontSize: 14, padding: "8px 18px", borderRadius: 8,
                }}
              >
                {item}
              </button>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          style={{ marginLeft: "auto", cursor: "pointer", color: C.gold, background: "transparent", fontWeight: 800, fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(227,182,79,0.55)" }}
        >
          Déconnexion
        </button>
      </header>

      {/* ===== Corps ===== */}
      <div style={{ flex: 1, display: "flex", gap: 20, padding: 20, minHeight: 0 }}>
        {/* --- Colonne gauche --- */}
        <aside style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Fiche joueur */}
          <div style={{ borderRadius: 16, background: C.panel, border: `1px solid ${C.goldSoft}`, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 18, color: C.gold, letterSpacing: ".05em", textTransform: "uppercase" }}>{zoneName}</div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: C.textFaint, textTransform: "uppercase" }}>Zone</div>
            </div>
            <div style={{ height: 1, background: "linear-gradient(90deg, rgba(227,182,79,0.5), transparent)" }} />
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img src={asset(player.avatar)} alt={`Avatar de ${player.name}`} style={{ width: 92, height: 92, borderRadius: "50%", border: `2px solid ${C.gold}`, objectFit: "cover", boxShadow: "0 6px 18px rgba(0,0,0,.5)" }} />
                <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", padding: "2px 10px", borderRadius: 10, background: "#0a3540", border: `1.5px solid ${C.gold}`, fontWeight: 800, fontSize: 12, color: "#cbe64f" }}>Niv. {player.level}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontWeight: 800, fontSize: 22, color: C.text }}>{player.name}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textMute }}>{player.title}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800 }}>
                  <span style={{ color: C.hpLabel, letterSpacing: ".08em" }}>SANTÉ</span>
                  <span style={{ color: C.textDim }}>{player.health.current} / {player.health.max}</span>
                </div>
                <Bar pct={hpPct} from={C.hp1} to={C.hp2} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800 }}>
                  <span style={{ color: C.mpLabel, letterSpacing: ".08em" }}>MANA</span>
                  <span style={{ color: C.textDim }}>{player.mana.current} / {player.mana.max}</span>
                </div>
                <Bar pct={mpPct} from={C.mp1} to={C.mp2} />
              </div>
            </div>
          </div>

          {/* Navigation icônes */}
          <nav style={{ borderRadius: 16, background: C.panel, border: `1px solid ${C.goldSoft}`, padding: 10, display: "flex", flexDirection: "column", gap: 2 }}>
            {railItems.map((it, i) => (
              <RailItem key={it.label} item={it} icon={asset(it.icon)} onClick={() => onRailClick?.(i)} />
            ))}
          </nav>

          {/* Ressources */}
          <div style={{ borderRadius: 16, background: C.panel, border: `1px solid ${C.goldSoft}`, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <Resource icon={asset(currencyIcons.gold)} label={`${resources.gold} Or`} color={C.gold} radius="50%" />
            <Resource icon={asset(currencyIcons.pa)} label={`${resources.pa} PA`} color={C.paLabel} radius={5} />
            <Resource icon={asset(currencyIcons.pm)} label={`${resources.pm} PM`} color={C.mpLabel} radius={5} />
          </div>
        </aside>

        {/* --- Carte + barre d'action --- */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 16, border: `1px solid ${C.goldSoft}`, overflow: "hidden", background: C.panelSolid, minWidth: 0 }}>
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <img src={asset(mapImage)} alt={`Carte du ${zoneName}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div style={{ flexShrink: 0, borderTop: `1px solid ${C.goldSoft}`, background: C.actionBar, padding: "12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* XP */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 13, color: C.gold, letterSpacing: ".1em" }}>XP</span>
              <div style={{ flex: 1 }}><Bar pct={xpPct} from={C.xp1} to={C.xp2} /></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#eaf4f4" }}>{experience.current} / {experience.max}</span>
            </div>
            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", gap: 7 }}>
                {usedSpells.map((s, i) => (
                  <Slot key={i} src={asset(s)} alt={`Sort ${i + 1}`} onClick={() => onSpellClick?.(i)} />
                ))}
                {Array.from({ length: emptyCount }).map((_, i) => <EmptySlot key={i} />)}
              </div>
              <Divider />
              <div style={{ display: "flex", gap: 7 }}>
                <Slot src={asset(potions.health)} alt="Potion de vie" />
                <Slot src={asset(potions.mana)} alt="Potion de mana" />
              </div>
              <Divider />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 25px)", gridAutoRows: "25px", gap: 4 }}>
                {miniSpells.map((m, i) => (
                  <div key={i} style={{ borderRadius: 6, border: "1px solid rgba(227,182,79,0.4)", overflow: "hidden" }}>
                    <img src={asset(m)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 6 - miniSpells.length) }).map((_, i) => (
                  <div key={`e${i}`} style={{ borderRadius: 6, border: `1px dashed ${C.slotDash}` }} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function RailItem({ item, icon, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: "none", font: "inherit", cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 14, padding: "8px 12px", borderRadius: 10,
        background: hover ? C.goldSofter : "transparent",
      }}
    >
      <img src={icon} alt="" style={{ width: 42, height: 42, borderRadius: "50%", filter: "drop-shadow(0 3px 6px rgba(0,0,0,.5))" }} />
      <span style={{ fontWeight: 800, fontSize: 15, color: C.textDim, letterSpacing: ".03em" }}>{item.label}</span>
      <span style={{ marginLeft: "auto", color: "rgba(227,182,79,0.6)", fontSize: 16 }}>›</span>
    </button>
  );
}

function Resource({ icon, label, color, radius }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img src={icon} alt="" style={{ width: 24, height: 24, borderRadius: radius }} />
      <span style={{ fontWeight: 800, fontSize: 15, color }}>{label}</span>
    </div>
  );
}
