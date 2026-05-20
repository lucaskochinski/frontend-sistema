"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/hooko-session";
import s from "../../adminShared.module.css";

/** @param {{ params: { userId: string } }} props */
export default function AdminUsuarioDetalhePage({ params }) {
  const { userId } = params;
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`);
        if (!cancelled) setUser(data);
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

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Memberships</h2>
        <div className={s.cardTable}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Organização</th>
                <th>Estado</th>
                <th>Papéis</th>
                <th className={s.mono}>organizationId</th>
              </tr>
            </thead>
            <tbody>
              {memberships.length === 0 ? (
                <tr>
                  <td colSpan={4}>Sem memberships.</td>
                </tr>
              ) : (
                memberships.map((m) => (
                  <tr key={m.id}>
                    <td>{m.organization?.name || "—"}</td>
                    <td>{m.status}</td>
                    <td>{roleLabels(m)}</td>
                    <td className={s.mono}>{m.organizationId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className={s.callout}>
        <p className={s.calloutTitle}>Plano exclusivo por organização</p>
        <p>
          O catálogo suporta planos com <strong>custom_organization_id</strong>. Cria em{" "}
          <Link href="/admin/planos" className={s.rowLink}>
            Admin → Planos
          </Link>{" "}
          usando o <span className={s.mono}>organizationId</span> acima.
        </p>
      </div>
    </div>
  );
}
