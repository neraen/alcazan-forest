import React, { useState } from "react";

/**
 * SpellsModal — "Sortilèges" spell-assignment modal.
 *
 * Design reference recreated from the HTML prototype (see README.md).
 * Self-contained, dependency-free React component using inline styles so it
 * drops into any codebase. Swap the inline styles for your design-system
 * primitives if you have them.
 *
 * Props:
 *   assetBase   — URL/path prefix where the spell images live (default "assets/")
 *   showBackdrop — render the blurred map backdrop behind the modal (default true)
 *   onClose      — called when the ✕ button is pressed
 *
 * Fonts required (load once, app-side):
 *   Cinzel (500,600,700) — headings
 *   Nunito Sans (400,600,700,800) — body
 */

/* ---------- palette ---------- */
const C = {
  bg: "#041e26",
  panel: "#06232b",
  panel2: "#0a2c36",
  gold: "#e3b64f",
  goldLight: "#f2d488",
  text: "#eef6f6",
  textSoft: "#c4dbde",
  textMuted: "#7fa8ae",
  ink: "#06232b",
  danger: "#e04a39",
};

/* ---------- data ---------- */
const SPELLS = [
  { id: "tir", name: "Tir rapide", img: "spell1.png", type: "Attaque", accent: "#3f8fdd",
    desc: "Un tir rapide d'une puissance modérée.", cd: 5, range: 4 },
  { id: "dest", name: "Flèche destructrice", img: "spell2.png", type: "Attaque", accent: "#6fb4f0",
    desc: "Une flèche puissante qui détruit tout sur son passage. Attention toutefois à son irrégularité.", cd: 10, range: 5 },
  { id: "poison", name: "Flèche empoisonnée", img: "spell3.png", type: "Poison", accent: "#5fbf6a",
    desc: "Une flèche peu puissante qui empêche la cible de se soigner pendant un court laps de temps.", cd: 10, range: 3 },
  { id: "maitrise", name: "Maîtrise de l'arc", img: "spell4.png", type: "Buff", accent: "#cbe64f",
    desc: "Un buff qui confère +40 en dextérité pendant 5 minutes.", cd: 0, range: 0 },
];

const HOTBAR_SIZE = 8;
const cdLabel = (cd) => (cd === 0 ? "Instantané" : cd + " s");
const rangeLabel = (r) => (r === 0 ? "Personnel" : r + " cases");

/* ---------- icons ---------- */
function Glyph({ paths, color = C.gold, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: paths }} />
  );
}
const ICONS = {
  wand: '<path d="M15 4l5 5M4 20l9-9M13 6l5 5"/><path d="M18 3l.6 1.4L20 5l-1.4.6L18 7l-.6-1.4L16 5l1.4-.6zM6 14l.5 1.2L8 16l-1.5.8L6 18l-.5-1.2L4 16l1.5-.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
};

