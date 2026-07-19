import React, { useMemo, useState } from "react";

/**
 * SpellbookModal — modale de sortilèges Alcazan Forest
 * ----------------------------------------------------
 * Composant React autonome (aucune dépendance externe, styles inline).
 *
 * Intégration :
 *   import SpellbookModal from "./SpellbookModal";
 *   {open && (
 *     <SpellbookModal
 *       spells={spells}                  // voir DEFAULT_SPELLS pour le schéma
 *       assignments={assignments}        // { [spellId]: slotIndex 0-7 } — état initial
 *       slotCount={8}                    // nombre d'emplacements de la barre
 *       assetBase="/assets"              // dossier des icônes de sorts
 *       onClose={() => setOpen(false)}
 *       onChange={(assignments) => save(assignments)}   // à chaque modif de la barre
 *     />
 *   )}
 *
 * Toutes les props de données sont optionnelles (données de démo par défaut).
 */

/* ------------------------------------------------------------------ */
/* Icônes vectorielles                                                 */
/* ------------------------------------------------------------------ */

const GLYPHS = {
  wand:
    '<path d="M15 4l5 5M4 20l9-9M13 6l5 5"/><path d="M18 3l.6 1.4L20 5l-1.4.6L18 7l-.6-1.4L16 5l1.4-.6zM6 14l.5 1.2L8 16l-1.5.8L6 18l-.5-1.2L4 16l1.5-.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
};

function Glyph({ name, color, size = "18px" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: size, height: size }}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] || GLYPHS.wand }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Données de démonstration                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_SPELLS = [
  { id: "tir", name: "Tir rapide", img: "spell1.png", type: "Attaque", accent: "#3f8fdd", cd: 5, range: 4, desc: "Un tir rapide d'une puissance modérée." },
  { id: "dest", name: "Flèche destructrice", img: "spell2.png", type: "Attaque", accent: "#6fb4f0", cd: 10, range: 5, desc: "Une flèche puissante qui détruit tout sur son passage. Attention toutefois à son irrégularité." },
  { id: "poison", name: "Flèche empoisonnée", img: "spell3.png", type: "Poison", accent: "#5fbf6a", cd: 10, range: 3, desc: "Une flèche peu puissante qui empêche la cible de se soigner pendant un court laps de temps." },
  { id: "maitrise", name: "Maîtrise de l'arc", img: "spell4.png", type: "Buff", accent: "#cbe64f", cd: 0, range: 0, desc: "Un buff qui confère +40 en dextérité pendant 5 minutes." },
];

const DEFAULT_ASSIGNMENTS = { tir: 0, dest: 1, poison: 2, maitrise: 3 };

const cdLabel = (cd) => (cd === 0 ? "Instantané" : `${cd} s`);
const rangeLabel = (r) => (r === 0 ? "Personnel" : `${r} cases`);

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

