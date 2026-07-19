import React, { useState } from "react";

/**
 * HistoryModal — modale d'historique / journal d'aventure Alcazan Forest
 * ---------------------------------------------------------------------
 * Composant React autonome (aucune dépendance externe, styles inline).
 *
 * Intégration :
 *   import HistoryModal from "./HistoryModal";
 *   {open && (
 *     <HistoryModal
 *       days={days}                 // voir DEFAULT_DAYS pour le schéma
 *       events={events}            // voir DEFAULT_EVENTS pour le schéma
 *       summary={summary}          // [{ label, value, cat }]
 *       highlights={highlights}    // [{ label, value, cat }]
 *       character={{ name: "neraën", level: 20 }}
 *       showBackdrop showHighlights compactRows
 *       assetBase="/assets"
 *       onClose={() => setOpen(false)}
 *     />
 *   )}
 *
 * Toutes les props de données sont optionnelles (données de démo par défaut).
 *
 * Catégories (`cat`) reconnues — définissent couleur / icône / groupe de filtre :
 *   dmgIn · dmgOut · heal · death · level · gold · loot · quest
 */

/* ------------------------------------------------------------------ */
/* Icônes vectorielles                                                 */
/* ------------------------------------------------------------------ */

const PATHS = {
  shield: "M12 2l8 3v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V5l8-3z",
  target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v12M6 12h12",
  heart: "M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 22l8.8-8.3a5 5 0 0 0 0-7.1z",
  skull: "M12 3a7 7 0 0 0-4.5 12.4V18a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2.6A7 7 0 0 0 12 3zM9.5 11h0M14.5 11h0M9.5 19v2.4M12 19v2.4M14.5 19v2.4",
  chevrons: "M18 11l-6-6-6 6M18 18l-6-6-6 6",
  coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.5 9c-.6-1-1.6-1.5-2.7-1.5-1.5 0-2.6.8-2.6 2s1.1 1.8 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.1 0-2.1-.5-2.7-1.5M12 6v1.6M12 16.4V18",
  chest: "M4 10h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8zM3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3H3V7zM12 10v4",
  scroll: "M7 4h10a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6M9 13h6M9 17h3",
  swords: "M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2",
};

const CAT = {
  dmgIn: { color: "#e0574a", tag: "Dégâts subis", icon: "shield", group: "combat" },
  dmgOut: { color: "#f0a95c", tag: "Attaque", icon: "target", group: "combat" },
  heal: { color: "#5fbf6a", tag: "Soin", icon: "heart", group: "soins" },
  death: { color: "#cf4d40", tag: "Mort", icon: "skull", group: "combat" },
  level: { color: "#e3b64f", tag: "Niveau", icon: "chevrons", group: "progression" },
  gold: { color: "#e3b64f", tag: "Or", icon: "coin", group: "butin" },
  loot: { color: "#b06be6", tag: "Butin", icon: "chest", group: "butin" },
  quest: { color: "#3f8fdd", tag: "Quête", icon: "scroll", group: "progression" },
};

function Icon({ name, color, size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name] || PATHS.scroll} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Données de démonstration                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_DAYS = [
  { label: "Aujourd'hui", date: "30 juillet 2022" },
  { label: "Hier", date: "29 juillet 2022" },
  { label: "28 juillet", date: "2022" },
];

