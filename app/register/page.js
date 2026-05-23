"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import BrandShowcase from "@/components/BrandShowcase/BrandShowcase";
import RegisterForm from "@/components/RegisterForm/RegisterForm";
import AuthSuccessTransition from "@/components/AuthSuccessTransition/AuthSuccessTransition";

const EXIT_MS = 520;

export default function RegisterPage() {
  const [phase, setPhase] = useState("form");
  const timer = useRef(null);

  const handleSuccess = useCallback(() => {
    setPhase("exit");
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPhase("transition");
    }, EXIT_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  if (phase === "transition") {
    return <AuthSuccessTransition variant="register" href="/checkout" durationMs={900} />;
  }

  return (
    <main className={`${styles.layout} ${phase === "exit" ? styles.layoutExit : ""}`}>
      <section className={styles.brandPanel} aria-label="Marca">
        <BrandShowcase tagline="Onboarding premium. Sua operação de anúncios, elevada." />
      </section>
      <section className={styles.formPanel} aria-label="Cadastro">
        <RegisterForm onSuccess={handleSuccess} />
      </section>
    </main>
  );
}
