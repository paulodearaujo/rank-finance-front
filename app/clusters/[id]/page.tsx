import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getAvailableWeeks,
  getClusterInfo,
  getClusterUrlsMetrics,
  getClusterWeeklyMetrics,
  getLatestRunId,
  getRunMetadata,
} from "@/lib/data/metrics-queries";
import type { Tables } from "@/lib/database.types";
import { ChartAreaInteractive, SectionCards, SiteHeader } from "../../dashboard/components";
import { ClusterHeader } from "../components/cluster-header";
import { ClusterUrlsTable } from "../components/urls-table";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ weeks?: string }>;
}

type WeeklyMetric = Partial<Tables<"blog_articles_metrics">>;

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { weeks } = await searchParams;

  const runId = await getLatestRunId();
  if (!runId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Nenhum run de clustering encontrado.</p>
      </div>
    );
  }

  const runMetadata = await getRunMetadata(runId);
  const formattedClusterDate = runMetadata?.createdAt
    ? new Date(runMetadata.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const availableWeeks = await getAvailableWeeks();
  const selectedWeeks = weeks
    ? weeks.split(",").filter((w) => availableWeeks.includes(w))
    : (availableWeeks as string[]);

  const clusterId = Number.parseInt(id, 10);
  const [info, weekly, urls] = await Promise.all([
    getClusterInfo(runId, clusterId),
    getClusterWeeklyMetrics(runId, clusterId, selectedWeeks),
    getClusterUrlsMetrics(runId, clusterId, selectedWeeks, 200, 0),
  ]);

  // Aggregate totals for KPIs
  const totals = weekly.reduce(
    (acc, w: WeeklyMetric) => {
      acc.impressions += w.gsc_impressions || 0;
      acc.clicks += w.gsc_clicks || 0;
      acc.conversions += w.amplitude_conversions || 0;
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0 },
  );
  // Weighted average position for KPIs
  const [sumWeightedPos, sumImpr] = weekly.reduce(
    (acc, w) => {
      const impressions = w.gsc_impressions || 0;
      const pos = w.gsc_position || 0;
      acc[0] += pos * impressions;
      acc[1] += impressions;
      return acc;
    },
    [0, 0] as [number, number],
  );
  const position = sumImpr > 0 ? sumWeightedPos / sumImpr : 0;

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
        <SiteHeader
          availableWeeks={availableWeeks as string[]}
          currentWeeks={selectedWeeks}
          basePath={`/clusters/${id}`}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <ClusterHeader
                name={info?.cluster_name || `Cluster ${id}`}
                meta={{
                  id: clusterId,
                  size: info?.cluster_size || 0,
                  coherence: info?.cluster_coherence || 0,
                  density: info?.cluster_density || 0,
                  avgSimilarity: info?.avg_similarity || 0,
                  minSimilarity: info?.min_similarity || 0,
                  runDate: formattedClusterDate || undefined,
                }}
                backHref={`/dashboard${selectedWeeks.length ? `?weeks=${selectedWeeks.join(",")}` : ""}`}
              />
              <SectionCards
                metrics={{
                  impressions: totals.impressions,
                  clicks: totals.clicks,
                  conversions: totals.conversions,
                  position,
                }}
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={weekly} selectedWeeks={selectedWeeks} />
              </div>
              <ClusterUrlsTable data={urls} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
