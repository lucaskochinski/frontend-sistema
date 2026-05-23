import Link from "next/link";
import { LANDING_ANCHORS } from "../landingLinks";
import styles from "./LandingCta.module.css";

export default function LandingCta() {
  return (
    <section id="cta" className={styles.section} aria-labelledby="landing-cta-title">
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <h2 id="landing-cta-title" className={styles.title}>
          Pare de testar no escuro. Comece a escalar com clareza.
        </h2>
        <p className={styles.lede}>
          A Hooko transforma dados de anúncio em decisões de criativo — gancho, retenção, oferta e
          conversão em um só lugar.
        </p>

        <div className={styles.actions}>
          <Link href={LANDING_ANCHORS.planos} className={styles.btnPrimary}>
            Criar conta
            <span aria-hidden="true">→</span>
          </Link>
          <Link href={LANDING_ANCHORS.comparacao} className={styles.btnGhost}>
            Ver comparação
          </Link>
        </div>
      </div>
    </section>
  );
}
