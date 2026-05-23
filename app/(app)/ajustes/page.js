"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  apiFetch,
  getApiBase,
  getStoredAccessToken,
  getStoredOrganizationId,
  persistSession,
} from "@/lib/hooko-session";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import styles from "./page.module.css";

/**
 * @typedef {{ id: string, organizationsByMembership?: Array<{ organizationId: string, organization?: { name?: string } }>, memberships?: Array<{ organizationId: string }> }} MeProfile
 */

function rowsFromProfile(/** @type {MeProfile | null} */ profile) {
  if (!profile) return [];
  const detailed = profile.organizationsByMembership;
  if (Array.isArray(detailed) && detailed.length > 0) return detailed;
  const lean = profile.memberships;
  if (Array.isArray(lean) && lean.length > 0) {
    return lean.map((m) => ({ organizationId: m.organizationId }));
  }
  return [];
}

function IconSlidersHeader({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4 7h16M4 12h10M4 17h14" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="17" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function copyText(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

export default function AjustesPage() {
  const apiBase = getApiBase();
  const [tokenPresent, setTokenPresent] = useState(false);
  const [me, setMe] = useState(/** @type {MeProfile | null} */ (null));
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [busyMeta, setBusyMeta] = useState(false);
  const [busyDrive, setBusyDrive] = useState(false);
  const [busyPortal, setBusyPortal] = useState(false);
  const [plans, setPlans] = useState([]);

  const syncTokenFlag = useCallback(() => {
    setTokenPresent(Boolean(getStoredAccessToken()));
  }, []);

  useEffect(() => {
    syncTokenFlag();
    const sid = getStoredOrganizationId();
    if (sid) setSelectedOrgId(sid);
  }, [syncTokenFlag]);

  useEffect(() => {
    if (!apiBase || !getStoredAccessToken()) {
      setMe(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/auth/me");
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, tokenPresent]);

  useEffect(() => {
    if (!apiBase) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/plans/public", { headers: {} });
        if (!cancelled) setPlans(Array.isArray(res?.items) ? res.items : []);
      } catch {
        if (!cancelled) setPlans([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const organizations = useMemo(() => rowsFromProfile(me), [me]);

  useEffect(() => {
    if (!organizations.length) return;
    const stored = getStoredOrganizationId();
    const validStored = Boolean(stored && organizations.some((r) => r.organizationId === stored));

    if (organizations.length === 1) {
      const only = organizations[0].organizationId;
      setSelectedOrgId(only);
      persistSession({ organizationId: only });
      return;
    }
    if (validStored) {
      setSelectedOrgId(stored);
      return;
    }
    const fallback = organizations[0].organizationId;
    setSelectedOrgId(fallback);
    persistSession({ organizationId: fallback });
  }, [organizations]);

  const orgReady = Boolean(selectedOrgId && organizations.some((r) => r.organizationId === selectedOrgId));
  const canConnect = Boolean(apiBase && tokenPresent && orgReady);

  const vturbWebhookUrl = useMemo(() => {
    if (!selectedOrgId) return "";
    return `${apiBase}/api/webhooks/vturb?organizationId=${selectedOrgId}`;
  }, [apiBase, selectedOrgId]);

  const pagtrustWebhookUrl = useMemo(() => {
    if (!selectedOrgId) return "";
    return `${apiBase}/api/webhooks/pagtrust?organizationId=${selectedOrgId}`;
  }, [apiBase, selectedOrgId]);

  const startOAuth = async (path, setBusy) => {
    if (!canConnect || !selectedOrgId) return;
    setBusy(true);
    try {
      const qs = new URLSearchParams({ organizationId: selectedOrgId.trim() });
      const data = await apiFetch(`${path}?${qs.toString()}`, { headers: {} });
      const url = data?.authorizeUrl;
      if (typeof url === "string" && url.length > 0) {
        window.location.href = url;
      }
    } catch {
      /* silencioso */
    } finally {
      setBusy(false);
    }
  };

  const openBillingPortal = async () => {
    if (!canConnect || !selectedOrgId) return;
    setBusyPortal(true);
    try {
      const data = await apiFetch("/api/billing/portal", {
        method: "POST",
        body: JSON.stringify({ organizationId: selectedOrgId }),
      });
      if (data?.url) window.location.href = data.url;
    } catch {
      /* silencioso */
    } finally {
      setBusyPortal(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topHeader}>
        <div className={styles.topHeaderGlow} aria-hidden />
        <div className={styles.topHeaderInner}>
          <div className={styles.topHeaderMain}>
            <div className={styles.topIconWrap} aria-hidden>
              <IconSlidersHeader className={styles.topIconSvg} />
            </div>
            <div className={styles.topTitleBlock}>
              <h1 className={styles.topPageTitle}>Ajustes</h1>
              <p className={styles.topHint}>
                Integrações, aparência, plano e webhooks de vendas (PagTrust, VTurb).
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.main}>
        <section className={styles.row} aria-labelledby="theme-h">
          <div className={styles.thumbIcon} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.rowGrow}>
            <h2 id="theme-h" className={styles.rowTitle}>
              Aparência
            </h2>
            <p className={styles.rowText}>Alterne entre tema claro e escuro. A preferência fica guardada neste browser.</p>
          </div>
          <div className={styles.rowActions}>
            <ThemeToggle />
          </div>
        </section>

        <section className={styles.row} aria-labelledby="meta-h">
          <div className={styles.thumb}>
            <Image src="/imagens/meta.png" alt="" width={120} height={120} />
          </div>
          <div className={styles.rowGrow}>
            <h2 id="meta-h" className={styles.rowTitle}>
              Meta Ads
            </h2>
            <p className={styles.rowText}>Conecta a tua conta da Meta para importares criativos e veres campanhas.</p>
          </div>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!canConnect || busyMeta}
              onClick={() => startOAuth("/api/meta/oauth/authorize-url", setBusyMeta)}
            >
              {busyMeta ? "A redirecionar…" : "Ligar Meta"}
            </button>
          </div>
        </section>

        <section className={styles.row} aria-labelledby="drive-h">
          <div className={styles.thumb}>
            <Image src="/imagens/google-drive.png" alt="" width={120} height={120} />
          </div>
          <div className={styles.rowGrow}>
            <h2 id="drive-h" className={styles.rowTitle}>
              Google Drive
            </h2>
            <p className={styles.rowText}>Autoriza o Google Drive para importares ou leres os teus ficheiros.</p>
          </div>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!canConnect || busyDrive}
              onClick={() => startOAuth("/api/google-drive/oauth/authorize-url", setBusyDrive)}
            >
              {busyDrive ? "A redirecionar…" : "Ligar Drive"}
            </button>
          </div>
        </section>

        <section className={styles.row} aria-labelledby="vturb-h">
          <div className={styles.thumbIcon} aria-hidden>
            <span className={styles.vturbMark}>VT</span>
          </div>
          <div className={styles.rowGrow}>
            <h2 id="vturb-h" className={styles.rowTitle}>
              VTurb / ConverteAI
            </h2>
            <p className={styles.rowText}>
              Integração parcial: webhook de vendas + embed do player no detalhe do criativo. Não há OAuth VTurb —
              configure o webhook abaixo e ligue o ID do player em cada anúncio.
            </p>
            {vturbWebhookUrl ? (
              <div className={styles.webhookBox}>
                <code className={styles.webhookCode}>{vturbWebhookUrl}</code>
                <button type="button" className={styles.btn} onClick={() => copyText(vturbWebhookUrl)}>
                  Copiar
                </button>
              </div>
            ) : null}
            <p className={styles.rowHint}>
              Use <code>utm_term</code> no payload igual ao ID Meta do anúncio para cruzamento de vendas.
            </p>
          </div>
        </section>

        <section className={styles.row} aria-labelledby="pagtrust-h">
          <div className={styles.thumbIcon} aria-hidden>
            <span className={styles.pagtrustMark}>PT</span>
          </div>
          <div className={styles.rowGrow}>
            <h2 id="pagtrust-h" className={styles.rowTitle}>
              PagTrust
            </h2>
            <p className={styles.rowText}>Webhook de vendas para alimentar o dashboard de receitas.</p>
            {pagtrustWebhookUrl ? (
              <div className={styles.webhookBox}>
                <code className={styles.webhookCode}>{pagtrustWebhookUrl}</code>
                <button type="button" className={styles.btn} onClick={() => copyText(pagtrustWebhookUrl)}>
                  Copiar
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.row} aria-labelledby="plan-h">
          <div className={styles.thumbIcon} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 10h18" strokeLinecap="round" />
            </svg>
          </div>
          <div className={styles.rowGrow}>
            <h2 id="plan-h" className={styles.rowTitle}>
              Plano e faturação
            </h2>
            <p className={styles.rowText}>
              Gerencie assinatura, faturas e cancelamento via portal Stripe.
            </p>
            {plans.length > 0 ? (
              <ul className={styles.planList}>
                {plans.slice(0, 3).map((plan) => (
                  <li key={plan.id}>
                    <strong>{plan.name || plan.key}</strong>
                    {plan.priceCents != null ? ` — R$ ${(Number(plan.priceCents) / 100).toFixed(2)}/mês` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.rowHint}>Planos disponíveis após login.</p>
            )}
          </div>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!canConnect || busyPortal}
              onClick={openBillingPortal}
            >
              {busyPortal ? "A abrir…" : "Portal de faturação"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
