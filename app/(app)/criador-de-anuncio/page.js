"use client";

import { useRouter } from "next/navigation";
import NotImplementedModal from "@/components/NotImplementedModal/NotImplementedModal";

export default function CriadorDeAnuncioPage() {
  const router = useRouter();

  return (
    <NotImplementedModal
      open
      featureKey="criador"
      onClose={() => router.push("/inicio")}
    />
  );
}
