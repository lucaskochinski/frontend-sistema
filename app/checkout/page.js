"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  clearCheckoutRequired,
  fetchBillingStatus,
  fetchCheckoutPlans,
  hasActiveBillingAccess,
  startCheckout,
} from "@/lib/billing";
import { getStoredAccessToken, getStoredOrganizationId } from "@/lib/hooko-session";
import styles from "./page.module.css";

function formatImports(limits) {
  const n = limits?.creative_imports_per_month;
  if (n == null) return "Importações personalizadas";
  if (n === Infinity || n > 999999) return "Importações ilimitadas";
  return `${n.toLocaleString("pt-PT")} importações / mês`;
}

function formatMinutes(limits) {
  const n = limits?.transcription_minutes_per_month;
  if (n == null) return null;
  if (n === Infinity || n > 999999) return "Transcrição ilimitada";
  return `${n.toLocaleString("pt-PT")} min de transcrição / mês`;
}

function formatVideo(limits) {
  const mb = limits?.max_video_size_mb;
  const sec = limits?.max_video_duration_seconds;
  if (mb == null && sec == null) return null;
  const parts = [];
  if (mb != null) parts.push(`Vídeos até ${mb} MB`);
  if (sec != null) parts.push(`até ${Math.floor(sec / 60)} min`);
  return parts.join(" · ");
}

function planPitch(tierKey) {
  const key = String(tierKey || "").toLowerCase();
  if (key.includes("starter") || key === "starter") {
    return "Ideal para validar criativos e começar a escalar com Meta Ads.";
  }
  if (key.includes("pro") || key === "pro") {
    return "Para equipas que importam volume e precisam de insights consistentes.";
  }
  if (key.includes("scale") || key === "scale") {
    return "Operação avançada, alto volume e limites generosos para crescer sem travas.";
  }
  return "Plano pensado para a sua operação de performance e criativos.";
}

function planFeatures(plan) {
  const limits = plan?.limits || {};
  return [
    formatImports(limits),
    formatMinutes(limits),
    formatVideo(limits),
    Number(plan?.trialDays) > 0 ? `${plan.trialDays} dias para testar grátis` : "Facturação mensal",
  ].filter(Boolean);
}

function isPopularPlan(tierKey, index, total) {
  const key = String(tierKey || "").toLowerCase();
  if (key.includes("pro")) return true;
  return total >= 3 && index === 1;
}

