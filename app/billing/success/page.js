"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchBillingStatus } from "@/lib/billing";
import styles from "./page.module.css";

export default function BillingSuccessPage() {
  const router = useRouter();
  const [message, setMessage] = useState("A confirmar pagamento…");

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;
    let timer;

    async function poll() {
      attempts += 1;
      try {
        const status = await fetchBillingStatus();
        if (cancelled) return;
        if (status?.hasActiveSubscription || status?.bypass) {
          setMessage("Assinatura activa! A abrir o painel…");
          timer = window.setTimeout(() => router.replace("/inicio"), 900);
          return;
        }
      } catch {
        /* retry */
      }
      if (attempts < 12 && !cancelled) {
        timer = window.setTimeout(poll, 1500);
      } else if (!cancelled) {
        setMessage("Pagamento recebido. Se o painel não abrir, aguarde alguns segundos e entre novamente.");
        timer = window.setTimeout(() => router.replace("/inicio"), 3500);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className={styles.wrap}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Stripe</p>
        <h1 className={styles.title}>Obrigado!</h1>
        <p className={styles.sub}>{message}</p>
      </div>
    </main>
  );
}
