"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  apiFetch,
  getApiBase,
  getStoredAccessToken,
  getStoredOrganizationId,
  persistSession,
} from "@/lib/hooko-session";
import styles from "./page.module.css";

/**
 * @typedef {{ id: string, organizationsByMembership?: Array<{ organizationId: string, organization?: { name?: string } }>, memberships?: Array<{ organizationId: string }> }} MeProfile
 */

function rowsFromProfile(/** @type {MeProfile | null} */ profile) {
  if (!profile) return [];
  const detailed = profile.organizationsByMembership;
  if (Array.isArray(detailed) && detailed.length > 0) return detailed;
  const lean = profile.memberships;
  if (Array.isArray(lean) && lean.length > 0) {
    return lean.map((m) => ({ organizationId: m.organizationId }));
  }
  return [];
}

function IconSlidersHeader({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4 7h16M4 12h10M4 17h14" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="17" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function AjustesPage() {
  const apiBase = getApiBase();
  const [tokenPresent, setTokenPresent] = useState(false);

  /** @type {MeProfile | null} */
  const [me, setMe] = useState(null);

  /** @type {string} */
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [busyMeta, setBusyMeta] = useState(false);
  const [busyDrive, setBusyDrive] = useState(false);

  const syncTokenFlag = useCallback(() => {
    setTokenPresent(Boolean(getStoredAccessToken()));
  }, []);

  useEffect(() => {
    syncTokenFlag();
    const sid = getStoredOrganizationId();
    if (sid) setSelectedOrgId(sid);
  }, [syncTokenFlag]);

  useEffect(() => {
    if (!apiBase || !getStoredAccessToken()) {
      setMe(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        /** @type {MeProfile} */
        const data = await apiFetch("/api/auth/me");
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, tokenPresent]);

  const organizations = useMemo(() => rowsFromProfile(me), [me]);

  useEffect(() => {
    if (!organizations.length) return;
    const stored = getStoredOrganizationId();
    const validStored = Boolean(stored && organizations.some((r) => r.organizationId === stored));

    if (organizations.length === 1) {
      const only = organizations[0].organizationId;
      setSelectedOrgId(only);
      persistSession({ organizationId: only });
      return;
    }
    if (validStored) {
      setSelectedOrgId(stored);
      return;
    }
    const fallback = organizations[0].organizationId;
    setSelectedOrgId(fallback);
    persistSession({ organizationId: fallback });
  }, [organizations]);

  const orgReady = Boolean(selectedOrgId && organizations.some((r) => r.organizationId === selectedOrgId));
  const canConnect = Boolean(apiBase && tokenPresent && orgReady);

  const startOAuth = async (path, setBusy) => {
    if (!canConnect || !selectedOrgId) return;
    setBusy(true);
    try {
      const qs = new URLSearchParams({ organizationId: selectedOrgId.trim() });
      const data = await apiFetch(`${path}?${qs.toString()}`, { headers: {} });
      const url = data?.authorizeUrl;
      if (typeof url === "string" && url.length > 0) {
        window.location.href = url;
      }
    } catch {
      /* silencioso — sem mensagens ao utilizador nesta página */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topHeader}>
        <div className={styles.topHeaderGlow} aria-hidden />
        <div className={styles.topHeaderInner}>
          <div className={styles.topHeaderMain}>
            <div className={styles.topIconWrap} aria-hidden>
              <IconSlidersHeader className={styles.topIconSvg} />
            </div>
            <div className={styles.topTitleBlock}>
              <h1 className={styles.topPageTitle}>Ajustes</h1>
              <p className={styles.topHint}>
                Liga a Meta Ads para importar criativos e campanhas, e o Google Drive para ler os ficheiros que
                escolheres.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.main}>
        <section className={styles.row} aria-labelledby="meta-h">
          <div className={styles.thumb}>
            <Image src="/imagens/meta.png" alt="" width={120} height={120} />
          </div>
          <div className={styles.rowGrow}>
            <h2 id="meta-h" className={styles.rowTitle}>
              Meta Ads
            </h2>
            <p className={styles.rowText}>Conecta a tua conta da Meta para importares criativos e veres campanhas.</p>
          </div>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!canConnect || busyMeta}
              onClick={() => startOAuth("/api/meta/oauth/authorize-url", setBusyMeta)}
            >
              {busyMeta ? "A redirecionar…" : "Ligar Meta"}
            </button>
          </div>
        </section>

        <section className={styles.row} aria-labelledby="drive-h">
          <div className={styles.thumb}>
            <Image src="/imagens/google-drive.png" alt="" width={120} height={120} />
          </div>
          <div className={styles.rowGrow}>
            <h2 id="drive-h" className={styles.rowTitle}>
              Google Drive
            </h2>
            <p className={styles.rowText}>Autoriza o Google Drive para importares ou leres os teus ficheiros.</p>
          </div>
          <div className={styles.rowActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!canConnect || busyDrive}
              onClick={() => startOAuth("/api/google-drive/oauth/authorize-url", setBusyDrive)}
            >
              {busyDrive ? "A redirecionar…" : "Ligar Drive"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
