import styles from "./LandingAudience.module.css";

const AUDIENCES = [
  {
    id: "agencias",
    title: "Agências",
    text: "Entregue resultado consistente para todos os clientes.",
  },
  {
    id: "infoprodutores",
    title: "Infoprodutores",
    text: "Escale lançamentos e perpétuos com criativo certo.",
  },
  {
    id: "ecommerce",
    title: "Ecommerce",
    text: "Mais conversão e ROAS por anúncio rodado.",
  },
  {
    id: "gestores",
    title: "Gestores de tráfego",
    text: "Decisão rápida e clara para escalar campanhas.",
  },
];

export default function LandingAudience() {
  return (
    <section id="publico" className={styles.section} aria-labelledby="landing-audience-title">
      <div className={styles.inner}>
        <h2 id="landing-audience-title" className={styles.title}>
          <span className={styles.titleBright}>Pra quem </span>
          <span className={styles.titleGold}>vive de criativo.</span>
        </h2>
        <p className={styles.lede}>
          Feito para quem precisa transformar anúncio em receita todo dia.
        </p>

        <ul className={styles.grid}>
          {AUDIENCES.map((item) => (
            <li key={item.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardText}>{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
