import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";

export const STORAGE_CHECKOUT_REQUIRED = "hooko_checkout_required";

export function markCheckoutRequired() {
  try {
    sessionStorage.setItem(STORAGE_CHECKOUT_REQUIRED, "1");
  } catch {
    /* ignore */
  }
}

export function clearCheckoutRequired() {
  try {
    sessionStorage.removeItem(STORAGE_CHECKOUT_REQUIRED);
  } catch {
    /* ignore */
  }
}

export function isCheckoutRequired() {
  try {
    return sessionStorage.getItem(STORAGE_CHECKOUT_REQUIRED) === "1";
  } catch {
    return false;
  }
}

export function hasActiveBillingAccess(status) {
  return Boolean(status?.bypass || status?.hasActiveSubscription);
}

export function billingOrgQuery() {
  const orgId = getStoredOrganizationId();
  return orgId ? `organizationId=${encodeURIComponent(orgId)}` : "";
}

export async function fetchBillingStatus() {
  const qs = billingOrgQuery();
  if (!qs) return null;
  return apiFetch(`/api/billing/status?${qs}`);
}

export function formatPlanPrice(plan) {
  const cents = plan?.priceAmountCents ?? plan?.price_amount_cents;
  if (cents == null || !Number.isFinite(Number(cents))) return null;
  const currency = plan?.priceCurrency ?? plan?.price_currency ?? "brl";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: String(currency).toUpperCase(),
  }).format(Number(cents) / 100);
}

export function formatImportsLimit(limits) {
  const n = limits?.creative_imports_per_month;
  if (n == null) return "Importações personalizadas";
  if (n === Infinity || n > 999999) return "Importações ilimitadas";
  return `${Number(n).toLocaleString("pt-PT")} importações / mês`;
}

export function formatMinutesLimit(limits) {
  const n = limits?.transcription_minutes_per_month;
  if (n == null) return null;
  if (n === Infinity || n > 999999) return "Transcrição ilimitada";
  return `${Number(n).toLocaleString("pt-PT")} min de transcrição / mês`;
}

export function formatVideoLimit(limits) {
  const mb = limits?.max_video_size_mb;
  const sec = limits?.max_video_duration_seconds;
  if (mb == null && sec == null) return null;
  const parts = [];
  if (mb != null) parts.push(`Vídeos até ${mb} MB`);
  if (sec != null) parts.push(`até ${Math.floor(sec / 60)} min`);
  return parts.join(" · ");
}

export function planPitch(plan) {
  const name = String(plan?.displayName || "").toLowerCase();
  const key = String(plan?.tierKey || "").toLowerCase();
  const tag = `${name} ${key}`;
  if (tag.includes("starter")) {
    return "Ideal para validar criativos e começar a escalar com Meta Ads.";
  }
  if (tag.includes("pro")) {
    return "Para equipas que importam volume e precisam de insights consistentes.";
  }
  if (tag.includes("scale")) {
    return "Operação avançada, alto volume e limites generosos para crescer sem travas.";
  }
  return "Plano pensado para a sua operação de performance e criativos.";
}

export function planFeatureList(plan) {
  const limits = plan?.limits || {};
  const trialDays = Number(plan?.trialDays ?? plan?.trial_days) || 0;
  return [
    formatImportsLimit(limits),
    formatMinutesLimit(limits),
    formatVideoLimit(limits),
    "Análise IA dos vídeos importados",
    "Integrações Meta e webhooks",
    trialDays > 0 ? `${trialDays} dias para testar grátis` : "Facturação mensal",
  ].filter(Boolean);
}

export function formatSubscriptionRenewal(sub) {
  if (!sub?.currentPeriodEnd) return "Renovação automática quando activo";
  const d = new Date(sub.currentPeriodEnd);
  if (Number.isNaN(d.getTime())) return "Renovação automática quando activo";
  const label = d.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
  if (sub.cancelAtPeriodEnd) return `Termina em · ${label}`;
  if (String(sub.status || "").toLowerCase() === "trialing") return `Trial até · ${label}`;
  return `Próxima renovação · ${label}`;
}

export function subscriptionBadgeLabel(billingStatus) {
  if (billingStatus?.bypass) return "Acesso administrador";
  const sub = billingStatus?.subscription;
  if (!billingStatus?.hasActiveSubscription) return "Sem subscrição activa";
  if (sub?.cancelAtPeriodEnd) return "Cancelamento agendado";
  if (String(sub?.status || "").toLowerCase() === "trialing") return "Trial activo";
  return "Subscrição activa";
}

export async function fetchMeProfile() {
  return apiFetch("/api/auth/me");
}

export function normalizeCheckoutPlan(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: String(raw.id),
    tierKey: raw.tierKey ?? raw.tier_key ?? "",
    displayName: raw.displayName ?? raw.display_name ?? raw.name ?? "Plano",
    trialDays: Number(raw.trialDays ?? raw.trial_days) || 0,
    priceAmountCents:
      raw.priceAmountCents != null
        ? Number(raw.priceAmountCents)
        : raw.price_amount_cents != null
          ? Number(raw.price_amount_cents)
          : null,
    priceCurrency: raw.priceCurrency ?? raw.price_currency ?? "brl",
    limits: raw.limits && typeof raw.limits === "object" ? raw.limits : {},
    customOrganizationId: raw.customOrganizationId ?? raw.custom_organization_id ?? null,
    isPublic: raw.isPublic !== false && raw.is_public !== false,
    canCheckout: raw.canCheckout === true || raw.can_checkout === true,
  };
}

export async function fetchCheckoutPlans() {
  const qs = billingOrgQuery();
  if (!qs) return { items: [] };
  const data = await apiFetch(`/api/billing/plans?${qs}`);
  const items = Array.isArray(data.items)
    ? data.items.map(normalizeCheckoutPlan).filter(Boolean)
    : [];
  return { ...data, items };
}

export async function startCheckout(planId) {
  const orgId = getStoredOrganizationId();
  const data = await apiFetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: orgId, planId }),
  });
  const checkoutUrl = data.checkoutUrl ?? data.checkout_url ?? null;
  return { ...data, checkoutUrl };
}

export async function openBillingPortal(returnPath = "/inicio") {
  const orgId = getStoredOrganizationId();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const data = await apiFetch("/api/billing/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: orgId,
      returnUrl: origin ? `${origin}${returnPath}` : undefined,
    }),
  });
  if (data?.portalUrl) window.location.href = data.portalUrl;
  return data;
}

/** Cancela renovação automática no sistema (sem portal Stripe). */
export async function cancelSubscriptionAtPeriodEnd() {
  const orgId = getStoredOrganizationId();
  return apiFetch("/api/billing/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: orgId }),
  });
}

export const ALERT_PRIORITY = {
  payment_past_due: 1,
  subscription_canceled: 2,
  trial_ending: 3,
  cancel_scheduled: 4,
  no_subscription: 5,
};

export function pickPrimaryAlert(alerts) {
  if (!Array.isArray(alerts) || alerts.length === 0) return null;
  return [...alerts].sort((a, b) => (ALERT_PRIORITY[a.type] ?? 99) - (ALERT_PRIORITY[b.type] ?? 99))[0];
}

export function dismissAlert(type) {
  try {
    sessionStorage.setItem(`hooko.planAlert.dismiss.${type}`, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isAlertDismissed(type) {
  try {
    return Boolean(sessionStorage.getItem(`hooko.planAlert.dismiss.${type}`));
  } catch {
    return false;
  }
}
