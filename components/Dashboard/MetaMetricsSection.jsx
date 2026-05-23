"use client";

import MetaMetricsPanel from "@/components/MetaMetrics/MetaMetricsPanel";
import DashboardCard from "./DashboardCard";
import { CHART_DATA_SOURCES, DATA_SOURCE } from "./metaDataSources";

export default function MetaMetricsSection({ overview }) {
  if (!overview) return null;

  return (
    <DashboardCard
      title="Métricas Meta completas"
      source={DATA_SOURCE.META}
      sourceNote={CHART_DATA_SOURCES.metaMetricsPanel.note}
    >
      <MetaMetricsPanel
        delivery={overview.delivery}
        videoMetrics={overview.videoMetrics}
        videoRetention={overview.videoRetention}
        videoPlayCurve={overview.videoPlayCurve}
        creativeHealth={overview.creativeHealth}
        compact
      />
    </DashboardCard>
  );
}
