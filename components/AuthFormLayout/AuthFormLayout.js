import Image from "next/image";
import styles from "./AuthFormLayout.module.css";

/**
 * Coluna com logo (PNG com alpha) + cartão do formulário — login e cadastro.
 */
export default function AuthFormLayout({ children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.logoWrap}>
        <Image
          src="/imagens/logo/logo.png"
          alt="HOOKO"
          width={2023}
          height={779}
          priority
          sizes="(max-width: 900px) 78vw, 240px"
          className={styles.logo}
        />
      </div>
      <div className={styles.card}>{children}</div>
    </div>
  );
}
