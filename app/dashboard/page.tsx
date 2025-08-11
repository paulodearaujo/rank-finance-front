import { HistogramChart, type HistogramPoint } from "@/components/dashboard/histogram-chart";
import {
  SeriesChart,
  type WeeklyPoint as WeeklyPointChart,
} from "@/components/dashboard/series-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Suspense } from "react";

type WeeklyPoint = {
  week: string;
  clicks: number;
  conversions: number;
  impressions: number;
  ctr: number;
  position: number;
};

type ClusterMetric = {
  cluster_id: number;
  cluster_size: number;
  cluster_coherence: number | null;
  cluster_density: number | null;
  avg_similarity: number | null;
  min_similarity: number | null;
  pillar_candidate_url: string | null;
};

function formatPercent(value: number | null | undefined) {
  if (!value && value !== 0) return "–";
  return `${(value * 100).toFixed(1)}%`;
}

function median(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (filtered.length === 0) return null;
  const sorted = [...filtered].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const left = sorted[mid - 1];
    const right = sorted[mid];
    if (left === undefined || right === undefined) return null;
    return (left + right) / 2;
  }
  const center = sorted[mid];
  return center ?? null;
}

function startOfYearISO() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return d.toISOString().slice(0, 10);
}

async function getLatestRunId() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("blog_clusters")
    .select("run_id, created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) return null;
  return data?.[0]?.run_id ?? null;
}

async function getClusterMetrics(runId: string): Promise<ClusterMetric[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("blog_cluster_metrics")
    .select(
      "cluster_id, cluster_size, cluster_coherence, cluster_density, avg_similarity, min_similarity, pillar_candidate_url",
    )
    .eq("run_id", runId)
    .order("cluster_size", { ascending: false });
  if (error || !data) return [];
  return data as unknown as ClusterMetric[];
}

async function getClusterSizesFromClusters(
  runId: string,
): Promise<Array<{ cluster_id: number; cluster_size: number }>> {
  const supabase = await createServerSupabase();
  // Fetch all rows for the run and aggregate sizes client-side to include clusters with no metrics (e.g., -1)
  const { data, error } = await supabase
    .from("blog_clusters")
    .select("cluster_id")
    .eq("run_id", runId);
  if (error || !data) return [];
  const sizeMap = new Map<number, number>();
  for (const row of data as { cluster_id: number }[]) {
    const id = row.cluster_id;
    sizeMap.set(id, (sizeMap.get(id) ?? 0) + 1);
  }
  return Array.from(sizeMap.entries()).map(([cluster_id, cluster_size]) => ({
    cluster_id,
    cluster_size,
  }));
}

async function getOutlierStats(runId: string) {
  const supabase = await createServerSupabase();
  const [{ count: total }, { count: outliers }] = await Promise.all([
    supabase.from("blog_clusters").select("id", { count: "exact", head: true }).eq("run_id", runId),
    supabase
      .from("blog_clusters")
      .select("id", { count: "exact", head: true })
      .eq("run_id", runId)
      .eq("cluster_id", -1),
  ]);
  const totalCount = total ?? 0;
  const outlierCount = outliers ?? 0;
  return {
    totalCount,
    outlierCount,
    outlierRate: totalCount > 0 ? outlierCount / totalCount : 0,
  };
}

async function getWeeklySeriesYTD(): Promise<WeeklyPoint[]> {
  const supabase = await createServerSupabase();
  const fromISO = startOfYearISO();
  const { data, error } = await supabase
    .from("blog_articles_metrics")
    .select(
      "week_ending, gsc_clicks, amplitude_conversions, gsc_impressions, gsc_ctr, gsc_position",
    )
    .gte("week_ending", fromISO)
    .order("week_ending", { ascending: true });
  if (error || !data) return [];

  const grouped = new Map<string, WeeklyPoint>();
  for (const row of data as {
    week_ending: string;
    gsc_clicks: number | null;
    amplitude_conversions: number | null;
    gsc_impressions: number | null;
    gsc_ctr: number | null;
    gsc_position: number | null;
  }[]) {
    const key = row.week_ending;
    const prev = grouped.get(key) || {
      week: key,
      clicks: 0,
      conversions: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };
    const clicks = prev.clicks + (row.gsc_clicks ?? 0);
    const conversions = prev.conversions + (row.amplitude_conversions ?? 0);
    const impressions = prev.impressions + (row.gsc_impressions ?? 0);
    // For CTR/Position, compute simple average across rows for now.
    // TODO: Replace with weighted averages by impressions once available server-side.
    const ctr = (prev.ctr + (row.gsc_ctr ?? 0)) / 2;
    const position = (prev.position + (row.gsc_position ?? 0)) / 2;
    grouped.set(key, { week: key, clicks, conversions, impressions, ctr, position });
  }
  return Array.from(grouped.values());
}

