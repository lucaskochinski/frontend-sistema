"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import BrandShowcase from "@/components/BrandShowcase/BrandShowcase";
import RegisterForm from "@/components/RegisterForm/RegisterForm";
import AuthSuccessTransition from "@/components/AuthSuccessTransition/AuthSuccessTransition";
import {
  buildCheckoutHref,
  readPlanIdFromSearchParams,
  resolvePreferredPlanId,
  setPendingPlanId,
} from "@/lib/billing";

const EXIT_MS = 520;

function RegisterPageInner() {
  const searchParams = useSearchParams();
  const planId = readPlanIdFromSearchParams(searchParams);

  const [phase, setPhase] = useState("form");
  const [checkoutHref, setCheckoutHref] = useState(() => buildCheckoutHref(planId));
  const timer = useRef(null);

  useEffect(() => {
    if (planId) setPendingPlanId(planId);
    setCheckoutHref(buildCheckoutHref(planId));
  }, [planId]);

  const handleSuccess = useCallback(() => {
    const resolvedPlanId = resolvePreferredPlanId(searchParams);
    if (resolvedPlanId) setPendingPlanId(resolvedPlanId);
    setCheckoutHref(buildCheckoutHref(resolvedPlanId));

    setPhase("exit");
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPhase("transition");
    }, EXIT_MS);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  if (phase === "transition") {
    return <AuthSuccessTransition variant="register" href={checkoutHref} durationMs={900} />;
  }

  return (
    <main className={`${styles.layout} ${phase === "exit" ? styles.layoutExit : ""}`}>
      <section className={styles.brandPanel} aria-label="Marca">
        <BrandShowcase tagline="Onboarding premium. Sua operação de anúncios, elevada." />
      </section>
      <section className={styles.formPanel} aria-label="Cadastro">
        <RegisterForm onSuccess={handleSuccess} selectedPlanId={planId} />
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.layout}>
          <section className={styles.brandPanel} aria-hidden />
          <section className={styles.formPanel}>
            <p>A carregar…</p>
          </section>
        </main>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}