// { day: index dans days, cat, time, who, text, badge }
const DEFAULT_EVENTS = [
  { day: 0, cat: "heal", time: "11:07:57", who: "joHeal", text: "vous soigne et restaure votre santé", badge: "+51 PV" },
  { day: 0, cat: "heal", time: "11:07:53", who: "joHeal", text: "vous soigne et restaure votre santé", badge: "+45 PV" },
  { day: 0, cat: "heal", time: "11:07:45", who: "joHeal", text: "vous soigne et restaure votre santé", badge: "+58 PV" },
  { day: 0, cat: "heal", time: "11:07:34", who: "joHeal", text: "vous soigne et restaure votre santé", badge: "+44 PV" },
  { day: 0, cat: "heal", time: "11:07:21", who: "joHeal", text: "vous soigne et restaure votre santé", badge: "+45 PV" },
  { day: 0, cat: "dmgIn", time: "11:07:00", who: "joHeal", text: "vous attaque avec Frappe céleste", badge: "−92 PV" },
  { day: 0, cat: "loot", time: "10:41:12", who: "Vous", text: "récupérez une Fiole de rosée", badge: "×2" },
  { day: 0, cat: "gold", time: "10:22:04", who: "Vous", text: "vendez une Peau de sanglier au marchand", badge: "+240 Or" },
  { day: 0, cat: "quest", time: "10:05:40", who: "Vous", text: "terminez la quête « Les racines chuchotantes »", badge: "+1 200 XP" },
  { day: 0, cat: "level", time: "09:58:11", who: "Vous", text: "atteignez le niveau 20 !", badge: "Niv. 20" },
  { day: 0, cat: "dmgOut", time: "09:52:33", who: "Vous", text: "frappez le Loup gris avec Flèche perçante", badge: "210 dég." },
  { day: 0, cat: "dmgOut", time: "09:40:18", who: "Vous", text: "frappez la Libellule avec Tir rapide", badge: "64 dég." },
  { day: 0, cat: "death", time: "09:07:27", who: "Libellule", text: "vous inflige un coup fatal", badge: "−151 PV" },
  { day: 1, cat: "quest", time: "21:14:03", who: "Vous", text: "acceptez la quête « La clairière oubliée »", badge: "Nouvelle" },
  { day: 1, cat: "loot", time: "20:50:47", who: "Vous", text: "obtenez l'Anneau de mousse", badge: "Rare" },
  { day: 1, cat: "dmgOut", time: "20:31:22", who: "Vous", text: "abattez le Sanglier des bois", badge: "Coup fatal" },
  { day: 1, cat: "dmgIn", time: "20:29:10", who: "Sanglier des bois", text: "vous charge de plein fouet", badge: "−88 PV" },
  { day: 1, cat: "heal", time: "20:12:55", who: "Potion de vie", text: "restaure votre santé", badge: "+150 PV" },
  { day: 1, cat: "gold", time: "19:47:31", who: "Vous", text: "trouvez une bourse dans un tronc creux", badge: "+320 Or" },
  { day: 1, cat: "level", time: "19:20:08", who: "Vous", text: "atteignez le niveau 19", badge: "Niv. 19" },
  { day: 2, cat: "dmgOut", time: "18:03:44", who: "Vous", text: "vainquez le Spectre des fougères", badge: "Coup fatal" },
  { day: 2, cat: "dmgIn", time: "17:59:12", who: "Spectre des fougères", text: "vous lance une malédiction", badge: "−134 PV" },
  { day: 2, cat: "loot", time: "17:40:29", who: "Vous", text: "récupérez un Éclat spectral", badge: "×1" },
  { day: 2, cat: "quest", time: "16:22:17", who: "Vous", text: "terminez « Sentiers brumeux »", badge: "+900 XP" },
  { day: 2, cat: "gold", time: "15:10:06", who: "Vous", text: "recevez votre solde d'aventurier", badge: "+540 Or" },
];

const DEFAULT_SUMMARY = [
  { label: "Dégâts infligés", value: "274", cat: "dmgOut" },
  { label: "Dégâts subis", value: "243", cat: "dmgIn" },
  { label: "Soins reçus", value: "+243", cat: "heal" },
  { label: "XP gagné", value: "+2 400", cat: "level" },
  { label: "Or gagné", value: "+240", cat: "gold" },
  { label: "Morts", value: "1", cat: "death" },
];

const DEFAULT_HIGHLIGHTS = [
  { label: "Coup le plus puissant", value: "Flèche perçante · 210", color: "#f0a95c", icon: "target" },
  { label: "Ennemi vaincu", value: "Loup gris", color: "#5fbf6a", icon: "swords" },
  { label: "Meilleur soin", value: "+58 PV", color: "#5fbf6a", icon: "heart" },
];

const FILTERS = [
  { key: "tout", label: "Tout", dot: "#e3b64f" },
  { key: "combat", label: "Combat", dot: "#e0574a" },
  { key: "soins", label: "Soins", dot: "#5fbf6a" },
  { key: "progression", label: "Progression", dot: "#3f8fdd" },
  { key: "butin", label: "Butin", dot: "#b06be6" },
];

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

