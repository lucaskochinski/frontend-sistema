import Link from "next/link";
import { LANDING_ANCHORS } from "../landingLinks";
import styles from "./LandingHero.module.css";

const FEATURES = [
  {
    id: "understand",
    title: "IA que entende o que funciona",
    text: "Analisamos milhões de anúncios para encontrar padrões ocultos.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      </svg>
    ),
  },
  {
    id: "discover",
    title: "Descubra antes. Lidere sempre.",
    text: "Receba insights acionáveis e esteja sempre à frente da concorrência.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 18V6l8 4 8-4v12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 14l4 2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "scale",
    title: "Escale com previsibilidade. Cresça com segurança.",
    text: "A IA da Hooko reduz riscos e aumenta suas chances de sucesso.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 18h16M6 18V10M10 18V7M14 18v-5M18 18V4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function LandingHero() {
  return (
    <section id="inicio" className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.badge}>
            <span aria-hidden="true">✨</span> IA especialista em criativos
          </p>

          <h1 id="landing-hero-title" className={styles.title}>
            A IA que{" "}
            <span className={styles.titleGold}>encontra, analisa e escala</span> seus criativos{" "}
            <span className={styles.titleGold}>vencedores.</span>
          </h1>

          <p className={styles.subtitle}>Detecte padrões ocultos.</p>

          <p className={styles.lede}>
            A Hooko é uma Inteligência Artificial que transforma dados em{" "}
            <span className={styles.ledeGold}>decisões e resultados.</span>
          </p>

          <ul className={styles.features}>
            {FEATURES.map((item) => (
              <li key={item.id} className={styles.feature}>
                <span className={styles.featureIcon}>{item.icon}</span>
                <div>
                  <p className={styles.featureTitle}>{item.title}</p>
                  <p className={styles.featureText}>{item.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link href={LANDING_ANCHORS.planos} className={styles.btnPrimary}>
              Analisar criativos
              <span aria-hidden="true">→</span>
            </Link>
            <Link href={LANDING_ANCHORS.diferencial} className={styles.btnGhost}>
              <span className={styles.playIcon} aria-hidden="true">
                ▶
              </span>
              Ver demonstração
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
