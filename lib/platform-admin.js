/**
 * Deve coincidir com `PLATFORM_ADMIN_JWT_ROLE_KEY` na API (default `hooko_platform_admin`).
 */
export const HOOKO_PLATFORM_ADMIN_ROLE_KEY =
  typeof process.env.NEXT_PUBLIC_PLATFORM_ADMIN_ROLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_PLATFORM_ADMIN_ROLE_KEY.trim()
    ? process.env.NEXT_PUBLIC_PLATFORM_ADMIN_ROLE_KEY.trim()
    : "hooko_platform_admin";

/** @param {unknown} roles */
export function hasPlatformAdminRole(roles) {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => String(r) === HOOKO_PLATFORM_ADMIN_ROLE_KEY);
}
