"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton.js";
import AdminModal from "@/components/AdminModal/AdminModal.js";
import AdminStepModal, { ReviewRow } from "@/components/AdminStepModal/AdminStepModal.js";
import { apiFetch } from "@/lib/hooko-session";
import s from "../adminShared.module.css";
import p from "./planos.module.css";

const DEFAULT_LIMITS = `{
  "creative_imports_per_month": 50
}`;

/** @typedef {{ id: string, tierKey: string, displayName: string, stripePriceId: string, trialDays: number, limitsJson: string, isPublic: boolean, isActive: boolean, customOrganizationId: string | null, orgName?: string }} PlanRow */

function mapPlanItem(item) {
  return {
    id: String(item.id),
    tierKey: item.tierKey ?? item.tier_key ?? "",
    displayName: item.displayName ?? item.name ?? "",
    stripePriceId: item.stripePriceId ?? item.stripe_price_id ?? "",
    trialDays: Number(item.trialDays ?? item.trial_days) || 0,
    limitsJson: JSON.stringify(item.limits ?? { creative_imports_per_month: 50 }, null, 2),
    isPublic: item.isPublic !== false && item.is_public !== false,
    isActive: item.isActive !== false && item.is_active !== false,
    customOrganizationId: item.customOrganizationId ?? item.custom_organization_id ?? null,
    orgName: item.customOrganization?.name ?? null,
  };
}

function summarizeVisibility(row) {
  if (row.customOrganizationId) return `Org. exclusivo · ${row.orgName || row.customOrganizationId.slice(0, 8)}…`;
  if (row.isPublic) return "Público na vitrine";
  return "Privado (não listado)";
}