function formatPlanPrice(plan) {
  const cents = plan?.priceAmountCents ?? plan?.price_amount_cents;
  if (cents == null || !Number.isFinite(Number(cents))) return null;
  const currency = plan?.priceCurrency ?? plan?.price_currency ?? "brl";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: String(currency).toUpperCase(),
  }).format(Number(cents) / 100);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [busyPlanId, setBusyPlanId] = useState(null);
  const [err, setErr] = useState("");
  const [hasPlan, setHasPlan] = useState(false);
  const [ready, setReady] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId],
  );

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!getStoredOrganizationId()) {
      setErr("Organização não encontrada na sessão. Faça login novamente.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const status = await fetchBillingStatus();
        if (cancelled) return;
        if (hasActiveBillingAccess(status)) {
          clearCheckoutRequired();
          setHasPlan(true);
          router.replace("/inicio");
          return;
        }
        const res = await fetchCheckoutPlans();
        if (cancelled) return;
        const items = Array.isArray(res.items) ? res.items : [];
        setPlans(items);
        if (items.length > 0) {
          const pro = items.find((p) => String(p.tierKey || "").toLowerCase().includes("pro"));
          setSelectedPlanId(pro?.id || items[0].id);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Erro ao carregar planos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!loading && !hasPlan) {
      const t = window.requestAnimationFrame(() => setReady(true));
      return () => window.cancelAnimationFrame(t);
    }
    setReady(false);
    return undefined;
  }, [loading, hasPlan]);

  async function handleContinue() {
    if (!selectedPlanId) return;
    setErr("");
    setBusyPlanId(selectedPlanId);
    try {
      const data = await startCheckout(selectedPlanId);
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setErr("Não foi possível abrir a página de pagamento.");
    } catch (e) {
      setErr(e?.message || "Falha ao iniciar pagamento");
    } finally {
      setBusyPlanId(null);
    }
  }

  if (loading || hasPlan) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.loadingOrb} aria-hidden />
          <div className={styles.loadingLines}>
            <span className={styles.loadingLine} />
            <span className={`${styles.loadingLine} ${styles.loadingLineShort}`} />
          </div>
          <p>A verificar assinatura…</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.page} ${ready ? styles.pageReady : ""}`}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glowTop} aria-hidden />
      <div className={styles.glowSide} aria-hidden />
      <header className={styles.topBar}>
        <Link href="/checkout" className={styles.logoLink}>
          <Image src="/imagens/logo/logo-pequena.png" alt="HOOKO" width={36} height={36} className={styles.logo} />
          <span className={styles.logoText}>HOOKO</span>
        </Link>
        <Link className={styles.accountLink} href="/login">
          Trocar conta
        </Link>
      </header>

      <div className={styles.split}>
        <section className={styles.plansCol} aria-label="Planos disponíveis">
          <div className={styles.plansIntro}>
            <p className={styles.eyebrow}>Escolha o seu plano</p>
            <h1 className={styles.title}>Eleve a sua operação de criativos</h1>
            <p className={styles.lead}>
              Seleccione um plano. O resumo actualiza em tempo real — pagamento seguro online.
            </p>
          </div>

          {err ? <p className={styles.errBanner}>{err}</p> : null}

          {plans.length === 0 ? (
            <div className={styles.empty}>
              <p>Nenhum plano disponível no momento.</p>
              <p className={styles.emptySub}>Contacte o suporte ou peça ao administrador para publicar planos.</p>
            </div>
          ) : (
            <ul className={styles.planList}>
              {plans.map((plan, index) => {
                const selected = plan.id === selectedPlanId;
                const popular = isPopularPlan(plan.tierKey, index, plans.length);
                const features = planFeatures(plan);

                return (
                  <li key={plan.id} className={styles.planItem} style={{ "--i": index }}>
                    <button
                      type="button"
                      className={`${styles.planCard} ${selected ? styles.planCardSelected : ""}`}
                      onClick={() => setSelectedPlanId(plan.id)}
                      aria-pressed={selected}
                    >
                      <div className={styles.planCardTop}>
                        <div className={styles.planCardHead}>
                          {popular ? <span className={styles.popularBadge}>Mais escolhido</span> : null}
                          <h2 className={styles.planName}>{plan.displayName}</h2>
                          {formatPlanPrice(plan) ? (
                            <p className={styles.planPrice}>
                              {formatPlanPrice(plan)}
                              <span className={styles.planPricePeriod}>/ mês</span>
                            </p>
                          ) : null}
                          <p className={styles.planPitch}>{planPitch(plan.tierKey)}</p>
                        </div>
                        <span className={`${styles.radio} ${selected ? styles.radioOn : ""}`} aria-hidden />
                      </div>

                      <ul className={styles.featureList}>
                        {features.map((feat) => (
                          <li key={feat}>{feat}</li>
                        ))}
                      </ul>

                      {plan.customOrganizationId ? (
                        <p className={styles.exclusiveTag}>Exclusivo da sua organização</p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className={styles.summaryCol} aria-label="Resumo do pedido">
          <div className={styles.summaryPanel}>
            <p className={styles.summaryEyebrow}>Resumo</p>
            <h2 className={styles.summaryTitle}>O seu plano</h2>

            {selectedPlan ? (
              <div key={selectedPlan.id} className={styles.summaryBody}>
                <div className={styles.summaryPlanBlock}>
                  <p className={styles.summaryPlanName}>{selectedPlan.displayName}</p>
                  <p className={styles.summaryPlanPitch}>{planPitch(selectedPlan.tierKey)}</p>
                </div>

                <ul className={styles.summaryFeatures}>
                  {planFeatures(selectedPlan).map((feat) => (
                    <li key={feat}>
                      <span className={styles.checkIcon} aria-hidden>
                        ✓
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                {Number(selectedPlan.trialDays) > 0 ? (
                  <div className={styles.trialBox}>
                    <strong>{selectedPlan.trialDays} dias grátis</strong>
                    <span>Só será cobrado após o período de teste.</span>
                  </div>
                ) : null}

                <div className={styles.summaryRow}>
                  <span>Total mensal</span>
                  <strong>{formatPlanPrice(selectedPlan) || "—"}</strong>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryRow}>
                  <span>Cobrança</span>
                  <span>Mensal</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Activar</span>
                  <span>Imediato após pagamento</span>
                </div>

                <button
                  type="button"
                  className={styles.checkoutBtn}
                  disabled={Boolean(busyPlanId)}
                  onClick={handleContinue}
                >
                  {busyPlanId ? "A abrir pagamento…" : "Continuar para pagamento"}
                </button>

                <p className={styles.secureNote}>
                  Pagamento encriptado. Pode cancelar ou alterar plano no portal de facturação.
                </p>
              </div>
            ) : (
              <p className={styles.summaryEmpty}>Seleccione um plano para ver o resumo.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
