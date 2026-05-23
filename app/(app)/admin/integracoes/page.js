"use client";

import { useCallback, useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton/Skeleton.js";
import s from "../adminShared.module.css";
import c from "./integracoes.module.css";
import { apiFetch } from "@/lib/hooko-session";
import { translateApiMessage } from "@/lib/api-messages";

const SECTIONS = [
  {
    id: "stripe",
    title: "Stripe — pagamentos",
    intro:
      "Chaves da conta Stripe. Com a secret key configurada, os planos são sincronizados automaticamente (Product + Price).",
    fields: [
      {
        key: "stripe_secret_key",
        label: "Chave secreta (Secret key)",
        secret: true,
        placeholder: "sk_live_… ou sk_test_…",
        hint: "Dashboard Stripe → Developers → API keys",
      },
      {
        key: "stripe_webhook_secret",
        label: "Signing secret do webhook",
        secret: true,
        placeholder: "whsec_…",
        hint: "Após criar o endpoint no Stripe com a URL abaixo",
      },
      {
        key: "stripe_publishable_key",
        label: "Chave publicável (Publishable key)",
        secret: false,
        placeholder: "pk_live_…",
        hint: "Opcional — útil se o checkout embutido for activado no futuro",
      },
    ],
  },
  {
    id: "ia",
    title: "Inteligência artificial",
    intro: "Transcrição de vídeo (Deepgram) e análise criativa (Google Gemini).",
    fields: [
      {
        key: "deepgram_api_key",
        label: "Deepgram API key",
        secret: true,
        placeholder: "Token Deepgram",
        hint: "console.deepgram.com",
      },
      {
        key: "gemini_api_key",
        label: "Google Gemini API key",
        secret: true,
        placeholder: "AIza…",
        hint: "aistudio.google.com → Get API key",
      },
    ],
  },
  {
    id: "meta",
    title: "Meta (Facebook Ads)",
    intro: "App OAuth e token de sistema para sincronização de anúncios sem login por organização.",
    fields: [
      {
        key: "meta_app_id",
        label: "App ID",
        secret: false,
        placeholder: "496590912982860",
      },
      {
        key: "meta_app_secret",
        label: "App Secret",
        secret: true,
        placeholder: "Segredo da app Meta",
      },
      {
        key: "meta_system_access_token",
        label: "System access token",
        secret: true,
        placeholder: "EAA…",
        hint: "Token long-lived com ads_read / ads_management",
      },
    ],
  },
  {
    id: "urls",
    title: "URLs e infra",
    intro: "Endereços públicos e filas usados pelo worker de vídeo.",
    fields: [
      {
        key: "public_app_url",
        label: "URL pública do frontend",
        secret: false,
        placeholder: "https://app.hooko.com.br",
        hint: "Redirects OAuth e links de checkout",
      },
      {
        key: "redis_url",
        label: "Redis URL",
        secret: true,
        placeholder: "redis://…",
        hint: "BullMQ — worker de transcrição/análise",
      },
    ],
  },
];

function SourceBadge({ fieldMeta }) {
  if (!fieldMeta?.configured) return null;
  const fromEnv = fieldMeta.source === "env";
  return (
    <span className={`${c.badge} ${fromEnv ? c.badgeEnv : c.badgeOk}`}>
      {fromEnv ? "via env" : "guardado"}
    </span>
  );
}

function SecretHint({ fieldMeta }) {
  if (!fieldMeta?.configured || !fieldMeta?.masked) return null;
  return (
    <p className={c.hint}>
      Configurado: <span className={s.mono}>{fieldMeta.masked}</span> — deixe vazio para manter o valor actual.
    </p>
  );
}

export default function AdminIntegracoesPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const loadIntegrations = useCallback(async () => {
    setErr("");
    try {
      const payload = await apiFetch("/api/admin/integrations");
      setData(payload);
      setForm({});
      setLoaded(true);
    } catch (e) {
      setErr(translateApiMessage(e?.message, e?.status));
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function fieldValue(key, secret) {
    if (Object.prototype.hasOwnProperty.call(form, key)) {
      return form[key];
    }
    if (secret) return "";
    return data?.values?.[key] ?? "";
  }

  async function copyWebhook() {
    const url = data?.webhooks?.stripe?.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setErr("Não foi possível copiar. Seleccione o texto manualmente.");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFlash("");
    setErr("");
    setBusy(true);

    /** @type {Record<string, string>} */
    const integrations = {};
    for (const section of SECTIONS) {
      for (const field of section.fields) {
        const raw = fieldValue(field.key, field.secret);
        const trimmed = String(raw ?? "").trim();
        if (!trimmed) continue;
        if (field.secret && trimmed.includes("••••")) continue;
        integrations[field.key] = trimmed;
      }
    }

    if (Object.keys(integrations).length === 0) {
      setErr("Indique pelo menos um campo para actualizar.");
      setBusy(false);
      return;
    }

    try {
      const payload = await apiFetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrations }),
      });
      setData(payload);
      setForm({});
      setFlash("Integrações actualizadas. A API já está a usar os novos valores.");
    } catch (e2) {
      setErr(translateApiMessage(e2?.message, e2?.status));
    } finally {
      setBusy(false);
    }
  }

  const stripeWebhookUrl = data?.webhooks?.stripe?.url ?? "";
  const stripeEvents = data?.webhooks?.stripe?.events ?? [];

  return (
    <div className={`${s.page} ${c.page}`}>
      <header className={s.header}>
        <p className={s.kicker}>Admin</p>
        <h1 className={s.title}>Integrações</h1>
        <p className={s.lede}>
          Webhooks, chaves Stripe, IA e Meta — configure tudo aqui sem redeploy. Prioridade: valores guardados →
          variáveis de ambiente do servidor.
        </p>
      </header>

      {err ? <p className={s.err}>{err}</p> : null}

      {!loaded ? (
        <div className={c.skeletonBlock}>
          <Skeleton height={140} width="100%" rounded={18} />
          <Skeleton height={220} width="100%" rounded={18} style={{ marginTop: "1rem" }} />
        </div>
      ) : (
        <form className={c.grid} onSubmit={onSubmit}>
          <section className={c.card} aria-labelledby="stripe-webhook-title">
            <h2 id="stripe-webhook-title" className={c.cardTitle}>
              Webhook Stripe
            </h2>
            <p className={c.cardIntro}>
              No{" "}
              <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
                Dashboard Stripe → Webhooks
              </a>
              , crie um endpoint com esta URL e seleccione os eventos abaixo. API:{" "}
              <span className={s.mono}>{data?.apiBaseUrl ?? "—"}</span>
            </p>
            <div className={c.field}>
              <label className={c.label} htmlFor="stripe-webhook-url">
                URL do endpoint
              </label>
              <div className={c.webhookRow}>
                <input
                  id="stripe-webhook-url"
                  className={c.input}
                  type="text"
                  readOnly
                  value={stripeWebhookUrl}
                />
                <button type="button" className={c.copyBtn} onClick={copyWebhook}>
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              {stripeEvents.length ? (
                <ul className={c.eventList}>
                  {stripeEvents.map((ev) => (
                    <li key={ev}>
                      <span className={s.mono}>{ev}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          {SECTIONS.map((section) => (
            <section key={section.id} className={c.card} aria-labelledby={`section-${section.id}`}>
              <h2 id={`section-${section.id}`} className={c.cardTitle}>
                {section.title}
              </h2>
              <p className={c.cardIntro}>{section.intro}</p>
              <div className={c.formGrid}>
                {section.fields.map((field) => {
                  const meta = data?.fields?.[field.key];
                  const wide = section.fields.length === 1;
                  return (
                    <div
                      key={field.key}
                      className={`${c.field} ${wide ? c.formGridWide : ""}`}
                    >
                      <label className={c.label} htmlFor={field.key}>
                        {field.label}
                        <SourceBadge fieldMeta={meta} />
                      </label>
                      <input
                        id={field.key}
                        className={c.input}
                        type={field.secret ? "password" : "text"}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={field.placeholder}
                        value={fieldValue(field.key, field.secret)}
                        onChange={(ev) => setField(field.key, ev.target.value)}
                      />
                      {field.secret ? <SecretHint fieldMeta={meta} /> : null}
                      {field.hint ? <p className={c.hint}>{field.hint}</p> : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className={c.actions}>
            <button type="submit" className={c.btnPrimary} disabled={busy}>
              {busy ? "A guardar…" : "Salvar integrações"}
            </button>
            {flash ? <p className={c.success}>{flash}</p> : null}
          </div>
        </form>
      )}
    </div>
  );
}
