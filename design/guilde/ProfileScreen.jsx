import React, { useMemo, useState } from "react";

/**
 * ProfileScreen — écran de profil Alcazan Forest (caractéristiques + répartition de points)
 * -----------------------------------------------------------------------------------------
 * Composant React autonome (aucune dépendance externe, styles inline).
 *
 * Deux présentations via la prop `variant` :
 *   - "modal"      → modale centrée, carte floutée derrière (par défaut)
 *   - "fullscreen" → page profil intégrée à l'interface du jeu
 *
 * Intégration :
 *   import ProfileScreen from "./ProfileScreen";
 *   {open && (
 *     <ProfileScreen
 *       variant="modal"                 // "modal" | "fullscreen"
 *       assetBase="/assets"             // dossier public des images (avatar, logo, icône profil)
 *       character={character}
 *       info={info}                     // lignes du bloc "Informations"
 *       stats={stats}                   // 6 caractéristiques (base + équip)
 *       pointsPool={5}                  // points à répartir
 *       onClose={() => setOpen(false)}
 *       onValidate={(allocation, newStats) => save(allocation)}
 *     />
 *   )}
 *
 * Toutes les props de données sont optionnelles : sans elles, des données de
 * démonstration sont affichées.
 */

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */

const GOLD = "#e3b64f";
const INK = "#06232b";

/* ------------------------------------------------------------------ */
/* Icônes vectorielles                                                 */
/* ------------------------------------------------------------------ */

const GLYPHS = {
  heart: '<path d="M12 20C7 16 3 12 3 8a4 4 0 018-1 4 4 0 018 1c0 4-4 8-9 12z"/>',
  strength: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  target:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  wisdom:
    '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>',
  speed: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  luck:
    '<path d="M12 12c-1.2-3-5-3.6-6-.8s2 4.6 6 .8zM12 12c1.2-3 5-3.6 6-.8s-2 4.6-6 .8zM12 12c-3-1.2-3.6-5-.8-6s4.6 2 .8 6zM12 12c-3 1.2-3.6 5-.8 6s4.6-2 .8-6zM12 13.5V20"/>',
  book: '<path d="M6 4h9a3 3 0 013 3v13H8a2 2 0 01-2-2z"/><path d="M6 4a2 2 0 00-2 2 2 2 0 002 2"/><path d="M10 9h5M10 13h5"/>',
};

function Glyph({ name, color, size = "22px" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: size, height: size }}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] || GLYPHS.heart }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Données de démonstration                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_CHARACTER = {
  name: "neraën",
  level: 20,
  cls: "Archer",
  avatar: "avatar.png",
};

const DEFAULT_INFO = [
  { label: "Classe", value: "Archer" },
  { label: "Niveau", value: "20" },
  { label: "Guilde", value: "Aucune" },
  { label: "Alignement", value: "Aucun" },
];

// base = valeur du personnage ; equip = bonus d'équipement.
const DEFAULT_STATS = [
  { key: "constitution", label: "Constitution", base: 42, equip: 8, glyph: "heart", color: "#e04a39" },
  { key: "force", label: "Force", base: 28, equip: 5, glyph: "strength", color: "#e3b64f" },
  { key: "dexterite", label: "Dextérité", base: 55, equip: 3, glyph: "target", color: "#5fbf6a" },
  { key: "intelligence", label: "Intelligence", base: 18, equip: 6, glyph: "wisdom", color: "#3f8fdd" },
  { key: "concentration", label: "Concentration", base: 31, equip: 2, glyph: "speed", color: "#b06be6" },
  { key: "chance", label: "Chance", base: 12, equip: 4, glyph: "luck", color: "#f0a95c" },
];

/* ------------------------------------------------------------------ */
/* Sous-composants réutilisés par les deux variantes                   */
/* ------------------------------------------------------------------ */

function SectionTitle({ children, size = 20, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 6, height: size - 2, borderRadius: 3, background: GOLD }} />
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          fontSize: size,
          color: GOLD,
          letterSpacing: ".04em",
        }}
      >
        {children}
      </div>
      {right}
    </div>
  );
}

function InfoRow({ row, big }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: big ? "10px 14px" : "9px 12px",
        borderRadius: big ? 11 : 10,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(227,182,79,.12)",
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "#7fa8ae",
        }}
      >
        {row.label}
      </span>
      <span style={{ fontSize: big ? 16 : 15, fontWeight: 800, color: "#eef6f6" }}>{row.value}</span>
    </div>
  );
}

