import styles from "./BrandShowcase.module.css";
import OctopusLoopVideo from "@/components/OctopusLoopVideo/OctopusLoopVideo";

export default function BrandShowcase({ tagline = "Inteligência para escala em Meta Ads." }) {
  return (
    <div className={styles.root}>
      <div className={styles.glowOrb} aria-hidden />
      <div className={styles.glowOrbSecondary} aria-hidden />
      <svg className={styles.tentacles} viewBox="0 0 400 400" aria-hidden>
        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(212,175,55,0)" />
            <stop offset="50%" stopColor="rgba(212,175,55,0.45)" />
            <stop offset="100%" stopColor="rgba(255,215,0,0.12)" />
          </linearGradient>
        </defs>
        <path
          className={styles.tentacle}
          d="M40 320 Q120 200 200 180 T360 60"
          fill="none"
          stroke="url(#lg1)"
          strokeWidth="1.2"
        />
        <path
          className={styles.tentacle}
          d="M20 200 Q140 240 220 120 T380 200"
          fill="none"
          stroke="rgba(212,175,55,0.25)"
          strokeWidth="1"
        />
        <path
          className={styles.tentacle}
          d="M80 380 Q200 260 320 140"
          fill="none"
          stroke="rgba(255,215,0,0.15)"
          strokeWidth="0.8"
        />
        <circle cx="200" cy="190" r="3" fill="rgba(212,175,55,0.6)" className={styles.node} />
        <circle cx="320" cy="140" r="2" fill="rgba(255,215,0,0.5)" className={styles.node} />
        <circle cx="120" cy="260" r="2" fill="rgba(212,175,55,0.35)" className={styles.node} />
      </svg>
      <OctopusLoopVideo />
      <div className={styles.videoScrim} aria-hidden />
      <div className={styles.gridFloor} aria-hidden />
      <div className={styles.content}>
        <p className={styles.eyebrow}>HOOKO</p>
        <h1 className={styles.title}>
          Dados que
          <span className={styles.titleAccent}> pulsam</span>
        </h1>
        <p className={styles.sub}>{tagline}</p>
        <ul className={styles.pills}>
          <li className={styles.pill}>Gancho & narrativa</li>
          <li className={styles.pill}>Oferta & prova</li>
          <li className={styles.pill}>CTA & escala</li>
        </ul>
      </div>
    </div>
  );
}
