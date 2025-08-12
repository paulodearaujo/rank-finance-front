"use client";

import type { Tables } from "@/lib/database.types";
import dynamic from "next/dynamic";

type WeeklyMetric = Partial<Tables<"blog_articles_metrics">>;

export interface WeeklyMetricsChartClientProps {
  data?: WeeklyMetric[];
  selectedWeeks?: string[];
}

const Inner = dynamic(
  () =>
    import("@/components/weekly-metrics-chart").then((m) => ({
      default: m.WeeklyMetricsChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="px-4 lg:px-6">
        <div className="h-[220px] sm:h-[250px] w-full rounded-lg bg-muted animate-pulse" />
      </div>
    ),
  },
);

export default function WeeklyMetricsChartClient(props: WeeklyMetricsChartClientProps) {
  return <Inner {...props} />;
}

