import styles from "./LandingComparison.module.css";

const BEFORE_ITEMS = [
  "Chute como estratégia",
  "Criativo morre e ninguém sabe por quê",
  "Repete erro toda semana",
  "Reuniões longas e decisão lenta",
];

const AFTER_ITEMS = [
  "Insight no lugar de achismo",
  "Padrão dos vencedores em 1 clique",
  "Sugestões de novas junções e formatos pela IA",
  "Decisão em segundos com mais conversão",
];

export default function LandingComparison() {
  return (
    <section id="comparacao" className={styles.section} aria-label="Comparação antes e depois">
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <article className={`${styles.card} ${styles.cardBefore}`}>
          <p className={`${styles.label} ${styles.labelBefore}`}>Antes</p>
          <h2 className={styles.title}>Testar no escuro</h2>
          <ul className={styles.list}>
            {BEFORE_ITEMS.map((text) => (
              <li key={text} className={`${styles.item} ${styles.itemBefore}`}>
                <span className={styles.iconBefore} aria-hidden="true">
                  ›
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={`${styles.card} ${styles.cardAfter}`}>
          <p className={`${styles.label} ${styles.labelAfter}`}>Com Hooko</p>
          <h2 className={styles.title}>Entender e escalar</h2>
          <ul className={styles.list}>
            {AFTER_ITEMS.map((text) => (
              <li key={text} className={`${styles.item} ${styles.itemAfter}`}>
                <span className={styles.iconAfter} aria-hidden="true">
                  ✓
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
