/**
 * Design tokens — SOURCE UNIQUE des couleurs / rayons / typos de l'app mobile.
 *
 * Transposition fidèle de `alcazan-front-prod/src/styles/_tokens.scss` (refonte graphique
 * du 20/07/2026). Même règle que sur le web : AUCUN hex en dur ailleurs, on passe
 * toujours par `colors.*`. Ce qui n'existe pas en React Native (dégradés, flou, ombres
 * portées CSS) est exposé ici sous forme de tableaux de couleurs prêts pour
 * `expo-linear-gradient` ou de presets d'ombre.
 */

export const colors = {
  /* --- Or (accent principal) --- */
  gold: '#e3b64f',
  goldHover: '#f2d488',
  goldSoft: 'rgba(227, 182, 79, 0.3)',
  goldSofter: 'rgba(227, 182, 79, 0.12)',
  goldBorder: 'rgba(227, 182, 79, 0.45)',
  goldBorderStrong: 'rgba(227, 182, 79, 0.55)',
  goldBgHover: 'rgba(227, 182, 79, 0.2)',
  goldDivider: 'rgba(227, 182, 79, 0.25)',
  goldHalf: 'rgba(227, 182, 79, 0.5)',
  goldCardBorder: 'rgba(227, 182, 79, 0.16)',
  goldFieldBorder: 'rgba(227, 182, 79, 0.22)',
  goldMiniBorder: 'rgba(227, 182, 79, 0.4)',

  /* --- Fonds --- */
  bgTop: '#06303b',
  bgBottom: '#041e26',
  panel: 'rgba(8, 40, 50, 0.85)',
  panelSolid: '#08222a',
  panelSoft: 'rgba(8, 40, 50, 0.55)',
  panelInner: 'rgba(4, 26, 33, 0.55)',
  headerBg: 'rgba(4, 26, 33, 0.6)',
  actionBarBg: 'rgba(4, 26, 33, 0.95)',
  badgeBg: '#0a3540',
  ink: '#05242c',

  /* --- HUD flottant de la carte (mobile uniquement) ---
     Plus transparent qu'un panneau : il SURVOLE le décor, il ne doit pas le boucher. */
  hudBg: 'rgba(4, 22, 28, 0.74)',
  hudBgStrong: 'rgba(4, 22, 28, 0.9)',
  hudBorder: 'rgba(227, 182, 79, 0.26)',
  hudTrack: 'rgba(0, 0, 0, 0.45)',
  scrim: 'rgba(4, 20, 26, 0.72)',
  toastBg: 'rgba(4, 26, 33, 0.94)',
  /* Croix directionnelle : presque du verre au repos, elle ne se densifie que sous le
     pouce. */
  padBg: 'rgba(4, 22, 28, 0.34)',
  padBgActif: 'rgba(4, 22, 28, 0.58)',
  padBorder: 'rgba(227, 182, 79, 0.3)',
  padGlyph: 'rgba(238, 246, 246, 0.7)',
  padThumb: 'rgba(227, 182, 79, 0.28)',

  /* --- Marqueurs posés sur la carte --- */
  mapDot: 'rgba(255, 255, 255, 0.62)',
  mapDotBorder: 'rgba(4, 26, 33, 0.45)',
  mapLabelBg: 'rgba(4, 22, 28, 0.72)',
  mapLabelCible: 'rgba(169, 31, 28, 0.92)',
  ringMoi: 'rgba(227, 182, 79, 0.5)',
  ringCible: 'rgba(224, 74, 57, 0.5)',

  /* --- Textes --- */
  text: '#eef6f6',
  textDim: '#b7d2d6',
  textMute: '#9fc3c9',
  textFaint: '#7fa8ae',
  textIce: '#cfe3e5',
  textDim2: '#6f959b',
  textDim3: '#557077',
  textSoft: '#c4dbde',
  level: '#cbe64f',
  levelSoftBg: 'rgba(203, 230, 79, 0.12)',
  levelBorder: 'rgba(203, 230, 79, 0.5)',
  goldPale: '#f2e2b0',

  /* --- Barres (PV / PM / XP / PA) --- */
  track: 'rgba(255, 255, 255, 0.08)',
  hpFrom: '#a91f1c',
  hpTo: '#e04a39',
  hpLabel: '#ef7b6d',
  mpFrom: '#1d5fa8',
  mpTo: '#3f8fdd',
  mpLabel: '#6fb4f0',
  xpFrom: '#b8892e',
  xpTo: '#e3b64f',
  paLabel: '#f0a95c',

  /* --- Karma (jauge bipolaire) --- */
  karmaFrom: '#8c3b2f',
  karmaMid: '#b7d2d6',
  karmaTo: '#3f9c7a',
  karmaLabel: '#8fd0b4',

  /* --- Slots --- */
  slotDash: 'rgba(159, 195, 201, 0.3)',
  slotEmptyBg: 'rgba(255, 255, 255, 0.03)',
  slotGhost: 'rgba(159, 195, 201, 0.32)',
  spellThumbBg: '#0a2027',

  /* --- Surfaces internes --- */
  rowBg: 'rgba(255, 255, 255, 0.03)',
  badgeNeutralBg: 'rgba(255, 255, 255, 0.04)',
  pastilleBg: '#0a2c36',
  badgeDarkBg: 'rgba(6, 28, 34, 0.8)',
  qtyBadgeBg: 'rgba(6, 26, 33, 0.92)',

  /* --- Raretés --- */
  rarityCommun: '#8ba0a6',
  rarityPeuCommun: '#5fbf6a',
  rarityRare: '#3f8fdd',
  rarityEpique: '#b06be6',
  rarityLegendaire: '#e3b64f',
  rarityHeroique: '#e04a39',

  /* --- Danger --- */
  danger: '#e04a39',
  dangerBorder: 'rgba(224, 74, 57, 0.5)',
  dangerBgHover: 'rgba(224, 74, 57, 0.18)',
  dangerText: '#e78a7d',

  /* --- Succès / état positif --- */
  success: '#6ed69a',
  successBorder: 'rgba(110, 214, 154, 0.5)',
  successBg: 'rgba(110, 214, 154, 0.12)',
  warningBorder: 'rgba(240, 169, 92, 0.6)',

  /* --- Podium des classements --- */
  podiumArgent: '#c9d6d8',
  podiumBronze: '#c98a52',

  /* --- Caractéristiques --- */
  statConstitution: '#e04a39',
  statForce: '#e3b64f',
  statDexterite: '#5fbf6a',
  statIntelligence: '#3f8fdd',
  statConcentration: '#b06be6',
  statChance: '#f0a95c',
  bonus: '#8fd39a',

  /* --- Présence --- */
  presenceEnLigne: '#6ed69a',
  presenceHorsLigne: '#557077',
} as const;

