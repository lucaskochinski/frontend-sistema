"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import s from "../../adminShared.module.css";

export default function AdminNovoUsuarioRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/usuarios?novo=1");
  }, [router]);
  return (
    <p className={s.loadingBlock}>
      A abrir o formulário de novo utilizador…
    </p>
  );
}
