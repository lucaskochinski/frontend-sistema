"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminNovoUsuarioRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/usuarios?novo=1");
  }, [router]);
  return (
    <p style={{ color: "rgba(161,161,170,0.95)", padding: "2rem 1rem" }}>
      A abrir o formulário de novo utilizador…
    </p>
  );
}
