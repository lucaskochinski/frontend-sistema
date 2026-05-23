import Link from "next/link";
import styles from "./page.module.css";

export default function BillingCancelPage() {
  return (
    <main className={styles.wrap}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Pagamento cancelado</p>
        <h1 className={styles.title}>Sem problema</h1>
        <p className={styles.sub}>Pode voltar quando quiser escolher um plano.</p>
        <p className={styles.links}>
          <Link className={styles.link} href="/checkout">
            Voltar aos planos
          </Link>
        </p>
      </div>
    </main>
  );
}