/** Dégradés, pour `expo-linear-gradient` (le CSS `linear-gradient` n'existe pas en RN). */
export const gradients = {
  page: [colors.bgTop, colors.bgBottom] as const,
  modal: ['#0a2c36', '#06232b'] as const,
  hp: [colors.hpFrom, colors.hpTo] as const,
  mp: [colors.mpFrom, colors.mpTo] as const,
  xp: [colors.xpFrom, colors.xpTo] as const,
  karma: [colors.karmaFrom, colors.karmaMid, colors.karmaTo] as const,
  gold: [colors.gold, '#8a6a22'] as const,
};

export const radius = {
  bar: 6,
  tab: 8,
  slot: 10,
  nav: 12,
  card: 14,
  panel: 16,
  panelLg: 18,
  pill: 999,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/**
 * Polices chargées par `app/_layout.tsx` (@expo-google-fonts). Les noms doivent
 * correspondre EXACTEMENT aux clés passées à `useFonts`, sinon RN retombe
 * silencieusement sur la police système.
 */
export const fonts = {
  title: 'Cinzel_600SemiBold',
  titleBold: 'Cinzel_700Bold',
  body: 'NunitoSans_400Regular',
  bodyBold: 'NunitoSans_700Bold',
} as const;

/** Équivalents des `box-shadow` du web (iOS + Android dans le même objet). */
export const shadows = {
  panel: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatar: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modal: {
    shadowColor: '#000',
    shadowOpacity: 0.65,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 20,
  },
} as const;

/** Couleurs de rareté indexées par nom de rareté renvoyé par le back. */
export function couleurRarete(rarete?: string | null): string {
  switch ((rarete || '').toLowerCase()) {
    case 'peu commun':
    case 'peu-commun':
      return colors.rarityPeuCommun;
    case 'rare':
      return colors.rarityRare;
    case 'épique':
    case 'epique':
      return colors.rarityEpique;
    case 'légendaire':
    case 'legendaire':
      return colors.rarityLegendaire;
    case 'héroïque':
    case 'heroique':
      return colors.rarityHeroique;
    default:
      return colors.rarityCommun;
  }
}
