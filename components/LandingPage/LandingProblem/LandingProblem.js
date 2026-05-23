import styles from "./LandingProblem.module.css";

export default function LandingProblem() {
  return (
    <section id="problema" className={styles.section} aria-labelledby="landing-problem-title">
      <div className={styles.inner}>
        <div>
          <p className={styles.eyebrow}>O problema</p>

          <h2 id="landing-problem-title" className={styles.title}>
            <span className={`${styles.line} ${styles.lineBright}`}>Você testa.</span>
            <span className={`${styles.line} ${styles.lineBright}`}>Você gasta.</span>
            <span className={`${styles.line} ${styles.lineMuted}`}>Você não</span>
            <span className={`${styles.line} ${styles.lineMuted}`}>entende.</span>
          </h2>
        </div>

        <div className={styles.copy}>
          <p className={styles.body}>
            <span className={styles.bodyLine}>Seu criativo bombou semana passada. Hoje, parou.</span>
            <span className={styles.bodyLine}>Outro travou na primeira hora. Sem motivo aparente.</span>
          </p>

          <p className={styles.closer}>
            <span className={styles.closerStrong}>Dados são números.</span>{" "}
            <span className={styles.closerGold}>Hooko é entendimento.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
