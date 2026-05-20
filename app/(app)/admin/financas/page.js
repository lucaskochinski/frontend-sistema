"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/hooko-session";
import { TableSkeleton } from "@/components/Skeleton/Skeleton.js";
import s from "../adminShared.module.css";

const USE_MOCK = false;

const MOCK_SUMMARY = {
  subscriptionsByStatus: [
    { status: "active", count: 42 },
    { status: "past_due", count: 3 },
    { status: "canceled", count: 18 },
  ],
  invoicesOpenAmountDueCents: "184900",
};

const MOCK_SUBS = [
  { id: "s1", organization: { name: "Agência Aurora" }, plan: { displayName: "HOOKO Pro", tierKey: "pro" }, status: "active", stripeSubscriptionId: "sub_demo_001" },
  { id: "s2", organization: { name: "Studio Mix" }, plan: { displayName: "HOOKO Basic", tierKey: "basic" }, status: "trialing", stripeSubscriptionId: "sub_demo_002" },
];

const MOCK_INV = [
  {
    id: "i1",
    organization: { name: "Agência Aurora" },
    status: "open",
    amountDueCents: 4900,
    stripeInvoiceId: "in_demo_aa",
  },
  {
    id: "i2",
    organization: { name: "ScaleUp Labs" },
    status: "open",
    amountDueCents: 12900,
    stripeInvoiceId: "in_demo_sl",
  },
];

export default function AdminFinancasPage() {
  const [loaded, setLoaded] = useState(!USE_MOCK);
  const [sum, setSum] = useState(USE_MOCK ? MOCK_SUMMARY : null);
  const [subs, setSubs] = useState(USE_MOCK ? MOCK_SUBS : []);
  const [inv, setInv] = useState(USE_MOCK ? MOCK_INV : []);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (USE_MOCK) {
      const t = window.setTimeout(() => setLoaded(true), 840);
      return () => window.clearTimeout(t);
    }
    let cancelled = false;
    (async () => {
      try {
        const [sumData, subsData, invData] = await Promise.all([
          apiFetch("/api/admin/finance/summary"),
          apiFetch("/api/admin/finance/subscriptions?limit=40"),
          apiFetch("/api/admin/finance/invoices?limit=40"),
        ]);
        if (cancelled) return;
        setSum(sumData);
        setSubs(Array.isArray(subsData.items) ? subsData.items : []);
        setInv(Array.isArray(invData.items) ? invData.items : []);
        setLoaded(true);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Erro ao carregar finanças");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const euros = (cents) => {
    const n = Number(cents || 0);
    if (!Number.isFinite(n)) return "—";
    return `${(n / 100).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  };

  const statusRows = Array.isArray(sum?.subscriptionsByStatus) ? sum.subscriptionsByStatus : [];

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Admin</p>
        <h1 className={s.title}>Finanças</h1>
        <p className={s.lede}>{USE_MOCK ? "Dados sintéticos + skeleton inicial — define USE_MOCK = false para API real." : "Assinaturas e faturas da plataforma."}</p>
      </header>

      {USE_MOCK ? (
        <p style={{ marginBottom: "0.85rem", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(212,175,55,0.85)" }}>
          USE_MOCK = true
        </p>
      ) : null}

      {err ? <p className={s.err}>{err}</p> : null}

      {!loaded ? (
        <>
          <div className={s.gridKpi}>
            {[1, 2, 3].map((k) => (
              <div key={k} className={s.kpi} style={{ minHeight: "5rem" }}>
                <TableSkeleton rows={2} />
              </div>
            ))}
          </div>
          <div className={s.cardTable} style={{ padding: "1rem" }}>
            <TableSkeleton rows={8} />
          </div>
        </>
      ) : (
        <>
          <div className={s.gridKpi}>
            <div className={s.kpi}>
              <p className={s.kpiMuted}>Em dívida (faturas abertas)</p>
              <p className={s.kpiStrong}>{sum ? euros(sum.invoicesOpenAmountDueCents) : "—"}</p>
            </div>
            {statusRows.map((row) => (
              <div key={String(row.status)} className={s.kpi}>
                <p className={s.kpiMuted}>Subscrições · {String(row.status)}</p>
                <p className={s.kpiStrong}>{row.count != null ? String(row.count) : "—"}</p>
              </div>
            ))}
          </div>

          <section className={s.section} aria-labelledby="subs-head">
            <h2 id="subs-head" className={s.sectionTitle}>
              Assinaturas recentes
            </h2>
            <div className={s.cardTable}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Organização</th>
                    <th>Plano</th>
                    <th>Estado</th>
                    <th>Stripe sub.</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ color: "rgba(161,161,170,0.9)" }}>
                        Sem registos.
                      </td>
                    </tr>
                  ) : (
                    subs.map((row) => (
                      <tr key={row.id}>
                        <td>{row.organization?.name || row.organizationId || "—"}</td>
                        <td>{row.plan?.displayName || row.plan?.tierKey || "—"}</td>
                        <td>{row.status || "—"}</td>
                        <td className={s.mono}>{row.stripeSubscriptionId || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={s.section} aria-labelledby="inv-head">
            <h2 id="inv-head" className={s.sectionTitle}>
              Faturas recentes
            </h2>
            <div className={s.cardTable}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Organização</th>
                    <th>Estado</th>
                    <th>Valor em dívida</th>
                    <th>Stripe inv.</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ color: "rgba(161,161,170,0.9)" }}>
                        Sem registos.
                      </td>
                    </tr>
                  ) : (
                    inv.map((row) => (
                      <tr key={row.id}>
                        <td>{row.organization?.name || row.organizationId || "—"}</td>
                        <td>{row.status || "—"}</td>
                        <td>{euros(row.amountDueCents)}</td>
                        <td className={s.mono}>{row.stripeInvoiceId || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
