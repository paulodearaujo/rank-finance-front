import { AppSidebar } from "@/components/app-sidebar";
import { SectionCards } from "@/components/section-cards";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getAvailableWeeks,
  getClusterLeaderboard,
  getLatestRunId,
  getRunMetadata,
  getWeeklyMetrics,
} from "@/lib/data/metrics-queries";
import type { Tables } from "@/lib/database.types";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { DashboardWrapper } from "./dashboard-wrapper";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visualize clusters, métricas semanais e ranking de conteúdo.",
  alternates: { canonical: "/dashboard" },
};

const CARD_SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4"] as const;

const WeeklyMetricsChart = dynamic(() =>
  import("@/components/weekly-metrics-chart.client").then((m) => ({ default: m.default })),
);

const ClusterLeaderboardTable = dynamic(
  () =>
    import("./components/cluster-leaderboard-table").then((m) => ({
      default: m.ClusterLeaderboardTable,
    })),
  {
    loading: () => (
      <div className="px-4 lg:px-6">
        <div className="h-64 w-full rounded-lg border animate-pulse" />
      </div>
    ),
  },
);

interface PageProps {
  searchParams: Promise<{ weeks?: string; week?: string }>;
}

// Usando tipo do banco de dados
type WeeklyMetric = Partial<Tables<"blog_articles_metrics">>;

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  // Get latest run
  const runId = await getLatestRunId();

  if (!runId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Nenhum run de clustering encontrado.</p>
      </div>
    );
  }

  // Get run metadata
  const runMetadata = await getRunMetadata(runId);

  // Format date on server to avoid hydration mismatch
  const formattedClusterDate = runMetadata?.createdAt
    ? new Date(runMetadata.createdAt).toISOString()
    : null;

  // Get available weeks
  const availableWeeks = await getAvailableWeeks();

  // Determine the selected weeks (from query param or ALL weeks by default)
  let selectedWeeks: string[] = [];

  if (params.weeks) {
    selectedWeeks = params.weeks.split(",").filter((w) => availableWeeks.includes(w));
  } else if (params.week) {
    // Backwards compatibility with single week param
    selectedWeeks = [params.week].filter((w) => availableWeeks.includes(w));
  } else {
    // Default to ALL weeks if no param specified
    selectedWeeks = availableWeeks as string[];
  }
  // Weeks already selected and validated above; no explicit min/max needed

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <DashboardWrapper availableWeeks={availableWeeks as string[]} currentWeeks={selectedWeeks}>
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Suspense
                fallback={
                  <div className="px-4 lg:px-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {CARD_SKELETON_KEYS.map((key) => (
                        <div key={key} className="rounded-lg border p-4">
                          <div className="h-4 w-24 mb-2 bg-muted animate-pulse rounded" />
                          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                }
              >
                {/* Cards stream separately */}
                <CardsSection selectedWeeks={selectedWeeks} />
              </Suspense>

              <Suspense
                fallback={
                  <div className="px-4 lg:px-6 space-y-4">
                    <div className="h-[250px] w-full rounded-lg bg-muted animate-pulse" />
                    <div className="h-64 w-full rounded-lg border animate-pulse" />
                  </div>
                }
              >
                <ChartAndTable
                  runId={runId}
                  selectedWeeks={selectedWeeks}
                  clusterCreatedAt={formattedClusterDate}
                />
              </Suspense>
            </div>
          </div>
        </DashboardWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function CardsSection({ selectedWeeks }: { selectedWeeks: string[] }) {
  const weeklyMetrics = await getWeeklyMetrics(selectedWeeks);

  const weeksSorted = [...selectedWeeks].sort((a, b) => a.localeCompare(b));
  const mid = Math.floor(weeksSorted.length / 2);
  const earlySet = new Set(weeksSorted.slice(0, mid));
  const lateSet = new Set(weeksSorted.slice(mid));

  const earlyTotals = (weeklyMetrics as WeeklyMetric[]).reduce(
    (acc, w) => {
      if (!w.week_ending || !earlySet.has(w.week_ending)) return acc;
      const impr = w.gsc_impressions || 0;
      const pos = w.gsc_position || 0;
      acc.impressions += impr;
      acc.clicks += w.gsc_clicks || 0;
      acc.conversions += w.amplitude_conversions || 0;
      acc._posWeighted += pos * impr;
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0, _posWeighted: 0 },
  );
  const lateTotals = (weeklyMetrics as WeeklyMetric[]).reduce(
    (acc, w) => {
      if (!w.week_ending || !lateSet.has(w.week_ending)) return acc;
      const impr = w.gsc_impressions || 0;
      const pos = w.gsc_position || 0;
      acc.impressions += impr;
      acc.clicks += w.gsc_clicks || 0;
      acc.conversions += w.amplitude_conversions || 0;
      acc._posWeighted += pos * impr;
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0, _posWeighted: 0 },
  );
  const earlyPosition =
    earlyTotals.impressions > 0 ? earlyTotals._posWeighted / earlyTotals.impressions : 0;
  const latePosition =
    lateTotals.impressions > 0 ? lateTotals._posWeighted / lateTotals.impressions : 0;

  const allTimeImpressions = (weeklyMetrics as WeeklyMetric[]).reduce(
    (sum, week) => sum + (week.gsc_impressions || 0),
    0,
  );
  const allTimeClicks = (weeklyMetrics as WeeklyMetric[]).reduce(
    (sum, week) => sum + (week.gsc_clicks || 0),
    0,
  );
  const allTimeConversions = (weeklyMetrics as WeeklyMetric[]).reduce(
    (sum, week) => sum + (week.amplitude_conversions || 0),
    0,
  );

  const averages =
    (weeklyMetrics as WeeklyMetric[]).length > 0
      ? {
          impressions: allTimeImpressions / weeklyMetrics.length,
          clicks: allTimeClicks / weeklyMetrics.length,
          position:
            allTimeImpressions > 0
              ? (weeklyMetrics as WeeklyMetric[]).reduce(
                  (acc, w) => acc + (w.gsc_position || 0) * (w.gsc_impressions || 0),
                  0,
                ) / allTimeImpressions
              : 0,
          conversions: allTimeConversions / weeklyMetrics.length,
        }
      : undefined;

  const metricsData = {
    impressions: allTimeImpressions,
    clicks: allTimeClicks,
    position: allTimeImpressions > 0 
      ? (weeklyMetrics as WeeklyMetric[]).reduce(
          (acc, w) => acc + (w.gsc_position || 0) * (w.gsc_impressions || 0),
          0,
        ) / allTimeImpressions
      : 0,
    conversions: allTimeConversions,
    previousPeriod: {
      impressions: earlyTotals.impressions,
      clicks: earlyTotals.clicks,
      conversions: earlyTotals.conversions,
      position: earlyPosition,
    },
    averages: averages || undefined,
  };
  return <SectionCards metrics={metricsData} />;
}

async function ChartAndTable({
  runId,
  selectedWeeks,
  clusterCreatedAt,
}: {
  runId: string;
  selectedWeeks: string[];
  clusterCreatedAt: string | null;
}) {
  const [weeklyMetrics, clusterLeaderboard] = await Promise.all([
    getWeeklyMetrics(selectedWeeks),
    getClusterLeaderboard(runId, selectedWeeks),
  ]);

  return (
    <>
      <div className="px-4 lg:px-6">
        <WeeklyMetricsChart data={weeklyMetrics} selectedWeeks={selectedWeeks} />
      </div>
      <ClusterLeaderboardTable
        data={clusterLeaderboard}
        clusterCreatedAt={clusterCreatedAt}
        selectedWeeks={selectedWeeks}
      />
    </>
  );
}