function EquipRow({ s, big }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: big ? "10px 14px" : "8px 12px",
        borderRadius: big ? 11 : 10,
        background: "rgba(255,255,255,.03)",
      }}
    >
      <span style={{ width: big ? 9 : 8, height: big ? 9 : 8, borderRadius: "50%", background: s.color }} />
      <span style={{ flex: 1, fontSize: big ? 15 : 14, fontWeight: 700, color: "#c4dbde" }}>{s.label}</span>
      <span style={{ fontSize: big ? 15 : 14, fontWeight: 800, color: "#eef6f6" }}>{s.base}</span>
      <span style={{ fontSize: big ? 15 : 14, fontWeight: 800, color: "#8fd39a" }}>+{s.equip}</span>
      <span
        style={{ minWidth: big ? 46 : 44, textAlign: "right", fontSize: big ? 16 : 15, fontWeight: 800, color: GOLD }}
      >
        {s.base + s.equip}
      </span>
    </div>
  );
}

function StepperBtn({ children, onClick, sizePx = 40, font = 24 }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(227,182,79,.16)";
        e.currentTarget.style.color = "#f2d488";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,.03)";
        e.currentTarget.style.color = GOLD;
      }}
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: sizePx * 0.27,
        border: "1px solid rgba(227,182,79,.4)",
        background: "rgba(255,255,255,.03)",
        color: GOLD,
        fontSize: font,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        transition: "all .12s",
      }}
    >
      {children}
    </button>
  );
}

function PointsBadge({ remaining, big }) {
  const has = remaining > 0;
  return (
    <div
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: big ? 10 : 8,
        padding: big ? "8px 20px" : "6px 16px",
        borderRadius: big ? 22 : 20,
        background: has ? "rgba(203,230,79,.12)" : "rgba(255,255,255,.04)",
        border: `1px solid ${has ? "rgba(203,230,79,.5)" : "rgba(227,182,79,.25)"}`,
      }}
    >
      <span
        style={{
          fontSize: big ? 12 : 11,
          fontWeight: 800,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "#7fa8ae",
        }}
      >
        {big ? "points à répartir" : "à répartir"}
      </span>
      <span style={{ fontSize: big ? 22 : 18, fontWeight: 800, color: has ? "#cbe64f" : "#7fa8ae" }}>
        {remaining}
      </span>
    </div>
  );
}

