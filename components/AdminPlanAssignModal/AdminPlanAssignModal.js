"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminModal from "@/components/AdminModal/AdminModal";
import { formatPlanPrice } from "@/lib/billing";
import { apiFetch } from "@/lib/hooko-session";
import s from "../adminShared.module.css";
import m from "./AdminPlanAssignModal.module.css";

const MODES = [
  { id: "grant", label: "Activar grátis", hint: "Cortesia, parceiro ou plano comp." },
  { id: "checkout", label: "Link de pagamento", hint: "Stripe Checkout para o cliente pagar." },
  { id: "change", label: "Alterar plano", hint: "Trocar plano da assinatura activa." },
  { id: "revoke", label: "Revogar", hint: "Cancela o acesso ao plano." },
];

function fmtDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function subscriptionStatusLabel(status) {
  const v = String(status || "").toLowerCase();
  if (v === "active") return "Activo";
  if (v === "trialing") return "Trial";
  if (v === "canceled") return "Cancelado";
  if (v === "past_due") return "Em atraso";
  return status || "—";
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   organizationId: string | null;
 *   organizationName?: string;
 *   userEmail?: string;
 *   onSuccess?: (message?: string) => void;
 * }} props
 */
export default function AdminPlanAssignModal({
  open,
  onClose,
  organizationId,
  organizationName = "",
  userEmail = "",
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const [mode, setMode] = useState("grant");
  const [plans, setPlans] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [planId, setPlanId] = useState("");
  const [grantStatus, setGrantStatus] = useState("active");
  const [periodDays, setPeriodDays] = useState("30");
  const [trialDays, setTrialDays] = useState("14");
  const [notes, setNotes] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [billingEmail, setBillingEmail] = useState(userEmail);
  const [billingName, setBillingName] = useState(organizationName);
  const [periodEnd, setPeriodEnd] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === planId) || null,
    [plans, planId],
  );

  const loadContext = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setErr("");
    setInfo("");
    setCheckoutUrl("");
    try {
      const data = await apiFetch(
        `/api/admin/organizations/${encodeURIComponent(organizationId)}/billing`,
      );
      const available = Array.isArray(data.availablePlans) ? data.availablePlans : [];
      setPlans(available);
      setActiveSubscription(data.activeSubscription || null);
      const activePlanId = data.activeSubscription?.plan?.id || data.activeSubscription?.planId;
      setPlanId(activePlanId || available[0]?.id || "");
      if (data.activeSubscription?.currentPeriodEnd) {
        setPeriodEnd(fmtDateInput(data.activeSubscription.currentPeriodEnd));
      }
    } catch (e) {
      setErr(e?.message || "Erro ao carregar billing da organização");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!open || !organizationId) return;
    setBillingEmail(userEmail || "");
    setBillingName(organizationName || "");
    setMode("grant");
    loadContext();
  }, [open, organizationId, userEmail, organizationName, loadContext]);

  async function handleSubmit() {
    if (!organizationId) return;
    setErr("");
    setInfo("");
    setCheckoutUrl("");
    setBusy(true);
    try {
      if (mode === "grant") {
        if (!planId) throw new Error("Seleccione um plano.");
        const data = await apiFetch(
          `/api/admin/organizations/${encodeURIComponent(organizationId)}/subscriptions/grant`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId,
              mode: grantStatus === "trialing" ? "trial" : "free",
              status: grantStatus,
              periodDays: Number(periodDays) || 30,
              trialDays: Number(trialDays) || 14,
              notes,
              replaceExisting,
            }),
          },
        );
        setInfo(data.message || "Plano activado.");
        onSuccess?.(data.message);
        await loadContext();
        return;
      }

      if (mode === "checkout") {
        if (!planId) throw new Error("Seleccione um plano.");
        if (!billingEmail.trim()) throw new Error("E-mail de cobrança obrigatório.");
        const data = await apiFetch(
          `/api/admin/organizations/${encodeURIComponent(organizationId)}/subscriptions/checkout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId,
              billingEmail: billingEmail.trim(),
              billingName: billingName.trim() || undefined,
            }),
          },
        );
        setCheckoutUrl(data.checkoutUrl || "");
        setInfo(data.message || "Link gerado.");
        return;
      }

      if (mode === "change") {
        if (!activeSubscription?.id) throw new Error("Organização sem assinatura activa.");
        if (!planId) throw new Error("Seleccione o novo plano.");
        await apiFetch(
          `/api/admin/organizations/${encodeURIComponent(organizationId)}/subscriptions/${encodeURIComponent(activeSubscription.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId,
              periodEnd: periodEnd || undefined,
              notes,
            }),
          },
        );
        setInfo("Plano actualizado.");
        onSuccess?.("Plano actualizado.");
        await loadContext();
        return;
      }

      if (mode === "revoke") {
        if (!activeSubscription?.id) throw new Error("Organização sem assinatura activa.");
        const data = await apiFetch(
          `/api/admin/organizations/${encodeURIComponent(organizationId)}/subscriptions/${encodeURIComponent(activeSubscription.id)}/revoke`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: revokeReason }),
          },
        );
        setInfo(data.message || "Assinatura revogada.");
        onSuccess?.(data.message);
        await loadContext();
      }
    } catch (e) {
      setErr(e?.message || "Operação falhou");
    } finally {
      setBusy(false);
    }
  }

  const submitLabel =
    mode === "grant"
      ? "Activar plano grátis"
      : mode === "checkout"
        ? "Gerar link Stripe"
        : mode === "change"
          ? "Guardar alteração"
          : "Revogar assinatura";

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Gerir plano da organização"
      subtitle={
        organizationName
          ? `${organizationName}${userEmail ? ` · ${userEmail}` : ""}`
          : userEmail || "Associe planos, cortesias ou pagamento directo."
      }
      size="wide"
      footer={
        <>
          <button type="button" className={s.btnGhost} onClick={onClose} disabled={busy}>
            Fechar
          </button>
          <button type="button" className={s.btnPrimary} disabled={busy || loading || !organizationId} onClick={handleSubmit}>
            {busy ? "A processar…" : submitLabel}
          </button>
        </>
      }
    >
      {!organizationId ? (
        <p className={s.err}>Organização não definida para este utilizador.</p>
      ) : loading ? (
        <p className={m.muted}>A carregar planos e assinatura…</p>
      ) : (
        <>
          {err ? <p className={s.err}>{err}</p> : null}
          {info ? <p className={s.success}>{info}</p> : null}

          <div className={m.summary}>
            <div>
              <span className={m.summaryLabel}>Assinatura actual</span>
              <strong>
                {activeSubscription?.plan?.displayName || "Sem plano activo"}
              </strong>
              {activeSubscription ? (
                <span className={m.summaryMeta}>
                  {subscriptionStatusLabel(activeSubscription.status)}
                  {activeSubscription.currentPeriodEnd
                    ? ` · até ${fmtDateInput(activeSubscription.currentPeriodEnd)}`
                    : ""}
                </span>
              ) : null}
            </div>
            <button type="button" className={`${s.btnGhost} ${s.btnSm}`} onClick={loadContext} disabled={busy}>
              Actualizar
            </button>
          </div>

          <div className={m.modeGrid}>
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${m.modeCard} ${mode === item.id ? m.modeCardActive : ""}`}
                onClick={() => setMode(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </div>

          {(mode === "grant" || mode === "checkout" || mode === "change") && (
            <div className={m.fieldBlock}>
              <label className={s.label} htmlFor="admin-plan-select">
                Plano
              </label>
              <select
                id="admin-plan-select"
                className={s.input}
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                {plans.length === 0 ? <option value="">Nenhum plano disponível</option> : null}
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.displayName}
                    {formatPlanPrice(plan) ? ` · ${formatPlanPrice(plan)}/mês` : ""}
                    {plan.customOrganizationId ? " · exclusivo" : ""}
                  </option>
                ))}
              </select>
              {selectedPlan ? (
                <p className={m.planHint}>
                  {formatPlanPrice(selectedPlan) || "Sem preço definido"}
                  {Number(selectedPlan.trialDays) > 0 ? ` · ${selectedPlan.trialDays} dias trial` : ""}
                </p>
              ) : null}
            </div>
          )}

          {mode === "grant" ? (
            <div className={m.formGrid}>
              <div className={m.fieldBlock}>
                <label className={s.label} htmlFor="admin-grant-status">
                  Tipo de activação
                </label>
                <select
                  id="admin-grant-status"
                  className={s.input}
                  value={grantStatus}
                  onChange={(e) => setGrantStatus(e.target.value)}
                >
                  <option value="active">Grátis / cortesia (activo)</option>
                  <option value="trialing">Trial administrativo</option>
                </select>
              </div>
              <div className={m.fieldBlock}>
                <label className={s.label} htmlFor="admin-period-days">
                  Duração (dias)
                </label>
                <input
                  id="admin-period-days"
                  className={s.input}
                  type="number"
                  min={1}
                  max={3650}
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                />
              </div>
              {grantStatus === "trialing" ? (
                <div className={m.fieldBlock}>
                  <label className={s.label} htmlFor="admin-trial-days">
                    Dias de trial
                  </label>
                  <input
                    id="admin-trial-days"
                    className={s.input}
                    type="number"
                    min={1}
                    max={730}
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                  />
                </div>
              ) : null}
              <label className={m.checkRow}>
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                />
                Substituir assinatura activa anterior
              </label>
              <div className={`${m.fieldBlock} ${m.formGridWide}`}>
                <label className={s.label} htmlFor="admin-grant-notes">
                  Notas internas
                </label>
                <textarea
                  id="admin-grant-notes"
                  className={s.input}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Motivo, acordo comercial, referência…"
                />
              </div>
            </div>
          ) : null}

          {mode === "checkout" ? (
            <div className={m.formGrid}>
              <div className={m.fieldBlock}>
                <label className={s.label} htmlFor="admin-billing-email">
                  E-mail de cobrança
                </label>
                <input
                  id="admin-billing-email"
                  className={s.input}
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                />
              </div>
              <div className={m.fieldBlock}>
                <label className={s.label} htmlFor="admin-billing-name">
                  Nome na factura
                </label>
                <input
                  id="admin-billing-name"
                  className={s.input}
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                />
              </div>
              {checkoutUrl ? (
                <div className={`${m.fieldBlock} ${m.formGridWide}`}>
                  <label className={s.label}>Link Stripe Checkout</label>
                  <div className={m.linkRow}>
                    <input className={s.input} readOnly value={checkoutUrl} />
                    <button
                      type="button"
                      className={`${s.btnGhost} ${s.btnSm}`}
                      onClick={() => navigator.clipboard?.writeText(checkoutUrl)}
                    >
                      Copiar
                    </button>
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${s.btnPrimary} ${s.btnSm}`}
                    >
                      Abrir
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {mode === "change" ? (
            <div className={m.formGrid}>
              <div className={m.fieldBlock}>
                <label className={s.label} htmlFor="admin-period-end">
                  Fim do período
                </label>
                <input
                  id="admin-period-end"
                  className={s.input}
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
              <div className={`${m.fieldBlock} ${m.formGridWide}`}>
                <label className={s.label} htmlFor="admin-change-notes">
                  Notas
                </label>
                <textarea
                  id="admin-change-notes"
                  className={s.input}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {mode === "revoke" ? (
            <div className={m.fieldBlock}>
              <label className={s.label} htmlFor="admin-revoke-reason">
                Motivo da revogação
              </label>
              <textarea
                id="admin-revoke-reason"
                className={s.input}
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Opcional — fica registado no billingMetadata"
              />
              <p className={m.planHint}>
                Remove o acesso imediato. Se existir subscrição Stripe, tenta cancelar a renovação.
              </p>
            </div>
          ) : null}
        </>
      )}
    </AdminModal>
  );
}
