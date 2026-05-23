"use client";

import styles from "@/components/AuthFormShared/AuthFormShared.module.css";
import AuthFormLayout from "@/components/AuthFormLayout/AuthFormLayout";
import Link from "next/link";
import { useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton";
import AuthPasswordField from "@/components/AuthPasswordField/AuthPasswordField";
import { translateApiMessage } from "@/lib/api-messages";
import { persistSession, getApiBase } from "@/lib/hooko-session";

const USE_MOCK = false;

const MOCK_LOGIN_RESPONSE = {
  accessToken: "mock-jwt",
  user: { id: "550e8400-e29b-41d4-a716-446655440000", email: "founder@hooko.demo" },
  organizationId: "550e8400-e29b-41d4-a716-446655440001",
};

async function loginRequest(email, password) {
  const API_BASE = getApiBase();

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    if (!email || !password) {
      const err = new Error("Preencha e-mail e senha.");
      err.code = "validation";
      throw err;
    }
    return MOCK_LOGIN_RESPONSE;
  }

  const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(translateApiMessage(data.message || data.error, res.status) || "Falha no login.");
    throw err;
  }
  return data;
}

export default function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      persistSession({
        accessToken: data.accessToken,
        organizationId: data?.organizationId ?? data?.user?.memberships?.[0]?.organizationId,
      });
      onSuccess?.();
    } catch (err) {
      setFeedback({ type: "err", text: err.message || "Erro" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormLayout>
      {loading ? (
        <div className={styles.skeletonWrap} aria-busy aria-label="Carregando">
          <Skeleton className={styles.skLineSm} />
          <Skeleton className={styles.skLine} />
          <Skeleton className={styles.skLine} />
          <Skeleton className={styles.skBtn} />
        </div>
      ) : (
        <>
          <header className={styles.header}>
            <h2 className={styles.cardTitle}>Entrar</h2>
            <p className={styles.cardSub}>Acesso seguro ao painel HOOKO.</p>
          </header>

          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <label className={styles.label}>
              <span className={styles.labelText}>E-mail</span>
              <input
                className={styles.input}
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                required
              />
            </label>
            <AuthPasswordField
              label="Senha"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />

            <div className={styles.feedSlot}>
              {feedback ? (
                <p className={styles.feedErr} role="status">
                  {feedback.text}
                </p>
              ) : null}
            </div>

            <div className={styles.push} aria-hidden />
            <button className={styles.submit} type="submit">
              Continuar
            </button>
          </form>

          <p className={styles.footer}>
            Novo por aqui?{" "}
            <Link className={styles.link} href="/register">
              Criar conta
            </Link>
          </p>
        </>
      )}
    </AuthFormLayout>
  );
}