function ValidateBtn({ onClick, big }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f2d488")}
      onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
      style={{
        flexShrink: 0,
        alignSelf: "flex-end",
        minWidth: big ? 220 : 200,
        padding: big ? "15px 34px" : "14px 30px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: GOLD,
        color: INK,
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: big ? 18 : 17,
        letterSpacing: ".04em",
        transition: "background .15s",
      }}
    >
      Valider
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */

export default function ProfileScreen({
  variant = "modal",
  assetBase = "/assets",
  character = DEFAULT_CHARACTER,
  info = DEFAULT_INFO,
  stats = DEFAULT_STATS,
  pointsPool = 5,
  showBackdrop = true,
  backdropImage = "map.png",
  logo = "logo.png",
  profileIcon = "icon-profil.png",
  onClose = () => {},
  onValidate = () => {},
}) {
  // Points alloués par caractéristique (avant validation).
  const [alloc, setAlloc] = useState(() => Object.fromEntries(stats.map((s) => [s.key, 0])));
  // Base courante (augmente après validation).
  const [base, setBase] = useState(() => Object.fromEntries(stats.map((s) => [s.key, s.base])));
  const [pool, setPool] = useState(pointsPool);

  const spent = useMemo(() => Object.values(alloc).reduce((a, b) => a + b, 0), [alloc]);
  const remaining = pool - spent;

  const inc = (key) => {
    if (remaining <= 0) return;
    setAlloc((a) => ({ ...a, [key]: a[key] + 1 }));
  };
  const dec = (key) => {
    if ((alloc[key] || 0) <= 0) return;
    setAlloc((a) => ({ ...a, [key]: a[key] - 1 }));
  };
  const validate = () => {
    const newBase = { ...base };
    stats.forEach((s) => (newBase[s.key] += alloc[s.key] || 0));
    onValidate(alloc, newBase);
    setBase(newBase);
    setPool((p) => p - spent);
    setAlloc(Object.fromEntries(stats.map((s) => [s.key, 0])));
  };

  // Caractéristiques calculées pour le rendu.
  const rows = stats.map((s) => {
    const a = alloc[s.key] || 0;
    return {
      ...s,
      base: base[s.key],
      alloc: a,
      total: base[s.key] + s.equip + a,
    };
  });

  /* ---------------- Variante modale ---------------- */
  if (variant === "modal") {
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
              filter: "blur(7px) saturate(.85) brightness(.5)",
            }}
          />
        )}
        <div
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 90% 90% at 50% 45%, rgba(4,20,26,.74), rgba(4,20,26,.95))",
          }}
        />

        <div
          style={{
            position: "relative",
            width: 1280,
            maxWidth: "96vw",
            height: 860,
            maxHeight: "96vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 18,
            overflow: "hidden",
            background: "linear-gradient(165deg, #0a2c36, #06232b 62%)",
            border: "1px solid rgba(227,182,79,.45)",
            boxShadow: "0 40px 120px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)",
          }}
        >
          {/* Header */}
          <header
            style={{
              flexShrink: 0,
              height: 84,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 26px",
              background: "linear-gradient(180deg, rgba(4,26,33,.9), rgba(4,26,33,.35))",
              borderBottom: "1px solid rgba(227,182,79,.35)",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                border: "1px solid rgba(227,182,79,.5)",
                background: "rgba(227,182,79,.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={`${assetBase}/${profileIcon}`}
                alt=""
                style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.12 }}>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: 28,
                  color: GOLD,
                  letterSpacing: ".04em",
                }}
              >
                Profil
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
                {character.name} · {character.cls} · Niveau {character.level}
              </div>
            </div>
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
                marginLeft: "auto",
                width: 42,
                height: 42,
                borderRadius: 11,
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
          </header>

          {/* Corps */}
          <div style={{ flex: 1, display: "flex", gap: 20, padding: 22, minHeight: 0 }}>
            {/* Colonne gauche */}
            <div
              style={{
                width: 430,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                minHeight: 0,
              }}
            >
              <div
                style={{
                  borderRadius: 16,
                  background: "rgba(8,40,50,.6)",
                  border: "1px solid rgba(227,182,79,.25)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <SectionTitle>Informations</SectionTitle>
                {info.map((row, i) => (
                  <InfoRow key={i} row={row} />
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  borderRadius: 16,
                  background: "rgba(8,40,50,.6)",
                  border: "1px solid rgba(227,182,79,.25)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <SectionTitle
                  right={
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "#7fa8ae",
                      }}
                    >
                      base + bonus
                    </span>
                  }
                >
                  Équipement
                </SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {stats.map((s) => (
                    <EquipRow key={s.key} s={s} />
                  ))}
                </div>
              </div>
            </div>

            {/* Colonne droite : caractéristiques */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                borderRadius: 16,
                background: "rgba(8,40,50,.6)",
                border: "1px solid rgba(227,182,79,.25)",
                padding: 22,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minHeight: 0,
              }}
            >
              <SectionTitle size={22} right={<PointsBadge remaining={remaining} />}>
                Caractéristiques
              </SectionTitle>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  paddingRight: 4,
                }}
              >
                {rows.map((s) => (
                  <div
                    key={s.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(227,182,79,.16)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        borderRadius: 11,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: s.color + "22",
                        border: `1px solid ${s.color}66`,
                      }}
                    >
                      <Glyph name={s.glyph} color={s.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#eef6f6" }}>{s.label}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#7fa8ae" }}>
                        base {s.base} · équip <span style={{ color: "#8fd39a" }}>+{s.equip}</span>
                      </div>
                    </div>
                    <StepperBtn onClick={() => dec(s.key)}>−</StepperBtn>
                    <div
                      style={{
                        minWidth: 72,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <span style={{ fontSize: 24, fontWeight: 800, color: GOLD, lineHeight: 1 }}>{s.total}</span>
                      {s.alloc > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#8fd39a" }}>+{s.alloc}</span>
                      )}
                    </div>
                    <StepperBtn onClick={() => inc(s.key)} font={22}>
                      +
                    </StepperBtn>
                  </div>
                ))}
              </div>
              <ValidateBtn onClick={validate} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Variante plein écran ---------------- */
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, #06303b, #041e26 70%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Nunito Sans', system-ui, sans-serif",
      }}
    >
      {/* Header global */}
      <header
        style={{
          height: 72,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 32,
          padding: "0 28px",
          borderBottom: "1px solid rgba(227,182,79,.3)",
          background: "rgba(4,26,33,.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src={`${assetBase}/${logo}`}
            alt="Logo Alcazan Forest"
            style={{ width: 46, height: 46, borderRadius: 12, border: "1px solid rgba(227,182,79,.5)", objectFit: "cover" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: 22,
                color: GOLD,
                letterSpacing: ".04em",
                lineHeight: 1.1,
              }}
            >
              Alcazan Forest
            </div>
            <div
              style={{
                color: "#7fa8ae",
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              MMORPG médiéval
            </div>
          </div>
        </div>
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginLeft: 20,
            padding: 5,
            borderRadius: 12,
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(227,182,79,.2)",
          }}
        >
          {["Carte", "Profil", "Inventaire", "Administration"].map((n) => {
            const active = n === "Profil";
            return (
              <span
                key={n}
                style={{
                  color: active ? INK : "#b7d2d6",
                  background: active ? GOLD : "transparent",
                  fontWeight: active ? 800 : 700,
                  fontSize: 14,
                  padding: "8px 18px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {n}
              </span>
            );
          })}
        </nav>
        <span
          style={{
            marginLeft: "auto",
            color: GOLD,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            padding: "10px 20px",
            borderRadius: 10,
            border: "1px solid rgba(227,182,79,.55)",
            cursor: "pointer",
          }}
        >
          Déconnexion
        </span>
      </header>

      {/* Sous-nav */}
      <div
        style={{
          flexShrink: 0,
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          borderBottom: "1px solid rgba(227,182,79,.18)",
          background: "rgba(4,26,33,.3)",
        }}
      >
        {["Profil", "Sorts", "Options"].map((n) => {
          const active = n === "Profil";
          return (
            <div
              key={n}
              style={{
                position: "relative",
                fontFamily: "'Cinzel', serif",
                fontWeight: active ? 700 : 600,
                fontSize: 20,
                color: active ? GOLD : "#7fa8ae",
                padding: "6px 4px",
                cursor: "pointer",
              }}
            >
              {n}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -2,
                    height: 3,
                    borderRadius: 2,
                    background: GOLD,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Corps */}
      <div style={{ flex: 1, display: "flex", gap: 22, padding: "28px 40px", minHeight: 0 }}>
        {/* Colonne gauche */}
        <div style={{ width: 480, flexShrink: 0, display: "flex", flexDirection: "column", gap: 22, minHeight: 0 }}>
          <div
            style={{
              borderRadius: 18,
              background: "rgba(8,40,50,.55)",
              border: "1px solid rgba(227,182,79,.25)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={`${assetBase}/${character.avatar}`}
                alt={`Avatar de ${character.name}`}
                style={{ width: 62, height: 62, borderRadius: "50%", border: `2px solid ${GOLD}`, objectFit: "cover" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontWeight: 800, fontSize: 24, color: "#eef6f6", lineHeight: 1 }}>{character.name}</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    color: GOLD,
                  }}
                >
                  {character.cls} · Niveau {character.level}
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: "linear-gradient(90deg, rgba(227,182,79,.5), transparent)" }} />
            {info.map((row, i) => (
              <InfoRow key={i} row={row} big />
            ))}
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              borderRadius: 18,
              background: "rgba(8,40,50,.55)",
              border: "1px solid rgba(227,182,79,.25)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <SectionTitle
              right={
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "#7fa8ae",
                  }}
                >
                  base + bonus
                </span>
              }
            >
              Équipement
            </SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.map((s) => (
                <EquipRow key={s.key} s={s} big />
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite : caractéristiques */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: 18,
            background: "rgba(8,40,50,.55)",
            border: "1px solid rgba(227,182,79,.25)",
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            minHeight: 0,
          }}
        >
          <SectionTitle size={26} right={<PointsBadge remaining={remaining} big />}>
            Caractéristiques
          </SectionTitle>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 14,
              alignContent: "start",
              paddingRight: 4,
            }}
          >
            {rows.map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  padding: 18,
                  borderRadius: 14,
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(227,182,79,.16)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: s.color + "22",
                      border: `1px solid ${s.color}66`,
                    }}
                  >
                    <Glyph name={s.glyph} color={s.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, color: "#eef6f6" }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#7fa8ae" }}>
                      base {s.base} · équip <span style={{ color: "#8fd39a" }}>+{s.equip}</span>
                    </div>
                  </div>
                  {s.alloc > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#8fd39a" }}>+{s.alloc}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <StepperBtn onClick={() => dec(s.key)} sizePx={44} font={26}>
                    −
                  </StepperBtn>
                  <div style={{ flex: 1, textAlign: "center", fontSize: 30, fontWeight: 800, color: GOLD, lineHeight: 1 }}>
                    {s.total}
                  </div>
                  <StepperBtn onClick={() => inc(s.key)} sizePx={44} font={24}>
                    +
                  </StepperBtn>
                </div>
              </div>
            ))}
          </div>
          <ValidateBtn onClick={validate} big />
        </div>
      </div>
    </div>
  );
}
