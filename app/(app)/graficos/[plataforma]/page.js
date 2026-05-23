"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import { CHART_GRID, CHART_TICK, DASHBOARD_COLORS, chartTooltipStyle } from "@/components/Dashboard/dashboardTheme";
import styles from "./page.module.css";

const DEFAULT_PAYMENTS = [
  { name: "Pix", value: 0, color: DASHBOARD_COLORS.pix },
  { name: "Cartão", value: 0, color: DASHBOARD_COLORS.card },
  { name: "Boleto", value: 0, color: DASHBOARD_COLORS.billet },
  { name: "Outros", value: 0, color: DASHBOARD_COLORS.other },
];

export default function PlatformDashboard() {
  const { plataforma } = useParams();
  
  // Normalizar nome exibido da plataforma
  const platformName = typeof plataforma === "string" 
    ? plataforma.charAt(0).toUpperCase() + plataforma.slice(1).toLowerCase() 
    : "Dashboard";

  // Estados dos filtros
  const [period, setPeriod] = useState("30d");
  const [account, setAccount] = useState("all");
  const [source, setSource] = useState("all");
  const [subPlatform, setSubPlatform] = useState("all");
  const [product, setProduct] = useState("all");

  // Estados dos dados reais vindos da API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    salesByPaymentMethod: DEFAULT_PAYMENTS,
    profitByHour: [],
    revenueByHour: [],
    isDemoData: true,
  });
  const [metaOverview, setMetaOverview] = useState(null);

  const periodToApi = (p) => {
    if (p === "today" || p === "yesterday") return "today";
    if (p === "7d") return "week";
    if (p === "30d" || p === "month") return "month";
    return "month";
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const orgId = getStoredOrganizationId();
      const apiPeriod = periodToApi(period);
      const [salesData, overviewData] = await Promise.all([
        apiFetch(`/api/dashboard/external-sales/${plataforma}?organizationId=${orgId}&period=${apiPeriod}`).catch(() => null),
        apiFetch(`/api/dashboard/overview?organizationId=${orgId}&period=${apiPeriod}`).catch(() => null),
      ]);

      setMetaOverview(overviewData);

      if (salesData) {
        setStats({
          totalRevenue: parseFloat(salesData.totalRevenue || 0),
          totalSales: parseInt(salesData.totalSales || 0, 10),
          salesByPaymentMethod:
            Array.isArray(salesData.salesByPaymentMethod) && salesData.salesByPaymentMethod.length > 0
              ? salesData.salesByPaymentMethod
              : DEFAULT_PAYMENTS,
          profitByHour: Array.isArray(salesData.revenueByHour)
            ? salesData.revenueByHour
            : Array.isArray(salesData.profitByHour)
              ? salesData.profitByHour
              : [],
          revenueByHour: Array.isArray(salesData.revenueByHour) ? salesData.revenueByHour : [],
          isDemoData: !!salesData.isDemoData,
        });
      }
    } catch (err) {
      console.error("❌ Erro ao buscar estatísticas do painel:", err);
      setError("Não foi possível carregar as métricas de vendas externas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (plataforma) {
      fetchStats();
    }
  }, [plataforma, period]);

  const adSpend = Number(metaOverview?.totalSpend || 0);
  const calculatedRevenue = stats.totalRevenue;
  const calculatedROI = adSpend > 0 ? (calculatedRevenue / adSpend).toFixed(2) : "0.00";
  const calculatedProfit = calculatedRevenue - adSpend;
  const calculatedMargin = calculatedRevenue > 0 ? ((calculatedProfit / calculatedRevenue) * 100).toFixed(2) : "0.00";

  return (
    <div className={styles.page}>
      
      {/* 1. Header do Dashboard */}
      <div className={styles.topHeader}>
        <div className={styles.topHeaderGlow} />
        <div className={styles.topHeaderInner}>
          <div className={styles.topHeaderLeft}>
            <div className={styles.topIconWrap}>
              <svg
                className={styles.topIconSvg}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M4 19h16" strokeLinecap="round" />
                <path d="M7 17V9m5 8v-8m5 13V5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles.topTitleBlock}>
              <h1 className={styles.topPageTitle}>Dashboard - {platformName}</h1>
              <p className={styles.topHint}>
                {stats.isDemoData 
                  ? "⚠️ Visualizando dados demonstrativos (envie um webhook para ativar dados reais)."
                  : "🚀 Conectado com sucesso à base de dados do webhook de vendas externas."}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className={styles.btnPrimary}
            onClick={fetchStats}
            disabled={loading}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l.73-.73" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {/* 2. Barra de Filtros */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Período de Visualização</span>
          <select className={styles.select} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="month">Este Mês</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Conta de Anúncio</span>
          <select className={styles.select} value={account} onChange={(e) => setAccount(e.target.value)}>
            <option value="all">Qualquer</option>
            <option value="ac1">Conta principal (Meta)</option>
            <option value="ac2">Conta secundária (Google)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Fonte de Tráfego</span>
          <select className={styles.select} value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="all">Qualquer</option>
            <option value="facebook">Meta Ads</option>
            <option value="google">Google Ads</option>
            <option value="tiktok">TikTok Ads</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Plataforma</span>
          <select className={styles.select} value={subPlatform} onChange={(e) => setSubPlatform(e.target.value)}>
            <option value="all">Qualquer</option>
            <option value="kiwify">Kiwify</option>
            <option value="perfectpay">Perfect Pay</option>
            <option value="hotmart">Hotmart</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Produto</span>
          <select className={styles.select} value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="all">Qualquer</option>
            <option value="p1">Ebook Seca Rápido</option>
            <option value="p2">Método Hooko Pro</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: "1rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* 3. Grid de Cartões de Métricas (13 cards) */}
      <div className={styles.cardsGrid}>
        
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Faturamento Líquido</h3>
          <p className={styles.cardValue}>
            {loading ? "..." : `R$ ${calculatedRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Gastos com Anúncios</h3>
          <p className={styles.cardValue} style={{ color: "#f87171" }}>
            {loading ? "..." : `R$ ${adSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>ROI Global</h3>
          <p className={`${styles.cardValue} ${parseFloat(calculatedROI) >= 1 ? styles.cardValuePositive : ""}`} style={{ color: parseFloat(calculatedROI) < 1 ? "#f87171" : "" }}>
            {loading ? "..." : `${calculatedROI}x`}
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Lucro Líquido</h3>
          <p className={`${styles.cardValue} ${calculatedProfit >= 0 ? styles.cardValuePositive : ""}`} style={{ color: calculatedProfit < 0 ? "#f87171" : "" }}>
            {loading ? "..." : `R$ ${calculatedProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vendas por Pagamento (Total)</h3>
          <p className={styles.cardValue}>
            {loading ? "..." : `${stats.totalSales} un`}
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vendas Pendentes</h3>
          <p className={styles.cardValue} style={{ color: "#fbbf24" }}>R$ 14.800,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Margem Líquida</h3>
          <p className={`${styles.cardValue} ${parseFloat(calculatedMargin) >= 0 ? styles.cardValuePositive : ""}`} style={{ color: parseFloat(calculatedMargin) < 0 ? "#f87171" : "" }}>
            {loading ? "..." : `${calculatedMargin}%`}
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Despesas Adicionais</h3>
          <p className={styles.cardValue} style={{ color: "#94a3b8" }}>R$ 3.400,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>ARPU (Médio)</h3>
          <p className={styles.cardValue}>
            {loading ? "..." : `R$ ${(stats.totalSales > 0 ? (calculatedRevenue / stats.totalSales) : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Volume de Reembolso</h3>
          <p className={styles.cardValue} style={{ color: "#f87171" }}>R$ 2.150,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>CPA Médio</h3>
          <p className={styles.cardValue}>R$ 31,83</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Volume Chargeback</h3>
          <p className={styles.cardValue} style={{ color: "#ef4444" }}>R$ 890,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Taxas Gateway</h3>
          <p className={styles.cardValue} style={{ color: "#f87171" }}>R$ 6.225,00</p>
        </div>

      </div>

      {/* 4. Área de Gráficos (Recharts) */}
      <div className={styles.chartsSection}>
        
        {/* Painel Esquerdo: Vendas por Pagamento (Rosca) */}
        <div className={styles.chartPanel}>
          <h2 className={styles.chartPanelTitle}>Vendas por Pagamento</h2>
          <div className={styles.chartContainer}>
            
            {/* Rótulo Central do Anel */}
            <div className={styles.pieLabelCenter}>
              <p className={styles.pieLabelNumber}>{loading ? "..." : stats.totalSales}</p>
              <p className={styles.pieLabelText}>Vendas</p>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.salesByPaymentMethod}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.salesByPaymentMethod.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#4b5563"} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: "#18191a", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "0.8rem", color: "#fff" }} 
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda do PieChart */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {stats.salesByPaymentMethod.map((row) => (
              <div key={row.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: row.color || "#4b5563", display: "inline-block" }} />
                <span style={{ color: "#94a3b8" }}>{row.name}:</span>
                <span style={{ color: "#fff", fontWeight: "600" }}>
                  {row.value} un ({stats.totalSales > 0 ? Math.round((row.value / stats.totalSales) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel Direito: Lucro por Horário (Barras Positivas/Negativas) */}
        <div className={styles.chartPanel}>
          <h2 className={styles.chartPanelTitle}>Receita por horário (PagTrust)</h2>
          <div className={styles.chartContainer}>
            {loading ? (
              <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Carregando gráfico...</div>
            ) : stats.profitByHour.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.profitByHour}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="hora"
                    stroke={CHART_TICK}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={CHART_TICK}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(212, 175, 55, 0.06)" }}
                    contentStyle={chartTooltipStyle()}
                    formatter={(val) => [`R$ ${parseFloat(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Receita"]}
                  />
                  <ReferenceLine y={0} stroke="rgba(212, 175, 55, 0.25)" />
                  <Bar dataKey="valor" fill={DASHBOARD_COLORS.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Sem dados analíticos por hora.</div>
            )}
          </div>
        </div>

      </div>

      {/* CSS Spin Keyframes */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