export default function AdminPlanosPage() {
  const [loaded, setLoaded] = useState(false);
  const [plans, setPlans] = useState(/** @type {PlanRow[]} */ ([]));
  const [orgs, setOrgs] = useState(/** @type {{ id: string, name: string, slug: string }[]} */ ([]));

  const [err, setErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [ok, setOk] = useState("");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState(/** @type {'create' | 'edit'} */ ("create"));
  const [editingId, setEditingId] = useState(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [modalDelete, setModalDelete] = useState(/** @type {PlanRow | null} */ (null));
  const [busy, setBusy] = useState(false);

  const [tierKey, setTierKey] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [stripePriceId, setStripePriceId] = useState("");
  const [trialDays, setTrialDays] = useState("0");
  const [limitsJson, setLimitsJson] = useState(DEFAULT_LIMITS);
  const [visibility, setVisibility] = useState(/** @type {'public' | 'org'} */ ("public"));
  const [customOrgId, setCustomOrgId] = useState("");
  const [usingPublicFallback, setUsingPublicFallback] = useState(false);

  const loadPlans = useCallback(async () => {
    setErr("");
    setUsingPublicFallback(false);
    try {
      const data = await apiFetch("/api/admin/plans?limit=200&includeInactive=true");
      const items = Array.isArray(data.items) ? data.items : [];
      setPlans(items.map(mapPlanItem));
      setLoaded(true);
    } catch (e) {
      /** API antiga em produção só expunha POST /api/admin/plans — GET devolve 404. */
      if (e?.status === 404) {
        try {
          const pub = await apiFetch("/api/plans/public");
          const items = Array.isArray(pub.items) ? pub.items : [];
          setPlans(items.map(mapPlanItem));
          setUsingPublicFallback(true);
          setErr(
            "API em produção desactualizada: faça redeploy do hooko--api para listar todos os planos (inactivos, Stripe ID, editar/desactivar).",
          );
          setLoaded(true);
          return;
        } catch (fallbackErr) {
          setErr(fallbackErr?.message || "Erro ao carregar planos públicos");
          setLoaded(true);
          return;
        }
      }
      setErr(e?.message || "Erro ao carregar planos");
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/admin/organizations?limit=120");
        if (!cancelled) setOrgs(Array.isArray(data.items) ? data.items : []);
      } catch {
        /* opcional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetWizard = () => {
    setTierKey("");
    setDisplayName("");
    setStripePriceId("");
    setTrialDays("0");
    setLimitsJson(DEFAULT_LIMITS);
    setVisibility("public");
    setCustomOrgId("");
    setWizardStep(0);
    setFormErr("");
    setEditingId(null);
  };

  const openCreate = () => {
    resetWizard();
    setWizardMode("create");
    setWizardOpen(true);
  };

  const openEdit = (row) => {
    setFormErr("");
    setWizardMode("edit");
    setEditingId(row.id);
    setTierKey(row.tierKey);
    setDisplayName(row.displayName);
    setStripePriceId(row.stripePriceId);
    setTrialDays(String(row.trialDays));
    setLimitsJson(row.limitsJson || DEFAULT_LIMITS);
    setVisibility(row.customOrganizationId ? "org" : row.isPublic ? "public" : "org");
    setCustomOrgId(row.customOrganizationId || "");
    setWizardStep(0);
    setWizardOpen(true);
  };

  const validateStep = (step) => {
    if (step === 0) {
      const tk = tierKey.trim().toLowerCase();
      if (wizardMode === "create" && !tk) {
        setFormErr("tier_key é obrigatório.");
        return false;
      }
      if (!displayName.trim()) {
        setFormErr("Nome exibido é obrigatório.");
        return false;
      }
    }
    if (step === 1) {
      if (!stripePriceId.trim()) {
        setFormErr("stripe_price_id é obrigatório.");
        return false;
      }
    }
    if (step === 2) {
      try {
        const parsed = JSON.parse(limitsJson || "{}");
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
      } catch {
        setFormErr("JSON de limites inválido.");
        return false;
      }
    }
    if (step === 3) {
      if (visibility === "org" && !customOrgId.trim()) {
        setFormErr("Selecciona a organização para plano exclusivo.");
        return false;
      }
    }
    setFormErr("");
    return true;
  };

  const handleStepChange = (next) => {
    if (next > wizardStep && !validateStep(wizardStep)) return;
    setWizardStep(next);
  };

  const buildPayload = () => {
    const limits = JSON.parse(limitsJson || "{}");
    const isPublic = visibility === "public";
    const customOrg = visibility === "org" && customOrgId.trim() ? customOrgId.trim() : null;
    return {
      tier_key: tierKey.trim().toLowerCase(),
      name: displayName.trim(),
      stripe_price_id: stripePriceId.trim(),
      limits,
      trial_days: Number(trialDays) || 0,
      is_public: isPublic,
      custom_organization_id: customOrg,
    };
  };

  const handleSubmitWizard = async () => {
    for (let i = 0; i < 4; i += 1) {
      if (!validateStep(i)) {
        setWizardStep(i);
        return;
      }
    }

    setBusy(true);
    setFormErr("");
    try {
      const payload = buildPayload();
      if (wizardMode === "create") {
        await apiFetch("/api/admin/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setOk("Plano criado com sucesso.");
      } else if (editingId) {
        const { tier_key: _tk, ...patch } = payload;
        await apiFetch(`/api/admin/plans/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        setOk("Plano actualizado.");
      }
      setWizardOpen(false);
      resetWizard();
      await loadPlans();
    } catch (e) {
      setFormErr(e?.message || "Falha ao guardar plano");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!modalDelete) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/plans/${modalDelete.id}`, { method: "DELETE" });
      setOk("Plano desactivado.");
      setModalDelete(null);
      await loadPlans();
    } catch (e) {
      setErr(e?.message || "Falha ao desactivar plano");
    } finally {
      setBusy(false);
    }
  };

  const orgLabel = useMemo(() => {
    const o = orgs.find((x) => x.id === customOrgId);
    return o ? `${o.name} · ${o.slug}` : customOrgId || "—";
  }, [orgs, customOrgId]);

  const wizardSteps = useMemo(
    () => [
      {
        key: "identity",
        label: "Identidade",
        content: (
          <>
            {formErr && wizardStep === 0 ? <p className={s.err} style={{ marginBottom: "0.75rem" }}>{formErr}</p> : null}
            <div className={s.field}>
              <label className={s.label} htmlFor="pf-tier">
                tier_key
              </label>
              <input
                id="pf-tier"
                className={s.input}
                style={{ width: "100%" }}
                value={tierKey}
                onChange={(e) => setTierKey(e.target.value)}
                disabled={wizardMode === "edit"}
                placeholder="growth_2026"
              />
              {wizardMode === "edit" ? <p className={s.hint}>Identificador fixo — não alterável.</p> : null}
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="pf-name">
                Nome exibido
              </label>
              <input
                id="pf-name"
                className={s.input}
                style={{ width: "100%" }}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </>
        ),
      },
      {
        key: "stripe",
        label: "Stripe",
        content: (
          <>
            {formErr && wizardStep === 1 ? <p className={s.err} style={{ marginBottom: "0.75rem" }}>{formErr}</p> : null}
            <div className={s.field}>
              <label className={s.label} htmlFor="pf-price">
                stripe_price_id
              </label>
              <input
                id="pf-price"
                className={s.input}
                style={{ width: "100%" }}
                value={stripePriceId}
                onChange={(e) => setStripePriceId(e.target.value)}
                placeholder="price_…"
              />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="pf-trial">
                trial_days
              </label>
              <input
                id="pf-trial"
                className={s.input}
                type="number"
                min={0}
                max={730}
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
              />
            </div>
          </>
        ),
      },
      {
        key: "limits",
        label: "Limites",
        content: (
          <>
            {formErr && wizardStep === 2 ? <p className={s.err} style={{ marginBottom: "0.75rem" }}>{formErr}</p> : null}
            <div className={s.field}>
              <label className={s.label} htmlFor="pf-limits">
                limits (JSON)
              </label>
              <textarea
                id="pf-limits"
                className={s.input}
                style={{ minHeight: "9rem", fontFamily: "ui-monospace, monospace", width: "100%" }}
                value={limitsJson}
                onChange={(e) => setLimitsJson(e.target.value)}
              />
            </div>
          </>
        ),
      },
      {
        key: "visibility",
        label: "Visibilidade",
        content: (
          <>
            {formErr && wizardStep === 3 ? <p className={s.err} style={{ marginBottom: "0.75rem" }}>{formErr}</p> : null}
            <fieldset className={p.fieldset}>
              <legend className={s.label}>Quem pode subscrever</legend>
              <label className={p.radioOpt}>
                <input type="radio" name="vis" checked={visibility === "public"} onChange={() => setVisibility("public")} />
                <span>
                  <strong>Público na vitrine</strong>
                  <span className={p.radioHint}>Aparece em `/api/plans/public` para qualquer organização.</span>
                </span>
              </label>
              <label className={p.radioOpt}>
                <input type="radio" name="vis" checked={visibility === "org"} onChange={() => setVisibility("org")} />
                <span>
                  <strong>Exclusivo para organização</strong>
                  <span className={p.radioHint}>Só o tenant seleccionado pode fazer checkout deste plano.</span>
                </span>
              </label>
            </fieldset>
            {visibility === "org" ? (
              <div className={s.field} style={{ marginTop: "1rem" }}>
                <label className={s.label} htmlFor="pf-org">
                  Organização
                </label>
                <select
                  id="pf-org"
                  className={s.input}
                  style={{ width: "100%" }}
                  value={customOrgId}
                  onChange={(e) => setCustomOrgId(e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} · {o.slug}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </>
        ),
      },
      {
        key: "review",
        label: "Revisão",
        content: (
          <div className={p.reviewWrap}>
            <ReviewRow label="tier_key" value={tierKey || "—"} />
            <ReviewRow label="Nome" value={displayName || "—"} />
            <ReviewRow label="Stripe price" value={stripePriceId || "—"} />
            <ReviewRow label="Trial (dias)" value={String(trialDays)} />
            <ReviewRow label="Visibilidade" value={visibility === "public" ? "Público" : `Org: ${orgLabel}`} />
          </div>
        ),
      },
    ],
    [
      formErr,
      wizardStep,
      tierKey,
      displayName,
      stripePriceId,
      trialDays,
      limitsJson,
      visibility,
      customOrgId,
      orgs,
      orgLabel,
      wizardMode,
    ],
  );

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Admin</p>
        <h1 className={s.title}>Planos</h1>
        <p className={s.lede}>Catálogo comercial integrado com Stripe — criar, editar e desactivar via API admin.</p>
      </header>

      {err ? <p className={s.err}>{err}</p> : null}
      {usingPublicFallback ? (
        <p className={s.hint} style={{ marginBottom: "0.75rem" }}>
          Modo compatibilidade: a listagem mostra só planos públicos activos. Criar plano (POST) pode funcionar; editar/desactivar exigem API actualizada.
        </p>
      ) : null}
      {ok ? <p className={s.success}>{ok}</p> : null}

      <div className={p.toolbar}>
        <button type="button" className={`${s.btnPrimary} ${s.btnSm}`} onClick={openCreate}>
          Novo plano
        </button>
      </div>

      <section className={s.section} aria-labelledby="pub-head">
        <h2 id="pub-head" className={s.sectionTitle}>
          Planos configurados
        </h2>
        {!loaded ? (
          <div className={s.cardTable} style={{ padding: "1rem 1.1rem" }}>
            <Skeleton height={120} width="100%" rounded={12} />
          </div>
        ) : (
          <div className={s.cardTable}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Nome</th>
                  <th>Visibilidade</th>
                  <th>Estado</th>
                  <th>Stripe</th>
                  <th>Trial</th>
                  <th className={p.thActions}>Acções</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ color: "rgba(161,161,170,0.9)", padding: "1.75rem 0.75rem" }}>
                      Nenhum plano. Clique em «Novo plano».
                    </td>
                  </tr>
                ) : (
                  plans.map((row) => (
                    <tr key={row.id} style={row.isActive ? undefined : { opacity: 0.55 }}>
                      <td className={s.mono}>{row.tierKey}</td>
                      <td>{row.displayName}</td>
                      <td>
                        <span className={row.isPublic && !row.customOrganizationId ? p.badgePub : p.badgeRest}>
                          {summarizeVisibility(row)}
                        </span>
                      </td>
                      <td>{row.isActive ? "Activo" : "Inactivo"}</td>
                      <td className={s.mono}>{row.stripePriceId || "—"}</td>
                      <td>{row.trialDays ?? "—"}</td>
                      <td className={p.tdActions}>
                        <button type="button" className={`${s.btnGhost} ${s.btnSm}`} onClick={() => openEdit(row)}>
                          Editar
                        </button>
                        {row.isActive ? (
                          <button type="button" className={`${s.btnDanger} ${s.btnSm}`} onClick={() => setModalDelete(row)}>
                            Desactivar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminStepModal
        open={wizardOpen}
        title={wizardMode === "create" ? "Novo plano" : "Editar plano"}
        steps={wizardSteps}
        step={wizardStep}
        onStepChange={handleStepChange}
        onClose={() => {
          setWizardOpen(false);
          resetWizard();
        }}
        onSubmit={handleSubmitWizard}
        busy={busy}
        submitLabel={wizardMode === "create" ? "Criar plano" : "Guardar alterações"}
      />

      <AdminModal
        open={Boolean(modalDelete)}
        title="Desactivar plano?"
        onClose={() => setModalDelete(null)}
        footer={
          <>
            <button type="button" className={s.btnGhost} onClick={() => setModalDelete(null)}>
              Cancelar
            </button>
            <button type="button" className={s.btnDanger} disabled={busy} onClick={handleDelete}>
              Desactivar
            </button>
          </>
        }
      >
        {modalDelete ? (
          <p style={{ margin: 0, color: "rgba(212,212,218,0.95)", lineHeight: 1.55 }}>
            O plano <strong>{modalDelete.displayName}</strong> deixa de aparecer na vitrine. Assinaturas existentes
            mantêm-se no histórico.
          </p>
        ) : null}
      </AdminModal>
    </div>
  );
}
