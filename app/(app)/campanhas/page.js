import { redirect } from "next/navigation";

/** Redirecionamento legado: criativos em `/criativo`. */
export default function CampanhasLegacyRedirect() {
  redirect("/criativo");
}
