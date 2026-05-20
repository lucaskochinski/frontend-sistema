import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Checkout — HOOKO",
};

export default function CheckoutPage() {
  return (
    <main className={styles.wrap}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Assinatura</p>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.sub}>
          Fluxo de pagamento (Stripe) entra aqui no MVP. Após o cadastro, o utilizador segue para escolher plano e
          concluir a subscrição.
        </p>
        <p className={styles.links}>
          <Link className={styles.link} href="/login">
            Ir para login
          </Link>
          {" · "}
          <Link className={styles.link} href="/inicio">
            Painel
          </Link>
        </p>
      </div>
    </main>
  );
}
