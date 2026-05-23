/** Identidade HOOKO — paleta dourada para gráficos */
export const HOOKO_GOLD = {
  primary: "#d4af37",
  bright: "#ffd700",
  light: "#f5e6b8",
  dark: "#b8941f",
  darker: "#8f7320",
  bronze: "#a38b2a",
  amber: "#eab308",
  muted: "#6b5a2a",
};

/** Tons dourados para séries distintas (donut, áreas, barras) */
export const DASHBOARD_COLORS = {
  pix: HOOKO_GOLD.bright,
  card: HOOKO_GOLD.primary,
  billet: HOOKO_GOLD.dark,
  other: "#78716c",
  revenue: HOOKO_GOLD.bright,
  spend: HOOKO_GOLD.dark,
  profit: HOOKO_GOLD.primary,
  loss: HOOKO_GOLD.darker,
  meta: HOOKO_GOLD.primary,
  accent: HOOKO_GOLD.primary,
  line: HOOKO_GOLD.bright,
  lineActive: HOOKO_GOLD.primary,
  funnelStart: HOOKO_GOLD.dark,
  funnelMid: HOOKO_GOLD.primary,
  funnelEnd: HOOKO_GOLD.bright,
};

/** Variações para cards de ranking (todos na família dourada) */
export const RANKING_ACCENTS = [
  HOOKO_GOLD.bright,
  HOOKO_GOLD.primary,
  HOOKO_GOLD.amber,
  HOOKO_GOLD.dark,
  HOOKO_GOLD.light,
  HOOKO_GOLD.bronze,
  HOOKO_GOLD.darker,
];

export const CHART_GRID = "rgba(212, 175, 55, 0.12)";
export const CHART_TICK = "rgba(212, 175, 55, 0.72)";

export function chartTooltipStyle() {
  if (typeof document === "undefined") return CHART_TOOLTIP_DARK;
  const theme = document.documentElement.getAttribute("data-theme");
  return theme === "light" ? CHART_TOOLTIP_LIGHT : CHART_TOOLTIP_DARK;
}

const CHART_TOOLTIP_DARK = {
  backgroundColor: "rgba(15, 12, 4, 0.94)",
  border: "1px solid rgba(212, 175, 55, 0.28)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#f5e6b8",
};

const CHART_TOOLTIP_LIGHT = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(184, 148, 31, 0.35)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#09090b",
};

/** @deprecated use chartTooltipStyle() */
export const CHART_TOOLTIP = CHART_TOOLTIP_DARK;

export const DAY_LABELS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
