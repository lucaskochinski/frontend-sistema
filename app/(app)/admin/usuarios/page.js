"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { TableSkeleton } from "@/components/Skeleton/Skeleton.js";
import AdminModal from "@/components/AdminModal/AdminModal.js";
import AdminPlanAssignModal from "@/components/AdminPlanAssignModal/AdminPlanAssignModal.js";
import AdminStepModal, { ReviewRow } from "@/components/AdminStepModal/AdminStepModal.js";
import { apiFetch } from "@/lib/hooko-session";
import { HOOKO_PLATFORM_ADMIN_ROLE_KEY } from "@/lib/platform-admin";
import s from "../adminShared.module.css";
import u from "./usuarios.module.css";

const USE_MOCK = false;

/** @typedef {{ id: string, email: string, planLabel: string, subscriptionStatus: string, createdDisplay: string, organizationId?: string, organizationName?: string }} UiUser */

function statusLabel(status) {
  const m = String(status || "").toLowerCase();
  if (m === "active") return "Activo";
  if (m === "delinquent") return "Inadimplente";
  if (m === "paused") return "Pausado";
  if (m === "invited") return "Convidado";
  if (m === "suspended") return "Suspenso";
  return status || "—";
}

function badgeClassForSubscription(status) {
  const m = String(status || "").toLowerCase();
  if (m === "active") return `${u.badge} ${u.badgeActive}`;
  if (m === "delinquent") return `${u.badge} ${u.badgeDelinquent}`;
  if (m === "paused") return `${u.badge} ${u.badgePaused}`;
  return u.badge;
}

function fmtDateIso(d) {
  if (!d) return "—";
  const x = typeof d === "string" ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
  return x || "—";
}

/** @returns {UiUser[]} */
function mockSeed() {
  return [
    { id: "1", email: "cliente@agencia.com", planLabel: "HOOKO Pro", subscriptionStatus: "active", createdDisplay: "2026-05-10" },
    { id: "2", email: "maria@studio.pt", planLabel: "HOOKO Basic", subscriptionStatus: "active", createdDisplay: "2026-05-08" },
    { id: "3", email: "ops@marca.io", planLabel: "HOOKO Pro", subscriptionStatus: "delinquent", createdDisplay: "2026-04-22" },
    { id: "4", email: "founder@scaleup.com", planLabel: "HOOKO Enterprise", subscriptionStatus: "active", createdDisplay: "2026-03-15" },
  ];
}

function subscriptionStatusLabel(status) {
  const m = String(status || "").toLowerCase();
  if (m === "active") return "Activo";
  if (m === "trialing") return "Trial";
  if (m === "canceled") return "Cancelado";
  if (m === "past_due") return "Em atraso";
  if (m === "delinquent") return "Inadimplente";
  if (m === "paused") return "Pausado";
  if (m === "invited") return "Convidado";
  if (m === "suspended") return "Suspenso";
  return status || "—";
}

/** @param {unknown} apiUser */
function mapApiUserToUi(apiUser) {
  /** @type {any} */
  const uRaw = apiUser;
  const memberships = Array.isArray(uRaw.memberships) ? uRaw.memberships : [];
  const primary = memberships[0];
  const orgSubs = primary?.organization?.subscriptions;
  const activeSub = Array.isArray(orgSubs) ? orgSubs[0] : null;
  const membershipStatus =
    memberships.length === 0
      ? "—"
      : memberships.length === 1
        ? primary?.status ?? "active"
        : memberships.map((m) => `${m.organization?.slug || "?"}:${m.status}`).join("; ");
  return {
    id: String(uRaw.id),
    email: uRaw.email ?? "",
    planLabel: activeSub?.plan?.displayName || "Sem plano",
    subscriptionStatus: activeSub?.status || membershipStatus,
    createdDisplay: fmtDateIso(uRaw.createdAt),
    organizationId: primary?.organizationId,
    organizationName: primary?.organization?.name || "",
  };
}

function nextMockId(users) {
  const nums = users.map((x) => Number.parseInt(String(x.id), 10)).filter((n) => !Number.isNaN(n));
  const m = nums.length ? Math.max(...nums) : 0;
  return String(m + 1);
}

function AdminUsuariosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openCreateFromQuery = searchParams.get("novo") === "1";

  const [loaded, setLoaded] = useState(false);
  const [users, setUsers] = useState(/** @type {UiUser[]} */ (USE_MOCK ? mockSeed() : []));
  const [orgs, setOrgs] = useState(/** @type {{ id: string, name: string, slug: string }[]} */ ([]));
  const [listErr, setListErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [toastOk, setToastOk] = useState("");

  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const [modalPlan, setModalPlan] = useState(null);
  const [createStep, setCreateStep] = useState(0);
  const [editStep, setEditStep] = useState(0);

  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formOrgId, setFormOrgId] = useState("");
  const [formRoleAdmin, setFormRoleAdmin] = useState(true);
  const [formRolePlatform, setFormRolePlatform] = useState(false);
  const [formMembershipStatus, setFormMembershipStatus] = useState("active");
  /** mock-only fields */
  const [formPlanLabel, setFormPlanLabel] = useState("HOOKO Pro");
  const [formSubStatus, setFormSubStatus] = useState("active");

  const resetForm = useCallback(() => {
    setFormEmail("");
    setFormPassword("");
    setFormOrgId("");
    setFormRoleAdmin(true);
    setFormRolePlatform(false);
    setFormMembershipStatus("active");
    setFormPlanLabel("HOOKO Pro");
    setFormSubStatus("active");
    setFormErr("");
    setCreateStep(0);
    setEditStep(0);
  }, []);

  const loadList = useCallback(async () => {
    if (USE_MOCK) {
      const t = window.setTimeout(() => setLoaded(true), 640);
      return () => window.clearTimeout(t);
    }
    setListErr("");
    try {
      const data = await apiFetch("/api/admin/users?limit=200&offset=0");
      const items = Array.isArray(data.items) ? data.items : [];
      setUsers(items.map(mapApiUserToUi));
      setLoaded(true);
    } catch (e) {
      setListErr(e?.message || "Erro ao carregar utilizadores");
      setLoaded(true);
    }
    return undefined;
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!openCreateFromQuery) return;
    resetForm();
    setModalCreate(true);
    router.replace("/admin/usuarios", { scroll: false });
  }, [openCreateFromQuery, resetForm, router]);

  useEffect(() => {
    if (USE_MOCK) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/admin/organizations?limit=120");
        if (!cancelled) setOrgs(Array.isArray(data.items) ? data.items : []);
      } catch {
        /* silenciar */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submitCreateEdit = async (mode, editingUser) => {
    setFormErr("");
    setToastOk("");
    setBusy(true);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 420));
        if (mode === "create") {
          const email = formEmail.trim().toLowerCase();
          if (!email.includes("@")) {
            setFormErr("E-mail inválido.");
            return;
          }
          if (users.some((x) => x.email.toLowerCase() === email)) {
            setFormErr("Já existe um utilizador com este e-mail.");
            return;
          }
          setUsers((prev) => [
            ...prev,
            {
              id: nextMockId(prev),
              email,
              planLabel: formPlanLabel.trim() || "—",
              subscriptionStatus: formSubStatus,
              createdDisplay: new Date().toISOString().slice(0, 10),
            },
          ]);
          setToastOk("Utilizador criado (mock).");
        } else if (editingUser) {
          const emailLocked = editingUser.email.toLowerCase();
          setUsers((prev) =>
            prev.map((x) =>
              x.id === editingUser.id
                ? {
                    ...x,
                    planLabel: formPlanLabel.trim() || x.planLabel,
                    subscriptionStatus: formSubStatus,
                  }
                : x,
            ),
          );
          setToastOk(`Utilizador ${emailLocked} actualizado (mock).`);
        }
        setModalCreate(false);
        setModalEdit(null);
        resetForm();
        return;
      }

      /* API — cria/atualiza via POST conforme backend */
      const roleKeys = [];
      if (formRoleAdmin) roleKeys.push("admin");
      if (formRolePlatform) roleKeys.push(HOOKO_PLATFORM_ADMIN_ROLE_KEY);

      const emailPayload = mode === "edit" && editingUser ? editingUser.email : formEmail.trim();

      await apiFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailPayload,
          password: formPassword.trim() || undefined,
          organizationId: formOrgId,
          roleKeys,
          membershipStatus: formMembershipStatus,
        }),
      });
      setToastOk(mode === "create" ? "Utilizador criado ou associado." : "Dados actualizados.");
      setModalCreate(false);
      setModalEdit(null);
      resetForm();
      await loadList();
    } catch (e) {
      setFormErr(e?.message || "Falha ao guardar");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!modalDelete) return;
    setBusy(true);
    setFormErr("");
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 350));
        setUsers((prev) => prev.filter((x) => x.id !== modalDelete.id));
        setToastOk(`Utilizador ${modalDelete.email} removido (mock).`);
      } else {
        setListErr("Eliminação de utilizador não está exposta na API nesta versão. Use o painel de base de dados ou peça suporte.");
      }
    } finally {
      setBusy(false);
      setModalDelete(null);
    }
  };

  const openEdit = (row) => {
    resetForm();
    setFormEmail(row.email);
    if (USE_MOCK) {
      setFormPlanLabel(row.planLabel);
      setFormSubStatus(row.subscriptionStatus);
    } else {
      setFormOrgId(row.organizationId || "");
      setFormMembershipStatus(
        typeof row.subscriptionStatus === "string" && ["active", "invited", "suspended"].includes(row.subscriptionStatus)
          ? row.subscriptionStatus
          : "active",
      );
    }
    setModalEdit(row);
  };

  const orgSelect = useMemo(() => {
    if (orgs.length === 0) return null;
    return (
      <select className={`${s.input} ${u.inputLg}`} value={formOrgId} onChange={(e) => setFormOrgId(e.target.value)} required>
        <option value="">Seleccionar organização…</option>
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} · {o.slug}
          </option>
        ))}
      </select>
    );
  }, [orgs, formOrgId]);

  const orgLabel = useMemo(() => {
    const o = orgs.find((x) => x.id === formOrgId);
    return o ? `${o.name} · ${o.slug}` : formOrgId || "—";
  }, [orgs, formOrgId]);

  const validateUserStep = (mode, step) => {
    if (mode === "create") {
      if (step === 0) {
        const email = formEmail.trim().toLowerCase();
        if (!email.includes("@")) {
          setFormErr("E-mail inválido.");
          return false;
        }
        if (formPassword.trim().length < 8) {
          setFormErr("Palavra-passe com mínimo 8 caracteres.");
          return false;
        }
      }
      if (step === 1 && !formOrgId.trim()) {
        setFormErr("Selecciona uma organização.");
        return false;
      }
    } else {
      if (step === 0 && formPassword.trim() && formPassword.trim().length < 8) {
        setFormErr("Palavra-passe com mínimo 8 caracteres.");
        return false;
      }
      if (step === 1 && !formOrgId.trim()) {
        setFormErr("Selecciona uma organização.");
        return false;
      }
    }
    setFormErr("");
    return true;
  };

  const createSteps = useMemo(
    () => [
      {
        key: "account",
        label: "Conta",
        content: (
          <div className={u.formSection}>
            {formErr && createStep === 0 ? <p className={s.err}>{formErr}</p> : null}
            <p className={u.formIntro}>Credenciais de acesso do novo utilizador na plataforma.</p>
            <div className={u.formGrid}>
              <div className={`${s.field} ${u.formGridWide}`}>
                <label className={s.label} htmlFor="um-email">
                  E-mail
                </label>
                <input
                  id="um-email"
                  className={`${s.input} ${u.inputLg}`}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  type="email"
                  autoComplete="off"
                />
              </div>
              <div className={`${s.field} ${u.formGridWide}`}>
                <label className={s.label} htmlFor="um-pass">
                  Palavra-passe
                </label>
                <input
                  id="um-pass"
                  className={`${s.input} ${u.inputLg}`}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "org",
        label: "Organização",
        content: (
          <div className={u.formSection}>
            {formErr && createStep === 1 ? <p className={s.err}>{formErr}</p> : null}
            <div className={u.formGrid}>
              <div className={`${s.field} ${u.formGridWide}`}>
                <label className={s.label} htmlFor="um-org">
                  Organização
                </label>
                {orgSelect || (
                  <input
                    id="um-org"
                    className={`${s.input} ${u.inputLg}`}
                    value={formOrgId}
                    onChange={(e) => setFormOrgId(e.target.value)}
                    placeholder="UUID"
                    required
                  />
                )}
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="um-ms">
                  Estado da membership
                </label>
                <select
                  id="um-ms"
                  className={`${s.input} ${u.inputLg}`}
                  value={formMembershipStatus}
                  onChange={(e) => setFormMembershipStatus(e.target.value)}
                >
                  <option value="active">Activo</option>
                  <option value="invited">Convidado</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "roles",
        label: "Papéis",
        content: (
          <div className={u.formSection}>
            <p className={u.formIntro}>Defina as permissões administrativas deste utilizador.</p>
            <div className={u.roleGrid}>
              <label className={`${u.roleCard} ${formRoleAdmin ? u.roleCardActive : ""}`}>
                <input type="checkbox" checked={formRoleAdmin} onChange={(e) => setFormRoleAdmin(e.target.checked)} />
                <span>
                  <strong>Admin da organização</strong>
                  <span className={u.roleHint}>Gere utilizadores, integrações e definições do tenant.</span>
                </span>
              </label>
              <label className={`${u.roleCard} ${formRolePlatform ? u.roleCardActive : ""}`}>
                <input type="checkbox" checked={formRolePlatform} onChange={(e) => setFormRolePlatform(e.target.checked)} />
                <span>
                  <strong>Admin da plataforma</strong>
                  <span className={u.roleHint}>
                    Acesso global HOOKO (<span className={s.mono}>{HOOKO_PLATFORM_ADMIN_ROLE_KEY}</span>).
                  </span>
                </span>
              </label>
            </div>
          </div>
        ),
      },
      {
        key: "review",
        label: "Revisão",
        content: (
          <div className={u.reviewWrap}>
            <ReviewRow label="E-mail" value={formEmail.trim().toLowerCase()} />
            <ReviewRow label="Organização" value={orgLabel} />
            <ReviewRow label="Membership" value={formMembershipStatus} />
            <ReviewRow
              label="Papéis"
              value={[formRoleAdmin && "admin", formRolePlatform && HOOKO_PLATFORM_ADMIN_ROLE_KEY].filter(Boolean).join(", ") || "—"}
            />
          </div>
        ),
      },
    ],
    [formErr, createStep, formEmail, formPassword, formOrgId, formMembershipStatus, formRoleAdmin, formRolePlatform, orgSelect, orgLabel],
  );

  const editSteps = useMemo(
    () => [
      {
        key: "account",
        label: "Conta",
        content: modalEdit ? (
          <div className={u.formSection}>
            {formErr && editStep === 0 ? <p className={s.err}>{formErr}</p> : null}
            <div className={u.formGrid}>
              <div className={`${s.field} ${u.formGridWide}`}>
                <span className={s.label}>E-mail</span>
                <p className={u.readonlyEmail}>{modalEdit.email}</p>
              </div>
              <div className={`${s.field} ${u.formGridWide}`}>
                <label className={s.label} htmlFor="ue-pass">
                  Nova palavra-passe (opcional)
                </label>
                <input
                  id="ue-pass"
                  className={`${s.input} ${u.inputLg}`}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
        ) : null,
      },
      {
        key: "org",
        label: "Organização",
        content: modalEdit ? (
          <div className={u.formSection}>
            {formErr && editStep === 1 ? <p className={s.err}>{formErr}</p> : null}
            <div className={u.formGrid}>
              <div className={`${s.field} ${u.formGridWide}`}>
                <label className={s.label} htmlFor="ue-org">
                  Organização
                </label>
                {orgSelect || (
                  <input
                    id="ue-org"
                    className={`${s.input} ${u.inputLg}`}
                    value={formOrgId}
                    onChange={(e) => setFormOrgId(e.target.value)}
                    required
                    placeholder="UUID"
                  />
                )}
              </div>
              <div className={s.field}>
                <label className={s.label} htmlFor="ue-ms">
                  Estado da membership
                </label>
                <select
                  id="ue-ms"
                  className={`${s.input} ${u.inputLg}`}
                  value={formMembershipStatus}
                  onChange={(e) => setFormMembershipStatus(e.target.value)}
                >
                  <option value="active">Activo</option>
                  <option value="invited">Convidado</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            </div>
          </div>
        ) : null,
      },
      {
        key: "roles",
        label: "Papéis",
        content: modalEdit ? (
          <div className={u.formSection}>
            <p className={u.formIntro}>Permissões administrativas do utilizador.</p>
            <div className={u.roleGrid}>
              <label className={`${u.roleCard} ${formRoleAdmin ? u.roleCardActive : ""}`}>
                <input type="checkbox" checked={formRoleAdmin} onChange={(e) => setFormRoleAdmin(e.target.checked)} />
                <span>
                  <strong>Admin da organização</strong>
                  <span className={u.roleHint}>Gere utilizadores e definições do tenant.</span>
                </span>
              </label>
              <label className={`${u.roleCard} ${formRolePlatform ? u.roleCardActive : ""}`}>
                <input type="checkbox" checked={formRolePlatform} onChange={(e) => setFormRolePlatform(e.target.checked)} />
                <span>
                  <strong>Admin da plataforma</strong>
                  <span className={u.roleHint}>Acesso global HOOKO.</span>
                </span>
              </label>
            </div>
          </div>
        ) : null,
      },
      {
        key: "review",
        label: "Revisão",
        content: modalEdit ? (
          <div className={u.reviewWrap}>
            <ReviewRow label="E-mail" value={modalEdit.email} />
            <ReviewRow label="Organização" value={orgLabel} />
            <ReviewRow label="Membership" value={formMembershipStatus} />
            <ReviewRow
              label="Papéis"
              value={[formRoleAdmin && "admin", formRolePlatform && HOOKO_PLATFORM_ADMIN_ROLE_KEY].filter(Boolean).join(", ") || "—"}
            />
          </div>
        ) : null,
      },
    ],
    [modalEdit, formErr, editStep, formPassword, formOrgId, formMembershipStatus, formRoleAdmin, formRolePlatform, orgSelect, orgLabel],
  );

  return (
    <div className={`${s.page} ${u.usersPage}`}>
      <header className={s.header}>
        <p className={s.kicker}>Admin</p>
        <h1 className={s.title}>Usuários / Clientes</h1>
        <p className={s.lede}>
          {USE_MOCK ? "CRUD completo em memória — liga à API definindo USE_MOCK = false." : "Lista global; criação e edição via POST /api/admin/users."}
        </p>
      </header>

      {USE_MOCK ? <span className={u.mockPill}>USE_MOCK = false</span> : null}
      {listErr ? <p className={s.err}>{listErr}</p> : null}
      {toastOk ? <p className={s.success}>{toastOk}</p> : null}

      <div className={u.toolbar}>
        <button type="button" className={`${s.btnPrimary} ${s.btnSm}`} onClick={() => { resetForm(); setModalCreate(true); }}>
          Novo utilizador
        </button>
        <Link href="/admin/planos" className={u.linkSecondary}>
          Gerir planos
        </Link>
      </div>

      {!loaded ? (
        <div className={u.tableWrap} style={{ padding: "1rem 1.15rem" }}>
          <TableSkeleton rows={5} />
        </div>
      ) : (
        <div className={u.tableWrap}>
          <table className={u.table}>
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Plano</th>
                <th>Assinatura</th>
                <th>Cadastro</th>
                <th className={u.thActions}>Acções</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "rgba(161,161,170,0.95)", padding: "1.75rem 1rem" }}>
                    Sem utilizadores. Cria um com «Novo utilizador».
                  </td>
                </tr>
              ) : (
                users.map((row) => (
                  <tr key={row.id}>
                    <td className={u.email}>
                      <Link href={`/admin/usuarios/${row.id}`} className={u.emailLink}>
                        {row.email}
                      </Link>
                    </td>
                    <td>
                      <span className={u.badge}>{row.planLabel}</span>
                    </td>
                    <td>
                      <span className={badgeClassForSubscription(row.subscriptionStatus)}>
                        {subscriptionStatusLabel(row.subscriptionStatus)}
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums", color: "rgba(161,161,170,0.95)" }}>{row.createdDisplay}</td>
                    <td className={u.tdActions}>
                      <button
                        type="button"
                        className={`${s.btnGhost} ${s.btnSm}`}
                        disabled={!row.organizationId}
                        onClick={() => setModalPlan(row)}
                      >
                        Plano
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

      <AdminStepModal
        open={modalCreate}
        title="Novo utilizador"
        subtitle="Configure conta, organização e permissões do novo cliente ou membro da equipa."
        size="xl"
        steps={createSteps}
        step={createStep}
        onStepChange={(next) => {
          if (next > createStep && !validateUserStep("create", createStep)) return;
          setCreateStep(next);
        }}
        onClose={() => {
          setModalCreate(false);
          resetForm();
        }}
        onSubmit={() => {
          for (let i = 0; i < 3; i += 1) {
            if (!validateUserStep("create", i)) {
              setCreateStep(i);
              return;
            }
          }
          submitCreateEdit("create", null);
        }}
        busy={busy}
        submitLabel="Criar utilizador"
      />

      <AdminStepModal
        open={Boolean(modalEdit)}
        title="Editar utilizador"
        subtitle="Actualize credenciais, organização e papéis administrativos."
        size="xl"
        steps={editSteps}
        step={editStep}
        onStepChange={(next) => {
          if (next > editStep && !validateUserStep("edit", editStep)) return;
          setEditStep(next);
        }}
        onClose={() => {
          setModalEdit(null);
          resetForm();
        }}
        onSubmit={() => {
          if (!validateUserStep("edit", 0)) {
            setEditStep(0);
            return;
          }
          if (!validateUserStep("edit", 1)) {
            setEditStep(1);
            return;
          }
          submitCreateEdit("edit", modalEdit);
        }}
        busy={busy}
        submitLabel="Guardar alterações"
      />

      <AdminPlanAssignModal
        open={Boolean(modalPlan)}
        onClose={() => setModalPlan(null)}
        organizationId={modalPlan?.organizationId || null}
        organizationName={modalPlan?.organizationName || ""}
        userEmail={modalPlan?.email || ""}
        onSuccess={(message) => {
          setToastOk(message || "Plano actualizado.");
          loadList();
        }}
      />

      <AdminModal
        open={Boolean(modalDelete)}
        title="Excluir utilizador?"
        onClose={() => setModalDelete(null)}
        footer={
          <>
            <button type="button" className={s.btnGhost} onClick={() => setModalDelete(null)}>
              Cancelar
            </button>
            <button type="button" className={s.btnDanger} disabled={busy} onClick={confirmDelete}>
              {busy ? "A remover…" : "Excluir"}
            </button>
          </>
        }
      >
        {modalDelete ? (
          <>
            <p style={{ margin: 0, color: "rgba(212,212,218,0.95)", lineHeight: 1.5 }}>
              Isto remove <strong>{modalDelete.email}</strong> da lista{USE_MOCK ? " mock" : ""}.
              {!USE_MOCK ? (
                <>
                  {" "}
                  A API não suporta eliminação pelo painel nesta versão; confirme com a equipa antes de apagar dados reais.
                </>
              ) : null}
            </p>
          </>
        ) : null}
      </AdminModal>
    </div>
  );
}

export default function AdminUsuariosPage() {
  return (
    <Suspense
      fallback={
        <div className={`${s.page} ${u.usersPage}`}>
          <header className={s.header}>
            <p className={s.kicker}>Admin</p>
            <h1 className={s.title}>Usuários / Clientes</h1>
          </header>
          <div className={u.tableWrap} style={{ padding: "1rem 1.15rem" }}>
            <TableSkeleton rows={5} />
          </div>
        </div>
      }
    >
      <AdminUsuariosPageContent />
    </Suspense>
  );
}
