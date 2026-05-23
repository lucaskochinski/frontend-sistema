/** Traduz códigos/mensagens técnicas da API para português (utilizador final). */
const MAP = {
  not_found: "Recurso não encontrado.",
  unexpected_error: "Erro inesperado. Tente novamente.",
  authorization_bearer_missing: "Sessão expirada. Faça login novamente.",
  forbidden_missing_role: "Sem permissão para esta acção.",
  credentials_required: "Indique e-mail e senha.",
  invalid_credentials: "E-mail ou senha incorrectos.",
  email_already_registered: "Este e-mail já está registado.",
  register_validation_failed: "Dados de registo inválidos.",
  organization_id_required: "Organização em falta. Faça login novamente.",
  organization_not_in_membership: "Sem acesso a esta organização.",
  organization_not_found: "Organização não encontrada.",
  invalid_plan_id: "Plano inválido.",
  invalid_organization_id: "Organização inválida.",
  plan_not_found_or_inactive: "Plano não encontrado ou inactivo.",
  plan_checkout_organization_mismatch: "Este plano não está disponível para a sua organização.",
  plan_missing_stripe_price_id: "Plano sem preço configurado. Contacte o suporte.",
  stripe_customer_not_linked_for_organization: "Conta de pagamento ainda não configurada.",
  plan_tier_key_invalid: "Chave do plano inválida.",
  plan_tier_key_already_exists: "Já existe um plano com esta chave.",
  plan_name_required: "Nome do plano é obrigatório.",
  plan_stripe_price_id_required: "ID do preço é obrigatório.",
  plan_price_amount_required: "Indique o preço mensal do plano.",
  plan_price_amount_invalid: "Preço inválido (mínimo R$ 0,50).",
  plan_limits_must_be_object: "Limites do plano inválidos.",
  plan_not_found: "Plano não encontrado.",
  plan_patch_empty: "Nenhuma alteração para guardar.",
  custom_organization_not_found: "Organização seleccionada não existe.",
  STRIPE_SECRET_KEY_not_configured: "Pagamentos temporariamente indisponíveis.",
};

/**
 * @param {unknown} raw
 * @param {number} [status]
 * @returns {string}
 */
export function translateApiMessage(raw, status) {
  const key = typeof raw === "string" ? raw.trim() : "";
  if (key && MAP[key]) return MAP[key];
  if (key && /^[\w.-]+$/.test(key) && key.includes("_")) {
    return "Ocorreu um problema. Tente novamente ou contacte o suporte.";
  }
  if (key) return key;
  if (status === 404) return "Recurso não encontrado.";
  if (status === 401) return "Sessão expirada. Faça login novamente.";
  if (status === 403) return "Sem permissão para esta acção.";
  if (status === 422) return "Dados inválidos. Verifique e tente novamente.";
  if (status && status >= 500) return "Erro no servidor. Tente mais tarde.";
  return status ? `Erro ${status}` : "Erro desconhecido.";
}
