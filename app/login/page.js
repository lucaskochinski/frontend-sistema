"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import BrandShowcase from "@/components/BrandShowcase/BrandShowcase";
import LoginForm from "@/components/LoginForm/LoginForm";
import AuthSuccessTransition from "@/components/AuthSuccessTransition/AuthSuccessTransition";
import PostAuthRedirect from "@/components/Billing/PostAuthRedirect";

const EXIT_MS = 520;

export default function LoginPage() {
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
    return <PostAuthRedirect variant="login" />;
  }

  return (
    <main className={`authThemeDark ${styles.layout} ${phase === "exit" ? styles.layoutExit : ""}`}>
      <section className={styles.brandPanel} aria-label="Marca">
        <BrandShowcase />
      </section>
      <section className={styles.formPanel} aria-label="Acesso">
        <LoginForm onSuccess={handleSuccess} />
      </section>
    </main>
  );
}
