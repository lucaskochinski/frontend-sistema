/** Chaves alinhadas ao fluxo real (login/registo gravam o token). */
import { translateApiMessage } from "@/lib/api-messages";

export const STORAGE_ACCESS_TOKEN = "hooko_access_token";
export const STORAGE_ORGANIZATION_ID = "hooko_organization_id";

export function getApiBase() {
  return "https://sistema-api.szpytu.easypanel.host";
}

/** @returns {string | null} */
export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_ACCESS_TOKEN);
  } catch {
    return null;
  }
}

/** @returns {string | null} */
export function getStoredOrganizationId() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_ORGANIZATION_ID);
  } catch {
    return null;
  }
}

export function persistSession({ accessToken, organizationId }) {
  if (typeof window === "undefined") return;
  try {
    if (accessToken) localStorage.setItem(STORAGE_ACCESS_TOKEN, accessToken);
    if (organizationId) localStorage.setItem(STORAGE_ORGANIZATION_ID, organizationId);
  } catch {
    /* ignore */
  }
}

/**
 * Fetch à API Hooko com Bearer.
 * @param {string} path - ex.: `/api/auth/me`
 * @param {RequestInit & { parseJson?: boolean }} [opts]
 */
export async function apiFetch(path, opts = {}) {
  const base = getApiBase();
  if (!base) {
    const err = new Error("NEXT_PUBLIC_API_URL não definido");
    err.code = "no_api_base";
    throw err;
  }
  const token = getStoredAccessToken();
  const { parseJson = true, headers: hdrInit, ...rest } = opts;
  const headers = new Headers(hdrInit);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, { ...rest, headers });

  if (!parseJson) return /** @type {Response} */ (res);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      "";
    const msg = translateApiMessage(raw, res.status);
    const err = new Error(msg);
    err.status = res.status;
    /** @type {any} */
    err.body = data;
    throw err;
  }
  return data;
}
