import Image from "next/image";
import Link from "next/link";
import { LANDING_ANCHORS } from "../landingLinks";
import styles from "./LandingFooter.module.css";

const SECTION_LINKS = [
  { href: LANDING_ANCHORS.inicio, label: "Início" },
  { href: LANDING_ANCHORS.planos, label: "Planos" },
  { href: LANDING_ANCHORS.formula, label: "IA + Dados + Estratégia" },
  { href: LANDING_ANCHORS.mercado, label: "A real do mercado" },
  { href: LANDING_ANCHORS.problema, label: "O problema" },
  { href: LANDING_ANCHORS.diferencial, label: "O diferencial" },
  { href: LANDING_ANCHORS.comparacao, label: "Antes e depois" },
  { href: LANDING_ANCHORS.publico, label: "Para quem é" },
  { href: LANDING_ANCHORS.cta, label: "Começar" },
];

export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href={LANDING_ANCHORS.inicio} className={styles.logoLink} aria-label="Hooko — início">
              <Image
                src="/imagens/logo/logo-pequena.png"
                alt=""
                width={40}
                height={40}
                className={styles.logoMark}
              />
              <span className={styles.logoText}>Hooko</span>
            </Link>
            <p className={styles.tagline}>
              IA especialista em criativos. Encontre padrões ocultos, analise anúncios e escale com
              previsibilidade.
            </p>
          </div>

          <nav className={styles.nav} aria-label="Secções da página">
            <p className={styles.columnTitle}>Secções</p>
            <ul className={styles.links}>
              {SECTION_LINKS.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>© {new Date().getFullYear()} Hooko. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
