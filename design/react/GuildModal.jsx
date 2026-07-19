import React from "react";

/**
 * GuildModal — modale de guilde Alcazan Forest
 * --------------------------------------------
 * Composant React autonome (aucune dépendance externe, styles inline).
 *
 * Intégration :
 *   import GuildModal from "./GuildModal";
 *   {open && (
 *     <GuildModal
 *       guild={guild}                 // voir DEFAULT_GUILD pour le schéma
 *       members={members}             // voir DEFAULT_MEMBERS pour le schéma
 *       objectives={objectives}       // [{ label, count, pct, c1, c2 }]
 *       activity={activity}           // [{ who, txt, time, color }]
 *       perks={perks}                 // [string]
 *       assetBase="/assets"           // dossier des images (logo, cur-or…)
 *       onClose={() => setOpen(false)}
 *       onInvite={() => invite()}
 *     />
 *   )}
 *
 * Toutes les props de données sont optionnelles (données de démo par défaut).
 */

/* ------------------------------------------------------------------ */
/* Palettes                                                            */
/* ------------------------------------------------------------------ */

const GRADE_COLORS = {
  "Maître de guilde": "#e3b64f",
  "Sénéchal": "#b06be6",
  "Chevalier": "#3f8fdd",
  "Baron": "#5fbf6a",
  "Écuyer": "#7fa8ae",
  "Recrue": "#6f8f95",
};
const CLASS_COLORS = {
  Paladin: "#e3b64f", Mage: "#3f8fdd", Archer: "#5fbf6a",
  Guerrier: "#e04a39", Prêtre: "#f0a95c", Voleur: "#b06be6",
};
const STATUS_COLORS = {
  "Connecté": "#5fbf6a", "En quête": "#e3b64f", "Hors ligne": "#6f8f95",
};

