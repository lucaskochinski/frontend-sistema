"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchBillingStatus, fetchCheckoutPlans, startCheckout } from "@/lib/billing";
import { getStoredAccessToken, getStoredOrganizationId } from "@/lib/hooko-session";
import styles from "./page.module.css";

function formatLimit(limits) {
  const n = limits?.creative_imports_per_month;
  if (n == null) return "Limites personalizados";
  if (n === Infinity || n > 999999) return "Importações ilimitadas";
  return `${n} importações de criativos / mês`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [busyPlanId, setBusyPlanId] = useState(null);
  const [err, setErr] = useState("");
  const [hasPlan, setHasPlan] = useState(false);

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
        if (status?.bypass || status?.hasActiveSubscription) {
          setHasPlan(true);
          router.replace("/inicio");
          return;
        }
        const res = await fetchCheckoutPlans();
        if (cancelled) return;
        setPlans(Array.isArray(res.items) ? res.items : []);
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

  async function handleSelectPlan(planId) {
    setErr("");
    setBusyPlanId(planId);
    try {
      const data = await startCheckout(planId);
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setErr("Stripe não devolveu URL de checkout.");
    } catch (e) {
      setErr(e?.message || "Falha ao iniciar checkout");
    } finally {
      setBusyPlanId(null);
    }
  }

  if (loading || hasPlan) {
    return (
      <main className={styles.wrap}>
        <div className={styles.inner}>
          <p className={styles.sub}>A verificar assinatura…</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Assinatura</p>
        <h1 className={styles.title}>Escolha o seu plano</h1>
        <p className={styles.sub}>
          Para usar o HOOKO, seleccione um plano. O pagamento é processado de forma segura pela Stripe.
        </p>

        {err ? <p className={styles.err}>{err}</p> : null}

        {plans.length === 0 ? (
          <div className={styles.empty}>
            <p>Nenhum plano disponível no momento.</p>
            <p className={styles.sub}>Contacte o suporte ou peça ao administrador para publicar planos.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {plans.map((plan) => (
              <article key={plan.id} className={styles.card}>
                <h2 className={styles.planName}>{plan.displayName}</h2>
                <p className={styles.planTier}>{plan.tierKey}</p>
                <p className={styles.planLimit}>{formatLimit(plan.limits)}</p>
                {Number(plan.trialDays) > 0 ? (
                  <p className={styles.trialBadge}>{plan.trialDays} dias de trial grátis</p>
                ) : null}
                {plan.customOrganizationId ? (
                  <p className={styles.exclusive}>Plano exclusivo da sua organização</p>
                ) : null}
                <button
                  type="button"
                  className={styles.cta}
                  disabled={Boolean(busyPlanId)}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {busyPlanId === plan.id ? "A redirecionar…" : "Subscrever"}
                </button>
              </article>
            ))}
          </div>
        )}

        <p className={styles.links}>
          <Link className={styles.link} href="/login">
            Trocar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
