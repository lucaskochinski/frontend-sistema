"use client";

import { useEffect, useRef } from "react";
import styles from "./OctopusLoopVideo.module.css";

function smoothstep(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

/** Opacidade: cai mais cedo que o vídeo linear → o blur / desaturação escondem o salto do loop. */
function opacityCurve(rawBlend) {
  return Math.pow(Math.max(0, Math.min(1, rawBlend)), 0.55);
}

export default function OctopusLoopVideo({
  src = "/videos/login/octopus.mp4",
  fadeSeconds = 1.48,
  maxBlurPx = 42,
  maxBridgeAlpha = 0.88,
  variant = "brand",
}) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const v = videoRef.current;
    if (!wrap || !v) return;

    v.play().catch(() => {});

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (reduce) {
      v.loop = true;
      return () => {
        v.loop = false;
      };
    }

    v.loop = false;

    let lastT = -1;
    /** Após `ended` ou salto de `currentTime`, anima o “de” e “volta” sem depender de frames no fim do clip. */
    let loopSeamAt = null;
    let raf = 0;

    const onEnded = () => {
      loopSeamAt = performance.now();
      v.currentTime = 0;
      v.play().catch(() => {});
    };
    v.addEventListener("ended", onEnded);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = v.currentTime;
      const d = v.duration;
      if (!Number.isFinite(d) || d <= fadeSeconds * 1.2) return;

      if (lastT >= 0 && t < lastT - 0.2) {
        loopSeamAt = performance.now();
      }
      lastT = t;

      let rawBlend = 1;
      const sinceSeamMs = loopSeamAt != null ? performance.now() - loopSeamAt : Infinity;

      if (loopSeamAt != null && sinceSeamMs < fadeSeconds * 1000) {
        rawBlend = smoothstep(sinceSeamMs / 1000 / fadeSeconds);
      } else {
        if (loopSeamAt != null) loopSeamAt = null;
        const tail = d - t;
        if (tail <= fadeSeconds) {
          rawBlend = smoothstep(tail / fadeSeconds);
        }
      }

      const blend = Math.min(1, Math.max(0, rawBlend));
      const obscure = smoothstep(1 - blend);
      // Blur sobe mais rápido no meio da zona de mistura → máscara forte onde o loop “pula”.
      const blurRamp = Math.pow(obscure, 1.12);
      const blurPx = blurRamp * maxBlurPx;
      const bright = 0.26 + 0.74 * blend;
      const sat = 0.52 + 0.48 * blend;
      const op = opacityCurve(blend);

      wrap.style.setProperty("--loop-blend", blend.toFixed(4));
      wrap.style.setProperty("--loop-opacity-fade", op.toFixed(4));
      wrap.style.setProperty("--loop-blur", `${blurPx.toFixed(2)}px`);
      wrap.style.setProperty("--loop-brightness", bright.toFixed(4));
      wrap.style.setProperty("--loop-saturate", sat.toFixed(4));
      const bridge = Math.min(1, obscure * 1.02) * maxBridgeAlpha;
      wrap.style.setProperty("--loop-bridge-alpha", bridge.toFixed(4));
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("ended", onEnded);
      v.loop = false;
      wrap.style.removeProperty("--loop-blend");
      wrap.style.removeProperty("--loop-opacity-fade");
      wrap.style.removeProperty("--loop-blur");
      wrap.style.removeProperty("--loop-brightness");
      wrap.style.removeProperty("--loop-saturate");
      wrap.style.removeProperty("--loop-bridge-alpha");
    };
  }, [fadeSeconds, maxBlurPx, maxBridgeAlpha]);

  return (
    <div
      ref={wrapRef}
      className={variant === "hero" ? styles.wrapHero : styles.wrap}
      data-variant={variant}
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className={styles.loopBridge} aria-hidden />
    </div>
  );
}
