"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./CriativoNav.module.css";

const TABS = [
  { href: "/criativo/dashboard", label: "Dashboard" },
  { href: "/criativo/biblioteca", label: "Biblioteca" },
];

export default function CriativoNav() {
  const pathname = usePathname();
  const onDetail = pathname.startsWith("/criativo/") && !TABS.some((t) => pathname === t.href);

  if (onDetail) return null;

  return (
    <nav className={styles.nav} aria-label="Secções de criativos">
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href === "/criativo/dashboard" && pathname === "/criativo");
        return (
          <Link key={tab.href} href={tab.href} className={`${styles.tab} ${active ? styles.tabActive : ""}`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
