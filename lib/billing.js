import { apiFetch, getStoredOrganizationId, getApiBase } from "@/lib/hooko-session";

export const STORAGE_CHECKOUT_REQUIRED = "hooko_checkout_required";
export const STORAGE_PENDING_PLAN_ID = "hooko_pending_plan_id";

export function setPendingPlanId(planId) {
  if (!planId) return;
  try {
    sessionStorage.setItem(STORAGE_PENDING_PLAN_ID, String(planId));
  } catch {
    /* ignore */
  }
}

export function getPendingPlanId() {
  try {
    const raw = sessionStorage.getItem(STORAGE_PENDING_PLAN_ID);
    return raw ? String(raw).trim() : null;
  } catch {
    return null;
  }
}

export function clearPendingPlanId() {
  try {
    sessionStorage.removeItem(STORAGE_PENDING_PLAN_ID);
  } catch {
    /* ignore */
  }
}

export function readPlanIdFromSearchParams(searchParams) {
  const raw = searchParams?.get?.("plan") ?? searchParams?.get?.("planId");
  return raw ? String(raw).trim() : null;
}

/** Plano escolhido na landing/registo — URL tem prioridade sobre sessionStorage. */
export function resolvePreferredPlanId(searchParams) {
  return readPlanIdFromSearchParams(searchParams) || getPendingPlanId();
}

export function buildCheckoutHref(planId) {
  const id = planId || getPendingPlanId();
  return id ? `/checkout?plan=${encodeURIComponent(id)}` : "/checkout";
}

export function pickDefaultCheckoutPlan(items, { preferredPlanId = null, currentPlanId = null } = {}) {
  if (!Array.isArray(items) || !items.length) return null;
  const preferred = preferredPlanId
    ? items.find((p) => p.id === String(preferredPlanId))
    : null;
  const current = currentPlanId ? items.find((p) => p.id === String(currentPlanId)) : null;
  const pro = items.find((p) => {
    const tag = `${p.displayName || ""} ${p.tierKey || ""}`.toLowerCase();
    return tag.includes("pro");
  });
  return preferred || current || pro || items.find((p) => p.canCheckout) || items[0];
}

export async function fetchPublicPlansClient() {
  const base = getApiBase();
  if (!base) return [];

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/plans/public`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data.items) ? data.items : [])
      .map(normalizePublicPlan)
      .filter(Boolean);
  } catch {
    return [];
  }
}

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

export function planHasBillablePrice(plan) {
  const cents = plan?.priceAmountCents ?? plan?.price_amount_cents;
  return cents != null && Number.isFinite(Number(cents)) && Number(cents) >= 50;
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
  const priceAmountCents =
    raw.priceAmountCents != null
      ? Number(raw.priceAmountCents)
      : raw.price_amount_cents != null
        ? Number(raw.price_amount_cents)
        : null;
  const canCheckoutFromApi = raw.canCheckout ?? raw.can_checkout;
  const canCheckout =
    canCheckoutFromApi === true ||
    (canCheckoutFromApi == null && planHasBillablePrice({ priceAmountCents }));

  return {
    id: String(raw.id),
    tierKey: raw.tierKey ?? raw.tier_key ?? "",
    displayName: raw.displayName ?? raw.display_name ?? raw.name ?? "Plano",
    trialDays: Number(raw.trialDays ?? raw.trial_days) || 0,
    priceAmountCents,
    priceCurrency: raw.priceCurrency ?? raw.price_currency ?? "brl",
    limits: raw.limits && typeof raw.limits === "object" ? raw.limits : {},
    customOrganizationId: raw.customOrganizationId ?? raw.custom_organization_id ?? null,
    isPublic: raw.isPublic !== false && raw.is_public !== false,
    canCheckout,
  };
}

export function normalizePublicPlan(raw) {
  const plan = normalizeCheckoutPlan(raw);
  if (!plan) return null;
  return { ...plan, canCheckout: true, isPublic: true };
}

export async function fetchPublicPlansServer() {
  const base = getApiBase();
  if (!base) return [];

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/plans/public`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data.items) ? data.items : [])
      .map(normalizePublicPlan)
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function pickFeaturedPlan(plans) {
  if (!Array.isArray(plans) || !plans.length) return null;
  const pro = plans.find((plan) => {
    const tag = `${plan.displayName || ""} ${plan.tierKey || ""}`.toLowerCase();
    return tag.includes("pro");
  });
  if (pro) return pro;
  if (plans.length >= 3) return plans[1];
  return plans[0];
}

export function isPopularPlan(plan, index, total) {
  const tag = `${plan?.displayName || ""} ${plan?.tierKey || ""}`.toLowerCase();
  if (tag.includes("pro")) return true;
  return total >= 3 && index === 1;
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
