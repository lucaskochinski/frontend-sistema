import AppShell from "@/components/AppShell/AppShell";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import PlanBillingGate from "@/components/Billing/PlanBillingGate";

export default function AppAreaLayout({ children }) {
  return (
    <ThemeProvider>
      <PlanBillingGate>
        <AppShell>{children}</AppShell>
      </PlanBillingGate>
    </ThemeProvider>
  );
}