function buildHistogram(values: number[]) {
  const bins = [
    { label: "1", min: 1, max: 1 },
    { label: "2–5", min: 2, max: 5 },
    { label: "6–10", min: 6, max: 10 },
    { label: "11–20", min: 11, max: 20 },
    { label: "21–50", min: 21, max: 50 },
    { label: "50+", min: 51, max: Number.POSITIVE_INFINITY },
  ];
  return bins.map((b) => ({
    bucket: b.label,
    count: values.filter((v) => v >= b.min && v <= b.max).length,
  }));
}

async function DashboardContent() {
  const latestRunId = await getLatestRunId();
  if (!latestRunId) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sem dados</CardTitle>
          </CardHeader>
          <CardContent>
            Configure o ambiente do Supabase e aplique as migrations. Em seguida, recarregue.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [metrics, sizesOnly, series, outliers] = await Promise.all([
    getClusterMetrics(latestRunId),
    getClusterSizesFromClusters(latestRunId),
    getWeeklySeriesYTD(),
    getOutlierStats(latestRunId),
  ]);

  // Merge sizes (clusters table) with metrics to ensure clusters without metrics (e.g., -1) appear
  const metricsById = new Map<number, ClusterMetric>();
  for (const m of metrics) metricsById.set(m.cluster_id, m);
  const merged: ClusterMetric[] = sizesOnly.map(({ cluster_id, cluster_size }) => {
    const m = metricsById.get(cluster_id);
    return m
      ? { ...m, cluster_size }
      : {
          cluster_id,
          cluster_size,
          cluster_coherence: null,
          cluster_density: null,
          avg_similarity: null,
          min_similarity: null,
          pillar_candidate_url: null,
        };
  });

  const clusterCount = merged.length; // inclui -1 como um cluster
  const sizes = merged.map((m) => m.cluster_size ?? 0);
  const hist = buildHistogram(sizes) as HistogramPoint[];
  const coherenceMedian = median(merged.map((m) => m.cluster_coherence));
  const densityMedian = median(merged.map((m) => m.cluster_density));

  const topClusters = [...merged].sort((a, b) => b.cluster_size - a.cluster_size).slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <span className="text-sm text-muted-foreground">Run: {latestRunId}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{clusterCount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outliers (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatPercent(outliers.outlierRate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Median Coherence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {coherenceMedian !== null ? coherenceMedian.toFixed(2) : "–"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Median Density</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {densityMedian !== null ? densityMedian.toFixed(2) : "–"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Series YTD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Séries semanais (YTD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <SeriesChart data={series as WeeklyPointChart[]} className="h-full" />
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leaderboard de Clusters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cluster</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Coherence</TableHead>
                  <TableHead className="text-right">Density</TableHead>
                  <TableHead className="text-right">Avg Similarity</TableHead>
                  <TableHead className="text-right">Min Similarity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClusters.map((c) => (
                  <TableRow key={c.cluster_id}>
                    <TableCell className="font-medium">{c.cluster_id}</TableCell>
                    <TableCell className="text-right">{c.cluster_size}</TableCell>
                    <TableCell className="text-right">
                      {c.cluster_coherence === null ? "–" : c.cluster_coherence.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.cluster_density === null ? "–" : c.cluster_density.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.avg_similarity === null ? "–" : c.avg_similarity.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.min_similarity === null ? "–" : c.min_similarity.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Histogram (sizes) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de Tamanhos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <HistogramChart data={hist} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <main className="container mx-auto max-w-6xl p-6">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando…</div>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}
