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

  // Calculate date range based on selected weeks
  const sortedWeeks = [...selectedWeeks].sort();
  const earliestWeek = sortedWeeks[0];
  const latestWeek = sortedWeeks[sortedWeeks.length - 1];

  // Fetch all data in parallel
  const [weeklyMetrics, clusterLeaderboard] = await Promise.all([
    getWeeklyMetrics(undefined, undefined, selectedWeeks), // Pass selected weeks for filtering
    getClusterLeaderboard(runId, earliestWeek, latestWeek, selectedWeeks), // Filter leaderboard by selected weeks
  ]);

  // Calculate weekly changes (comparing last two weeks of selected period)
  const sortedMetrics = [...(weeklyMetrics as WeeklyMetric[])]
    .filter((item) => item.week_ending) // Ensure week_ending exists
    .sort((a, b) => {
      const dateA = a.week_ending ? new Date(a.week_ending).getTime() : 0;
      const dateB = b.week_ending ? new Date(b.week_ending).getTime() : 0;
      return dateA - dateB;
    });
  const previousWeek = sortedMetrics[sortedMetrics.length - 2];

  // Calculate totals for selected weeks
  const totalImpressions = (weeklyMetrics as WeeklyMetric[]).reduce(
    (sum, week) => sum + (week.gsc_impressions || 0),
    0,
  );
  const totalClicks = (weeklyMetrics as WeeklyMetric[]).reduce(
    (sum, week) => sum + (week.gsc_clicks || 0),
    0,
  );
  const totalConversions = (weeklyMetrics as WeeklyMetric[]).reduce(
    (sum, week) => sum + (week.amplitude_conversions || 0),
    0,
  );

  // Calculate weighted CTR for the period
  const totalCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  // Calculate previous period totals (if we have enough data)
  let previousPeriodMetrics = null;
  if (previousWeek) {
    const previousPeriodWeeks = sortedMetrics.slice(
      Math.max(0, sortedMetrics.length - selectedWeeks.length * 2),
      sortedMetrics.length - selectedWeeks.length,
    );

    if (previousPeriodWeeks.length > 0) {
      const prevImpressions = previousPeriodWeeks.reduce(
        (sum, week) => sum + (week.gsc_impressions || 0),
        0,
      );
      const prevClicks = previousPeriodWeeks.reduce((sum, week) => sum + (week.gsc_clicks || 0), 0);
      const prevConversions = previousPeriodWeeks.reduce(
        (sum, week) => sum + (week.amplitude_conversions || 0),
        0,
      );

      previousPeriodMetrics = {
        impressions: prevImpressions,
        clicks: prevClicks,
        ctr: prevImpressions > 0 ? prevClicks / prevImpressions : 0,
        conversions: prevConversions,
      };
    }
  }

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
          ctr: allTimeImpressions > 0 ? allTimeClicks / allTimeImpressions : 0,
          conversions: allTimeConversions / weeklyMetrics.length,
        }
      : undefined;

  // Prepare metrics object for SectionCards
  const metricsData = {
    impressions: totalImpressions,
    clicks: totalClicks,
    ctr: totalCTR,
    conversions: totalConversions,
    previousPeriod: previousPeriodMetrics || undefined,
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
              <DataTable data={clusterLeaderboard} clusterCreatedAt={formattedClusterDate} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
