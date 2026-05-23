"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminPlanAssignModal from "@/components/AdminPlanAssignModal/AdminPlanAssignModal";
import { formatPlanPrice } from "@/lib/billing";
import { apiFetch } from "@/lib/hooko-session";
import s from "../../adminShared.module.css";

function subscriptionStatusLabel(status) {
  const v = String(status || "").toLowerCase();
  if (v === "active") return "Activo";
  if (v === "trialing") return "Trial";
  if (v === "canceled") return "Cancelado";
  if (v === "past_due") return "Em atraso";
  return status || "—";
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT");
}

/** @param {{ params: { userId: string } }} props */
export default function AdminUsuarioDetalhePage({ params }) {
  const { userId } = params;
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");
  const [toastOk, setToastOk] = useState("");
  const [planModal, setPlanModal] = useState(null);

  async function loadUser() {
    const data = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`);
    setUser(data);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadUser();
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Utilizador não encontrado");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (err) {
    return (
      <div className={s.page}>
        <p className={s.err}>{err}</p>
        <Link href="/admin/usuarios" className={s.rowLink}>
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={s.page}>
        <p style={{ color: "rgba(161,161,170,0.95)" }}>A carregar…</p>
      </div>
    );
  }

  const memberships = Array.isArray(user.memberships) ? user.memberships : [];

  const roleLabels = (m) => {
    const roles = m?.roles;
    if (!Array.isArray(roles) || roles.length === 0) return "—";
    return roles.map((r) => r.key || r.name).join(", ");
  };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className={s.kicker}>Admin · Usuários</p>
        <h1 className={s.title}>{user.email}</h1>
        <p className={s.lede}>Identificador {user.id}</p>
      </header>

      <Link href="/admin/usuarios" className={s.rowLink} style={{ display: "inline-block", marginBottom: "1.25rem" }}>
        ← Lista
      </Link>

      {toastOk ? <p className={s.success}>{toastOk}</p> : null}

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Organizações e planos</h2>
        <div className={s.cardTable}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Organização</th>
                <th>Membership</th>
                <th>Plano actual</th>
                <th>Assinatura</th>
                <th>Papéis</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              {memberships.length === 0 ? (
                <tr>
                  <td colSpan={6}>Sem memberships.</td>
                </tr>
              ) : (
                memberships.map((m) => {
                  const subs = Array.isArray(m.organization?.subscriptions)
                    ? m.organization.subscriptions
                    : [];
                  const activeSub =
                    subs.find((sub) => ["active", "trialing"].includes(String(sub.status).toLowerCase())) ||
                    subs[0] ||
                    null;

                  return (
                    <tr key={m.id}>
                      <td>{m.organization?.name || "—"}</td>
                      <td>{m.status}</td>
                      <td>
                        {activeSub?.plan?.displayName || "Sem plano"}
                        {activeSub?.plan ? (
                          <span style={{ display: "block", fontSize: "0.76rem", color: "rgba(161,161,170,0.95)" }}>
                            {formatPlanPrice(activeSub.plan) || "—"}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        {activeSub
                          ? `${subscriptionStatusLabel(activeSub.status)} · até ${fmtDate(activeSub.currentPeriodEnd)}`
                          : "—"}
                      </td>
                      <td>{roleLabels(m)}</td>
                      <td>
                        <button
                          type="button"
                          className={`${s.btnGhost} ${s.btnSm}`}
                          onClick={() =>
                            setPlanModal({
                              organizationId: m.organizationId,
                              organizationName: m.organization?.name || "",
                              userEmail: user.email,
                            })
                          }
                        >
                          Gerir plano
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className={s.callout}>
        <p className={s.calloutTitle}>Flexibilidade administrativa</p>
        <p>
          Pode activar plano <strong>grátis</strong>, gerar <strong>link Stripe</strong>, trocar plano ou revogar
          acesso por organização. Planos exclusivos continuam disponíveis em{" "}
          <Link href="/admin/planos" className={s.rowLink}>
            Admin → Planos
          </Link>
          .
        </p>
      </div>

      <AdminPlanAssignModal
        open={Boolean(planModal)}
        onClose={() => setPlanModal(null)}
        organizationId={planModal?.organizationId || null}
        organizationName={planModal?.organizationName || ""}
        userEmail={planModal?.userEmail || user.email}
        onSuccess={async (message) => {
          setToastOk(message || "Plano actualizado.");
          await loadUser();
        }}
      />
    </div>
  );
}
