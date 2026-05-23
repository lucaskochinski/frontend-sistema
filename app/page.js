import {
  LandingAudience,
  LandingComparison,
  LandingCta,
  LandingDifferentiator,
  LandingFooter,
  LandingFormula,
  LandingHeader,
  LandingHero,
  LandingMarketTruth,
  LandingPricing,
  LandingProblem,
} from "@/components/LandingPage";
import { fetchPublicPlansServer } from "@/lib/billing";
import styles from "./landing.module.css";

export const metadata = {
  title: "Hooko — IA que encontra, analisa e escala criativos vencedores",
  description:
    "Inteligência Artificial especialista em criativos. Detecte padrões ocultos, analise anúncios e escale com previsibilidade.",
};

export default async function HomePage() {
  const plans = await fetchPublicPlansServer();

  return (
    <div className={styles.page}>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingPricing plans={plans} />
        <LandingFormula />
        <LandingMarketTruth />
        <LandingProblem />
        <LandingDifferentiator />
        <LandingComparison />
        <LandingAudience />
        <LandingPricing plans={plans} anchorId={null} titleId="landing-pricing-title-bottom" />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
