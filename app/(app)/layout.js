import AppShell from "@/components/AppShell/AppShell";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";

export default function AppAreaLayout({ children }) {
  return (
    <ThemeProvider>
      <AppShell>{children}</AppShell>
    </ThemeProvider>
  );
}
