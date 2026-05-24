"use client";

import OctopusLoopVideo from "@/components/OctopusLoopVideo/OctopusLoopVideo";
import styles from "./LandingHero.module.css";

export default function LandingHeroVisual() {
  return (
    <div className={styles.visual}>
      <div className={styles.mascotWrap}>
        <OctopusLoopVideo variant="hero" />
        <div className={styles.videoScrim} aria-hidden />
      </div>
    </div>
  );
}
