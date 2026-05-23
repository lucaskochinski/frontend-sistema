"use client";

import AdminModal from "@/components/AdminModal/AdminModal.js";
import shared from "@/app/(app)/admin/adminShared.module.css";
import s from "./AdminStepModal.module.css";

/**
 * Modal admin com navegação por passos (wizard).
 * @param {{ key: string, label: string, content: React.ReactNode }[]} steps
 */
export default function AdminStepModal({
  open,
  title,
  subtitle,
  steps = [],
  step = 0,
  onStepChange,
  onClose,
  onSubmit,
  busy = false,
  submitLabel = "Concluir",
  wide = true,
  size = "xl",
}) {
  const safeStep = Math.min(Math.max(step, 0), Math.max(steps.length - 1, 0));
  const current = steps[safeStep];
  const isFirst = safeStep === 0;
  const isLast = safeStep >= steps.length - 1;
  const isXl = size === "xl";

  return (
    <AdminModal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      size={size}
      wide={wide && !isXl}
      footer={
        <>
          <button type="button" className={`${shared.btnGhost} ${s.footerBtn}`} onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          {!isFirst ? (
            <button
              type="button"
              className={`${shared.btnGhost} ${s.footerBtn}`}
              onClick={() => onStepChange?.(safeStep - 1)}
              disabled={busy}
            >
              Voltar
            </button>
          ) : null}
          {isLast ? (
            <button type="button" className={`${shared.btnPrimary} ${s.footerBtnPrimary}`} onClick={onSubmit} disabled={busy}>
              {busy ? "A guardar…" : submitLabel}
            </button>
          ) : (
            <button
              type="button"
              className={`${shared.btnPrimary} ${s.footerBtnPrimary}`}
              onClick={() => onStepChange?.(safeStep + 1)}
              disabled={busy}
            >
              Continuar
            </button>
          )}
        </>
      }
    >
      <div className={`${s.shell} ${isXl ? s.shellXl : ""}`}>
        <nav className={s.stepNav} aria-label="Progresso">
          {steps.map((st, i) => {
            const done = i < safeStep;
            const active = i === safeStep;
            return (
              <button
                key={st.key}
                type="button"
                className={`${s.stepNavItem} ${active ? s.stepNavItemActive : ""} ${done ? s.stepNavItemDone : ""}`}
                onClick={() => !busy && i < safeStep && onStepChange?.(i)}
                disabled={busy || i > safeStep}
                aria-current={active ? "step" : undefined}
              >
                <span className={s.stepNum}>{done ? "✓" : i + 1}</span>
                <span className={s.stepNavLabel}>{st.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={s.stepMain}>
          <div className={s.stepHead}>
            <p className={s.stepKicker}>
              Passo {safeStep + 1} de {steps.length}
            </p>
            <h3 className={s.stepTitle}>{current?.label}</h3>
          </div>
          <div key={current?.key} className={s.stepContent}>
            {current?.content}
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

export function ReviewRow({ label, value }) {
  return (
    <div className={s.reviewRow}>
      <span className={s.reviewKey}>{label}</span>
      <span className={s.reviewVal}>{value ?? "—"}</span>
    </div>
  );
}
