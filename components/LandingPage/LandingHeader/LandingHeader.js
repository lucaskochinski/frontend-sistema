import Image from "next/image";
import Link from "next/link";
import { LANDING_ANCHORS } from "../landingLinks";
import styles from "./LandingHeader.module.css";

export default function LandingHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={LANDING_ANCHORS.inicio} className={styles.logoLink} aria-label="Hooko — início">
          <Image
            src="/imagens/logo/logo-pequena.png"
            alt=""
            width={32}
            height={32}
            className={styles.logoMark}
            priority
          />
          <span className={styles.logoText}>Hooko</span>
        </Link>

        <Link href={LANDING_ANCHORS.planos} className={styles.cta}>
          Quero mais conversão
          <span className={styles.ctaArrow} aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </header>
  );
}
