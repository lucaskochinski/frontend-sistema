"use client";

import styles from "@/components/AuthFormShared/AuthFormShared.module.css";
import AuthFormLayout from "@/components/AuthFormLayout/AuthFormLayout";
import Link from "next/link";
import { useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton";
import AuthPasswordField from "@/components/AuthPasswordField/AuthPasswordField";
import { persistSession, getApiBase } from "@/lib/hooko-session";

const USE_MOCK = false;

const MOCK_REGISTER_RESPONSE = {
  userId: "660e8400-e29b-41d4-a716-446655440001",
  email: "nova@hooko.demo",
  accessToken: "mock-jwt-register",
  organizationId: "770e8400-e29b-41d4-a716-446655440002",
};

async function registerRequest(payload) {
  if (
    !payload.email ||
    !payload.password ||
    !payload.organizationName ||
    payload.confirmPassword == null
  ) {
    const err = new Error("Preencha todos os campos.");
    throw err;
  }
  if (!String(payload.confirmPassword).trim()) {
    const err = new Error("Confirme sua senha.");
    throw err;
  }
  if (String(payload.password).length < 8) {
    const err = new Error("Senha mínimo 8 caracteres.");
    throw err;
  }
  if (payload.password !== payload.confirmPassword) {
    const err = new Error("Senhas não coincidem.");
    throw err;
  }

  const API_BASE = getApiBase();

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    return MOCK_REGISTER_RESPONSE;
  }

  const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      organizationName: payload.organizationName,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Não foi possível criar a conta.");
    throw err;
  }
  return data;
}

export default function RegisterForm({ onSuccess }) {
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const data = await registerRequest({
        email,
        password,
        confirmPassword,
        organizationName,
      });
      persistSession({
        accessToken: data.accessToken,
        organizationId: data.organizationId,
      });
      onSuccess?.();
    } catch (err) {
      setFeedback({ type: "err", text: err.message });
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
          <Skeleton className={styles.skLine} />
          <Skeleton className={styles.skBtn} />
        </div>
      ) : (
        <>
          <header className={styles.header}>
            <h2 className={styles.cardTitle}>Criar conta</h2>
            <p className={styles.cardSub}>Workspace + identidade em um fluxo único.</p>
          </header>

          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <label className={styles.label}>
              <span className={styles.labelText}>Empresa / Workspace</span>
              <input
                className={styles.input}
                type="text"
                name="organizationName"
                autoComplete="organization"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Ex: Hooko Performance"
                required
              />
            </label>
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
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 8 caracteres"
            />
            <AuthPasswordField
              label="Confirmar senha"
              name="passwordConfirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repita a senha"
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
              Começar
            </button>
          </form>

          <p className={styles.footer}>
            Já tem conta?{" "}
            <Link className={styles.link} href="/login">
              Entrar
            </Link>
          </p>
        </>
      )}
    </AuthFormLayout>
  );
}
