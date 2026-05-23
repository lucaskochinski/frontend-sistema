"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatBRL } from "@/components/MetaMetrics/MetaMetricsPanel";
import DashboardCard from "./DashboardCard";
import { DATA_SOURCE } from "./metaDataSources";
import { CHART_TICK, chartTooltipStyle } from "./dashboardTheme";
import styles from "./dashboard.module.css";

function fmtMoney(value, currency = "BRL") {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(n);
  } catch {
    return formatBRL(n);
  }
}

function BreakdownTable({ rows, emptyText }) {
  if (!rows?.length) {
    return <p className={styles.emptyText}>{emptyText}</p>;
  }
  return (
    <div className={styles.tableScroll}>
      <table className={styles.listTable}>
        <thead>
          <tr>
            <th>Segmento</th>
            <th>Gasto</th>
            <th>Cliques</th>
            <th>Compras</th>
            <th>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{fmtMoney(row.spend)}</td>
              <td>{Number(row.clicks || 0).toLocaleString("pt-BR")}</td>
              <td>{Number(row.purchases || 0).toLocaleString("pt-BR")}</td>
              <td>{row.roas != null ? `${row.roas}x` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WarningNote({ warning }) {
  if (!warning) return null;
  return <p className={styles.metaWarn}>{warning}</p>;
}

export default function MetaExtendedSection({ metaExtended }) {
  if (!metaExtended) return null;

  if (!metaExtended.available) {
    return (
      <DashboardCard title="Marketing API (completo)" source={DATA_SOURCE.META}>
        <p className={styles.emptyText}>
          {metaExtended.reason === "no_meta_ad_account"
            ? "Importe anúncios Meta para activar billing, breakdowns e estrutura de campanhas."
            : "Conecte a Meta (OAuth ou token de sistema) para carregar dados em tempo real."}
        </p>
      </DashboardCard>
    );
  }

  const currency = metaExtended.billing?.currency || "BRL";
  const billing = metaExtended.billing;

  return (
    <div className={styles.metaExtendedGrid}>
      <DashboardCard title="Conta de anunciante (billing)" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.billingWarning} />
        {billing ? (
          <div className={styles.secondaryGrid}>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Gasto acumulado</p>
              <p className={styles.miniValue}>{fmtMoney(billing.amountSpent, currency)}</p>
            </div>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Saldo devedor</p>
              <p className={styles.miniValue}>{fmtMoney(billing.balance, currency)}</p>
            </div>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Spend cap</p>
              <p className={styles.miniValue}>
                {billing.spendCap != null ? fmtMoney(billing.spendCap, currency) : "Sem limite"}
              </p>
            </div>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Pagamento</p>
              <p className={styles.miniValue}>{billing.fundingSource?.typeLabel || "—"}</p>
            </div>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Tipo conta</p>
              <p className={styles.miniValue}>{billing.isPrepayAccount ? "Pré-pago" : "Pós-pago"}</p>
            </div>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Fuso</p>
              <p className={styles.miniValue}>{billing.timezoneName || "—"}</p>
            </div>
          </div>
        ) : (
          <p className={styles.emptyText}>Billing indisponível para esta conta.</p>
        )}
      </DashboardCard>

      <DashboardCard title="Gasto por hora (Meta)" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.hourlySpendWarning} />
        {metaExtended.hourlySpend?.some((h) => h.spend > 0) ? (
          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metaExtended.hourlySpend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hora" tick={CHART_TICK} interval={2} />
                <YAxis tick={CHART_TICK} width={48} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => fmtMoney(v, currency)} />
                <Bar dataKey="spend" name="Gasto" fill="rgba(212,175,55,0.75)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className={styles.emptyText}>Sem entrega horária no período.</p>
        )}
      </DashboardCard>

      <DashboardCard title="Plataforma & posicionamento" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.platformBreakdownWarning} />
        <BreakdownTable
          rows={metaExtended.platformBreakdown}
          emptyText="Breakdown publisher_platform indisponível."
        />
      </DashboardCard>

      <DashboardCard title="Demografia (idade × género)" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.demographicsWarning} />
        <BreakdownTable rows={metaExtended.demographics} emptyText="Sem breakdown demográfico." />
      </DashboardCard>

      <DashboardCard title="Assets criativos (DCO)" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.creativeAssetsWarning} />
        <BreakdownTable rows={metaExtended.creativeAssets} emptyText="Sem variantes body/title/video." />
      </DashboardCard>

      <DashboardCard title="Mensagens (Marketing Messages)" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.messagingWarning} />
        {metaExtended.messaging?.items?.length ? (
          <table className={styles.listTable}>
            <thead>
              <tr>
                <th>Acção</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {metaExtended.messaging.items.map((row) => (
                <tr key={row.actionType}>
                  <td>{row.label}</td>
                  <td>{row.count.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.emptyText}>Sem campanhas de mensagem no período.</p>
        )}
      </DashboardCard>

      <DashboardCard title="Catálogo / Commerce" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.catalogWarning} />
        {metaExtended.catalog ? (
          <div className={styles.secondaryGrid}>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Produtos convertidos</p>
              <p className={styles.miniValue}>
                {Number(metaExtended.catalog.convertedProductQuantity || 0).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Valor convertido</p>
              <p className={styles.miniValue}>
                {fmtMoney(metaExtended.catalog.convertedProductValue, currency)}
              </p>
            </div>
            <div className={styles.miniMetric}>
              <p className={styles.miniLabel}>Catálogo (valor)</p>
              <p className={styles.miniValue}>
                {fmtMoney(metaExtended.catalog.catalogSegmentValue, currency)}
              </p>
            </div>
          </div>
        ) : (
          <p className={styles.emptyText}>Sem dados de catálogo (pixel + catálogo necessários).</p>
        )}
      </DashboardCard>

      <DashboardCard title="Leilão (auction insights)" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.auctionWarning} />
        {metaExtended.auction?.length ? (
          <div className={styles.tableScroll}>
            <table className={styles.listTable}>
              <thead>
                <tr>
                  <th>Anúncio</th>
                  <th>Gasto</th>
                  <th>Competitividade</th>
                  <th>Lance concorrente</th>
                </tr>
              </thead>
              <tbody>
                {metaExtended.auction.map((row) => (
                  <tr key={row.adId || row.adName}>
                    <td>{row.adName || row.adId}</td>
                    <td>{fmtMoney(row.spend, currency)}</td>
                    <td>{row.auctionCompetitiveness ?? "—"}</td>
                    <td>{row.auctionMaxCompetitorBid ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyText}>Auction insights indisponíveis para estes anúncios.</p>
        )}
      </DashboardCard>

      <DashboardCard title="Transacções Meta" source={DATA_SOURCE.META}>
        <WarningNote warning={metaExtended.transactionsWarning} />
        {metaExtended.transactions?.length ? (
          <div className={styles.tableScroll}>
            <table className={styles.listTable}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {metaExtended.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.time ? new Date(tx.time).toLocaleString("pt-BR") : "—"}</td>
                    <td>{tx.chargeType || "—"}</td>
                    <td>{tx.amount != null ? fmtMoney(tx.amount, tx.currency || currency) : "—"}</td>
                    <td>{tx.status || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyText}>Sem transacções ou permissão insuficiente.</p>
        )}
      </DashboardCard>

      <DashboardCard title="Estrutura campanhas & ad sets" source={DATA_SOURCE.META} className={styles.spanFull}>
        <WarningNote warning={metaExtended.structureWarning} />
        {metaExtended.campaignStructure?.length ? (
          <div className={styles.structureList}>
            {metaExtended.campaignStructure.slice(0, 8).map((camp) => (
              <details key={camp.id} className={styles.structureItem}>
                <summary>
                  <strong>{camp.name}</strong>
                  <span className={styles.structureMeta}>
                    {camp.objective} · {camp.status}
                    {camp.dailyBudget != null ? ` · ${fmtMoney(camp.dailyBudget, currency)}/dia` : ""}
                  </span>
                </summary>
                {camp.adSets?.length ? (
                  <ul className={styles.structureAdsets}>
                    {camp.adSets.map((as) => (
                      <li key={as.id}>
                        {as.name} — {as.optimizationGoal || as.destinationType || as.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyText}>Sem ad sets listados.</p>
                )}
              </details>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>Estrutura indisponível.</p>
        )}
      </DashboardCard>
    </div>
  );
}
