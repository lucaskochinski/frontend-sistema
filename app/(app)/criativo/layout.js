import CriativoNav from "./CriativoNav";

export const metadata = {
  title: "Criativos — HOOKO",
};

export default function DashboardCreativesLayout({ children }) {
  return (
    <>
      <CriativoNav />
      {children}
    </>
  );
}
