"use client";

import { useState } from "react";
import ExternalImage from "@/components/ExternalMedia/ExternalImage";
import { apiFetch, getStoredOrganizationId } from "@/lib/hooko-session";
import styles from "./page.module.css";

export default function FormatAdThumb({ adId, mediaId, initialSrc, alt }) {
  const [src, setSrc] = useState(initialSrc || "/imagens/meta.png");
  const [refreshing, setRefreshing] = useState(false);

  const handleError = async () => {
    if (!mediaId || refreshing) {
      setSrc("/imagens/meta.png");
      return;
    }
    setRefreshing(true);
    try {
      const orgId = getStoredOrganizationId();
      if (!orgId) return;
      const res = await apiFetch(`/api/dashboard/media-refresh/${mediaId}?organizationId=${orgId}`);
      if (res?.thumbnailUrl) setSrc(res.thumbnailUrl);
      else if (res?.url && res?.type !== "video") setSrc(res.url);
      else setSrc("/imagens/meta.png");
    } catch {
      setSrc("/imagens/meta.png");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ExternalImage
      src={src}
      alt={alt}
      className={styles.adPreviewThumb}
      onError={handleError}
    />
  );
}