/* ------------------------------------------------------------------ */
/* Données de démonstration                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_GUILD = {
  name: "Les Gardiens d'Alcazan",
  level: 14,
  rank: "#7",
  motto: "« Par la forêt, unis — jamais seuls sous la canopée. »",
  xp: "34 200 / 50 000",
  xpPct: "68%",
  treasury: "128 540 Or",
  capacity: 30,
};

const DEFAULT_MEMBERS = [
  { name: "Aldric", grade: "Maître de guilde", cls: "Paladin", lvl: 60, status: "Connecté", contrib: 48200, since: "Fondateur" },
  { name: "Séléné", grade: "Sénéchal", cls: "Mage", lvl: 57, status: "En quête", contrib: 41300, since: "Membre depuis 8 mois" },
  { name: "Théodric", grade: "Sénéchal", cls: "Guerrier", lvl: 55, status: "Connecté", contrib: 38900, since: "Membre depuis 7 mois" },
  { name: "Maëlys", grade: "Chevalier", cls: "Prêtre", lvl: 49, status: "Hors ligne", contrib: 27600, since: "Membre depuis 5 mois" },
  { name: "Corvyn", grade: "Chevalier", cls: "Voleur", lvl: 47, status: "Connecté", contrib: 24100, since: "Membre depuis 4 mois" },
  { name: "Isolde", grade: "Baron", cls: "Mage", lvl: 38, status: "Hors ligne", contrib: 18700, since: "Membre depuis 3 mois" },
  { name: "neraën", grade: "Baron", cls: "Archer", lvl: 20, status: "Connecté", contrib: 5400, since: "Membre depuis 2 j", you: true },
  { name: "Gauvain", grade: "Écuyer", cls: "Guerrier", lvl: 31, status: "En quête", contrib: 9200, since: "Membre depuis 6 sem." },
  { name: "Perrin", grade: "Écuyer", cls: "Archer", lvl: 26, status: "Connecté", contrib: 6100, since: "Membre depuis 1 mois" },
  { name: "Elara", grade: "Recrue", cls: "Prêtre", lvl: 14, status: "Hors ligne", contrib: 1200, since: "Recrutée cette semaine" },
  { name: "Bran", grade: "Recrue", cls: "Voleur", lvl: 11, status: "Connecté", contrib: 800, since: "Recruté hier" },
  { name: "Yseult", grade: "Recrue", cls: "Mage", lvl: 8, status: "Hors ligne", contrib: 300, since: "Recrutée hier" },
];

const DEFAULT_OBJECTIVES = [
  { label: "Vaincre le Golem des Racines", count: "3 / 5", pct: "60%", c1: "#7a1f1c", c2: "#e04a39" },
  { label: "Alimenter le trésor", count: "14 200 / 20 000", pct: "71%", c1: "#b8892e", c2: "#e3b64f" },
  { label: "Quêtes de guilde", count: "38 / 50", pct: "76%", c1: "#2f7a38", c2: "#5fbf6a" },
];

const DEFAULT_ACTIVITY = [
  { who: "Séléné", txt: "a rejoint la guilde.", time: "il y a 2 h", color: "#b06be6" },
  { who: "Aldric", txt: "a amélioré le coffre partagé au rang III.", time: "il y a 5 h", color: "#e3b64f" },
  { who: "neraën", txt: "a atteint le niveau 20.", time: "hier", color: "#5fbf6a" },
  { who: "Théodric", txt: "a déposé 5 000 Or au trésor.", time: "il y a 2 j", color: "#e04a39" },
  { who: "La guilde", txt: "est montée au niveau 14.", time: "il y a 3 j", color: "#3f8fdd" },
  { who: "Corvyn", txt: "a vaincu le Spectre des Fougères.", time: "il y a 4 j", color: "#b06be6" },
];

const DEFAULT_PERKS = [
  "+8 % d'XP en groupe",
  "+5 % d'Or récolté",
  "Coffre partagé — 30 emplacements",
  "Portail de guilde vers le camp",
];

const fmt = (n) => n.toLocaleString("fr-FR");

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

export default function GuildModal({
  guild = DEFAULT_GUILD,
  members = DEFAULT_MEMBERS,
  objectives = DEFAULT_OBJECTIVES,
  activity = DEFAULT_ACTIVITY,
  perks = DEFAULT_PERKS,
  assetBase = "/assets",
  showBackdrop = true,
  showObjectives = true,
  backdropImage = "map.png",
  onClose = () => {},
  onInvite = () => {},
}) {
  const online = members.filter((m) => m.status !== "Hors ligne").length;

  const closeHover = (e, on) => {
    e.currentTarget.style.background = on ? "rgba(224,74,57,.25)" : "rgba(255,255,255,.04)";
    e.currentTarget.style.borderColor = on ? "#e04a39" : "rgba(227,182,79,.35)";
    e.currentTarget.style.color = on ? "#ffd9d2" : "#cfe3e5";
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito Sans', system-ui, sans-serif" }}>
      {showBackdrop && (
        <img src={`${assetBase}/${backdropImage}`} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(6px) saturate(.85) brightness(.55)" }} />
      )}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 90% at 50% 45%, rgba(4,20,26,.72), rgba(4,20,26,.94))" }} />

      <div style={{ position: "relative", width: 1460, maxWidth: "96vw", height: 916, maxHeight: "96vh", display: "flex", flexDirection: "column", borderRadius: 18, overflow: "hidden", background: "linear-gradient(165deg, #0a2c36, #06232b 62%)", border: "1px solid rgba(227,182,79,.45)", boxShadow: "0 40px 120px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)" }}>

        {/* Header */}
        <header style={{ flexShrink: 0, height: 74, display: "flex", alignItems: "center", gap: 20, padding: "0 24px", background: "linear-gradient(180deg, rgba(4,26,33,.9), rgba(4,26,33,.4))", borderBottom: "1px solid rgba(227,182,79,.35)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(227,182,79,.5)", background: "rgba(227,182,79,.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src={`${assetBase}/logo.png`} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 27, color: "#e3b64f", letterSpacing: ".04em" }}>Guilde</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#7fa8ae" }}>{guild.name} · {members.length} membres · {online} en ligne</div>
          </div>
          <nav style={{ marginLeft: 26, display: "flex", gap: 4, padding: 5, borderRadius: 12, background: "rgba(4,26,33,.55)", border: "1px solid rgba(227,182,79,.2)" }}>
            {["Membres", "Journal", "Objectifs"].map((t) => {
              const active = t === "Membres";
              return (
                <a key={t} href="#" onClick={(e) => e.preventDefault()} style={{ color: active ? "#05242c" : "#b7d2d6", background: active ? "#e3b64f" : "transparent", fontWeight: active ? 800 : 700, fontSize: 14, padding: "7px 18px", borderRadius: 8, textDecoration: "none" }}>{t}</a>
              );
            })}
          </nav>
          <button onClick={onClose} onMouseEnter={(e) => closeHover(e, true)} onMouseLeave={(e) => closeHover(e, false)} style={{ marginLeft: "auto", width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(227,182,79,.35)", background: "rgba(255,255,255,.04)", color: "#cfe3e5", fontSize: 20, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>✕</button>
        </header>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", gap: 20, padding: 20, minHeight: 0 }}>
          {/* Roster */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 6, height: 20, borderRadius: 3, background: "#e3b64f" }} />
              <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 18, color: "#e3b64f", letterSpacing: ".06em", textTransform: "uppercase" }}>Membres</div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#7fa8ae" }}>{members.length} / {guild.capacity}</span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(227,182,79,.2)" }}>
                <SearchIcon />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#7fa8ae" }}>Rechercher</span>
              </div>
              <button onClick={onInvite} onMouseEnter={(e) => (e.currentTarget.style.background = "#f2d488")} onMouseLeave={(e) => (e.currentTarget.style.background = "#e3b64f")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: "#e3b64f", color: "#06232b", fontWeight: 800, fontSize: 14, transition: "background .15s" }}>
                <span style={{ fontSize: 17, lineHeight: 1 }}>+</span> Inviter
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.5fr 1.2fr 0.8fr 1.4fr 1.1fr", gap: 12, padding: "0 16px" }}>
              {["Membre", "Grade", "Classe", "Niveau", "Contribution", "Statut"].map((h, i) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#6f8f95", textAlign: i === 5 ? "right" : "left" }}>{h}</span>
              ))}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7, paddingRight: 4 }}>
              {members.map((m) => {
                const clsColor = CLASS_COLORS[m.cls] || "#7fa8ae";
                const gradeColor = GRADE_COLORS[m.grade] || "#7fa8ae";
                const statusColor = STATUS_COLORS[m.status] || "#6f8f95";
                return (
                  <div key={m.name} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(227,182,79,.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = m.you ? "rgba(227,182,79,.10)" : "rgba(255,255,255,.03)")} style={{ display: "grid", gridTemplateColumns: "2.4fr 1.5fr 1.2fr 0.8fr 1.4fr 1.1fr", gap: 12, alignItems: "center", padding: "11px 16px", borderRadius: 12, background: m.you ? "rgba(227,182,79,.10)" : "rgba(255,255,255,.03)", border: `1px solid ${m.you ? "rgba(227,182,79,.5)" : "rgba(227,182,79,.10)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 17, color: "#eef6f6", background: "rgba(255,255,255,.06)", border: `2px solid ${clsColor}` }}>{m.name.charAt(0).toUpperCase()}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: "#eef6f6" }}>{m.name}</span>
                          {m.you && <span style={{ padding: "1px 7px", borderRadius: 6, background: "rgba(227,182,79,.18)", border: "1px solid rgba(227,182,79,.5)", fontSize: 10, fontWeight: 800, letterSpacing: ".06em", color: "#e3b64f" }}>VOUS</span>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#7fa8ae" }}>{m.since}</span>
                      </div>
                    </div>
                    <div><span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 8, background: `${gradeColor}22`, border: `1px solid ${gradeColor}66`, fontSize: 12.5, fontWeight: 800, color: gradeColor }}>{m.grade}</span></div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: clsColor }}>{m.cls}</span>
                    <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 18, color: "#eef6f6" }}>{m.lvl}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <img src={`${assetBase}/cur-or.png`} alt="Or" style={{ width: 17, height: 17, borderRadius: "50%" }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#e3b64f" }}>{fmt(m.contrib)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end" }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: statusColor, boxShadow: `0 0 8px ${statusColor}88` }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>{m.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right rail */}
          <div style={{ width: 434, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
            {/* Identity */}
            <div style={{ flexShrink: 0, borderRadius: 16, background: "rgba(4,26,33,.5)", border: "1px solid rgba(227,182,79,.25)", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <div style={{ position: "relative", flexShrink: 0, width: 74, height: 74, borderRadius: 16, background: "radial-gradient(circle at 50% 35%, rgba(227,182,79,.22), rgba(4,26,33,.6))", border: "2px solid rgba(227,182,79,.6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(0,0,0,.45)" }}>
                  <img src={`${assetBase}/logo.png`} alt="Emblème de guilde" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 21, color: "#f2e2b0", lineHeight: 1.1 }}>{guild.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ padding: "3px 11px", borderRadius: 9, background: "#0a3540", border: "1.5px solid #e3b64f", fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 12, color: "#cbe64f" }}>Niveau {guild.level}</span>
                    <span style={{ padding: "3px 11px", borderRadius: 9, background: "rgba(95,191,106,.14)", border: "1px solid rgba(95,191,106,.5)", fontSize: 11, fontWeight: 800, color: "#8fd39a" }}>Rang {guild.rank}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontStyle: "italic", fontSize: 14.5, color: "#9fc3c9", lineHeight: 1.4 }}>{guild.motto}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 800 }}>
                  <span style={{ color: "#e3b64f", letterSpacing: ".08em" }}>XP DE GUILDE</span>
                  <span style={{ color: "#d6e8ea" }}>{guild.xp}</span>
                </div>
                <div style={{ position: "relative", height: 11, borderRadius: 6, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, width: guild.xpPct, background: "linear-gradient(90deg, #b8892e, #e3b64f)", borderRadius: 6 }} />
                </div>
              </div>
            </div>

            {/* Objectives */}
            {showObjectives && (
              <div style={{ flexShrink: 0, borderRadius: 16, background: "rgba(4,26,33,.5)", border: "1px solid rgba(227,182,79,.25)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>
                <SectionTitle>Objectifs de la semaine</SectionTitle>
                {objectives.map((o) => (
                  <div key={o.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#d6e8ea" }}>{o.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: "#eef6f6" }}>{o.count}</span>
                    </div>
                    <div style={{ position: "relative", height: 9, borderRadius: 5, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, width: o.pct, background: `linear-gradient(90deg, ${o.c1}, ${o.c2})`, borderRadius: 5 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Journal */}
            <div style={{ flex: 1, minHeight: 0, borderRadius: 16, background: "rgba(4,26,33,.5)", border: "1px solid rgba(227,182,79,.25)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <SectionTitle>Journal d'activité</SectionTitle>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, paddingRight: 4 }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0" }}>
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 11, height: 11, borderRadius: "50%", background: a.color, border: "2px solid rgba(4,26,33,.8)", boxShadow: `0 0 0 1px ${a.color}` }} />
                      <span style={{ flex: 1, width: 2, background: "rgba(227,182,79,.18)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 4 }}>
                      <div style={{ fontSize: 13, color: "#d6e8ea", lineHeight: 1.35 }}><span style={{ fontWeight: 800, color: a.color }}>{a.who}</span> {a.txt}</div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6f8f95" }}>{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 18, padding: "15px 24px 18px", background: "linear-gradient(0deg, rgba(4,26,33,.9), rgba(4,26,33,.35))", borderTop: "1px solid rgba(227,182,79,.35)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, flexShrink: 0 }}>
            <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 12, background: "rgba(227,182,79,.12)", border: "1px solid rgba(227,182,79,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={`${assetBase}/cur-or.png`} alt="Or" style={{ width: 28, height: 28, borderRadius: "50%" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#7fa8ae" }}>Trésor de guilde</span>
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "#e3b64f", lineHeight: 1 }}>{guild.treasury}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginLeft: "auto", width: 720 }}>
            {perks.map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(227,182,79,.14)" }}>
                <CheckIcon />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#d6e8ea", lineHeight: 1.2 }}>{p}</span>
              </div>
            ))}
          </div>
        </footer>
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="none" stroke="#7fa8ae" strokeWidth={2} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="#8fd39a" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
