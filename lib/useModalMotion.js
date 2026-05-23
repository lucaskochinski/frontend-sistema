"use client";

import { useEffect, useState } from "react";

const CLOSE_MS = 280;

/**
 * Controla montagem + fase de saída para modais com animação fluida.
 * @param {boolean} open
 */
export function useModalMotion(open) {
  const [phase, setPhase] = useState(/** @type {'closed' | 'open' | 'closing'} */ ("closed"));

  useEffect(() => {
    if (open) {
      setPhase("open");
      return;
    }
    setPhase((prev) => (prev === "open" ? "closing" : prev === "closing" ? "closing" : "closed"));
  }, [open]);

  useEffect(() => {
    if (phase !== "closing") return undefined;
    const timer = window.setTimeout(() => setPhase("closed"), CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return {
    mounted: phase !== "closed",
    closing: phase === "closing",
    closeMs: CLOSE_MS,
  };
}
