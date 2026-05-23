"use client";

import { useTheme } from "./ThemeProvider";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle({ compact = false, sidebar = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`${styles.toggle} ${compact ? styles.compact : ""} ${sidebar ? styles.sidebar : ""}`}
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
    >
      <span className={`${styles.icon} ${sidebar ? styles.sidebarIcon : ""}`} aria-hidden>
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M21 14.5A8.5 8.5 0 1111.5 3a6.5 6.5 0 109.5 11.5z" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {!compact && !sidebar ? <span className={styles.label}>{isDark ? "Tema claro" : "Tema escuro"}</span> : null}
      {sidebar && !compact ? <span className={styles.sidebarLabel}>{isDark ? "Tema claro" : "Tema escuro"}</span> : null}
    </button>
  );
}
