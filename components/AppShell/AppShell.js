"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/hooko-session";
import { isAdminUiBypassEnabled } from "@/lib/admin-ui-bypass";
import { hasPlatformAdminRole } from "@/lib/platform-admin";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import NotImplementedModal from "@/components/NotImplementedModal/NotImplementedModal";
import styles from "./AppShell.module.css";

const NAV = [
  { href: "/inicio", label: "Início" },
  { href: "/criativo", label: "Criativos" },
  { href: "/formatos", label: "Formatos", comingSoon: true, featureKey: "formatos" },
  { href: "/criador-de-anuncio", label: "Criador de anúncio", comingSoon: true, featureKey: "criador" },
  { href: "/perfil", label: "Perfil" },
  { href: "/ajustes", label: "Ajustes" },
];

function IconDash() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconMegaphone() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4 10v4h4l6 4V6l-6 4H4z" strokeLinejoin="round" />
      <path d="M16 8.5a5 5 0 010 7" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function IconUserCircle() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <circle cx="12" cy="8.75" r="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5.85 19.6c1.16-4.6 5.8-7.6 6.15-7.6 0.35 0 4.95 3 6.12 7.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4 7h16M4 12h10M4 17h14" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" fill="currentColor" />
      <circle cx="10" cy="12" r="2" fill="currentColor" />
      <circle cx="14" cy="17" r="2" fill="currentColor" />
    </svg>
  );
}

function IconMagic() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" opacity="0.4" />
      <path d="M19 11l-8 8-4-4 8-8 4 4zM16 8l-3.5 3.5" />
    </svg>
  );
}

const ICONS = [IconDash, IconMegaphone, IconLayers, IconMagic, IconUserCircle, IconSliders];

