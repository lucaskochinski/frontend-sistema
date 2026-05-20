import styles from "./Skeleton.module.css";

/**
 * Faixa única tipo shimmer (admin / mock loaders).
 * @param {{ height?: number | string, width?: number | string, rounded?: number, className?: string, style?: React.CSSProperties }} props
 */
export default function Skeleton({ height = 14, width = "100%", rounded = 8, className = "", style = {} }) {
  return (
    <span
      className={`${styles.root} ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
        borderRadius: rounded,
        ...style,
      }}
      aria-hidden
    />
  );
}

/** Esqueleto da dashboard admin (3 KPIs + bloco de gráfico). */
export function AdminDashboardSkeleton() {
  return (
    <div>
      <div className={styles.grid3}>
        {[1, 2, 3].map((k) => (
          <div key={k} className={styles.card}>
            <Skeleton height={10} width="42%" rounded={4} />
            <Skeleton height={28} width="68%" rounded={8} style={{ marginTop: "0.65rem" }} />
          </div>
        ))}
      </div>
      <div className={styles.chart}>
        <Skeleton height={12} width="30%" rounded={4} />
        <Skeleton height={220} width="100%" rounded={12} style={{ marginTop: "1rem" }} />
      </div>
    </div>
  );
}

/** Esqueleto genérico para tabelas. */
export function TableSkeleton({ rows = 6 }) {
  return (
    <div className={styles.tableSkeleton}>
      <Skeleton height={14} width="100%" rounded={6} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.row}>
          <Skeleton height={12} width="22%" rounded={4} />
          <Skeleton height={12} width="18%" rounded={4} />
          <Skeleton height={12} width="14%" rounded={4} />
          <Skeleton height={12} width="28%" rounded={4} />
        </div>
      ))}
    </div>
  );
}
