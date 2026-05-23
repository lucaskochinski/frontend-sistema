"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dismissAlert, isAlertDismissed, openBillingPortal, pickPrimaryAlert } from "@/lib/billing";
import styles from "./PlanAlertModals.module.css";

function badgeClass(severity) {
  if (severity === "critical") return `${styles.badge} ${styles.badgeCritical}`;
  if (severity === "warning") return `${styles.badge} ${styles.badgeWarning}`;
  return `${styles.badge} ${styles.badgeInfo}`;
}

function badgeLabel(severity) {
  if (severity === "critical") return "Atenção";
  if (severity === "warning") return "Aviso";
  return "Plano";
}

/**
 * Modais de billing: trial a terminar, pagamento pendente, cancelamento agendado, etc.
 */
export default function PlanAlertModals({ billingStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  const alert = useMemo(() => {
    if (!billingStatus || billingStatus.bypass) return null;
    if (!billingStatus.hasActiveSubscription) return null;
    const primary = pickPrimaryAlert(billingStatus?.alerts);
    if (!primary || isAlertDismissed(primary.type)) return null;
    if (primary.type === "no_subscription" || primary.type === "plan_active") return null;
    return primary;
  }, [billingStatus]);

  if (!alert || hidden) return null;

  const planLabel = billingStatus?.subscription?.plan?.displayName;

  async function handlePortal() {
    setBusy(true);
    try {
      await openBillingPortal("/inicio");
    } catch {
      setBusy(false);
    }
  }

  function handleDismiss() {
    dismissAlert(alert.type);
    setHidden(true);
  }

  const needsCheckout =
    alert.type === "subscription_canceled" || alert.type === "no_subscription";

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="plan-alert-title">
        <span className={badgeClass(alert.severity)}>{badgeLabel(alert.severity)}</span>
        <h2 id="plan-alert-title" className={styles.title}>
          {alert.title}
        </h2>
        <p className={styles.text}>{alert.message}</p>
        {planLabel ? <p className={styles.planName}>Plano actual: {planLabel}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={handleDismiss} disabled={busy}>
            Agora não
          </button>
          {needsCheckout ? (
            <button type="button" className={styles.btnPrimary} onClick={() => router.push("/checkout")} disabled={busy}>
              Escolher plano
            </button>
          ) : (
            <button type="button" className={styles.btnPrimary} onClick={handlePortal} disabled={busy}>
              {busy ? "A abrir…" : "Gerir assinatura"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
