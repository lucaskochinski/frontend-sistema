"use client";

import styles from "./dashboard.module.css";

function IconLock() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.65" />
      <path
        d="M8 11V8a4 4 0 018 0v3"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Overlay de “em breve” — mantém o card visível mas bloqueia interacção.
 */
export default function FutureFeatureLock({
  children,
  label = "PagTrust / Utmify",
  message = "Integração em breve",
  compact = false,
  className = "",
}) {
  return (
    <div className={`${styles.lockWrap} ${compact ? styles.lockWrapCompact : ""} ${className}`}>
      <div className={styles.lockTarget}>{children}</div>
      <div className={styles.lockOverlay} role="status" aria-live="polite">
        <span className={styles.lockIconWrap}>
          <IconLock />
        </span>
        <p className={styles.lockMessage}>{message}</p>
        <span className={styles.lockLabel}>{label}</span>
      </div>
    </div>
  );
}
