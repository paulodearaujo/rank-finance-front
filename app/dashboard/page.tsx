import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getAvailableWeeks,
  getClusterLeaderboard,
  getLatestRunId,
  getRunMetadata,
  getWeeklyMetrics,
} from "@/lib/data/metrics-queries";
import type { Tables } from "@/lib/database.types";
import { ChartAreaInteractive, DataTable, SectionCards, SiteHeader } from "./components";

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
    ? new Date(runMetadata.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
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

  // Fetch all data in parallel
  const [weeklyMetrics, clusterLeaderboard] = await Promise.all([
    getWeeklyMetrics(selectedWeeks),
    getClusterLeaderboard(runId, selectedWeeks),
  ]);

  // Split selected weeks into early/late and aggregate for cards deltas
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

  // Calculate averages for all available data
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

  // Prepare metrics object for SectionCards
  const metricsData = {
    impressions: lateTotals.impressions,
    clicks: lateTotals.clicks,
    position: latePosition,
    conversions: lateTotals.conversions,
    previousPeriod: {
      impressions: earlyTotals.impressions,
      clicks: earlyTotals.clicks,
      conversions: earlyTotals.conversions,
      position: earlyPosition,
    },
    averages: averages || undefined,
  };

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
        <SiteHeader availableWeeks={availableWeeks as string[]} currentWeeks={selectedWeeks} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards metrics={metricsData} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={weeklyMetrics} selectedWeeks={selectedWeeks} />
              </div>
              <DataTable
                data={clusterLeaderboard}
                clusterCreatedAt={formattedClusterDate}
                selectedWeeks={selectedWeeks}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
