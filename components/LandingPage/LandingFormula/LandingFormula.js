import styles from "./LandingFormula.module.css";

const PILLARS = [
  {
    id: "dados",
    title: "Dados",
    text: "Centralizamos e analisamos todas as suas fontes de dados em um só lugar.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 18V8M12 18V5M19 18v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "integracao",
    title: "Integração",
    text: "Conecte plataformas, automatize processos e tenha tudo funcionando junto.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 11l7-4M12 11v8M12 11L5 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "automacao",
    title: "Automação",
    text: "Economize tempo com fluxos inteligentes e automações personalizadas.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    id: "resultados",
    title: "Resultados",
    text: "Decisões baseadas em IA que geram mais vendas, menos desperdício e escala real.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
];

export default function LandingFormula() {
  return (
    <section id="formula" className={styles.section} aria-labelledby="landing-formula-title">
      <div className={styles.inner}>
        <div className={styles.banner}>
          <span className={styles.bannerIcon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v1.2c0 .5-.2 1-.6 1.4L14 9.5V11c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1V9.5L8.6 7.6C8.2 7.2 8 6.7 8 6.2V5z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M10 12v2.5c0 1.1.9 2 2 2s2-.9 2-2V12M7 19h10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div className={styles.bannerCopy}>
            <h2 id="landing-formula-title" className={styles.bannerTitle}>
              IA + Dados + Estratégia = Resultados reais
            </h2>
            <p className={styles.bannerSub}>Sua vantagem competitiva começa aqui.</p>
          </div>
        </div>

        <ul className={styles.grid}>
          {PILLARS.map((item) => (
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
