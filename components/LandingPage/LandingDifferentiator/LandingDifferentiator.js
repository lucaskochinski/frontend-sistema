import styles from "./LandingDifferentiator.module.css";

const ITEMS = [
  {
    id: "gancho",
    title: "O gancho",
    text: "Os 3 segundos que prendem ou perdem o cliente.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "promessa",
    title: "A promessa",
    text: "O que seu criativo entrega em uma linha.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "padrao",
    title: "O padrão",
    text: "O que se repete nos seus criativos vencedores.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 18V8M12 18V5M19 18v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "motivo",
    title: "O motivo",
    text: "Por que esse criativo escala em linguagem simples.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "juncoes",
    title: "As junções",
    text: "Combinações entre criativos para multiplicar resultado.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 7h10M7 17h10M9 5v4M15 15v4M15 5v4M9 15v4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "formatos",
    title: "Os formatos",
    text: "Mais de 50 formatos sugeridos sob medida.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 11l7-4M12 11v8M12 11L5 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "retencao",
    title: "A retenção",
    text: "Onde o público desiste e como segurar até o final.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 16l4-5 4 3 5-8 3 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      </svg>
    ),
  },
  {
    id: "conversao",
    title: "A conversão",
    text: "O que move da curiosidade para a compra.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4L12 3z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M5 18l1-2.5M19 18l-1-2.5M8 21l.8-2M16 21l-.8-2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function LandingDifferentiator() {
  return (
    <section id="diferencial" className={styles.section} aria-labelledby="landing-differentiator-title">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>O diferencial</p>

          <h2 id="landing-differentiator-title" className={styles.title}>
            <span className={`${styles.line} ${styles.lineBright}`}>Não mostramos só o que</span>
            <span className={styles.line}>
              <span className={styles.lineMuted}>performou. </span>
              <span className={styles.lineGold}>Mostramos o porquê.</span>
            </span>
          </h2>
        </header>

        <ul className={styles.grid}>
          {ITEMS.map((item) => (
            <li key={item.id} className={styles.card}>
              <span className={styles.cardIcon}>{item.icon}</span>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardText}>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
