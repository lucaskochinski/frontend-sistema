import Link from "next/link";
import styles from "./AdminForbidden.module.css";

export default function AdminForbidden({ reason }) {
  const isAuthIssue = reason === "noauth";

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Acesso reservado a administradores</h1>
      <p className={styles.lede}>
        {isAuthIssue
          ? "Precisas de sessão válida para abrir esta área."
          : "A tua conta não tem papel de administrador da plataforma."}
      </p>
      <Link className={styles.link} href={isAuthIssue ? "/login" : "/inicio"}>
        {isAuthIssue ? "Ir para entrar" : "Voltar ao início"}
      </Link>
    </div>
  );
}
