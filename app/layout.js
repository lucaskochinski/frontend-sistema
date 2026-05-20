import "./globals.css";

export const metadata = {
  title: "HOOKO — Inteligência para Meta Ads",
  description: "Análise de criativos com IA. Gancho, oferta, prova social e CTA.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
