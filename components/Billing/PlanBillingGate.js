"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchBillingStatus } from "@/lib/billing";
import { getStoredAccessToken } from "@/lib/hooko-session";
import PlanAlertModals from "./PlanAlertModals";

/**
 * Garante assinatura activa antes de usar o app autenticado.
 * Sem plano → redirecciona para /checkout.
 */
export default function PlanBillingGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const [state, setState] = useState(/** @type {'loading' | 'ok' | 'redirect'} */ ("loading"));
  const [billingStatus, setBillingStatus] = useState(null);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token || isAdminRoute) {
      setState("ok");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const status = await fetchBillingStatus();
        if (cancelled) return;
        setBillingStatus(status);

        if (status?.bypass || status?.hasActiveSubscription) {
          setState("ok");
          return;
        }

        setState("redirect");
        router.replace("/checkout");
      } catch {
        if (!cancelled) setState("ok");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, isAdminRoute]);

  if (state === "loading" || state === "redirect") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--hooko-text-muted)", fontSize: "0.9rem" }}>
        A verificar assinatura…
      </div>
    );
  }

  return (
    <>
      {children}
      <PlanAlertModals billingStatus={billingStatus} />
    </>
  );
}
