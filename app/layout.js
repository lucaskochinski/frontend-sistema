import "./globals.css";
import ThemeInitScript from "@/components/Theme/ThemeInitScript";

export const metadata = {
  title: "HOOKO — Inteligência para Meta Ads",
  description: "Análise de criativos com IA. Gancho, oferta, prova social e CTA.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
