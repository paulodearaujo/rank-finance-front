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
import dynamic from "next/dynamic";
import { Suspense } from "react";
const CARD_SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4"] as const;
import { SectionCards, SiteHeader } from "../../dashboard/components";
import { ClusterHeader } from "../components/cluster-header";

const ChartAreaInteractive = dynamic(
  () =>
    import("../../dashboard/components/chart-area-interactive").then((m) => ({
      default: m.ChartAreaInteractive,
    })),
  {
    ssr: true,
    loading: () => (
      <div className="px-4 lg:px-6">
        <div className="h-[220px] sm:h-[250px] w-full rounded-lg bg-muted animate-pulse" />
      </div>
    ),
  },
);

const ClusterUrlsTable = dynamic(
  () => import("../components/urls-table").then((m) => ({ default: m.ClusterUrlsTable })),
  {
    ssr: true,
    loading: () => (
      <div className="px-4 lg:px-6">
        <div className="h-64 w-full rounded-lg border animate-pulse" />
      </div>
    ),
  },
);

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
  const [info] = await Promise.all([getClusterInfo(runId, clusterId)]);

  // Aggregate totals for KPIs will stream below

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
              <Suspense
                fallback={
                  <div className="px-4 lg:px-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {CARD_SKELETON_KEYS.map((key) => (
                      <div key={key} className="rounded-lg border p-4">
                        <div className="h-4 w-24 mb-2 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                }
              >
                <CardsSection clusterId={clusterId} selectedWeeks={selectedWeeks} />
              </Suspense>

              <Suspense
                fallback={
                  <div className="px-4 lg:px-6 space-y-4">
                    <div className="h-[250px] w-full rounded-lg bg-muted animate-pulse" />
                    <div className="h-64 w-full rounded-lg border animate-pulse" />
                  </div>
                }
              >
                <ChartAndUrls clusterId={clusterId} selectedWeeks={selectedWeeks} />
              </Suspense>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function CardsSection({
  clusterId,
  selectedWeeks,
}: {
  clusterId: number;
  selectedWeeks: string[];
}) {
  const runId = await getLatestRunId();
  if (!runId) return null;
  const weekly = await getClusterWeeklyMetrics(runId, clusterId, selectedWeeks);
  const totals = weekly.reduce(
    (acc, w: WeeklyMetric) => {
      acc.impressions += w.gsc_impressions || 0;
      acc.clicks += w.gsc_clicks || 0;
      acc.conversions += w.amplitude_conversions || 0;
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0 },
  );
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
    <SectionCards
      metrics={{
        impressions: totals.impressions,
        clicks: totals.clicks,
        conversions: totals.conversions,
        position,
      }}
    />
  );
}

async function ChartAndUrls({
  clusterId,
  selectedWeeks,
}: {
  clusterId: number;
  selectedWeeks: string[];
}) {
  const runId = await getLatestRunId();
  if (!runId) return null;
  const [weekly, urls] = await Promise.all([
    getClusterWeeklyMetrics(runId, clusterId, selectedWeeks),
    getClusterUrlsMetrics(runId, clusterId, selectedWeeks, 200, 0),
  ]);

  return (
    <>
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={weekly} selectedWeeks={selectedWeeks} />
      </div>
      <ClusterUrlsTable data={urls} />
    </>
  );
}
