/**
 * Desenvolvimento / preview: permite abrir `/admin/*` sem JWT nem API.
 * Definir `NEXT_PUBLIC_ADMIN_UI_BYPASS=true` no `.env.local` do frontend.
 *
 * Nunca activar em produção.
 */
export function isAdminUiBypassEnabled() {
  const v = typeof process.env.NEXT_PUBLIC_ADMIN_UI_BYPASS === "string" ? process.env.NEXT_PUBLIC_ADMIN_UI_BYPASS.trim().toLowerCase() : "";
  return v === "1" || v === "true" || v === "yes";
}
