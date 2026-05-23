"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  clearCheckoutRequired,
  fetchBillingStatus,
  fetchCheckoutPlans,
  formatPlanPrice,
  hasActiveBillingAccess,
  isPopularPlan,
  pickDefaultCheckoutPlan,
  planFeatureList,
  planHasBillablePrice,
  planPitch,
  resolvePreferredPlanId,
  setPendingPlanId,
  startCheckout,
} from "@/lib/billing";
import { getStoredAccessToken, getStoredOrganizationId } from "@/lib/hooko-session";
import styles from "./page.module.css";

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgradeMode = searchParams.get("mode") === "upgrade";
  const preferredPlanId = resolvePreferredPlanId(searchParams);
  const appliedPreferredRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [busyPlanId, setBusyPlanId] = useState(null);
  const [err, setErr] = useState("");
  const [hasPlan, setHasPlan] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId],
  );

  const isCurrentPlan = selectedPlan && currentPlanId && selectedPlan.id === currentPlanId;

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

        const active = hasActiveBillingAccess(status);
        const planId = status?.currentPlanId || status?.subscription?.plan?.id || null;
        setCurrentPlanId(planId ? String(planId) : null);

        if (active && !upgradeMode) {
          clearCheckoutRequired();
          setHasPlan(true);
          router.replace("/inicio");
          return;
        }

        const res = await fetchCheckoutPlans();
        if (cancelled) return;
        const items = Array.isArray(res.items) ? res.items : [];
        setPlans(items);

        const resolvedPreferredId = resolvePreferredPlanId(searchParams);
        if (resolvedPreferredId) {
          setPendingPlanId(resolvedPreferredId);
        }

        if (items.length > 0) {
          const defaultPlan = pickDefaultCheckoutPlan(items, {
            preferredPlanId: resolvedPreferredId,
            currentPlanId: planId,
          });
          if (defaultPlan) {
            setSelectedPlanId(defaultPlan.id);
            if (
              resolvedPreferredId &&
              defaultPlan.id === String(resolvedPreferredId)
            ) {
              appliedPreferredRef.current = true;
            }
          }
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
  }, [router, searchParams, upgradeMode]);

  useEffect(() => {
    if (appliedPreferredRef.current || !plans.length) return;
    const resolvedPreferredId = resolvePreferredPlanId(searchParams);
    if (!resolvedPreferredId) return;

    const match = plans.find((p) => p.id === String(resolvedPreferredId));
    if (!match) return;

    setPendingPlanId(resolvedPreferredId);
    setSelectedPlanId(match.id);
    appliedPreferredRef.current = true;
  }, [plans, searchParams]);

  useEffect(() => {
    if (!loading && !hasPlan) {
      const t = window.requestAnimationFrame(() => setReady(true));
      return () => window.cancelAnimationFrame(t);
    }
    setReady(false);
    return undefined;
  }, [loading, hasPlan]);

  async function handleContinue() {
    if (!selectedPlanId || !selectedPlan?.canCheckout || isCurrentPlan) return;
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
        <Link href={upgradeMode ? "/perfil" : "/checkout"} className={styles.logoLink}>
          <Image src="/imagens/logo/logo-pequena.png" alt="HOOKO" width={36} height={36} className={styles.logo} />
          <span className={styles.logoText}>HOOKO</span>
        </Link>
        <Link className={styles.accountLink} href={upgradeMode ? "/perfil" : "/login"}>
          {upgradeMode ? "Voltar ao perfil" : "Trocar conta"}
        </Link>
      </header>

      <div className={styles.split}>
        <section className={styles.plansCol} aria-label="Planos disponíveis">
          <div className={styles.plansIntro}>
            <p className={styles.eyebrow}>{upgradeMode ? "Alterar plano" : "Escolha o seu plano"}</p>
            <h1 className={styles.title}>
              {upgradeMode ? "Upgrade ou mudança de plano" : "Eleve a sua operação de criativos"}
            </h1>
            <p className={styles.lead}>
              {upgradeMode
                ? "Planos públicos e exclusivos da sua organização. O plano actual está assinalado."
                : preferredPlanId
                  ? "Plano pré-seleccionado no registo — pode trocar abaixo antes de pagar."
                  : "Seleccione um plano. O resumo actualiza em tempo real — pagamento seguro online."}
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
                const isCurrent = currentPlanId && plan.id === currentPlanId;
                const popular = !isCurrent && isPopularPlan(plan, index, plans.length);
                const features = planFeatureList(plan);

                return (
                  <li key={plan.id} className={styles.planItem} style={{ "--i": index }}>
                    <button
                      type="button"
                      className={`${styles.planCard} ${selected ? styles.planCardSelected : ""} ${isCurrent ? styles.planCardCurrent : ""}`}
                      onClick={() => setSelectedPlanId(plan.id)}
                      aria-pressed={selected}
                    >
                      <div className={styles.planCardTop}>
                        <div className={styles.planCardHead}>
                          {isCurrent ? (
                            <span className={styles.currentBadge}>Plano actual</span>
                          ) : popular ? (
                            <span className={styles.popularBadge}>Mais escolhido</span>
                          ) : null}
                          <h2 className={styles.planName}>{plan.displayName}</h2>
                          {formatPlanPrice(plan) ? (
                            <p className={styles.planPrice}>
                              {formatPlanPrice(plan)}
                              <span className={styles.planPricePeriod}>/ mês</span>
                            </p>
                          ) : null}
                          <p className={styles.planPitch}>{planPitch(plan)}</p>
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
                  <p className={styles.summaryPlanPitch}>{planPitch(selectedPlan)}</p>
                </div>

                <ul className={styles.summaryFeatures}>
                  {planFeatureList(selectedPlan).map((feat) => (
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
                  <span>{isCurrentPlan ? "Já activo" : "Imediato após pagamento"}</span>
                </div>

                <button
                  type="button"
                  className={styles.checkoutBtn}
                  disabled={Boolean(busyPlanId) || !selectedPlan.canCheckout || isCurrentPlan}
                  onClick={handleContinue}
                >
                  {isCurrentPlan
                    ? "Plano actual"
                    : busyPlanId
                      ? "A abrir pagamento…"
                      : selectedPlan.canCheckout
                        ? "Continuar para pagamento"
                        : "Plano indisponível para pagamento"}
                </button>

                {!selectedPlan.canCheckout ? (
                  <p className={styles.secureNote}>
                    {planHasBillablePrice(selectedPlan)
                      ? "Pagamento temporariamente indisponível. Verifique se o Stripe está configurado no painel admin."
                      : "Este plano ainda não tem valor mensal definido. Peça ao administrador para guardar o plano com preço."}
                  </p>
                ) : isCurrentPlan ? (
                  <p className={styles.secureNote}>
                    Este é o seu plano actual. Escolha outro plano para fazer upgrade ou alteração.
                  </p>
                ) : (
                  <p className={styles.secureNote}>
                    Pagamento encriptado. Pode cancelar ou alterar plano no portal de facturação.
                  </p>
                )}
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

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.loadingState}>
            <p>A carregar planos…</p>
          </div>
        </main>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  );
}

