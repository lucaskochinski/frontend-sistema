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

export async function fetchCheckoutPlans() {
  const qs = billingOrgQuery();
  if (!qs) return { items: [] };
  return apiFetch(`/api/billing/plans?${qs}`);
}

export async function startCheckout(planId) {
  const orgId = getStoredOrganizationId();
  return apiFetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: orgId, planId }),
  });
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
