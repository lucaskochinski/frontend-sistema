/** Destinos partilhados — landing page */
export const LANDING_ANCHORS = {
  inicio: "#inicio",
  planos: "#planos",
  formula: "#formula",
  mercado: "#mercado",
  problema: "#problema",
  diferencial: "#diferencial",
  comparacao: "#comparacao",
  publico: "#publico",
  cta: "#cta",
};

export function registerWithPlanHref(planId) {
  return planId ? `/register?plan=${encodeURIComponent(planId)}` : "/register";
}
