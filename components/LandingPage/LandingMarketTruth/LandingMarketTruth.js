import styles from "./LandingMarketTruth.module.css";

export default function LandingMarketTruth() {
  return (
    <section id="mercado" className={styles.section} aria-labelledby="landing-market-truth-title">
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <p className={styles.eyebrow}>A real do mercado</p>

        <h2 id="landing-market-truth-title" className={styles.title}>
          <span className={`${styles.line} ${styles.lineBright}`}>Você gasta dinheiro</span>
          <span className={`${styles.line} ${styles.lineMuted}`}>comprando dados, mas não</span>
          <span className={styles.line}>
            <span className={styles.lineBright}>consegue ver </span>
            <span className={styles.lineGold}>o que fazer</span>
          </span>
          <span className={`${styles.line} ${styles.lineGold}`}>com eles para vender mais.</span>
        </h2>

        <p className={styles.lede}>
          Seus problemas acabaram. Conheça a Hooko, a inteligência que transforma seus relatórios em
          decisões claras de criativo.
        </p>
      </div>
    </section>
  );
}
