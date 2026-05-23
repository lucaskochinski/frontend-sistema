"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useModalMotion } from "@/lib/useModalMotion";
import s from "./AdminModal.module.css";

/**
 * Modal premium para admin (portal, ESC, motion enter/exit).
 * @param {'default' | 'wide' | 'xl'} [size]
 */
export default function AdminModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
  size,
}) {
  const titleId = useId();
  const { mounted, closing } = useModalMotion(open);
  const resolvedSize = size || (wide ? "wide" : "default");

  useEffect(() => {
    if (!mounted) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`${s.backdrop} ${closing ? s.backdropOut : s.backdropIn}`}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`${s.dialog} ${s[`dialog_${resolvedSize}`] || ""} ${closing ? s.dialogOut : s.dialogIn}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={s.glow} aria-hidden />
        <div className={s.header}>
          <div className={s.headerText}>
            <h2 className={s.title} id={titleId}>
              {title}
            </h2>
            {subtitle ? <p className={s.subtitle}>{subtitle}</p> : null}
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={`${s.body} ${resolvedSize === "xl" ? s.bodyXl : ""}`}>{children}</div>
        {footer ? <div className={`${s.footer} ${resolvedSize === "xl" ? s.footerXl : ""}`}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
