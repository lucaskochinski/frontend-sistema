"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton.js";
import AdminModal from "@/components/AdminModal/AdminModal.js";
import AdminStepModal, { ReviewRow } from "@/components/AdminStepModal/AdminStepModal.js";
import { apiFetch } from "@/lib/hooko-session";
import s from "../adminShared.module.css";
import p from "./planos.module.css";

const DEFAULT_LIMITS = {
  creativeImports: 50,
  transcriptionMinutes: 120,
  videoSizeMb: 100,
  videoDurationMin: 5,
};

/** @typedef {{ id: string, tierKey: string, displayName: string, stripePriceId: string, priceAmountCents: number | null, priceCurrency: string, trialDays: number, limits: typeof DEFAULT_LIMITS, isPublic: boolean, isActive: boolean, customOrganizationId: string | null, orgName?: string }} PlanRow */

function formatPriceBrl(cents, currency = "brl") {
  if (cents == null || !Number.isFinite(Number(cents))) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: String(currency || "brl").toUpperCase(),
  }).format(Number(cents) / 100);
}

function centsFromReaisInput(raw) {
  const normalized = String(raw ?? "").trim().replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function limitsFromApi(raw) {
  const L = raw && typeof raw === "object" ? raw : {};
  return {
    creativeImports: Number(L.creative_imports_per_month) || DEFAULT_LIMITS.creativeImports,
    transcriptionMinutes: Number(L.transcription_minutes_per_month) || DEFAULT_LIMITS.transcriptionMinutes,
    videoSizeMb: Number(L.max_video_size_mb) || DEFAULT_LIMITS.videoSizeMb,
    videoDurationMin: Math.max(1, Math.floor(Number(L.max_video_duration_seconds || 300) / 60)),
  };
}

function limitsToApi(form) {
  return {
    creative_imports_per_month: Math.max(0, Math.floor(Number(form.creativeImports) || 0)),
    transcription_minutes_per_month: Math.max(0, Math.floor(Number(form.transcriptionMinutes) || 0)),
    max_video_size_mb: Math.max(1, Math.floor(Number(form.videoSizeMb) || 1)),
    max_video_duration_seconds: Math.max(30, Math.floor(Number(form.videoDurationMin) || 1) * 60),
  };
}

function summarizeLimits(limits) {
  return `${limits.creativeImports} import./mês · ${limits.transcriptionMinutes} min transcrição · vídeo ${limits.videoSizeMb} MB / ${limits.videoDurationMin} min`;
}

function mapPlanItem(item) {
  return {
    id: String(item.id),
    tierKey: item.tierKey ?? item.tier_key ?? "",
    displayName: item.displayName ?? item.name ?? "",
    stripePriceId: item.stripePriceId ?? item.stripe_price_id ?? "",
    priceAmountCents:
      item.priceAmountCents != null
        ? Number(item.priceAmountCents)
        : item.price_amount_cents != null
          ? Number(item.price_amount_cents)
          : null,
    priceCurrency: item.priceCurrency ?? item.price_currency ?? "brl",
    trialDays: Number(item.trialDays ?? item.trial_days) || 0,
    limits: limitsFromApi(item.limits),
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

  const [displayName, setDisplayName] = useState("");
  const [priceReais, setPriceReais] = useState("");
  const [trialDays, setTrialDays] = useState("0");
  const [limitCreativeImports, setLimitCreativeImports] = useState(String(DEFAULT_LIMITS.creativeImports));
  const [limitTranscriptionMinutes, setLimitTranscriptionMinutes] = useState(String(DEFAULT_LIMITS.transcriptionMinutes));
  const [limitVideoSizeMb, setLimitVideoSizeMb] = useState(String(DEFAULT_LIMITS.videoSizeMb));
  const [limitVideoDurationMin, setLimitVideoDurationMin] = useState(String(DEFAULT_LIMITS.videoDurationMin));
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
            "Servidor desactualizado: faça redeploy da API para listar todos os planos (inactivos, editar e desactivar).",
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
    setDisplayName("");
    setPriceReais("");
    setTrialDays("0");
    setLimitCreativeImports(String(DEFAULT_LIMITS.creativeImports));
    setLimitTranscriptionMinutes(String(DEFAULT_LIMITS.transcriptionMinutes));
    setLimitVideoSizeMb(String(DEFAULT_LIMITS.videoSizeMb));
    setLimitVideoDurationMin(String(DEFAULT_LIMITS.videoDurationMin));
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
    setDisplayName(row.displayName);
    setPriceReais(row.priceAmountCents != null ? (row.priceAmountCents / 100).toFixed(2) : "");
    setTrialDays(String(row.trialDays));
    setLimitCreativeImports(String(row.limits.creativeImports));
    setLimitTranscriptionMinutes(String(row.limits.transcriptionMinutes));
    setLimitVideoSizeMb(String(row.limits.videoSizeMb));
    setLimitVideoDurationMin(String(row.limits.videoDurationMin));
    setVisibility(row.customOrganizationId ? "org" : row.isPublic ? "public" : "org");
    setCustomOrgId(row.customOrganizationId || "");
    setWizardStep(0);
    setWizardOpen(true);
  };

  const validateStep = (step) => {
    if (step === 0) {
      if (!displayName.trim()) {
        setFormErr("Nome do plano é obrigatório.");
        return false;
      }
    }
    if (step === 1) {
      const cents = centsFromReaisInput(priceReais);
      if (cents == null || cents < 50) {
        setFormErr("Indique um preço mensal válido (mínimo R$ 0,50).");
        return false;
      }
    }
    if (step === 2) {
      const imports = Number(limitCreativeImports);
      if (!Number.isFinite(imports) || imports < 0) {
        setFormErr("Importações por mês deve ser um número válido.");
        return false;
      }
      const minutes = Number(limitTranscriptionMinutes);
      if (!Number.isFinite(minutes) || minutes < 0) {
        setFormErr("Minutos de transcrição deve ser um número válido.");
        return false;
      }
      const sizeMb = Number(limitVideoSizeMb);
      if (!Number.isFinite(sizeMb) || sizeMb < 1) {
        setFormErr("Tamanho máximo de vídeo deve ser pelo menos 1 MB.");
        return false;
      }
      const durMin = Number(limitVideoDurationMin);
      if (!Number.isFinite(durMin) || durMin < 1) {
        setFormErr("Duração máxima de vídeo deve ser pelo menos 1 minuto.");
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
    const limits = limitsToApi({
      creativeImports: limitCreativeImports,
      transcriptionMinutes: limitTranscriptionMinutes,
      videoSizeMb: limitVideoSizeMb,
      videoDurationMin: limitVideoDurationMin,
    });
    const isPublic = visibility === "public";
    const customOrg = visibility === "org" && customOrgId.trim() ? customOrgId.trim() : null;
    return {
      name: displayName.trim(),
      price_amount_cents: centsFromReaisInput(priceReais),
      price_currency: "brl",
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
        await apiFetch(`/api/admin/plans/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        label: "Nome",
        content: (
          <div className={p.formSection}>
            {formErr && wizardStep === 0 ? <p className={s.err}>{formErr}</p> : null}
            <p className={p.formIntro}>Nome comercial exibido na vitrine e no checkout.</p>
            <div className={s.field}>
              <label className={s.label} htmlFor="pf-name">
                Nome do plano
              </label>
              <input
                id="pf-name"
                className={`${s.input} ${p.inputLg}`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ex.: HOOKO Pro"
              />
            </div>
          </div>
        ),
      },
      {
        key: "stripe",
        label: "Preço",
        content: (
          <div className={p.formSection}>
            {formErr && wizardStep === 1 ? <p className={s.err}>{formErr}</p> : null}
            <p className={p.formIntro}>
              O produto e o preço recorrente são criados automaticamente no Stripe — não precisa copiar IDs manualmente.
            </p>
            <div className={p.formGrid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="pf-price">
                  Preço mensal (R$)
                </label>
                <input
                  id="pf-price"
                  className={`${s.input} ${p.inputLg}`}
                  type="number"
                  min={0.5}
                  step={0.01}
                  value={priceReais}
                  onChange={(e) => setPriceReais(e.target.value)}
                  placeholder="ex.: 97.00"
                />
                <p className={s.hint}>Valor cobrado mensalmente após o período de teste (se houver).</p>
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="pf-trial">
                  Dias de teste grátis
                </label>
                <input
                  id="pf-trial"
                  className={`${s.input} ${p.inputLg}`}
                  type="number"
                  min={0}
                  max={730}
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "limits",
        label: "Limites",
        content: (
          <div className={p.formSection}>
            {formErr && wizardStep === 2 ? <p className={s.err}>{formErr}</p> : null}
            <p className={p.formIntro}>Defina os limites mensais incluídos neste plano.</p>
            <div className={p.formGrid}>
              <div className={s.field}>
                <label className={s.label} htmlFor="pf-imports">
                  Importações de criativos / mês
                </label>
                <input
                  id="pf-imports"
                  className={`${s.input} ${p.inputLg}`}
                  type="number"
                  min={0}
                  value={limitCreativeImports}
                  onChange={(e) => setLimitCreativeImports(e.target.value)}
                />
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="pf-transcription">
                  Minutos de transcrição / mês
                </label>
                <input
                  id="pf-transcription"
                  className={`${s.input} ${p.inputLg}`}
                  type="number"
                  min={0}
                  value={limitTranscriptionMinutes}
                  onChange={(e) => setLimitTranscriptionMinutes(e.target.value)}
                />
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="pf-video-size">
                  Tamanho máximo de vídeo (MB)
                </label>
                <input
                  id="pf-video-size"
                  className={`${s.input} ${p.inputLg}`}
                  type="number"
                  min={1}
                  value={limitVideoSizeMb}
                  onChange={(e) => setLimitVideoSizeMb(e.target.value)}
                />
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="pf-video-dur">
                  Duração máxima de vídeo (min)
                </label>
                <input
                  id="pf-video-dur"
                  className={`${s.input} ${p.inputLg}`}
                  type="number"
                  min={1}
                  value={limitVideoDurationMin}
                  onChange={(e) => setLimitVideoDurationMin(e.target.value)}
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "visibility",
        label: "Visibilidade",
        content: (
          <div className={p.formSection}>
            {formErr && wizardStep === 3 ? <p className={s.err}>{formErr}</p> : null}
            <fieldset className={p.fieldset}>
              <legend className={s.label}>Quem pode escolher este plano</legend>
              <div className={p.radioGrid}>
              <label className={`${p.radioOpt} ${visibility === "public" ? p.radioOptActive : ""}`}>
                <input type="radio" name="vis" checked={visibility === "public"} onChange={() => setVisibility("public")} />
                <span>
                  <strong>Público na vitrine</strong>
                  <span className={p.radioHint}>Aparece para qualquer organização na página de planos.</span>
                </span>
              </label>
              <label className={`${p.radioOpt} ${visibility === "org" ? p.radioOptActive : ""}`}>
                <input type="radio" name="vis" checked={visibility === "org"} onChange={() => setVisibility("org")} />
                <span>
                  <strong>Exclusivo para organização</strong>
                  <span className={p.radioHint}>Só a organização seleccionada pode pagar este plano.</span>
                </span>
              </label>
              </div>
            </fieldset>
            {visibility === "org" ? (
              <div className={`${s.field} ${p.orgField}`}>
                <label className={s.label} htmlFor="pf-org">
                  Organização
                </label>
                <select
                  id="pf-org"
                  className={`${s.input} ${p.inputLg}`}
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
          </div>
        ),
      },
      {
        key: "review",
        label: "Revisão",
        content: (
          <div className={p.reviewWrap}>
            <ReviewRow label="Nome" value={displayName || "—"} />
            <ReviewRow label="Preço mensal" value={`${formatPriceBrl(centsFromReaisInput(priceReais), "brl")} / mês`} />
            <ReviewRow label="Teste grátis (dias)" value={String(trialDays)} />
            <ReviewRow
              label="Limites"
              value={summarizeLimits({
                creativeImports: Number(limitCreativeImports) || 0,
                transcriptionMinutes: Number(limitTranscriptionMinutes) || 0,
                videoSizeMb: Number(limitVideoSizeMb) || 0,
                videoDurationMin: Number(limitVideoDurationMin) || 0,
              })}
            />
            <ReviewRow label="Visibilidade" value={visibility === "public" ? "Público" : `Organização: ${orgLabel}`} />
          </div>
        ),
      },
    ],
    [
      formErr,
      wizardStep,
      displayName,
      priceReais,
      trialDays,
      limitCreativeImports,
      limitTranscriptionMinutes,
      limitVideoSizeMb,
      limitVideoDurationMin,
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
        <p className={s.lede}>Catálogo comercial — criar, editar e desactivar planos com pagamento integrado.</p>
      </header>

      {err ? <p className={s.err}>{err}</p> : null}
      {usingPublicFallback ? (
        <p className={s.hint} style={{ marginBottom: "0.75rem" }}>
          Modo compatibilidade: a listagem mostra só planos públicos activos. Criar plano pode funcionar; editar e desactivar exigem API actualizada.
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
                  <th>Nome</th>
                  <th>Visibilidade</th>
                  <th>Estado</th>
                  <th>Preço</th>
                  <th>Teste</th>
                  <th className={p.thActions}>Acções</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={s.emptyCell} style={{ padding: "1.75rem 0.75rem" }}>
                      Nenhum plano. Clique em «Novo plano».
                    </td>
                  </tr>
                ) : (
                  plans.map((row) => (
                    <tr key={row.id} style={row.isActive ? undefined : { opacity: 0.55 }}>
                      <td>{row.displayName}</td>
                      <td>
                        <span className={row.isPublic && !row.customOrganizationId ? p.badgePub : p.badgeRest}>
                          {summarizeVisibility(row)}
                        </span>
                      </td>
                      <td>{row.isActive ? "Activo" : "Inactivo"}</td>
                      <td>{formatPriceBrl(row.priceAmountCents, row.priceCurrency)}{row.priceAmountCents != null ? " / mês" : ""}</td>
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
        subtitle="Defina nome, preço mensal, limites e visibilidade — o Stripe é sincronizado automaticamente."
        size="xl"
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
          <p className={s.bodyText}>
            O plano <strong>{modalDelete.displayName}</strong> deixa de aparecer na vitrine. Assinaturas existentes
            mantêm-se no histórico.
          </p>
        ) : null}
      </AdminModal>
    </div>
  );
}
