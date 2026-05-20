"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import s from "./AdminModal.module.css";

/**
 * Modal simples para admin (portal, ESC, foco inicial).
 */
export default function AdminModal({ open, title, onClose, children, footer, wide = false }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={s.backdrop} role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`${s.dialog} ${wide ? s.dialogWide : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={s.header}>
          <h2 className={s.title} id={titleId}>
            {title}
          </h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className={s.body}>{children}</div>
        {footer ? <div className={s.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
