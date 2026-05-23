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
