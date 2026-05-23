import Link from "next/link";
import {
  formatPlanPrice,
  isPopularPlan,
  planFeatureList,
  planPitch,
} from "@/lib/billing";
import { registerWithPlanHref } from "../landingLinks";
import styles from "./LandingPricing.module.css";

/**
 * @param {{ plans?: Array<Record<string, unknown>>; anchorId?: string; titleId?: string }} props
 */
export default function LandingPricing({
  plans = [],
  anchorId = "planos",
  titleId = "landing-pricing-title",
}) {
  return (
    <section
      {...(anchorId ? { id: anchorId } : {})}
      className={styles.section}
      aria-labelledby={titleId}
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Planos</p>
          <h2 id={titleId} className={styles.title}>
            Escolha o plano certo para a sua operação
          </h2>
          <p className={styles.lede}>
            Preços públicos actualizados em tempo real. Crie a conta e finalize a assinatura em
            minutos.
          </p>
        </header>

        {plans.length === 0 ? (
          <div className={styles.empty}>
            Planos em breve. Entre em contacto ou crie a conta para ser avisado.
          </div>
        ) : (
          <ul className={styles.grid}>
            {plans.map((plan, index) => {
              const popular = isPopularPlan(plan, index, plans.length);
              const features = planFeatureList(plan);
              const price = formatPlanPrice(plan);

              return (
                <li
                  key={plan.id}
                  className={`${styles.card} ${popular ? styles.cardPopular : ""}`}
                >
                  {popular ? <span className={styles.badge}>Mais escolhido</span> : null}

                  <div className={styles.head}>
                    <h3 className={styles.name}>{plan.displayName}</h3>
                    {price ? (
                      <p className={styles.price}>
                        {price}
                        <span className={styles.pricePeriod}> / mês</span>
                      </p>
                    ) : null}
                    <p className={styles.pitch}>{planPitch(plan)}</p>
                  </div>

                  <ul className={styles.features}>
                    {features.map((feature) => (
                      <li key={feature} className={styles.feature}>
                        <span className={styles.featureMark} aria-hidden="true">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={registerWithPlanHref(plan.id)}
                    className={`${styles.btn} ${popular ? styles.btnPopular : ""}`}
                  >
                    Assinar {plan.displayName}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
