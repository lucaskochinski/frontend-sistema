"use client";

import { useEffect } from "react";
import { useModalMotion } from "@/lib/useModalMotion";
import styles from "./NotImplementedModal.module.css";

export const NOT_IMPLEMENTED_COPY = {
  vturb: {
    title: "VTurb",
    description:
      "A integração com a API VTurb ainda não está implementada. Em breve poderá conectar a sua conta e ver métricas de VSL aqui.",
  },
  formatos: {
    title: "Formatos criativos",
    description:
      "A biblioteca de formatos criativos ainda não está disponível nesta versão. Estamos a finalizar essa funcionalidade.",
  },
  criador: {
    title: "Criador de anúncio",
    description:
      "O criador de anúncio com IA ainda não está disponível nesta versão. Em breve poderá gerar copies e previews a partir dos seus criativos.",
  },
};

export default function NotImplementedModal({ open, featureKey = "vturb", title, description, onClose }) {
  const copy = NOT_IMPLEMENTED_COPY[featureKey] || NOT_IMPLEMENTED_COPY.vturb;
  const resolvedTitle = title || copy.title;
  const resolvedDescription = description || copy.description;
  const { mounted, closing } = useModalMotion(open);

  useEffect(() => {
    if (!mounted) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  useEffect(() => {
    if (!mounted) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`${styles.root} ${closing ? styles.rootOut : styles.rootIn}`}
      role="presentation"
    >
      <button type="button" className={styles.backdrop} aria-label="Fechar" onClick={onClose} />
      <div
        className={`${styles.panel} ${closing ? styles.panelOut : styles.panelIn}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="not-implemented-title"
        aria-describedby="not-implemented-desc"
      >
        <div className={styles.glow} aria-hidden />
        <p className={styles.badge}>Em breve</p>
        <h2 id="not-implemented-title" className={styles.title}>
          {resolvedTitle}
        </h2>
        <p id="not-implemented-desc" className={styles.text}>
          {resolvedDescription}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