export default function HistoryModal({
  days = DEFAULT_DAYS,
  events = DEFAULT_EVENTS,
  summary = DEFAULT_SUMMARY,
  highlights = DEFAULT_HIGHLIGHTS,
  character = { name: "neraën", level: 20 },
  assetBase = "/assets",
  showBackdrop = true,
  showHighlights = true,
  compactRows = false,
  backdropImage = "map.png",
  onClose = () => {},
}) {
  const [filter, setFilter] = useState("tout");
  const rowPad = compactRows ? "9px" : "13px";

  const closeHover = (e, on) => {
    e.currentTarget.style.background = on ? "rgba(224,74,57,.25)" : "rgba(255,255,255,.04)";
    e.currentTarget.style.borderColor = on ? "#e04a39" : "rgba(227,182,79,.35)";
    e.currentTarget.style.color = on ? "#ffd9d2" : "#cfe3e5";
  };

  const grouped = days
    .map((d, di) => ({
      ...d,
      events: events.filter((e) => e.day === di && (filter === "tout" || CAT[e.cat].group === filter)),
    }))
    .filter((d) => d.events.length > 0);

  const shownCount = grouped.reduce((n, d) => n + d.events.length, 0);
  const groupCount = (g) => events.filter((e) => CAT[e.cat].group === g).length;
  const filterLabel = (FILTERS.find((f) => f.key === filter) || FILTERS[0]).label;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito Sans', system-ui, sans-serif" }}>
      {showBackdrop && (
        <img src={`${assetBase}/${backdropImage}`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(6px) saturate(.85) brightness(.55)" }} />
      )}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 90% at 50% 45%, rgba(4,20,26,.72), rgba(4,20,26,.94))" }} />

      <div style={{ position: "relative", width: 1460, maxWidth: "96vw", height: 916, maxHeight: "96vh", display: "flex", flexDirection: "column", borderRadius: 18, overflow: "hidden", background: "linear-gradient(165deg, #0a2c36, #06232b 62%)", border: "1px solid rgba(227,182,79,.45)", boxShadow: "0 40px 120px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)" }}>

        {/* Header */}
        <header style={{ flexShrink: 0, height: 74, display: "flex", alignItems: "center", gap: 20, padding: "0 24px", background: "linear-gradient(180deg, rgba(4,26,33,.9), rgba(4,26,33,.4))", borderBottom: "1px solid rgba(227,182,79,.35)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(227,182,79,.5)", background: "rgba(227,182,79,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="scroll" color="#e3b64f" size={23} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 27, color: "#e3b64f", letterSpacing: ".04em" }}>Historique</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#7fa8ae" }}>{character.name} · niveau {character.level} · {events.length} événements consignés</div>
          </div>
          <div style={{ marginLeft: 26, display: "flex", alignItems: "center", gap: 4, padding: 5, borderRadius: 12, background: "rgba(4,26,33,.55)", border: "1px solid rgba(227,182,79,.2)" }}>
            {["Aujourd'hui", "7 jours", "Tout"].map((t, i) => (
              <a key={t} href="#" onClick={(e) => e.preventDefault()} style={{ color: i === 0 ? "#05242c" : "#b7d2d6", background: i === 0 ? "#e3b64f" : "transparent", fontWeight: i === 0 ? 800 : 700, fontSize: 13, padding: "7px 16px", borderRadius: 8, textDecoration: "none" }}>{t}</a>
            ))}
          </div>
          <button onClick={onClose} onMouseEnter={(e) => closeHover(e, true)} onMouseLeave={(e) => closeHover(e, false)} style={{ marginLeft: "auto", width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(227,182,79,.35)", background: "rgba(255,255,255,.04)", color: "#cfe3e5", fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>✕</button>
        </header>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", gap: 20, padding: 20, minHeight: 0 }}>
          {/* Left rail */}
          <aside style={{ width: 372, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
            {/* Summary */}
            <div style={{ flexShrink: 0, borderRadius: 16, background: "rgba(4,26,33,.5)", border: "1px solid rgba(227,182,79,.25)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>
              <SectionTitle>Résumé du jour</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                {summary.map((s) => {
                  const c = CAT[s.cat] || { color: "#e3b64f", icon: "scroll" };
                  return (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(227,182,79,.12)" }}>
                      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${c.color}1e`, border: `1px solid ${c.color}55` }}>
                        <Icon name={c.icon} color={c.color} size={19} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 18, color: c.color, lineHeight: 1 }}>{s.value}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "#7fa8ae", whiteSpace: "nowrap" }}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div style={{ flexShrink: 0, borderRadius: 16, background: "rgba(4,26,33,.5)", border: "1px solid rgba(227,182,79,.25)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
              <SectionTitle>Filtrer</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FILTERS.map((f) => {
                  const on = f.key === filter;
                  const count = f.key === "tout" ? events.length : groupCount(f.key);
                  return (
                    <button key={f.key} onClick={() => setFilter(f.key)} onMouseEnter={(e) => !on && (e.currentTarget.style.background = "rgba(227,182,79,.12)")} onMouseLeave={(e) => !on && (e.currentTarget.style.background = "rgba(255,255,255,.03)")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", borderRadius: 11, cursor: "pointer", textAlign: "left", background: on ? "rgba(227,182,79,.16)" : "rgba(255,255,255,.03)", border: `1px solid ${on ? "rgba(227,182,79,.55)" : "rgba(227,182,79,.14)"}` }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: f.dot }} />
                      <span style={{ fontWeight: 800, fontSize: 14, color: on ? "#f2e2b0" : "#b7d2d6" }}>{f.label}</span>
                      <span style={{ marginLeft: "auto", padding: "2px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, color: on ? "#e3b64f" : "#7fa8ae", background: on ? "rgba(227,182,79,.18)" : "rgba(255,255,255,.05)" }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Highlights */}
            {showHighlights && (
              <div style={{ flex: 1, minHeight: 0, borderRadius: 16, background: "rgba(4,26,33,.5)", border: "1px solid rgba(227,182,79,.25)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 11 }}>
                <SectionTitle>Faits marquants</SectionTitle>
                {highlights.map((h) => (
                  <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 11, background: "rgba(255,255,255,.03)", border: "1px solid rgba(227,182,79,.12)" }}>
                    <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${h.color}1e`, border: `1px solid ${h.color}55` }}>
                      <Icon name={h.icon} color={h.color} size={18} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "#7fa8ae" }}>{h.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#eef6f6" }}>{h.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Feed */}
          <div style={{ flex: 1, minWidth: 0, borderRadius: 16, background: "rgba(4,26,33,.45)", border: "1px solid rgba(227,182,79,.25)", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 14, padding: "18px 24px 12px" }}>
              <span style={{ width: 7, height: 24, borderRadius: 3, background: "#e3b64f" }} />
              <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "#e3b64f", letterSpacing: ".04em" }}>Chronologie</div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#7fa8ae" }}>{filterLabel} · {shownCount} entrées</span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(227,182,79,.2)" }}>
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="none" stroke="#7fa8ae" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#7fa8ae" }}>Rechercher</span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped.map((d) => (
                <React.Fragment key={d.label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 2px 6px" }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 14, color: "#e3b64f", letterSpacing: ".1em", textTransform: "uppercase" }}>{d.label}</span>
                    {d.date && <span style={{ fontSize: 12, fontWeight: 700, color: "#6f8f95" }}>{d.date}</span>}
                    <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(227,182,79,.35), transparent)" }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#6f8f95" }}>{d.events.length} évén.</span>
                  </div>
                  {d.events.map((e, i) => {
                    const c = CAT[e.cat];
                    return (
                      <div key={i} onMouseEnter={(ev) => { ev.currentTarget.style.background = "rgba(227,182,79,.07)"; ev.currentTarget.style.borderColor = "rgba(227,182,79,.22)"; }} onMouseLeave={(ev) => { ev.currentTarget.style.background = "rgba(255,255,255,.02)"; ev.currentTarget.style.borderColor = "rgba(227,182,79,.08)"; }} style={{ display: "flex", alignItems: "center", gap: 14, padding: `${rowPad} 16px`, borderRadius: 12, background: "rgba(255,255,255,.02)", border: "1px solid rgba(227,182,79,.08)" }}>
                        <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", background: `${c.color}1e`, border: `1px solid ${c.color}55` }}>
                          <Icon name={c.icon} color={c.color} size={23} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 15, color: "#d6e8ea", lineHeight: 1.3 }}><span style={{ fontWeight: 800, color: c.color }}>{e.who}</span> {e.text}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span style={{ padding: "2px 9px", borderRadius: 7, fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: c.color, background: `${c.color}1e` }}>{c.tag}</span>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#6f8f95" }}>{e.time}</span>
                          </div>
                        </div>
                        <span style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 10, fontWeight: 800, fontSize: 14, color: c.color, background: `${c.color}1e`, border: `1px solid ${c.color}55` }}>{e.badge}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sous-composants                                                     */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 6, height: 20, borderRadius: 3, background: "#e3b64f" }} />
      <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 17, color: "#e3b64f", letterSpacing: ".04em" }}>{children}</div>
    </div>
  );
}
