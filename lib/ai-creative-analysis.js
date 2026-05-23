/** Normaliza `aiAnalysis` da API (Gemini holístico) para UI de cards HOOKO. */

const INSIGHT_COPY = {
  gancho: {
    title: "Gancho forte",
    description: "Prende a atenção nos 3 primeiros segundos.",
  },
  prova: {
    title: "Prova clara",
    description: "Aumenta confiança e credibilidade.",
  },
  oferta: {
    title: "Oferta relevante",
    description: "Conecta desejo com dor do público.",
  },
  cta: {
    title: "CTA directo",
    description: "Estimula acção imediata e conversão.",
  },
};

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function readDetailedScores(raw) {
  if (!raw || typeof raw !== "object") return {};
  const detailed = raw.notasDetalhadas || raw.notas_detalhadas || raw.notas;
  if (detailed && typeof detailed === "object") {
    return {
      gancho: clampScore(detailed.gancho ?? detailed.hook),
      oferta: clampScore(detailed.oferta ?? detailed.offer),
      prova: clampScore(detailed.prova_social ?? detailed.prova ?? detailed.social_proof),
      cta: clampScore(detailed.cta),
    };
  }
  return {
    gancho: clampScore(raw.hook_score ?? raw.hookScore),
    oferta: clampScore(raw.offer_score ?? raw.offerScore),
    prova: clampScore(raw.social_proof_score ?? raw.socialProofScore),
    cta: clampScore(raw.cta_score ?? raw.ctaScore),
  };
}

function readHarmonia(raw) {
  if (!raw || typeof raw !== "object") return null;
  const text = raw.harmonia_entre_video_e_texto ?? raw.harmonia ?? raw.feedback;
  if (typeof text === "number") return clampScore(text);
  if (typeof text === "string" && /^\d+$/.test(text.trim())) return clampScore(text);
  return null;
}

function computeRetentionScore({ videoMetrics, detailed }) {
  const vm = videoMetrics || {};
  const plays = Number(vm.videoPlays ?? vm.video_plays ?? vm.plays) || 0;
  const p75 = Number(vm.videoP75 ?? vm.video_p75 ?? vm.p75Watched) || 0;
  if (plays > 0 && p75 >= 0) {
    return clampScore((p75 / plays) * 100);
  }
  if (detailed.gancho != null && detailed.prova != null) {
    return clampScore((detailed.gancho + detailed.prova) / 2);
  }
  return null;
}

function computeFormatScore({ detailed, harmonia }) {
  if (harmonia != null) return harmonia;
  const values = [detailed.gancho, detailed.oferta, detailed.prova, detailed.cta].filter(
    (v) => v != null,
  );
  if (!values.length) return null;
  return clampScore(values.reduce((a, b) => a + b, 0) / values.length);
}

function averageScores(values) {
  const nums = values.filter((v) => v != null);
  if (!nums.length) return null;
  return clampScore(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function readSuggestions(raw) {
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw.sugestoes)) return raw.sugestoes.map(String).filter(Boolean);
  if (typeof raw.sugestoes === "string" && raw.sugestoes.trim()) return [raw.sugestoes.trim()];
  return [];
}

function scalePotentialLabel(score) {
  if (score == null) return null;
  if (score >= 85) return "Alto potencial de escala";
  if (score >= 70) return "Potencial moderado de escala";
  return "Precisa optimizar antes de escalar";
}

/**
 * @param {Record<string, unknown> | null | undefined} rawAi
 * @param {{ videoMetrics?: Record<string, unknown>, rollup?: Record<string, unknown>, aiUi?: Record<string, unknown> | null }} [context]
 */
export function normalizeAiCreativeAnalysis(rawAi, context = {}) {
  if (context.aiUi && typeof context.aiUi === "object") {
    return context.aiUi;
  }
  if (rawAi?.ui && typeof rawAi.ui === "object" && !context.videoMetrics) {
    return rawAi.ui;
  }

  const raw = rawAi && typeof rawAi === "object" ? rawAi : null;
  const detailed = readDetailedScores(raw);
  const harmonia = readHarmonia(raw);
  const retencao = computeRetentionScore({ videoMetrics: context.videoMetrics, detailed });
  const formato = computeFormatScore({ detailed, harmonia });

  const performanceScore =
    clampScore(raw?.nota) ??
    averageScores([detailed.gancho, retencao, detailed.oferta, detailed.prova, detailed.cta, formato]);

  const pending = performanceScore == null && !raw;

  const insights = [
    { key: "gancho", ...INSIGHT_COPY.gancho, score: detailed.gancho },
    { key: "prova", ...INSIGHT_COPY.prova, score: detailed.prova },
    { key: "oferta", ...INSIGHT_COPY.oferta, score: detailed.oferta },
    { key: "cta", ...INSIGHT_COPY.cta, score: detailed.cta },
  ];

  const verdict =
    (typeof raw?.harmonia_entre_video_e_texto === "string" && raw.harmonia_entre_video_e_texto) ||
    (typeof raw?.gancho === "string" && raw.gancho) ||
    (typeof raw?.feedback === "string" && raw.feedback) ||
    "";

  return {
    pending,
    performanceScore,
    successProbability: performanceScore,
    scores: {
      gancho: detailed.gancho,
      retencao,
      oferta: detailed.oferta,
      prova: detailed.prova,
      cta: detailed.cta,
      formato,
      harmonia,
    },
    insights,
    verdict,
    suggestions: readSuggestions(raw),
    scalePotential: scalePotentialLabel(performanceScore),
    raw,
  };
}

/** Cor do score (verde / amarelo / vermelho) como na referência visual. */
export function scoreTone(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "muted";
  if (n >= 80) return "good";
  if (n >= 65) return "mid";
  return "low";
}

/** Mapeia item da API `/dashboard/insights` para card da grelha. */
export function mapInsightToGridItem(item) {
  const ai = normalizeAiCreativeAnalysis(item?.aiAnalysis, {
    aiUi: item?.aiUi,
    rollup: item?.rollup,
  });
  return {
    adId: item?.adId,
    adName: item?.adName || "Criativo",
    thumbnailUrl: item?.thumbnailUrl || "/imagens/meta.png",
    score: ai.performanceScore,
    pending: ai.pending,
    href: item?.adId ? `/criativo/${item.adId}` : null,
  };
}
