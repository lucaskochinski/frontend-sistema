"use client";

import { useRouter } from "next/navigation";
import NotImplementedModal from "@/components/NotImplementedModal/NotImplementedModal";

export default function FormatosPage() {
  const router = useRouter();

  return (
    <NotImplementedModal
      open
      featureKey="formatos"
      onClose={() => router.push("/inicio")}
    />
  );
}
