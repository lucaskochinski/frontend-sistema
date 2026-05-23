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
  steps = [],
  step = 0,
  onStepChange,
  onClose,
  onSubmit,
  busy = false,
  submitLabel = "Concluir",
  wide = true,
}) {
  const safeStep = Math.min(Math.max(step, 0), Math.max(steps.length - 1, 0));
  const current = steps[safeStep];
  const isFirst = safeStep === 0;
  const isLast = safeStep >= steps.length - 1;

  return (
    <AdminModal
      open={open}
      title={title}
      onClose={onClose}
      wide={wide}
      footer={
        <>
          <button type="button" className={shared.btnGhost} onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          {!isFirst ? (
            <button
              type="button"
              className={shared.btnGhost}
              onClick={() => onStepChange?.(safeStep - 1)}
              disabled={busy}
            >
              Voltar
            </button>
          ) : null}
          {isLast ? (
            <button type="button" className={shared.btnPrimary} onClick={onSubmit} disabled={busy}>
              {busy ? "A guardar…" : submitLabel}
            </button>
          ) : (
            <button
              type="button"
              className={shared.btnPrimary}
              onClick={() => onStepChange?.(safeStep + 1)}
              disabled={busy}
            >
              Continuar
            </button>
          )}
        </>
      }
    >
      <div className={s.stepBar} aria-label="Progresso">
        {steps.map((st, i) => {
          const done = i < safeStep;
          const active = i === safeStep;
          return (
            <div key={st.key} className={s.stepItem}>
              <div className={s.stepTrack} aria-hidden>
                <div className={s.stepTrackFill} style={{ width: done || active ? "100%" : "0%" }} />
              </div>
              <span
                className={`${s.stepLabel} ${active ? s.stepLabelActive : ""} ${done ? s.stepLabelDone : ""}`}
              >
                {i + 1}. {st.label}
              </span>
            </div>
          );
        })}
      </div>
      {current?.content}
    </AdminModal>
  );
}

export function ReviewRow({ label, value }) {
  return (
    <div className={s.reviewRow}>
      <span className={s.reviewKey}>{label}</span>
      <span className={`${s.reviewVal} ${typeof value === "string" && value.includes("_") ? s.mono : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}
