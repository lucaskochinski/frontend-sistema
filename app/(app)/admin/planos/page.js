"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton.js";
import AdminModal from "@/components/AdminModal/AdminModal.js";
import { apiFetch } from "@/lib/hooko-session";
import s from "../adminShared.module.css";
import p from "./planos.module.css";

const USE_MOCK = true;

const DEFAULT_LIMITS = `{
  "creative_imports_per_month": 50
}`;

/** @typedef {{ id: string, tierKey: string, displayName: string, stripePriceId: string, trialDays: number, limitsJson: string, visibilityMode: 'public' | 'restricted', restrictedUserEmails: string[] }} PlanRow */

/** @returns {PlanRow[]} */
function mockPlans() {
  return [
    {
      id: "p1",
      tierKey: "pro",
      displayName: "HOOKO Pro",
      stripePriceId: "price_mock_pro",
      trialDays: 14,
      limitsJson: DEFAULT_LIMITS,
      visibilityMode: "public",
      restrictedUserEmails: [],
    },
    {
      id: "p2",
      tierKey: "basic",
      displayName: "HOOKO Basic",
      stripePriceId: "price_mock_basic",
      trialDays: 0,
      limitsJson: DEFAULT_LIMITS,
      visibilityMode: "restricted",
      restrictedUserEmails: ["founder@scaleup.com", "cliente@agencia.com"],
    },
  ];
}

function parseEmailsBlock(text) {
  return [
    ...new Set(
      String(text || "")
        .split(/[\n,;]+/)
        .map((x) => x.trim().toLowerCase())
        .filter((x) => x.includes("@")),
    ),
  ];
}

function summarizeVisibility(row) {
  if (row.visibilityMode === "public") return "Público na vitrine";
  const n = row.restrictedUserEmails.length;
  if (n === 0) return "Específico (sem utilizadores)";
  return `Específico · ${n} utilizador(es)`;
}