export default function SpellbookModal({
  spells = DEFAULT_SPELLS,
  assignments = DEFAULT_ASSIGNMENTS,
  slotCount = 8,
  assetBase = "/assets",
  showBackdrop = true,
  backdropImage = "map.png",
  onClose = () => {},
  onChange = () => {},
}) {
  const [slots, setSlots] = useState(assignments);
  const [selectedId, setSelectedId] = useState(spells[0]?.id);

  const sel = useMemo(
    () => spells.find((s) => s.id === selectedId) || spells[0],
    [spells, selectedId]
  );

  const update = (next) => {
    setSlots(next);
    onChange(next);
  };

  const assign = (idx) => {
    const next = { ...slots };
    for (const k in next) if (next[k] === idx) delete next[k];
    next[selectedId] = idx;
    update(next);
  };

  const unassign = () => {
    const next = { ...slots };
    delete next[selectedId];
    update(next);
  };

  const clickHotbar = (idx) => {
    const occ = Object.keys(slots).find((k) => slots[k] === idx);
    if (occ) setSelectedId(occ);
    else assign(idx);
  };

  const closeBtnHover = (e, on) => {
    e.currentTarget.style.background = on ? "rgba(224,74,57,.25)" : "rgba(255,255,255,.04)";
    e.currentTarget.style.borderColor = on ? "#e04a39" : "rgba(227,182,79,.35)";
    e.currentTarget.style.color = on ? "#ffd9d2" : "#cfe3e5";
  };

  const selSlot = slots[sel.id];

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
          boxShadow: "0 40px 120px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)",
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
            background: "linear-gradient(180deg, rgba(4,26,33,.9), rgba(4,26,33,.4))",
            borderBottom: "1px solid rgba(227,182,79,.35)",
          }}
        >
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
            <Glyph name="wand" color="#e3b64f" size="24px" />
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
              Sortilèges
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
              {Object.keys(slots).length} sorts équipés · {spells.length} appris
            </div>
          </div>
          <nav
            style={{
              marginLeft: 26,
              display: "flex",
              gap: 4,
              padding: 5,
              borderRadius: 12,
              background: "rgba(4,26,33,.55)",
              border: "1px solid rgba(227,182,79,.2)",
            }}
          >
            {["Profil", "Sorts", "Options"].map((t) => {
              const active = t === "Sorts";
              return (
                <a
                  key={t}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    color: active ? "#05242c" : "#b7d2d6",
                    background: active ? "#e3b64f" : "transparent",
                    fontWeight: active ? 800 : 700,
                    fontSize: 14,
                    padding: "7px 18px",
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  {t}
                </a>
              );
            })}
          </nav>
          <button
            onClick={onClose}
            onMouseEnter={(e) => closeBtnHover(e, true)}
            onMouseLeave={(e) => closeBtnHover(e, false)}
            style={{
              marginLeft: "auto",
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
        </header>

        {/* Corps */}
        <div style={{ flex: 1, display: "flex", gap: 20, padding: 20, minHeight: 0 }}>
          {/* Gauche : grimoire */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
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
                Grimoire
              </div>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#7fa8ae" }}>
                Sélectionne un sort pour l'assigner
              </span>
            </div>

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
              {spells.map((s) => {
                const active = s.id === selectedId;
                const slot = slots[s.id];
                const has = slot !== undefined;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    onMouseEnter={(e) =>
                      !active && (e.currentTarget.style.borderColor = "rgba(227,182,79,.55)")
                    }
                    onMouseLeave={(e) =>
                      !active && (e.currentTarget.style.borderColor = "rgba(227,182,79,.2)")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: 14,
                      cursor: "pointer",
                      transition: "all .15s",
                      background: active ? "rgba(227,182,79,.1)" : "rgba(8,40,50,.55)",
                      border: `1px solid ${active ? "#e3b64f" : "rgba(227,182,79,.2)"}`,
                      boxShadow: active
                        ? "0 0 0 2px rgba(227,182,79,.35), 0 8px 22px rgba(0,0,0,.4)"
                        : "0 3px 10px rgba(0,0,0,.25)",
                    }}
                  >
                    <div
                      style={{
                        width: 66,
                        height: 66,
                        flexShrink: 0,
                        borderRadius: 13,
                        overflow: "hidden",
                        background: "#0a2027",
                        border: `2px solid ${s.accent}`,
                        boxShadow: "0 4px 12px rgba(0,0,0,.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={`${assetBase}/${s.img}`}
                        alt={s.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 800, fontSize: 17, color: "#eef6f6" }}>{s.name}</span>
                        <span
                          style={{
                            padding: "2px 10px",
                            borderRadius: 7,
                            background: `${s.accent}1f`,
                            border: `1px solid ${s.accent}`,
                            fontSize: 10.5,
                            fontWeight: 800,
                            letterSpacing: ".05em",
                            textTransform: "uppercase",
                            color: s.accent,
                          }}
                        >
                          {s.type}
                        </span>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#b6d0d4", fontStyle: "italic", lineHeight: 1.35 }}>
                        {s.desc}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 1 }}>
                        <StatChip glyph="clock" label={cdLabel(s.cd)} />
                        <StatChip glyph="target" label={rangeLabel(s.range)} />
                      </div>
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        alignSelf: "stretch",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 3,
                        minWidth: 66,
                        borderLeft: "1px solid rgba(227,182,79,.14)",
                        paddingLeft: 14,
                      }}
                    >
                      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#7fa8ae" }}>
                        Barre
                      </span>
                      <span
                        style={{
                          fontFamily: "'Cinzel', serif",
                          fontWeight: 700,
                          fontSize: 26,
                          color: has ? "#e3b64f" : "#557077",
                          lineHeight: 1,
                        }}
                      >
                        {has ? slot + 1 : "—"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Droite : détail + assignation */}
          <div
            style={{
              width: 480,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              borderRadius: 16,
              background: "rgba(4,26,33,.5)",
              border: "1px solid rgba(227,182,79,.25)",
              padding: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  flexShrink: 0,
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#0a2027",
                  border: `3px solid ${sel.accent}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img src={`${assetBase}/${sel.img}`} alt={sel.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 24, color: "#eef6f6", lineHeight: 1.1 }}>
                  {sel.name}
                </div>
                <span
                  style={{
                    alignSelf: "flex-start",
                    padding: "3px 12px",
                    borderRadius: 8,
                    background: `${sel.accent}1f`,
                    border: `1px solid ${sel.accent}`,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    color: sel.accent,
                  }}
                >
                  {sel.type}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 15, fontWeight: 500, color: "#c4dbde", fontStyle: "italic", lineHeight: 1.5 }}>
              {sel.desc}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DetailRow glyph="clock" color="#e3b64f" bg="rgba(227,182,79,.14)" label="Temps de recharge" value={cdLabel(sel.cd)} />
              <DetailRow glyph="target" color="#5fbf6a" bg="rgba(95,191,106,.14)" label="Portée" value={rangeLabel(sel.range)} />
              <DetailRow glyph="bolt" color="#6fb4f0" bg="rgba(111,180,240,.14)" label="Type" value={sel.type} />
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#e3b64f" }}>
                Emplacement dans la barre
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {Array.from({ length: slotCount }, (_, i) => {
                  const on = selSlot === i;
                  return (
                    <button
                      key={i}
                      onClick={() => assign(i)}
                      onMouseEnter={(e) => !on && (e.currentTarget.style.borderColor = "#e3b64f")}
                      onMouseLeave={(e) => !on && (e.currentTarget.style.borderColor = "rgba(227,182,79,.25)")}
                      style={{
                        padding: "12px 0",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 700,
                        fontSize: 16,
                        transition: "all .15s",
                        background: on ? "#e3b64f" : "rgba(255,255,255,.03)",
                        color: on ? "#06232b" : "#cfe3e5",
                        border: `1px solid ${on ? "#e3b64f" : "rgba(227,182,79,.25)"}`,
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={unassign}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(224,74,57,.18)";
                  e.currentTarget.style.color = "#ffb3a8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#e78a7d";
                }}
                style={{
                  padding: 11,
                  borderRadius: 11,
                  border: "1px solid rgba(224,74,57,.5)",
                  background: "transparent",
                  color: "#e78a7d",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all .15s",
                }}
              >
                Retirer de la barre
              </button>
            </div>
          </div>
        </div>

        {/* Barre de sorts */}
        <footer
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "16px 24px 20px",
            background: "linear-gradient(0deg, rgba(4,26,33,.9), rgba(4,26,33,.35))",
            borderTop: "1px solid rgba(227,182,79,.35)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 16, color: "#e3b64f", letterSpacing: ".04em" }}>
              Barre de sorts
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".04em", color: "#7fa8ae" }}>
              Ordre d'affichage en jeu
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
            {Array.from({ length: slotCount }, (_, i) => {
              const occId = Object.keys(slots).find((k) => slots[k] === i);
              const occ = occId ? spells.find((x) => x.id === occId) : null;
              const selected = occ && occ.id === selectedId;
              return (
                <button
                  key={i}
                  onClick={() => clickHotbar(i)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(227,182,79,.6)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = selected
                      ? "#e3b64f"
                      : occ
                      ? `${occ.accent}cc`
                      : "rgba(227,182,79,.2)")
                  }
                  style={{
                    position: "relative",
                    width: 76,
                    height: 76,
                    borderRadius: 13,
                    overflow: "hidden",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all .15s",
                    background: occ ? "#0a2027" : "rgba(0,0,0,.35)",
                    border: `2px solid ${selected ? "#e3b64f" : occ ? `${occ.accent}cc` : "rgba(227,182,79,.2)"}`,
                    boxShadow: selected ? "0 0 0 2px rgba(227,182,79,.5)" : "inset 0 2px 8px rgba(0,0,0,.5)",
                  }}
                >
                  {occ && (
                    <img src={`${assetBase}/${occ.img}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: 5,
                      fontSize: 11,
                      fontWeight: 800,
                      color: occ ? "#f2d488" : "#557077",
                      textShadow: "0 1px 2px rgba(0,0,0,.8)",
                    }}
                  >
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sous-composants                                                     */
/* ------------------------------------------------------------------ */

function StatChip({ glyph, label }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 8,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(227,182,79,.16)",
      }}
    >
      <Glyph name={glyph} color="#e3b64f" size="15px" />
      <span style={{ fontSize: 12, fontWeight: 800, color: "#cfe3e5" }}>{label}</span>
    </span>
  );
}

function DetailRow({ glyph, color, bg, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 11,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(227,182,79,.16)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: 9,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
        }}
      >
        <Glyph name={glyph} color={color} size="18px" />
      </div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "#7fa8ae" }}>
        {label}
      </span>
      <span style={{ fontSize: 17, fontWeight: 800, color: "#eef6f6" }}>{value}</span>
    </div>
  );
}
