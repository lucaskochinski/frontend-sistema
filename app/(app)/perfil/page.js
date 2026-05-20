"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

const MOCK_SAVED_PROFILE = {
  fullName: "Conta demo",
  email: "demo@hooko.ai",
  phone: "+351 912 345 678",
  organization: "Hooko Labs",
};

const MOCK_PLAN = {
  id: "growth",
  name: "Growth",
  priceLabel: "49 € / mês",
  renewalLabel: "Próxima renovação estimada · 12 jun. 2026",
  creativesUsed: 14,
  creativesLimit: 50,
  features: [
    "Importação Meta & Drive com créditos de criativos",
    "Análise IA dos vídeos importados",
    "Integrações (Meta, Drive) e webhooks Stripe",
    "Suporte por email",
  ],
};

function deepEqualProfiles(a, b) {
  return (
    a.fullName === b.fullName &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.organization === b.organization
  );
}

export default function PerfilPage() {
  const cancelDialogTitleId = useId();
  const closeBtnRef = useRef(null);

  const [saved, setSaved] = useState(MOCK_SAVED_PROFILE);
  const [draft, setDraft] = useState(MOCK_SAVED_PROFILE);
  const [savedFlash, setSavedFlash] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const dirty = useMemo(() => !deepEqualProfiles(draft, saved), [draft, saved]);

  useEffect(() => {
    if (!savedFlash) return;
    const t = window.setTimeout(() => setSavedFlash(false), 2200);
    return () => window.clearTimeout(t);
  }, [savedFlash]);

  useEffect(() => {
    if (!cancelOpen) return;
    document.body.style.overflow = "hidden";
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

  const pct = MOCK_PLAN.creativesLimit
    ? Math.min(100, (MOCK_PLAN.creativesUsed / MOCK_PLAN.creativesLimit) * 100)
    : 0;

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
              <span className={styles.planBadge}>Subscrição activa</span>
              <h2 id="profile-plan-head" className={styles.planSectionTitle}>
                O teu plano
              </h2>
            </div>

            <div className={styles.planHero}>
              <div className={styles.planHeroMain}>
                <h3 className={styles.planName}>{MOCK_PLAN.name}</h3>
                <p className={styles.planTagline}>Para equipas a crescer com criativos e IA</p>
              </div>
              <div className={styles.planPriceTag} aria-label={`Preço ${MOCK_PLAN.priceLabel}`}>
                {MOCK_PLAN.priceLabel}
              </div>
            </div>

            <p className={styles.planRenewal}>
              <span className={styles.planRenewalDot} aria-hidden />
              {MOCK_PLAN.renewalLabel}
            </p>

            <div className={styles.usageShell}>
              <div className={styles.usageHead}>
                <span>Créditos de criativos</span>
                <span className={styles.usageFraction}>
                  {MOCK_PLAN.creativesUsed}
                  <span className={styles.usageOf}>/</span>
                  {MOCK_PLAN.creativesLimit}
                </span>
              </div>
              <div className={styles.usageBar} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Utilização de créditos de criativos">
                <div className={styles.usageFill} style={{ width: `${pct}%` }} />
              </div>
              <p className={styles.usageFoot}>{Math.round(pct)}% do limite mensal utilizado</p>
            </div>

            <p className={styles.featureTitle}>Incluído no plano</p>
            <ul className={styles.featureBoard}>
              {MOCK_PLAN.features.map((f) => (
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
              <Link href="/checkout" className={styles.btnUpgrade}>
                Fazer upgrade
              </Link>
              <button type="button" className={styles.btnCancelSub} onClick={() => setCancelOpen(true)}>
                Cancelar subscrição
              </button>
              <p className={styles.subNote}>Upgrade e gestão de pagamentos no checkout e no portal da Stripe.</p>
            </div>
          </div>
        </aside>
      </div>

      {cancelOpen ? (
        <div className={styles.overlay} role="presentation">
          <div className={styles.backdrop} aria-hidden onClick={() => setCancelOpen(false)} />
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={cancelDialogTitleId}
          >
            <h3 id={cancelDialogTitleId} className={styles.dialogTitle}>
              Cancelar subscrição
            </h3>
            <p className={styles.dialogBody}>
              Quando integrarmos Stripe, será aberto o portal de cliente para rever faturação e dar baixa ao plano. Por
              agora só confirmamos aqui este fluxo.
            </p>
            <div className={styles.dialogActions}>
              <button
                ref={closeBtnRef}
                type="button"
                className={styles.btnPrimary}
                onClick={() => setCancelOpen(false)}
              >
                Está bem
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
