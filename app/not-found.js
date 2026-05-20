import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import styles from "./not-found.module.css";

export const metadata = {
  title: "404 — Página não encontrada | Hooko",
  description: "Esta página não existe ou foi movida.",
};

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export default function NotFound() {
  return (
    <div className={`${styles.page} ${montserrat.className}`}>
      <main className={styles.inner}>
        <h1 className="sr-only">404 — página não encontrada</h1>
        <div className={styles.octoWrap}>
          <div className={styles.octoGlow} aria-hidden />
          <div className={styles.octoPulse} aria-hidden />
          <div className={styles.octoFrame}>
            <Image
              src="/imagens/404-polvo.png"
              alt=""
              fill
              className={styles.octoImg}
              priority
              sizes="(max-width: 480px) 98vw, 576px"
            />
          </div>
        </div>

        <p className={`${styles.message} ${montserrat.className}`}>
          O Hooko já foi espreitar este URL — e não trouxe nada
          <span className={styles.dots} aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <br />
          <strong>Volta ao início</strong> ou confirma o endereço na barra.
        </p>

        <div className={styles.actions}>
          <Link href="/inicio" className={`${styles.btn} ${styles.btnPrimary}`}>
            Ir para o início
          </Link>
          <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
            Entrar
          </Link>
        </div>

        <p className={styles.hookoFoot}>Hooko</p>
      </main>
    </div>
  );
}
