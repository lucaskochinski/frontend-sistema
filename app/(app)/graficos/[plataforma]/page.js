"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
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
import styles from "./page.module.css";

// Dados mockados de vendas por forma de pagamento (Gráfico Rosca)
const PAYMENTS_DATA = [
  { name: "Pix", value: 846, color: "#1d4ed8" },       // Azul Escuro
  { name: "Cartão", value: 438, color: "#60a5fa" },    // Azul Claro
  { name: "Boleto", value: 112, color: "#fbbf24" },    // Amarelo
  { name: "Outros", value: 24, color: "#4b5563" },     // Cinza
];

const TOTAL_SALES_COUNT = PAYMENTS_DATA.reduce((acc, row) => acc + row.value, 0);

// Dados mockados de lucro/prejuízo por hora (Gráfico de Barras Bi-direcional)
const HOURLY_PROFIT_DATA = [
  { hora: "00:00", valor: 1200 },
  { hora: "01:00", valor: 800 },
  { hora: "02:00", valor: 350 },
  { hora: "03:00", valor: -150 }, // Prejuízo (ads rodando sem conversão)
  { hora: "04:00", valor: -300 },
  { hora: "05:00", valor: -100 },
  { hora: "06:00", valor: 200 },
  { hora: "07:00", valor: 1400 },
  { hora: "08:00", valor: 2800 },
  { hora: "09:00", valor: 4500 },
  { hora: "10:00", valor: 6200 },
  { hora: "11:00", valor: 8500 },
  { hora: "12:00", valor: 9400 },
  { hora: "13:00", valor: 7800 },
  { hora: "14:00", valor: 5900 },
  { hora: "15:00", valor: 6300 },
  { hora: "16:00", valor: 7200 },
  { hora: "17:00", valor: 9100 },
  { hora: "18:00", valor: 11500 },
  { hora: "19:00", valor: 14200 },
  { hora: "20:00", valor: 15800 },
  { hora: "21:00", valor: 13400 },
  { hora: "22:00", valor: 8900 },
  { hora: "23:00", valor: 4200 },
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
  const [refreshing, setRefreshing] = useState(false);

  // Simulação de ação de atualizar dados
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

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
                Visão de performance, ROI, lucratividade e volume de conversão unificada.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className={styles.btnPrimary}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l.73-.73" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {refreshing ? "Carregando..." : "Atualizar"}
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

      {/* 3. Grid de Cartões de Métricas (13 cards) */}
      <div className={styles.cardsGrid}>
        
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Faturamento Líquido</h3>
          <p className={styles.cardValue}>R$ 124.500,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Gastos com Anúncios</h3>
          <p className={styles.cardValue} style={{ color: "#f87171" }}>R$ 45.200,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>ROI Global</h3>
          <p className={`${styles.cardValue} ${styles.cardValuePositive}`}>2.75x</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Lucro Líquido</h3>
          <p className={`${styles.cardValue} ${styles.cardValuePositive}`}>R$ 79.300,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vendas por Pagamento (Total)</h3>
          <p className={styles.cardValue}>{TOTAL_SALES_COUNT} un</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vendas Pendentes</h3>
          <p className={styles.cardValue} style={{ color: "#fbbf24" }}>R$ 14.800,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Margem Líquida</h3>
          <p className={`${styles.cardValue} ${styles.cardValuePositive}`}>63.69%</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Despesas Adicionais</h3>
          <p className={styles.cardValue} style={{ color: "#94a3b8" }}>R$ 3.400,00</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>ARPU (Médio)</h3>
          <p className={styles.cardValue}>R$ 87,67</p>
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
              <p className={styles.pieLabelNumber}>{TOTAL_SALES_COUNT}</p>
              <p className={styles.pieLabelText}>Vendas</p>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PAYMENTS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {PAYMENTS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
            {PAYMENTS_DATA.map((row) => (
              <div key={row.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: row.color, display: "inline-block" }} />
                <span style={{ color: "#94a3b8" }}>{row.name}:</span>
                <span style={{ color: "#fff", fontWeight: "600" }}>{row.value} un ({Math.round((row.value / TOTAL_SALES_COUNT) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel Direito: Lucro por Horário (Barras Positivas/Negativas) */}
        <div className={styles.chartPanel}>
          <h2 className={styles.chartPanelTitle}>Lucro por Horário</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={HOURLY_PROFIT_DATA}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis 
                  dataKey="hora" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{
                    background: "#18191a",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    color: "#fff"
                  }}
                  formatter={(val) => [`R$ ${parseFloat(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, val >= 0 ? "Lucro" : "Prejuízo"]}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="valor">
                  {HOURLY_PROFIT_DATA.map((entry, index) => {
                    // Barra azul se positivo, vermelha se negativo
                    const color = entry.valor >= 0 ? "#2563eb" : "#ef4444";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