export default function AdminPlanosPage() {
  const [loaded, setLoaded] = useState(false);
  const [plans, setPlans] = useState(/** @type {PlanRow[]} */ (USE_MOCK ? mockPlans() : []));

  const [err, setErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [ok, setOk] = useState("");

  const [modalNew, setModalNew] = useState(false);
  const [modalEdit, setModalEdit] = useState(/** @type {PlanRow | null} */ (null));
  const [modalConfig, setModalConfig] = useState(/** @type {PlanRow | null} */ (null));
  const [modalDelete, setModalDelete] = useState(/** @type {PlanRow | null} */ (null));

  const [tierKey, setTierKey] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [stripePriceId, setStripePriceId] = useState("");
  const [trialDays, setTrialDays] = useState("0");
  const [limitsJson, setLimitsJson] = useState(DEFAULT_LIMITS);

  const [cfgVisibility, setCfgVisibility] = useState("public");
  const [cfgEmailsRaw, setCfgEmailsRaw] = useState("");
  const [busy, setBusy] = useState(false);

  const loadPublic = useCallback(async () => {
    setErr("");
    if (USE_MOCK) {
      const t = window.setTimeout(() => setLoaded(true), 720);
      return () => window.clearTimeout(t);
    }
    try {
      const data = await apiFetch("/api/plans/public");
      const items = Array.isArray(data.items) ? data.items : [];
      const mapped = items.map(
        /** @returns {PlanRow} */ (item) =>
          ({
            id: String(item.id),
            tierKey: item.tierKey ?? "",
            displayName: item.displayName ?? item.name ?? "",
            stripePriceId: item.stripePriceId ?? "",
            trialDays: Number(item.trialDays) || 0,
            limitsJson: JSON.stringify(item.limits ?? { creative_imports_per_month: 50 }, null, 2),
            visibilityMode: item.customOrganizationId ? "restricted" : "public",
            restrictedUserEmails: [],
          }),
      );
      setPlans(mapped);
      setLoaded(true);
    } catch (e) {
      setErr(e?.message || "Erro ao carregar planos");
      setLoaded(true);
    }
    return undefined;
  }, []);

  useEffect(() => {
    loadPublic();
  }, [loadPublic]);

  const resetForm = () => {
    setTierKey("");
    setDisplayName("");
    setStripePriceId("");
    setTrialDays("0");
    setLimitsJson(DEFAULT_LIMITS);
    setFormErr("");
  };

  const openNew = () => {
    resetForm();
    setModalNew(true);
  };

  const openEdit = (row) => {
    setFormErr("");
    setTierKey(row.tierKey);
    setDisplayName(row.displayName);
    setStripePriceId(row.stripePriceId);
    setTrialDays(String(row.trialDays));
    setLimitsJson(row.limitsJson || DEFAULT_LIMITS);
    setModalEdit(row);
  };

  const openConfig = (row) => {
    setFormErr("");
    setCfgVisibility(row.visibilityMode);
    setCfgEmailsRaw(row.restrictedUserEmails.join("\n"));
    setModalConfig(row);
  };

  const syncConfigToRow = (row, visibility, emails) => {
    setPlans((prev) =>
      prev.map((x) =>
        x.id === row.id
          ? {
              ...x,
              visibilityMode: visibility,
              restrictedUserEmails: visibility === "restricted" ? emails : [],
            }
          : x,
      ),
    );
  };

  const handleSaveNewOrEdit = async () => {
    setFormErr("");
    setOk("");
    let limits = {};
    try {
      const parsed = JSON.parse(limitsJson || "{}");
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("invalid");
      limits = parsed;
    } catch {
      setFormErr("JSON de limites inválido.");
      return;
    }

    const tk = tierKey.trim().toLowerCase();
    if (!tk) {
      setFormErr("tier_key é obrigatório.");
      return;
    }

    setBusy(true);
    try {
      if (!USE_MOCK && modalEdit) {
        setFormErr("Com USE_MOCK = false só é suportada a criação de planos (POST). Editar e apagar usam o mock até existir PATCH/DELETE na API.");
        return;
      }
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 450));
        if (modalEdit) {
          setPlans((prev) =>
            prev.map((x) =>
              x.id === modalEdit.id
                ? {
                    ...x,
                    tierKey: tk,
                    displayName: displayName.trim(),
                    stripePriceId: stripePriceId.trim(),
                    trialDays: Number(trialDays) || 0,
                    limitsJson: JSON.stringify(limits, null, 2),
                  }
                : x,
            ),
          );
          setOk("Plano actualizado (mock).");
        } else {
          if (plans.some((p0) => p0.tierKey === tk)) {
            setFormErr("Já existe um plano com este tier_key.");
            setBusy(false);
            return;
          }
          const newRow = {
            id: `local-${Date.now()}`,
            tierKey: tk,
            displayName: displayName.trim(),
            stripePriceId: stripePriceId.trim(),
            trialDays: Number(trialDays) || 0,
            limitsJson: JSON.stringify(limits, null, 2),
            visibilityMode: /** @type {'public'} */ ("public"),
            restrictedUserEmails: [],
          };
          setPlans((prev) => [...prev, newRow]);
          setOk("Plano criado (mock).");
        }
        setModalNew(false);
        setModalEdit(null);
        resetForm();
        setBusy(false);
        return;
      }

      await apiFetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier_key: tk,
          name: displayName.trim(),
          stripe_price_id: stripePriceId.trim(),
          limits,
          trial_days: Number(trialDays) || 0,
          is_public: true,
        }),
      });
      setOk("Plano registado.");
      setModalNew(false);
      setModalEdit(null);
      resetForm();
      await loadPublic();
    } catch (e) {
      setFormErr(e?.message || "Falha ao guardar plano");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!modalConfig) return;
    setFormErr("");
    const emails = cfgVisibility === "restricted" ? parseEmailsBlock(cfgEmailsRaw) : [];
    if (cfgVisibility === "restricted" && emails.length === 0) {
      setFormErr("Em modo específico, indica pelo menos um e-mail autorizado.");
      return;
    }
    setBusy(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 320));
        syncConfigToRow(
          modalConfig,
          cfgVisibility === "restricted" ? "restricted" : "public",
          emails,
        );
        setOk("Visibilidade e utilizadores específicos guardados (mock).");
      } else {
        setOk("Quando ligar billing, esta configuração mapeará para is_public / lista de allowances na API.");
        syncConfigToRow(
          modalConfig,
          cfgVisibility === "restricted" ? "restricted" : "public",
          emails,
        );
      }
      setModalConfig(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!modalDelete) return;
    setBusy(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        setPlans((prev) => prev.filter((x) => x.id !== modalDelete.id));
        setOk("Plano removido (mock).");
      } else {
        setErr("Eliminação de plano não está exposta na API — remoção apenas em mock.");
      }
    } finally {
      setBusy(false);
      setModalDelete(null);
    }
  };

  const previewEmails = useMemo(() => parseEmailsBlock(cfgEmailsRaw), [cfgEmailsRaw]);

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Admin</p>
        <h1 className={s.title}>Planos</h1>
        <p className={s.lede}>
          Catálogo com visibilidade pública ou restrita a utilizadores. Tudo em modais — {USE_MOCK ? "dados mock até integrar listagem e PATCH na API." : "integração parcial com POST /api/admin/plans."}
        </p>
      </header>

      {USE_MOCK ? (
        <p className={p.mockPill}>USE_MOCK = true</p>
      ) : null}
      {err ? <p className={s.err}>{err}</p> : null}
      {ok ? <p className={s.success}>{ok}</p> : null}

      <div className={p.toolbar}>
        <button type="button" className={`${s.btnPrimary} ${s.btnSm}`} onClick={openNew}>
          Novo plano
        </button>
      </div>

      <section className={s.section} aria-labelledby="pub-head">
        <h2 id="pub-head" className={s.sectionTitle}>
          Planos configurados
        </h2>
        {!loaded ? (
          <div className={s.cardTable} style={{ padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Skeleton height={14} width="40%" />
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
                  <th>Stripe</th>
                  <th>Trial</th>
                  <th className={p.thActions}>Acções</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: "rgba(161,161,170,0.9)", padding: "1.75rem 0.75rem" }}>
                      Nenhum plano. Clique em «Novo plano».
                    </td>
                  </tr>
                ) : (
                  plans.map((row) => (
                    <tr key={row.id}>
                      <td className={s.mono}>{row.tierKey}</td>
                      <td>{row.displayName}</td>
                      <td>
                        <span className={row.visibilityMode === "public" ? p.badgePub : p.badgeRest}>{summarizeVisibility(row)}</span>
                      </td>
                      <td className={s.mono}>{row.stripePriceId || "—"}</td>
                      <td>{row.trialDays ?? "—"}</td>
                      <td className={p.tdActions}>
                        <button type="button" className={`${s.btnGhost} ${s.btnSm}`} onClick={() => openConfig(row)}>
                          Configurar
                        </button>
                        <button type="button" className={`${s.btnGhost} ${s.btnSm}`} onClick={() => openEdit(row)}>
                          Editar
                        </button>
                        <button type="button" className={`${s.btnDanger} ${s.btnSm}`} onClick={() => setModalDelete(row)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminModal
        open={modalNew}
        title="Novo plano"
        onClose={() => { setModalNew(false); resetForm(); }}
        footer={
          <>
            <button type="button" className={s.btnGhost} onClick={() => { setModalNew(false); resetForm(); }}>
              Cancelar
            </button>
            <button type="button" className={s.btnPrimary} disabled={busy} onClick={handleSaveNewOrEdit}>
              {busy ? "A guardar…" : USE_MOCK ? "Criar (mock)" : "Criar na API"}
            </button>
          </>
        }
        wide
      >
        {formErr ? <p className={s.err} style={{ marginBottom: "0.75rem" }}>{formErr}</p> : null}
        <p className={s.hint} style={{ marginBottom: "1rem" }}>
          Após criar, usa «Configurar» para definir se o plano é público na vitrine ou exclusivo para e-mails específicos.
        </p>
        <PlanFormFields
          tierKey={tierKey}
          setTierKey={setTierKey}
          displayName={displayName}
          setDisplayName={setDisplayName}
          stripePriceId={stripePriceId}
          setStripePriceId={setStripePriceId}
          limitsJson={limitsJson}
          setLimitsJson={setLimitsJson}
          trialDays={trialDays}
          setTrialDays={setTrialDays}
          tierDisabled={false}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(modalEdit)}
        title="Editar plano"
        onClose={() => { setModalEdit(null); resetForm(); }}
        footer={
          <>
            <button type="button" className={s.btnGhost} onClick={() => { setModalEdit(null); resetForm(); }}>
              Cancelar
            </button>
            <button type="button" className={s.btnPrimary} disabled={busy} onClick={handleSaveNewOrEdit}>
              {busy ? "A guardar…" : "Guardar alterações"}
            </button>
          </>
        }
        wide
      >
        {formErr ? <p className={s.err} style={{ marginBottom: "0.75rem" }}>{formErr}</p> : null}
        <PlanFormFields
          tierKey={tierKey}
          setTierKey={setTierKey}
          displayName={displayName}
          setDisplayName={setDisplayName}
          stripePriceId={stripePriceId}
          setStripePriceId={setStripePriceId}
          limitsJson={limitsJson}
          setLimitsJson={setLimitsJson}
          trialDays={trialDays}
          setTrialDays={setTrialDays}
          tierDisabled={!USE_MOCK && Boolean(modalEdit)}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(modalConfig)}
        title="Configurar visibilidade"
        onClose={() => setModalConfig(null)}
        footer={
          <>
            <button type="button" className={s.btnGhost} onClick={() => setModalConfig(null)}>
              Cancelar
            </button>
            <button type="button" className={s.btnPrimary} disabled={busy} onClick={handleSaveConfig}>
              {busy ? "A aplicar…" : "Guardar"}
            </button>
          </>
        }
        wide
      >
        {modalConfig ? (
          <>
            <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "rgba(212,212,218,0.95)" }}>
              Plano <span className={s.mono}>{modalConfig.displayName}</span> (<span className={s.mono}>{modalConfig.tierKey}</span>)
            </p>
            {formErr ? <p className={s.err} style={{ marginBottom: "0.75rem" }}>{formErr}</p> : null}

            <fieldset className={p.fieldset}>
              <legend className={s.label}>Quem pode subscrever este plano</legend>
              <label className={p.radioOpt}>
                <input type="radio" name="vis" checked={cfgVisibility === "public"} onChange={() => setCfgVisibility("public")} />
                <span>
                  <strong>Público na vitrine</strong>
                  <span className={p.radioHint}>Qualquer conta nova ou existente pode ver e escolher este plano no catálogo.</span>
                </span>
              </label>
              <label className={p.radioOpt}>
                <input type="radio" name="vis" checked={cfgVisibility === "restricted"} onChange={() => setCfgVisibility("restricted")} />
                <span>
                  <strong>Específico para utilizadores</strong>
                  <span className={p.radioHint}>Apenas os e-mails indicados abaixo veem este plano (ex.: VIP, contratos B2B, trial fechado).</span>
                </span>
              </label>
            </fieldset>

            {cfgVisibility === "restricted" ? (
              <div className={s.field} style={{ marginTop: "1rem" }}>
                <label className={s.label} htmlFor="cfg-emails">
                  E-mails autorizados (um por linha ou separados por vírgula)
                </label>
                <textarea
                  id="cfg-emails"
                  className={s.input}
                  style={{ minHeight: "8rem", fontFamily: "ui-monospace, monospace", width: "100%", minWidth: 0 }}
                  value={cfgEmailsRaw}
                  onChange={(e) => setCfgEmailsRaw(e.target.value)}
                  placeholder={"founder@empresa.com\nops@equipa.pt"}
                />
                <p className={s.hint}>{previewEmails.length} endereço(s) reconhecido(s).</p>
                {previewEmails.length > 0 ? (
                  <ul className={p.emailChips}>
                    {previewEmails.map((em) => (
                      <li key={em}>{em}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className={s.hint} style={{ marginTop: "0.85rem" }}>
                Em modo público não é necessário listar utilizadores. Podes voltar a «Específico» quando precisares de um plano fechado.
              </p>
            )}
          </>
        ) : null}
      </AdminModal>

      <AdminModal
        open={Boolean(modalDelete)}
        title="Excluir plano?"
        onClose={() => setModalDelete(null)}
        footer={
          <>
            <button type="button" className={s.btnGhost} onClick={() => setModalDelete(null)}>
              Cancelar
            </button>
            <button type="button" className={s.btnDanger} disabled={busy} onClick={handleDelete}>
              Excluir
            </button>
          </>
        }
      >
        {modalDelete ? (
          <p style={{ margin: 0, color: "rgba(212,212,218,0.95)", lineHeight: 1.55 }}>
            O plano <strong>{modalDelete.displayName}</strong> será removido{USE_MOCK ? " da lista mock" : " — confirme com backend se já existir em produção"}.
          </p>
        ) : null}
      </AdminModal>
    </div>
  );
}

function PlanFormFields({
  tierKey,
  setTierKey,
  displayName,
  setDisplayName,
  stripePriceId,
  setStripePriceId,
  limitsJson,
  setLimitsJson,
  trialDays,
  setTrialDays,
  tierDisabled,
}) {
  return (
    <>
      <div className={s.field}>
        <label className={s.label} htmlFor="pf-tier">
          tier_key
        </label>
        <input
          id="pf-tier"
          className={s.input}
          style={{ width: "100%", minWidth: 0 }}
          value={tierKey}
          onChange={(e) => setTierKey(e.target.value)}
          required
          disabled={tierDisabled}
          placeholder="growth_2026"
        />
        {tierDisabled ? <p className={s.hint}>Identificador fixo para não partir assinaturas existentes.</p> : null}
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="pf-name">
          Nome exibido
        </label>
        <input id="pf-name" className={s.input} style={{ width: "100%", minWidth: 0 }} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="pf-price">
          stripe_price_id
        </label>
        <input id="pf-price" className={s.input} style={{ width: "100%", minWidth: 0 }} value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)} required placeholder="price_…" />
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="pf-limits">
          limits (JSON)
        </label>
        <textarea
          id="pf-limits"
          className={s.input}
          style={{ minHeight: "7rem", fontFamily: "ui-monospace, monospace", width: "100%", minWidth: 0 }}
          value={limitsJson}
          onChange={(e) => setLimitsJson(e.target.value)}
        />
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="pf-trial">
          trial_days
        </label>
        <input id="pf-trial" className={s.input} type="number" min={0} max={730} value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
      </div>
    </>
  );
}
