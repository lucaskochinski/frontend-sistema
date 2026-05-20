"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./AuthSuccessTransition.module.css";

const COPY = {
  login: {
    title: "Bem-vindo de volta",
    sub: "A abrir o painel…",
  },
  register: {
    title: "Conta criada",
    sub: "A preparar o checkout…",
  },
};

export default function AuthSuccessTransition({ variant, href, durationMs = 2600 }) {
  const router = useRouter();
  const copy = COPY[variant];

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.push(href);
    }, durationMs);
    return () => window.clearTimeout(t);
  }, [href, durationMs, router]);

  return (
    <div className={styles.root} role="status" aria-live="polite" aria-atomic="true">
      <div className={styles.glow} aria-hidden />
      <div className={styles.panel}>
        <div className={styles.iconWrap} aria-hidden>
          <svg className={styles.icon} viewBox="0 0 32 32" fill="none" aria-hidden>
            <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" opacity="0.95" />
            <path d="M9.5 16.25l4.2 4.35L23 11" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="24.5" r="1.35" stroke="currentColor" strokeWidth="1" opacity="0.62" />
            <circle cx="23.5" cy="24.5" r="1.35" stroke="currentColor" strokeWidth="1" opacity="0.62" />
            <circle cx="16" cy="26.5" r="1.05" stroke="currentColor" strokeWidth="0.85" opacity="0.5" />
          </svg>
        </div>
        <h2 className={styles.title}>{copy.title}</h2>
        <p className={styles.sub}>{copy.sub}</p>
        <div className={styles.bar} aria-hidden>
          <div className={styles.barFill} />
        </div>
      </div>
    </div>
  );
}
