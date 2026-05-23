"use client";

import Image from "next/image";
import styles from "./creativeAi.module.css";

export default function HookoAiCoach({
  message = "Entendo o que faz um criativo vender e mostro como encontrar mais vencedores, todos os dias.",
}) {
  return (
    <aside className={styles.coachRow} aria-label="IA HOOKO">
      <Image
        src="/imagens/landing/hooka-mascot.png"
        alt=""
        width={72}
        height={72}
        className={styles.coachMascot}
      />
      <div className={styles.coachBubble}>
        <span className={styles.coachLabel}>IA HOOKO</span>
        {message}
      </div>
    </aside>
  );
}
