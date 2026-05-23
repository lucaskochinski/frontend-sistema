/**
 * Mapa de origem dos dados por widget (Meta Graph API vs PagTrust/webhook vs calculado).
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-account/insights
 */
export const DATA_SOURCE = {
  META: "meta",
  PAGTRUST: "pagtrust",
  CALCULATED: "calculated",
  UNAVAILABLE: "unavailable",
};

export const CHART_DATA_SOURCES = {
  summaryKpi: {
    revenue: { source: DATA_SOURCE.PAGTRUST, metaField: null, note: "Webhook PagTrust/Utmify — Meta não envia faturamento líquido." },
    spend: { source: DATA_SOURCE.META, metaField: "spend", note: "Insights API · spend" },
    roi: { source: DATA_SOURCE.CALCULATED, metaField: null, note: "Receita PagTrust ÷ gasto Meta" },
    profit: { source: DATA_SOURCE.CALCULATED, metaField: null, note: "Receita − gasto Meta" },
  },
  secondaryMetrics: {
    arpu: { source: DATA_SOURCE.CALCULATED, note: "Receita ÷ vendas aprovadas" },
    cpa: { source: DATA_SOURCE.CALCULATED, metaField: "cost_per_action_type", note: "Gasto Meta ÷ compras (actions purchase)" },
    margin: { source: DATA_SOURCE.CALCULATED, note: "Lucro ÷ receita" },
    pendingSales: { source: DATA_SOURCE.PAGTRUST, note: "Status pendente no webhook" },
    refunds: { source: DATA_SOURCE.PAGTRUST, note: "Meta não rastreia reembolso de gateway" },
  },
  salesByPayment: {
    source: DATA_SOURCE.PAGTRUST,
    metaField: null,
    note: "Pix/Cartão/Boleto vêm do gateway. Meta não informa método de pagamento.",
  },
  profitByHour: {
    source: DATA_SOURCE.CALCULATED,
    metaField: null,
    note: "Receita horária PagTrust − gasto Meta rateado no período. Meta não entrega spend por hora na série diária sync.",
  },
  cumulativeHourly: {
    source: DATA_SOURCE.CALCULATED,
    note: "Acumulado hora a hora (PagTrust + gasto Meta rateado)",
  },
  salesByProduct: {
    source: DATA_SOURCE.PAGTRUST,
    metaField: null,
    note: "Usa utm_campaign como proxy. Catálogo de produtos exige Catalog API + pixel content_ids.",
  },
  salesBySource: {
    pagtrust: { source: DATA_SOURCE.PAGTRUST, metaField: "utm_source", note: "utm_source do webhook" },
    meta: { source: DATA_SOURCE.META, metaField: "publisher_platform", note: "Breakdown publisher_platform (FB/IG)" },
  },
  approvalRate: {
    source: DATA_SOURCE.PAGTRUST,
    note: "Aprovadas ÷ total por método. Meta não tem taxa de aprovação de pagamento.",
  },
  salesByHour: { source: DATA_SOURCE.PAGTRUST, note: "Horário da venda no webhook" },
  salesByDayOfWeek: { source: DATA_SOURCE.PAGTRUST, note: "Dia da semana da venda" },
  metaFunnel: {
    source: DATA_SOURCE.META,
    fields: [
      "clicks",
      "actions:landing_page_view",
      "actions:initiate_checkout",
      "actions:add_to_cart (fallback vendas inic.)",
      "actions:purchase (fallback vendas apr.)",
    ],
    note: "Cliques, page view e IC vêm da Meta. Vendas Inic./Apr. vêm do PagTrust quando conectado.",
  },
  metaDailySpend: { source: DATA_SOURCE.META, metaField: "spend", note: "time_increment=1 · spend" },
  pagtrustRevenue: {
    source: DATA_SOURCE.PAGTRUST,
    note: "Receita diária aprovada via webhook PagTrust — a Meta não envia faturamento de gateway.",
  },
  metaRankings: {
    source: DATA_SOURCE.META,
    note: "Rankings por anúncio importado com insights sincronizados (nível ad, período selecionado).",
    metrics: {
      bestHook: { fields: ["video_3_sec_watched_actions", "impressions"], formula: "3s ÷ impressões" },
      bestRetention: { fields: ["video_p75_watched_actions", "video_play_actions"], formula: "75% ÷ plays" },
      bestCtr: { fields: ["clicks", "impressions"], formula: "CTR" },
      bestCostIc: { fields: ["spend", "actions:initiate_checkout"], formula: "CPIc" },
      bestRoi: { fields: ["action_values:purchase", "spend"], formula: "ROI % Meta" },
      bestSalesVolume: { fields: ["actions:purchase"], formula: "volume compras" },
      bestConversionRate: { fields: ["actions:purchase", "landing_page_view"], formula: "compras ÷ views" },
    },
  },
  metaMetricsPanel: {
    source: DATA_SOURCE.META,
    note: "Impressões, vídeo, rankings, breakdowns",
  },
};

export const SOURCE_LABELS = {
  [DATA_SOURCE.META]: "Meta Ads",
  [DATA_SOURCE.PAGTRUST]: "PagTrust",
  [DATA_SOURCE.CALCULATED]: "Calculado",
  [DATA_SOURCE.UNAVAILABLE]: "Indisponível",
};
