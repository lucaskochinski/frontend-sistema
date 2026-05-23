"use client";

import { useEffect, useState } from "react";
import AuthSuccessTransition from "@/components/AuthSuccessTransition/AuthSuccessTransition";
import { fetchBillingStatus, hasActiveBillingAccess, markCheckoutRequired } from "@/lib/billing";

/**
 * Após login, envia para checkout se não houver plano activo; registo usa checkout directo.
 */
export default function PostAuthRedirect({ variant = "login" }) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (variant === "register") {
        markCheckoutRequired();
        if (!cancelled) setTarget("/checkout");
        return;
      }
      try {
        const status = await fetchBillingStatus();
        if (cancelled) return;
        setTarget(hasActiveBillingAccess(status) ? "/inicio" : "/checkout");
        if (!hasActiveBillingAccess(status)) markCheckoutRequired();
      } catch {
        if (cancelled) return;
        markCheckoutRequired();
        setTarget("/checkout");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variant]);

  if (!target) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", color: "var(--hooko-text-muted)" }}>
        A verificar plano…
      </div>
    );
  }

  return <AuthSuccessTransition variant={variant} href={target} />;
}