export default function SpellsModal({ assetBase = "assets/", showBackdrop = true, onClose = () => {} }) {
  const [selectedId, setSelectedId] = useState("tir");
  // spellId -> hotbar index (0..7). Absent = not on the bar.
  const [slots, setSlots] = useState({ tir: 0, dest: 1, poison: 2, maitrise: 3 });

  const sel = SPELLS.find((s) => s.id === selectedId) || SPELLS[0];

  const assign = (idx) =>
    setSlots((prev) => {
      const next = { ...prev };
      for (const k in next) if (next[k] === idx) delete next[k]; // swap out occupant
      next[selectedId] = idx;
      return next;
    });

  const unassign = () =>
    setSlots((prev) => {
      const next = { ...prev };
      delete next[selectedId];
      return next;
    });

  const clickHotbar = (idx) => {
    const occupant = Object.keys(slots).find((k) => slots[k] === idx);
    if (occupant) setSelectedId(occupant);
    else assign(idx);
  };

  const img = (name) => assetBase + name;

  return (
    <section style={S.stage}>
      {showBackdrop && <img src={img("map.png")} alt="" style={S.backdrop} />}
      <div style={S.vignette} />

      <div style={S.modal}>
        {/* Header */}
        <header style={S.header}>
          <div style={S.headerIcon}><Glyph paths={ICONS.wand} size={24} /></div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <div style={S.title}>Sortilèges</div>
            <div style={S.subtitle}>{Object.keys(slots).length} sorts équipés · {SPELLS.length} appris</div>
          </div>
          <nav style={S.nav}>
            <a href="#" style={S.navLink}>Profil</a>
            <a href="#" style={S.navLinkActive}>Sorts</a>
            <a href="#" style={S.navLink}>Options</a>
          </nav>
          <button onClick={onClose} style={S.closeBtn} aria-label="Fermer">✕</button>
        </header>

        {/* Body */}
        <div style={S.body}>
          {/* LEFT: grimoire */}
          <div style={S.grimoire}>
            <div style={S.sectionHead}>
              <span style={S.sectionBar} />
              <div style={S.sectionTitle}>Grimoire</div>
              <span style={S.sectionHint}>Sélectionne un sort pour l'assigner</span>
            </div>

            <div style={S.grimoireList}>
              {SPELLS.map((s) => {
                const active = s.id === selectedId;
                const slot = slots[s.id];
                const has = slot !== undefined;
                return (
                  <button key={s.id} onClick={() => setSelectedId(s.id)} style={cardStyle(active)}>
                    <div style={cardThumb(s.accent)}>
                      <img src={img(s.img)} alt={s.name} style={S.fill} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{s.name}</span>
                        <span style={typeBadge(s.accent)}>{s.type}</span>
                      </div>
                      <div style={S.cardDesc}>{s.desc}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 1 }}>
                        <span style={S.metaChip}><Glyph paths={ICONS.clock} size={15} /><span style={S.metaVal}>{cdLabel(s.cd)}</span></span>
                        <span style={S.metaChip}><Glyph paths={ICONS.target} size={15} /><span style={S.metaVal}>{rangeLabel(s.range)}</span></span>
                      </div>
                    </div>
                    <div style={S.cardSlotCol}>
                      <span style={S.cardSlotLabel}>Barre</span>
                      <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 26, lineHeight: 1, color: has ? C.gold : "#557077" }}>
                        {has ? slot + 1 : "—"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: detail + assignment */}
          <div style={S.detail}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={detailThumb(sel.accent)}>
                <img src={img(sel.img)} alt={sel.name} style={S.fill} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                <div style={S.detailName}>{sel.name}</div>
                <span style={{ ...typeBadge(sel.accent), alignSelf: "flex-start", fontSize: 11, padding: "3px 12px" }}>{sel.type}</span>
              </div>
            </div>

            <div style={S.detailDesc}>{sel.desc}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Temps de recharge", value: cdLabel(sel.cd), icon: ICONS.clock, color: "#e3b64f", bg: "rgba(227,182,79,.14)" },
                { label: "Portée", value: rangeLabel(sel.range), icon: ICONS.target, color: "#5fbf6a", bg: "rgba(95,191,106,.14)" },
                { label: "Type", value: sel.type, icon: ICONS.bolt, color: "#6fb4f0", bg: "rgba(111,180,240,.14)" },
              ].map((d) => (
                <div key={d.label} style={S.detailRow}>
                  <div style={{ ...S.detailRowIcon, background: d.bg }}><Glyph paths={d.icon} color={d.color} size={18} /></div>
                  <span style={S.detailRowLabel}>{d.label}</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{d.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={S.assignLabel}>Emplacement dans la barre</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {Array.from({ length: HOTBAR_SIZE }, (_, i) => {
                  const on = slots[sel.id] === i;
                  return (
                    <button key={i} onClick={() => assign(i)} style={pickStyle(on)}>{i + 1}</button>
                  );
                })}
              </div>
              <button onClick={unassign} style={S.unassignBtn}>Retirer de la barre</button>
            </div>
          </div>
        </div>

        {/* Footer: hotbar */}
        <footer style={S.footer}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
            <span style={S.footerTitle}>Barre de sorts</span>
            <span style={S.footerSub}>Ordre d'affichage en jeu</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
            {Array.from({ length: HOTBAR_SIZE }, (_, i) => {
              const occId = Object.keys(slots).find((k) => slots[k] === i);
              const occ = occId ? SPELLS.find((s) => s.id === occId) : null;
              const selected = occ && occ.id === selectedId;
              return (
                <button key={i} onClick={() => clickHotbar(i)} style={hotbarStyle(occ, selected)}>
                  {occ && <img src={img(occ.img)} alt="" style={S.fill} />}
                  <span style={{ ...S.hotbarKey, color: occ ? C.goldLight : "#557077" }}>{i + 1}</span>
                </button>
              );
            })}
          </div>
        </footer>
      </div>
    </section>
  );
}

/* ---------- dynamic styles ---------- */
const cardStyle = (active) => ({
  display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left",
  padding: "14px 16px", borderRadius: 14, cursor: "pointer", transition: "all .15s",
  background: active ? "rgba(227,182,79,.1)" : "rgba(8,40,50,.55)",
  border: "1px solid " + (active ? C.gold : "rgba(227,182,79,.2)"),
  boxShadow: active ? "0 0 0 2px rgba(227,182,79,.35), 0 8px 22px rgba(0,0,0,.4)" : "0 3px 10px rgba(0,0,0,.25)",
});
const cardThumb = (accent) => ({
  width: 66, height: 66, flexShrink: 0, borderRadius: 13, overflow: "hidden",
  background: "#0a2027", border: "2px solid " + accent, boxShadow: "0 4px 12px rgba(0,0,0,.4)",
  display: "flex", alignItems: "center", justifyContent: "center",
});
const detailThumb = (accent) => ({
  width: 96, height: 96, flexShrink: 0, borderRadius: 16, overflow: "hidden",
  background: "#0a2027", border: "3px solid " + accent, boxShadow: "0 8px 24px rgba(0,0,0,.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
});
const typeBadge = (accent) => ({
  padding: "2px 10px", borderRadius: 7, background: accent + "1f", border: "1px solid " + accent,
  fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: accent,
});
const pickStyle = (on) => ({
  padding: "12px 0", borderRadius: 10, cursor: "pointer", fontFamily: "'Cinzel', serif",
  fontWeight: 700, fontSize: 16, transition: "all .15s",
  background: on ? C.gold : "rgba(255,255,255,.03)", color: on ? C.ink : "#cfe3e5",
  border: "1px solid " + (on ? C.gold : "rgba(227,182,79,.25)"),
});
const hotbarStyle = (occ, selected) => ({
  position: "relative", width: 76, height: 76, borderRadius: 13, overflow: "hidden",
  cursor: "pointer", padding: 0, transition: "all .15s",
  background: occ ? "#0a2027" : "rgba(0,0,0,.35)",
  border: "2px solid " + (selected ? C.gold : occ ? occ.accent + "cc" : "rgba(227,182,79,.2)"),
  boxShadow: selected ? "0 0 0 2px rgba(227,182,79,.5)" : "inset 0 2px 8px rgba(0,0,0,.5)",
});

/* ---------- static styles ---------- */
const S = {
  stage: { position: "relative", width: 1920, height: 1080, overflow: "hidden", background: C.bg,
    display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito Sans', sans-serif" },
  backdrop: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
    filter: "blur(6px) saturate(.85) brightness(.55)" },
  vignette: { position: "absolute", inset: 0,
    background: "radial-gradient(ellipse 90% 90% at 50% 45%, rgba(4,20,26,.72), rgba(4,20,26,.94))" },
  fill: { width: "100%", height: "100%", objectFit: "cover" },

  modal: { position: "relative", width: 1460, height: 916, display: "flex", flexDirection: "column",
    borderRadius: 18, overflow: "hidden", background: "linear-gradient(165deg, #0a2c36, #06232b 62%)",
    border: "1px solid rgba(227,182,79,.45)",
    boxShadow: "0 40px 120px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)" },

  header: { flexShrink: 0, height: 74, display: "flex", alignItems: "center", gap: 20, padding: "0 24px",
    background: "linear-gradient(180deg, rgba(4,26,33,.9), rgba(4,26,33,.4))",
    borderBottom: "1px solid rgba(227,182,79,.35)" },
  headerIcon: { width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(227,182,79,.5)",
    background: "rgba(227,182,79,.1)", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 27, color: C.gold, letterSpacing: ".04em" },
  subtitle: { fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.textMuted },
  nav: { marginLeft: 26, display: "flex", gap: 4, padding: 5, borderRadius: 12,
    background: "rgba(4,26,33,.55)", border: "1px solid rgba(227,182,79,.2)" },
  navLink: { color: "#b7d2d6", fontWeight: 700, fontSize: 14, padding: "7px 18px", borderRadius: 8, textDecoration: "none" },
  navLinkActive: { color: "#05242c", background: C.gold, fontWeight: 800, fontSize: 14, padding: "7px 18px", borderRadius: 8, textDecoration: "none" },
  closeBtn: { marginLeft: "auto", width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(227,182,79,.35)",
    background: "rgba(255,255,255,.04)", color: "#cfe3e5", fontSize: 20, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" },

  body: { flex: 1, display: "flex", gap: 20, padding: 20, minHeight: 0 },

  grimoire: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 },
  sectionHead: { display: "flex", alignItems: "center", gap: 10 },
  sectionBar: { width: 6, height: 20, borderRadius: 3, background: C.gold },
  sectionTitle: { fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 18, color: C.gold,
    letterSpacing: ".06em", textTransform: "uppercase" },
  sectionHint: { marginLeft: "auto", fontSize: 12, fontWeight: 700, color: C.textMuted },
  grimoireList: { flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 },
  cardDesc: { fontSize: 13.5, fontWeight: 500, color: "#b6d0d4", fontStyle: "italic", lineHeight: 1.35 },
  metaChip: { display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8,
    background: "rgba(255,255,255,.04)", border: "1px solid rgba(227,182,79,.16)" },
  metaVal: { fontSize: 12, fontWeight: 800, color: "#cfe3e5" },
  cardSlotCol: { flexShrink: 0, alignSelf: "stretch", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 3, minWidth: 66,
    borderLeft: "1px solid rgba(227,182,79,.14)", paddingLeft: 14 },
  cardSlotLabel: { fontSize: 9.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: C.textMuted },

  detail: { width: 480, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, borderRadius: 16,
    background: "rgba(4,26,33,.5)", border: "1px solid rgba(227,182,79,.25)", padding: 22 },
  detailName: { fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 24, color: C.text, lineHeight: 1.1 },
  detailDesc: { fontSize: 15, fontWeight: 500, color: C.textSoft, fontStyle: "italic", lineHeight: 1.5 },
  detailRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 11,
    background: "rgba(255,255,255,.03)", border: "1px solid rgba(227,182,79,.16)" },
  detailRowIcon: { width: 34, height: 34, flexShrink: 0, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" },
  detailRowLabel: { flex: 1, fontSize: 13, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: C.textMuted },
  assignLabel: { fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: C.gold },
  unassignBtn: { padding: 11, borderRadius: 11, border: "1px solid rgba(224,74,57,.5)", background: "transparent",
    color: "#e78a7d", fontWeight: 800, fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase",
    cursor: "pointer", transition: "all .15s" },

  footer: { flexShrink: 0, display: "flex", alignItems: "center", gap: 18, padding: "16px 24px 20px",
    background: "linear-gradient(0deg, rgba(4,26,33,.9), rgba(4,26,33,.35))", borderTop: "1px solid rgba(227,182,79,.35)" },
  footerTitle: { fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 16, color: C.gold, letterSpacing: ".04em" },
  footerSub: { fontSize: 11, fontWeight: 700, letterSpacing: ".04em", color: C.textMuted },
  hotbarKey: { position: "absolute", top: 3, left: 5, fontSize: 11, fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,.8)" },
};
