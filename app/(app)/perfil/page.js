"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  cancelSubscriptionAtPeriodEnd,
  fetchBillingStatus,
  fetchMeProfile,
  formatPlanPrice,
  formatSubscriptionRenewal,
  planFeatureList,
  planPitch,
  subscriptionBadgeLabel,
} from "@/lib/billing";
import { getStoredOrganizationId } from "@/lib/hooko-session";
import styles from "./page.module.css";

const EMPTY_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  organization: "",
};

function deepEqualProfiles(a, b) {
  return (
    a.fullName === b.fullName &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.organization === b.organization
  );
}

function profileFromMe(me) {
  const orgId = getStoredOrganizationId();
  const memberships = me?.organizationsByMembership || me?.memberships || [];
  const match =
    memberships.find((m) => String(m.organizationId || m.organization?.id) === String(orgId)) ||
    memberships[0];

  return {
    fullName: match?.organization?.name || "",
    email: me?.email || "",
    phone: "",
    organization: match?.organization?.name || "",
  };
}

export default function PerfilPage() {
  const router = useRouter();
  const cancelDialogTitleId = useId();
  const closeBtnRef = useRef(null);

  const [saved, setSaved] = useState(EMPTY_PROFILE);
  const [draft, setDraft] = useState(EMPTY_PROFILE);
  const [savedFlash, setSavedFlash] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelErr, setCancelErr] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");
  const [planLoading, setPlanLoading] = useState(true);
  const [billing, setBilling] = useState(null);

  const dirty = useMemo(() => !deepEqualProfiles(draft, saved), [draft, saved]);

  const sub = billing?.subscription;
  const plan = sub?.plan;
  const usage = billing?.usage;

  const planName = plan?.displayName || (billing?.hasActiveSubscription ? "HOOKO" : "Nenhum plano activo");
  const planTagline = plan ? planPitch(plan) : "Escolha um plano para activar créditos e integrações.";
  const priceLabel = formatPlanPrice(plan) ? `${formatPlanPrice(plan)} / mês` : "—";
  const renewalLabel = formatSubscriptionRenewal(sub);
  const badgeLabel = subscriptionBadgeLabel(billing);
  const features = plan ? planFeatureList(plan) : ["Importação Meta & Drive", "Análise IA", "Integrações e webhooks"];

  const creativesUsed = Number(usage?.used || 0);
  const creativesLimit = usage?.limitless ? null : usage?.limit;
  const pct =
    creativesLimit != null && creativesLimit > 0
      ? Math.min(100, (creativesUsed / creativesLimit) * 100)
      : usage?.limitless
        ? 100
        : 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPlanLoading(true);
      try {
        const [me, status] = await Promise.all([
          fetchMeProfile().catch(() => null),
          fetchBillingStatus().catch(() => null),
        ]);
        if (cancelled) return;
        if (me) {
          const profile = profileFromMe(me);
          setSaved(profile);
          setDraft(profile);
        }
        setBilling(status);
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 2200);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  useEffect(() => {
    if (!cancelOpen) return;
    document.body.style.overflow = "hidden";
    setCancelErr("");
    setCancelSuccess("");
    const onKey = (e) => {
      if (e.key === "Escape") setCancelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(id);
    };
  }, [cancelOpen]);

  const onField = useCallback((key) => {
    return (e) => {
      const val = e.target.value;
      setDraft((prev) => ({ ...prev, [key]: val }));
    };
  }, []);

  const restoreDraft = useCallback(() => {
    setDraft(saved);
  }, [saved]);

  const saveDraft = useCallback(() => {
    setSaved({ ...draft });
    setSavedFlash(true);
  }, [draft]);

  const handleUpgrade = useCallback(() => {
    router.push("/checkout?mode=upgrade");
  }, [router]);

  const handleConfirmCancel = useCallback(async () => {
    setCancelErr("");
    setCancelBusy(true);
    try {
      const data = await cancelSubscriptionAtPeriodEnd();
      const status = await fetchBillingStatus();
      if (status) setBilling(status);
      setCancelSuccess(data?.message || "Renovação automática cancelada com sucesso.");
      window.setTimeout(() => setCancelOpen(false), 1800);
    } catch (e) {
      setCancelErr(e?.message || "Não foi possível cancelar a renovação automática.");
    } finally {
      setCancelBusy(false);
    }
  }, []);

  const cancelAlreadyScheduled = Boolean(sub?.cancelAtPeriodEnd);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Conta</p>
        <h1 className={styles.title}>Perfil</h1>
        <p className={styles.lede}>
          Actualiza os teus dados de contacto e vê o resumo da tua subscrição.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.formCard}`} aria-labelledby="profile-form-head">
          <h2 id="profile-form-head" className={styles.cardHead}>
            Dados do utilizador
          </h2>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              saveDraft();
            }}
          >
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pf-name">
                Nome completo
              </label>
              <input
                id="pf-name"
                className={styles.input}
                value={draft.fullName}
                onChange={onField("fullName")}
                autoComplete="name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pf-email">
                Email
              </label>
              <input
                id="pf-email"
                type="email"
                className={styles.input}
                value={draft.email}
                onChange={onField("email")}
                autoComplete="email"
                readOnly
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pf-phone">
                Telefone
              </label>
              <input
                id="pf-phone"
                type="tel"
                className={styles.input}
                value={draft.phone}
                onChange={onField("phone")}
                autoComplete="tel"
                placeholder="Opcional"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pf-org">
                Organização / marca
              </label>
              <input
                id="pf-org"
                className={styles.input}
                value={draft.organization}
                onChange={onField("organization")}
                autoComplete="organization"
              />
              <p className={styles.hint}>Aparecerá nos relatórios e faturação quando configurado.</p>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={!dirty}>
                Guardar alterações
              </button>
              <button type="button" className={styles.btnGhost} onClick={restoreDraft} disabled={!dirty}>
                Repôr alterações
              </button>
              {savedFlash ? (
                <span className={styles.toastSaved} role="status">
                  Dados atualizados
                </span>
              ) : null}
            </div>
          </form>
        </section>

        <aside className={`${styles.card} ${styles.planCard}`} aria-labelledby="profile-plan-head">
          <div className={styles.planWrap}>
            <div className={styles.planAccent} aria-hidden />

            <div className={styles.planTop}>
              <span className={styles.planBadge}>{planLoading ? "A carregar…" : badgeLabel}</span>
              <h2 id="profile-plan-head" className={styles.planSectionTitle}>
                O teu plano
              </h2>
            </div>

            <div className={styles.planHero}>
              <div className={styles.planHeroMain}>
                <h3 className={styles.planName}>{planLoading ? "…" : planName}</h3>
                <p className={styles.planTagline}>{planLoading ? "A sincronizar com Stripe…" : planTagline}</p>
              </div>
              <div className={styles.planPriceTag} aria-label={`Preço ${priceLabel}`}>
                {planLoading ? "…" : priceLabel}
              </div>
            </div>

            <p className={styles.planRenewal}>
              <span className={styles.planRenewalDot} aria-hidden />
              {planLoading ? "A carregar renovação…" : renewalLabel}
            </p>

            <div className={styles.usageShell}>
              <div className={styles.usageHead}>
                <span>Créditos de criativos</span>
                <span className={styles.usageFraction}>
                  {creativesUsed}
                  <span className={styles.usageOf}>/</span>
                  {usage?.limitless ? "∞" : creativesLimit ?? "—"}
                </span>
              </div>
              <div
                className={styles.usageBar}
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Utilização de créditos de criativos"
              >
                <div className={styles.usageFill} style={{ width: `${pct}%` }} />
              </div>
              <p className={styles.usageFoot}>
                {usage?.limitless
                  ? "Importações ilimitadas neste plano"
                  : creativesLimit
                    ? `${Math.round(pct)}% do limite mensal utilizado`
                    : "Sem limite activo — escolha um plano"}
              </p>
            </div>

            <p className={styles.featureTitle}>Incluído no plano</p>
            <ul className={styles.featureBoard}>
              {features.map((f) => (
                <li key={f} className={styles.featureLi}>
                  <span className={styles.featureCheck} aria-hidden>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span className={styles.featureText}>{f}</span>
                </li>
              ))}
            </ul>

            <div className={styles.planActions}>
              <button type="button" className={styles.btnUpgrade} onClick={handleUpgrade}>
                Fazer upgrade
              </button>
              <button
                type="button"
                className={styles.btnCancelSub}
                onClick={() => setCancelOpen(true)}
                disabled={(!billing?.hasActiveSubscription && !billing?.bypass) || cancelAlreadyScheduled}
              >
                {cancelAlreadyScheduled ? "Renovação já cancelada" : "Cancelar subscrição"}
              </button>
              <p className={styles.subNote}>
                Upgrade abre o checkout com planos públicos ou exclusivos da sua org. Cancelar para a cobrança automática no fim do período.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {cancelOpen ? (
        <div className={styles.overlay} role="presentation">
          <div className={styles.backdrop} aria-hidden onClick={() => !cancelBusy && setCancelOpen(false)} />
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={cancelDialogTitleId}
          >
            <h3 id={cancelDialogTitleId} className={styles.dialogTitle}>
              Cancelar renovação automática
            </h3>
            <p className={styles.dialogBody}>
              O teu plano continua activo até ao fim do período já pago. Depois disso não haverá nova cobrança no cartão
              — o pagamento recorrente fica cancelado aqui no HOOKO.
            </p>
            {cancelSuccess ? <p className={styles.dialogSuccess}>{cancelSuccess}</p> : null}
            {cancelErr ? <p className={styles.dialogError}>{cancelErr}</p> : null}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.btnCancelSub}
                disabled={cancelBusy || Boolean(cancelSuccess)}
                onClick={handleConfirmCancel}
              >
                {cancelBusy ? "A cancelar…" : "Confirmar cancelamento"}
              </button>
              <button
                ref={closeBtnRef}
                type="button"
                className={styles.btnGhost}
                disabled={cancelBusy}
                onClick={() => setCancelOpen(false)}
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
