"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/hooko-session";
import { isAdminUiBypassEnabled } from "@/lib/admin-ui-bypass";
import { hasPlatformAdminRole } from "@/lib/platform-admin";
import AdminForbidden from "./AdminForbidden";
import styles from "./AdminGate.module.css";

/**
 * Confirma `/api/auth/me` + papel platform admin antes de renderizar páginas `/admin/*`.
 * Com `NEXT_PUBLIC_ADMIN_UI_BYPASS=true`, salta a verificação (só para desenvolvimento).
 */
export default function AdminGate({ children }) {
  const bypass = isAdminUiBypassEnabled();
  const [state, setState] = useState(
    /** @type {'loading' | 'ok' | 'forbidden' | 'noauth'} */
    bypass ? "ok" : "loading",
  );

  useEffect(() => {
    if (bypass) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch("/api/auth/me");
        if (cancelled) return;
        if (!hasPlatformAdminRole(me?.roles)) setState("forbidden");
        else setState("ok");
      } catch {
        if (!cancelled) setState("noauth");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bypass]);

  if (!bypass && state === "loading") {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "rgba(161,161,170,0.95)", fontSize: "0.9rem" }}>
        A carregar…
      </div>
    );
  }

  if (!bypass && state !== "ok") {
    return <AdminForbidden reason={state} />;
  }

  return (
    <>
      {bypass ? (
        <div className={styles.bypassRibbon} role="status">
          <strong>Preview admin:</strong> sem API ligada — <code>NEXT_PUBLIC_ADMIN_UI_BYPASS=true</code> no frontend. Não usar em produção.
        </div>
      ) : null}
      {children}
    </>
  );
}
