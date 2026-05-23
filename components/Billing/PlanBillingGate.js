"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearCheckoutRequired,
  fetchBillingStatus,
  hasActiveBillingAccess,
  isCheckoutRequired,
  markCheckoutRequired,
} from "@/lib/billing";
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
    if (isAdminRoute) {
      setState("ok");
      return;
    }

    const token = getStoredAccessToken();
    if (!token) {
      setState("redirect");
      router.replace("/login");
      return;
    }

    if (isCheckoutRequired()) {
      setState("redirect");
      router.replace("/checkout");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const status = await fetchBillingStatus();
        if (cancelled) return;
        setBillingStatus(status);

        if (hasActiveBillingAccess(status)) {
          clearCheckoutRequired();
          setState("ok");
          return;
        }

        markCheckoutRequired();
        setState("redirect");
        router.replace("/checkout");
      } catch {
        if (cancelled) return;
        markCheckoutRequired();
        setState("redirect");
        router.replace("/checkout");
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
