"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import styles from "./page.module.css";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";

const COLORS = {
  pix: "#1d4ed8", // Azul forte
  card: "#60a5fa", // Azul claro
  billet: "#fbbf24", // Amarelo/Laranja
  other: "#4b5563", // Cinza
  revenue: "#8b5cf6", // Roxo lindo da Imagem 2 (PagTrust)
  spend: "#f43f5e", // Vermelho suave
  profit: "#10b981", // Verde (Lucro)
};

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState(null);
  const [dateFilter, setDateFilter] = useState("today");

  useEffect(() => {
    async function loadRealData() {
      setLoading(true);
      try {
        const orgId = getStoredOrganizationId();
        if (!orgId) return;

        // Puxando os dados reais dos nossos endpoints
        const [overviewRes, salesRes] = await Promise.all([
          apiFetch(`/api/dashboard/overview?organizationId=${orgId}`).catch(() => null),
          apiFetch(`/api/dashboard/external-sales/pagtrust?organizationId=${orgId}`).catch(() => null),
        ]);

        setOverview(overviewRes);
        setSales(salesRes);
      } catch (err) {
        console.error("Erro ao puxar dados do Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRealData();
  }, [dateFilter]);

  // Cálculos consolidados cruzando os dados do Meta com os de Vendas
  const totalSpend = Number(overview?.totalSpend || 0);
  const totalRevenue = Number(sales?.totalRevenue || 0);
  const profit = totalRevenue - totalSpend;
  const roi = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00";

  // Formatação em BRL
  const formatBRL = (val) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);

  // Gráfico de Pagamentos (Donut Chart idêntico ao da Utmify)
  const paymentData = sales?.salesByPaymentMethod || [
    { name: "Pix", value: 0, color: COLORS.pix },
    { name: "Cartão", value: 0, color: COLORS.card },
    { name: "Boleto", value: 0, color: COLORS.billet },
    { name: "Outros", value: 0, color: COLORS.other },
  ];

  // Gráfico da Imagem 2 (Receitas PagTrust Suave) 
  // Usa o profitByHour da nossa API para simular a flutuação diária
  const areaChartData = (sales?.profitByHour || []).map((h) => ({
    hora: h.hora,
    receita: h.valor > 0 ? h.valor : 0, // Área só de receita bruta por hora
    lucro: h.valor, 
    gasto: totalSpend / 24 // média simplificada para o gráfico
  }));

  if (loading) {
    return (
      <div className={styles.loadingContainer} style={{ padding: '2rem', color: '#fff' }}>
        <h2>Carregando dados da API...</h2>
        <p>Buscando estatísticas do Meta Ads e PagTrust.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0f111a', color: '#fff', minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Estilo Utmify */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#9ca3af', margin: '0.2rem 0 0 0' }}>CAPITAL PRIME, bora vender mais hoje?</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ backgroundColor: '#1f2937', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #374151' }}
          >
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
          </select>
          <button style={{ backgroundColor: '#2563eb', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
            Atualizar
          </button>
        </div>
      </header>

      {/* KPI Row (Faturamento, Gastos, ROI, Lucro) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Faturamento Líquido</p>
          <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 'bold' }}>{formatBRL(totalRevenue)}</h2>
        </div>
        <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Gastos com anúncios</p>
          <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 'bold' }}>{formatBRL(totalSpend)}</h2>
        </div>
        <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>ROI</p>
          <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 'bold', color: roi >= 1 ? '#10b981' : '#f43f5e' }}>{roi}</h2>
        </div>
        <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Lucro</p>
          <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 'bold', color: profit >= 0 ? '#10b981' : '#f43f5e' }}>{formatBRL(profit)}</h2>
        </div>
      </div>

      {/* Middle Section (Donut Chart & Secondary KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Vendas por Pagamento */}
        <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Vendas por Pagamento</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Customizada */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {paymentData.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico Gigante Roxo PagTrust (Estilo Imagem 2) */}
        <div style={{ backgroundColor: '#6366f1', padding: '1.5rem', borderRadius: '0.75rem', backgroundImage: 'linear-gradient(to right, #4f46e5, #6366f1)', position: 'relative' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#fff', fontWeight: 'bold' }}>Receitas PagTrust</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '0.5rem', color: '#fff' }} 
                  formatter={(val) => formatBRL(val)} 
                />
                <Area type="monotone" dataKey="receita" stroke="#fff" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico Utmify: Faturamento x Investimento x Lucro (Linhas e Áreas mescladas) */}
      <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Faturamento x Investimento x Lucro por Hora (Acumulado)</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.profit} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="hora" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${(val/1000)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} 
                formatter={(val) => formatBRL(val)}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="lucro" name="Lucro" stroke={COLORS.profit} fill="url(#colorLucro)" strokeWidth={2} />
              <Area type="monotone" dataKey="gasto" name="Investimento" stroke={COLORS.spend} fill="transparent" strokeWidth={2} />
              <Area type="monotone" dataKey="receita" name="Faturamento" stroke={COLORS.card} fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lucro por Horário (Barras) */}
      <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Vendas por Horário</h3>
        <div style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="hora" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: '#2d3042'}}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} 
                formatter={(val) => formatBRL(val)}
              />
              <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION: Funil de Conversão e Ranking Avançado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
        
        {/* Funil de Conversão (Meta Ads) */}
        <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Funil de Conversão (Meta Ads + PagTrust)</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '2rem' }}>
            {/* Barras em forma de funil manual */}
            {[
              { label: 'Cliques', val: 100, num: 477, color: '#3b82f6' },
              { label: 'Vis. Página', val: 74, num: 353, color: '#6366f1' },
              { label: 'ICs', val: 14.3, num: 68, color: '#8b5cf6' },
              { label: 'Vendas Inic.', val: 7.8, num: 37, color: '#a855f7' },
              { label: 'Vendas Apr.', val: 4.4, num: 21, color: '#ec4899' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem', textAlign: 'center' }}>{step.label}</div>
                <div style={{ width: '80%', height: `${step.val}%`, backgroundColor: step.color, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', transition: 'height 1s ease' }}>
                  {step.val}%
                </div>
                <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#e5e7eb' }}>{step.num}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela de Destaques / Ranking */}
        <div style={{ backgroundColor: '#1e202e', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #2d3042', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#e5e7eb' }}>Destaques (Rankings Avançados)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <td style={{ padding: '0.75rem 0', color: '#9ca3af' }}>Melhor Gancho (3s / Impr.)</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>Vid_04 (32.4%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <td style={{ padding: '0.75rem 0', color: '#9ca3af' }}>Maior Retenção Corpo (75% / Início)</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>Vid_02 (18.1%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <td style={{ padding: '0.75rem 0', color: '#9ca3af' }}>Maior CTR (Cliques/Impr.)</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>Img_Promo (4.2%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <td style={{ padding: '0.75rem 0', color: '#9ca3af' }}>Menor Custo IC</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#a855f7' }}>Vid_Oferta (R$ 14,20)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <td style={{ padding: '0.75rem 0', color: '#9ca3af' }}>Maior ROI (%)</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>Vid_04 (310%)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #374151' }}>
                <td style={{ padding: '0.75rem 0', color: '#9ca3af' }}>Maior Volume de Vendas</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ec4899' }}>Vid_01 (14 vendas)</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 0', color: '#9ca3af' }}>Maior Conversão (Vendas/Views)</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ec4899' }}>Img_Checkout (8.9%)</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