const ADMIN_NAV = [
  { href: "/admin", label: "Visão Geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/financas", label: "Finanças" },
  { href: "/admin/planos", label: "Planos" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

function IconPie() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <circle cx={12} cy={12} r={9} strokeOpacity="0.32" />
      <path d="M12 3a9 9 0 016.364 14.636L12 12V3z" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <path d="M4 19h16" strokeLinecap="round" />
      <path d="M7 17V9m5 8v-8m5 13V5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinejoin="round" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

function IconGearSmall() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx={12} cy={12} r={3} />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ADMIN_ICONS = [IconPie, IconUsers, IconChart, IconLayers, IconGearSmall];

function IconLogout() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

/** Ícone minimalista de polvo — avatar até haver foto de perfil na API */
function IconOctopusAvatar({ className }) {
  return (
    <svg
      className={className}
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <ellipse cx="12" cy="8.8" rx="5" ry="4.1" />
      <circle cx="9.45" cy="8.05" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="14.55" cy="8.05" r="0.85" fill="currentColor" stroke="none" />
      <path d="M7.2 12.4c-.9 2.2-.7 4.7.4 6.8" />
      <path d="M9.3 12.8c-.6 2.1-.4 4.5.3 6.4" />
      <path d="M12 13.2c0 2.2 0 4.4 0 6.5" />
      <path d="M14.7 12.8c.6 2.1.4 4.5-.3 6.4" />
      <path d="M16.8 12.4c.9 2.2.7 4.7-.4 6.8" />
    </svg>
  );
}

const MOCK_PROFILE_NAME =
  typeof process.env.NEXT_PUBLIC_PROFILE_NAME === "string" && process.env.NEXT_PUBLIC_PROFILE_NAME.trim()
    ? process.env.NEXT_PUBLIC_PROFILE_NAME.trim()
    : "Conta demo";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const profileActive = pathname === "/perfil" || pathname.startsWith("/perfil/");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobileVp, setIsMobileVp] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(() => isAdminUiBypassEnabled());
  const [comingSoonKey, setComingSoonKey] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    function sync() {
      setIsMobileVp(mq.matches);
    }
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("hooko.sidebarCollapsed") === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hooko.sidebarCollapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    function onKey(e) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    if (isAdminUiBypassEnabled()) {
      setIsPlatformAdmin(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await apiFetch("/api/auth/me");
        if (!cancelled && hasPlatformAdminRole(me?.roles)) setIsPlatformAdmin(true);
      } catch {
        if (!cancelled) setIsPlatformAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Só ícone: desktop com sidebar recolhida (no mobile o drawer mantém sempre a logo larga). */
  const showGlyphLogo = collapsed && !isMobileVp;

  return (
    <div
      className={styles.root}
      data-collapsed={collapsed ? "true" : "false"}
      data-drawer={drawerOpen ? "open" : "closed"}
    >
      <div
        className={styles.backdrop}
        onClick={closeDrawer}
        onKeyDown={(e) => e.key === "Enter" && closeDrawer()}
        role="button"
        tabIndex={-1}
        aria-hidden={!drawerOpen}
      />

      <aside className={styles.sidebar} aria-label="Navegação principal">
        <div className={styles.sideTop}>
          <Link
            href="/inicio"
            className={`${styles.brandMark} ${showGlyphLogo ? styles.brandMarkGlyph : styles.brandMarkWide}`}
            onClick={closeDrawer}
          >
            {showGlyphLogo ? (
              <Image
                src="/imagens/logo/logo-pequena.png"
                alt="HOOKO"
                width={2048}
                height={2048}
                className={styles.logoGlyph}
                sizes="48px"
                priority
              />
            ) : (
              <Image
                src="/imagens/logo/logo.png"
                alt="HOOKO"
                width={2023}
                height={779}
                className={styles.logoWide}
                sizes="(max-width: 900px) 220px, min(212px, 100vw)"
                priority
              />
            )}
          </Link>
          <button
            type="button"
            className={styles.closeDrawer}
            onClick={closeDrawer}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        <div className={styles.navScroll}>
          <nav className={styles.nav} aria-label="Área principal">
            {NAV.map((item, i) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = ICONS[i] ?? IconDash;

              if (item.comingSoon) {
                return (
                  <button
                    key={item.href}
                    type="button"
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                    onClick={() => {
                      closeDrawer();
                      setComingSoonKey(item.featureKey || "formatos");
                    }}
                  >
                    <span className={styles.navIcon} aria-hidden>
                      <Icon />
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  onClick={closeDrawer}
                >
                  <span className={styles.navIcon} aria-hidden>
                    <Icon />
                  </span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}

          </nav>

          {isPlatformAdmin ? (
            <>
              <div className={styles.navAdminDivider} aria-hidden />
              <nav className={styles.navAdmin} aria-label="Administração da plataforma">
                <p className={styles.navSectionLabel}>Admin</p>
                {ADMIN_NAV.map((item, i) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = ADMIN_ICONS[i] ?? IconDash;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                      onClick={closeDrawer}
                    >
                      <span className={styles.navIcon} aria-hidden>
                        <Icon />
                      </span>
                      <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </>
          ) : null}
        </div>

        <div className={styles.sideFoot}>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setCollapsed((c) => !c)}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          >
            <span className={styles.collapseIcon} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                {collapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
              </svg>
            </span>
            <span className={styles.collapseLabel}>Recolher</span>
          </button>
          <Link
            href="/perfil"
            className={`${styles.profileLink} ${profileActive ? styles.profileLinkActive : ""}`}
            onClick={closeDrawer}
            aria-label={`Perfil — ${MOCK_PROFILE_NAME}`}
          >
            <span className={styles.profileAvatar} aria-hidden>
              <IconOctopusAvatar className={styles.profileOctopus} />
            </span>
            <span className={styles.profileName}>{MOCK_PROFILE_NAME}</span>
          </Link>
          {showGlyphLogo ? (
            <Link href="/login" className={styles.signOutIconBtn} onClick={closeDrawer} aria-label="Sair da conta" title="Sair da conta">
              <IconLogout />
            </Link>
          ) : (
            <Link href="/login" className={styles.signOut} onClick={closeDrawer}>
              Sair da conta
            </Link>
          )}
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topBar}>
          <button type="button" className={styles.menuBtn} onClick={openDrawer} aria-label="Abrir menu">
            <span className={styles.menuIcon} aria-hidden>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </span>
          </button>
          <span className={styles.topBarTitle}>Área autenticada</span>
          <div className={styles.topBarActions}>
            <ThemeToggle compact />
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>

      <NotImplementedModal
        open={Boolean(comingSoonKey)}
        featureKey={comingSoonKey || "formatos"}
        onClose={() => setComingSoonKey(null)}
      />
    </div>
  );
}
