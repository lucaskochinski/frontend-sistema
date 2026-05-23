"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchPublicPlansClient,
  formatPlanPrice,
  planPitch,
  setPendingPlanId,
} from "@/lib/billing";
import styles from "./RegisterPlanPanel.module.css";

/** Banner compacto no topo do formulário de registo. */
export default function RegisterPlanPanel({ planId }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(Boolean(planId));
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!planId) {
      setLoading(false);
      setPlan(null);
      setErr("");
      return undefined;
    }

    setPendingPlanId(planId);
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const plans = await fetchPublicPlansClient();
        if (cancelled) return;
        const match = plans.find((item) => item.id === String(planId));
        if (!match) {
          setErr("Plano não encontrado.");
          setPlan(null);
          return;
        }
        setPlan(match);
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || "Erro ao carregar plano");
          setPlan(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [planId]);

  if (!planId) return null;

  if (loading) {
    return <p className={styles.planBannerLoading}>A carregar plano seleccionado…</p>;
  }

  if (err || !plan) {
    return (
      <div className={styles.planBannerError}>
        <p>{err || "Plano indisponível."}</p>
        <Link href="/#planos" className={styles.changeLink}>
          Escolher plano
        </Link>
      </div>
    );
  }

  const price = formatPlanPrice(plan);
  const trialDays = Number(plan.trialDays) || 0;

  return (
    <div className={styles.planBanner} aria-labelledby="register-plan-banner-title">
      <div className={styles.topRow}>
        <div>
          <p className={styles.eyebrow}>Plano seleccionado</p>
          <p id="register-plan-banner-title" className={styles.name}>
            {plan.displayName}
          </p>
        </div>
        {price ? (
          <p className={styles.price}>
            {price}
            <span className={styles.pricePeriod}> /mês</span>
          </p>
        ) : null}
      </div>

      <p className={styles.pitch}>{planPitch(plan)}</p>

      {trialDays > 0 ? (
        <p className={styles.meta}>{trialDays} dias de teste antes da cobrança.</p>
      ) : (
        <p className={styles.meta}>Após o cadastro, você confirma o pagamento no checkout.</p>
      )}

      <Link href="/#planos" className={styles.changeLink}>
        Trocar plano
      </Link>
    </div>
  );
}
