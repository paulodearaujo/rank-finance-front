import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

// Type aliases dos tipos existentes
type BlogArticlesMetrics = Tables<"blog_articles_metrics">;
type BlogClusterMetrics = Tables<"blog_cluster_metrics">;
// Small helpers to keep aggregation and deltas DRY
type Accumulator = {
  clicks: number;
  impressions: number;
  conversions: number;
  posWeighted: number;
};

function createAccum(): Accumulator {
  return { clicks: 0, impressions: 0, conversions: 0, posWeighted: 0 };
}

function splitWeeksSets(selectedWeeks?: string[]) {
  const weeksSorted = (selectedWeeks || []).slice().sort((a, b) => a.localeCompare(b));
  const middleIndex = Math.floor(weeksSorted.length / 2);
  return {
    early: new Set(weeksSorted.slice(0, middleIndex)),
    late: new Set(weeksSorted.slice(middleIndex)),
  } as const;
}


const BATCH_SIZE = 1000; // Limite de paginação do Supabase
const OUTLIER_CLUSTER_ID = -1; // ID especial para clusters outliers
const PERCENTAGE_MULTIPLIER = 100; // Conversor para porcentagem

// Tipo auxiliar para agregação - estende BlogArticlesMetrics com campos calculados
interface WeeklyAggregated extends Pick<BlogArticlesMetrics, "week_ending"> {
  gsc_clicks: number;
  gsc_impressions: number;
  amplitude_conversions: number;
  gsc_ctr: number;
  gsc_position: number;
  gsc_ctr_weighted: number;
  gsc_position_weighted: number;
  count: number;
}

export type WeeklyAggregateRow = Pick<
  WeeklyAggregated,
  "week_ending" | "gsc_clicks" | "gsc_impressions" | "amplitude_conversions" | "gsc_ctr" | "gsc_position"
>;

async function fetchArticleMetrics(
  selectedWeeks?: string[],
): Promise<BlogArticlesMetrics[]> {
  const supabase = await createClient();
  const allData: BlogArticlesMetrics[] = [];
  const batchSize = BATCH_SIZE;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("blog_articles_metrics")
      .select("*")
      .range(offset, offset + batchSize - 1)
      .order("week_ending", { ascending: true });

    if (selectedWeeks && selectedWeeks.length > 0) {
      query = query.in("week_ending", selectedWeeks);
    }

    const { data, error } = await query;
    if (error) break;
    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    allData.push(...data);
    if (data.length < batchSize) {
      hasMore = false;
    } else {
      offset += batchSize;
    }
  }

  return allData;
}

function aggregateWeekly(allData: BlogArticlesMetrics[]): WeeklyAggregateRow[] {
  const weekly = allData.reduce<Record<string, WeeklyAggregated>>((acc, item) => {
    const week = item.week_ending;
    if (!acc[week]) {
      acc[week] = {
        week_ending: week,
        gsc_clicks: 0,
        gsc_impressions: 0,
        amplitude_conversions: 0,
        gsc_ctr: 0,
        gsc_position: 0,
        gsc_ctr_weighted: 0,
        gsc_position_weighted: 0,
        count: 0,
      };
    }
    const w = acc[week];
    w.gsc_clicks += item.gsc_clicks || 0;
    w.gsc_impressions += item.gsc_impressions || 0;
    w.amplitude_conversions += item.amplitude_conversions || 0;
    w.gsc_ctr_weighted += (item.gsc_ctr || 0) * (item.gsc_impressions || 0);
    w.gsc_position_weighted += (item.gsc_position || 0) * (item.gsc_impressions || 0);
    w.count += 1;
    return acc;
  }, {});

  return Object.values(weekly).map((week) => ({
    week_ending: week.week_ending,
    gsc_clicks: week.gsc_clicks,
    gsc_impressions: week.gsc_impressions,
    amplitude_conversions: week.amplitude_conversions,
    gsc_ctr: week.gsc_impressions > 0 ? week.gsc_ctr_weighted / week.gsc_impressions : 0,
    gsc_position: week.gsc_impressions > 0 ? week.gsc_position_weighted / week.gsc_impressions : 0,
  }));
}

export async function getLatestRunId() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_clusters")
    .select("run_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // Silently handle error in production
    return null;
  }

  return data?.run_id;
}

export async function getRunMetadata(runId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_clusters")
    .select("run_id, created_at")
    .eq("run_id", runId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // Silently handle error in production
    return null;
  }

  return {
    runId: data?.run_id,
    createdAt: data?.created_at,
  };
}

export async function getClusterStats(runId: string) {
  const supabase = await createClient();

  // Get total clusters (excluding outliers)
  const { count: clusterCount } = await supabase
    .from("blog_clusters")
    .select("*", { count: "exact", head: true })
    .eq("run_id", runId)
    .gte("cluster_id", 0);

  // Get outliers count
  const { count: outlierCount } = await supabase
    .from("blog_clusters")
    .select("*", { count: "exact", head: true })
    .eq("run_id", runId)
    .eq("cluster_id", OUTLIER_CLUSTER_ID);

  // Get total articles
  const { count: totalCount } = await supabase
    .from("blog_clusters")
    .select("*", { count: "exact", head: true })
    .eq("run_id", runId);

  const outlierRate = totalCount ? (outlierCount || 0) / totalCount : 0;

  return {
    clusterCount: clusterCount || 0,
    outlierCount: outlierCount || 0,
    totalCount: totalCount || 0,
    outlierRate: outlierRate * PERCENTAGE_MULTIPLIER,
  };
}

export async function getClusterMetrics(runId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_cluster_metrics")
    .select("*")
    .eq("run_id", runId)
    .order("cluster_size", { ascending: false });

  if (error) {
    // Silently handle error in production
    return [];
  }

  return data || [];
}

export async function getAvailableWeeks() {
  const supabase = await createClient();

  // Fetch ALL records using pagination to bypass the 1000 row limit
  const uniqueWeeks = new Set<string>();
  const batchSize = BATCH_SIZE;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("blog_articles_metrics")
      .select("week_ending")
      .range(offset, offset + batchSize - 1)
      .order("week_ending", { ascending: true });

    if (error) {
      // Silently handle error in production
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    // Add weeks to the set
    data.forEach((item: { week_ending: string }) => {
      uniqueWeeks.add(item.week_ending);
    });

    // Check if we need to fetch more
    if (data.length < batchSize) {
      hasMore = false;
    } else {
      offset += batchSize;
    }
  }

  // Convert to array and sort in descending order (newest first)
  const weeksArray = Array.from(uniqueWeeks).sort((a, b) => b.localeCompare(a));

  // Found ${weeksArray.length} unique weeks
  return weeksArray;
}

export async function getWeeklyMetrics(selectedWeeks?: string[]) {
  const allData = await fetchArticleMetrics(selectedWeeks);
  return aggregateWeekly(allData);
}

export async function getClusterLeaderboard(runId: string, selectedWeeks?: string[]) {
  const supabase = await createClient();

  // Get cluster metrics
  const { data: clusterMetrics } = await supabase
    .from("blog_cluster_metrics")
    .select("*")
    .eq("run_id", runId);

  // Get clusters with their URLs (including outliers)
  const { data: clusters } = await supabase
    .from("blog_clusters")
    .select("cluster_id, cluster_name, url")
    .eq("run_id", runId);

  if (!clusters || !clusterMetrics) return [];

  const articleMetrics = await fetchArticleMetrics(selectedWeeks);

  // Prepare intra-period comparison buckets (early vs late)
  const { early: earlyWeeksSet, late: lateWeeksSet } = splitWeeksSets(selectedWeeks);

  // Group clusters and aggregate metrics
  const clusterMap = new Map<
    number,
    {
      cluster_id: number;
      cluster_name: string;
      cluster_size: number;
      cluster_coherence: number;
      cluster_density: number;
      avg_similarity: number;
      min_similarity: number;
      urls: string[];
      gsc_clicks: number;
      gsc_impressions: number;
      amplitude_conversions: number;
      _pos_weighted: number;
      _early: Accumulator;
      _late: Accumulator;
    }
  >();

  clusters.forEach((cluster: { cluster_id: number; cluster_name: string | null; url: string }) => {
    if (!clusterMap.has(cluster.cluster_id)) {
      const meta = clusterMetrics.find(
        (m: BlogClusterMetrics) => m.cluster_id === cluster.cluster_id,
      );
      clusterMap.set(cluster.cluster_id, {
        cluster_id: cluster.cluster_id,
        cluster_name:
          cluster.cluster_name ||
          (cluster.cluster_id === OUTLIER_CLUSTER_ID
            ? "Outliers"
            : `Cluster ${cluster.cluster_id}`),
        cluster_size: meta?.cluster_size || 0,
        cluster_coherence: meta?.cluster_coherence || 0,
        cluster_density: meta?.cluster_density || 0,
        avg_similarity: meta?.avg_similarity || 0,
        min_similarity: meta?.min_similarity || 0,
        urls: [],
        gsc_clicks: 0,
        gsc_impressions: 0,
        amplitude_conversions: 0,
        _pos_weighted: 0,
        // intra-period buckets
        _early: createAccum(),
        _late: createAccum(),
      });
    }
    const clusterData = clusterMap.get(cluster.cluster_id);
    if (clusterData) {
      clusterData.urls.push(cluster.url);
    }
  });

  const urlToClusterId = new Map<string, number>();
  clusters.forEach((c) => urlToClusterId.set(c.url, c.cluster_id));

  // Aggregate metrics by cluster
  for (const metric of articleMetrics) {
    const cid = metric.url ? urlToClusterId.get(metric.url) : undefined;
    if (cid === undefined) continue;
    const clusterData = clusterMap.get(cid);
    if (!clusterData) continue;
    clusterData.gsc_clicks += metric.gsc_clicks || 0;
    clusterData.gsc_impressions += metric.gsc_impressions || 0;
    clusterData.amplitude_conversions += metric.amplitude_conversions || 0;
    clusterData._pos_weighted += (metric.gsc_position || 0) * (metric.gsc_impressions || 0);

    // assign to early/late buckets
    const week = metric.week_ending as string;
    if (week && earlyWeeksSet.has(week)) {
      clusterData._early.clicks += metric.gsc_clicks || 0;
      clusterData._early.impressions += metric.gsc_impressions || 0;
      clusterData._early.conversions += metric.amplitude_conversions || 0;
      clusterData._early.posWeighted += (metric.gsc_position || 0) * (metric.gsc_impressions || 0);
    } else if (week && lateWeeksSet.has(week)) {
      clusterData._late.clicks += metric.gsc_clicks || 0;
      clusterData._late.impressions += metric.gsc_impressions || 0;
      clusterData._late.conversions += metric.amplitude_conversions || 0;
      clusterData._late.posWeighted += (metric.gsc_position || 0) * (metric.gsc_impressions || 0);
    }
  }

  // Calculate CTR and Position, and fix cluster_size for outliers
  const leaderboard = Array.from(clusterMap.values()).map((cluster) => {
    const gsc_ctr = cluster.gsc_impressions > 0 ? cluster.gsc_clicks / cluster.gsc_impressions : 0;
    const gsc_position =
      cluster.gsc_impressions > 0 ? cluster._pos_weighted / cluster.gsc_impressions : 0;

    // compute early/late derived metrics
    const earlyClicks = cluster._early.clicks;
    const lateClicks = cluster._late.clicks;
    const earlyImpr = cluster._early.impressions;
    const lateImpr = cluster._late.impressions;
    const earlyConv = cluster._early.conversions;
    const lateConv = cluster._late.conversions;
    const earlyPos = earlyImpr > 0 ? cluster._early.posWeighted / earlyImpr : 0;
    const latePos = lateImpr > 0 ? cluster._late.posWeighted / lateImpr : 0;

    const clicks_delta = lateClicks - earlyClicks;
    const clicks_delta_pct = earlyClicks > 0 ? clicks_delta / earlyClicks : 0;
    const impressions_delta = lateImpr - earlyImpr;
    const impressions_delta_pct = earlyImpr > 0 ? impressions_delta / earlyImpr : 0;
    const conversions_delta = lateConv - earlyConv;
    const conversions_delta_pct = earlyConv > 0 ? conversions_delta / earlyConv : 0;
    // position: positive delta means improvement (lower is better)
    const position_delta = earlyPos - latePos;
    const position_delta_pct = earlyPos > 0 ? position_delta / earlyPos : 0;

    return {
      ...cluster,
      cluster_size: cluster.cluster_size || (cluster.urls ? cluster.urls.length : 0),
      gsc_ctr,
      gsc_position,
      // deltas
      gsc_clicks_delta: clicks_delta,
      gsc_clicks_delta_pct: clicks_delta_pct,
      gsc_impressions_delta: impressions_delta,
      gsc_impressions_delta_pct: impressions_delta_pct,
      amplitude_conversions_delta: conversions_delta,
      amplitude_conversions_delta_pct: conversions_delta_pct,
      gsc_position_delta: position_delta,
      gsc_position_delta_pct: position_delta_pct,
    };
  });

  return leaderboard.sort((a, b) => b.gsc_clicks - a.gsc_clicks);
}

export async function getOutliers(runId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_clusters")
    .select(`
      *,
      blog_articles!inner(name, category)
    `)
    .eq("run_id", runId)
    .eq("cluster_id", OUTLIER_CLUSTER_ID);

  if (error) {
    // Silently handle error in production
    return [];
  }

  return data || [];
}

// Cluster detail helpers

/**
 * Retrieve cluster metadata and URL list for a given run and cluster.
 * Keeps reads simple and explicit to avoid hidden joins and surprises.
 */
export async function getClusterInfo(runId: string, clusterId: number) {
  const supabase = await createClient();

  // Read base cluster metrics (size, coherence, density...)
  const { data: metric, error: metricError } = await supabase
    .from("blog_cluster_metrics")
    .select("cluster_id, cluster_size, cluster_coherence, cluster_density, avg_similarity, min_similarity")
    .eq("run_id", runId)
    .eq("cluster_id", clusterId)
    .single();

  // Read cluster rows to obtain name/urls. Name is nullable and may vary per row; prefer first non-null.
  const { data: clusters, error: clustersError } = await supabase
    .from("blog_clusters")
    .select("cluster_id, cluster_name, url")
    .eq("run_id", runId)
    .eq("cluster_id", clusterId);

  if (metricError && !metric) {
    // Minimal fallback when metrics missing: still return URLs
    // Note: upstream should always provide metrics, but we stay defensive here.
  }
  if (clustersError && !clusters) {
    return null;
  }

  const urls = (clusters || []).map((c) => c.url);
  const clusterName = (clusters || []).find((c) => !!c.cluster_name)?.cluster_name;

  return {
    cluster_id: clusterId,
    cluster_name: clusterName || (clusterId === OUTLIER_CLUSTER_ID ? "Outliers" : `Cluster ${clusterId}`),
    cluster_size: metric?.cluster_size ?? urls.length,
    cluster_coherence: metric?.cluster_coherence ?? 0,
    cluster_density: metric?.cluster_density ?? 0,
    avg_similarity: metric?.avg_similarity ?? 0,
    min_similarity: metric?.min_similarity ?? 0,
    urls,
  };
}

/**
 * Aggregate weekly metrics for a single cluster over selected weeks.
 * CTR and position are weighted by impressions to avoid bias.
 */
export async function getClusterWeeklyMetrics(
  runId: string,
  clusterId: number,
  selectedWeeks?: string[],
) {
  const info = await getClusterInfo(runId, clusterId);
  const urlSet = new Set(info?.urls || []);
  if (urlSet.size === 0) return [] as Array<Pick<WeeklyAggregated, "week_ending" | "gsc_clicks" | "gsc_impressions" | "amplitude_conversions" | "gsc_ctr" | "gsc_position">>;
  const allData = await fetchArticleMetrics(selectedWeeks);
  const filtered = allData.filter((row) => row.url && urlSet.has(row.url));
  return aggregateWeekly(filtered);
}

export type ClusterUrlAggregates = {
  url: string;
  name?: string | null | undefined;
  gsc_clicks: number;
  gsc_impressions: number;
  amplitude_conversions: number;
  gsc_ctr: number; // weighted (clicks / impressions)
  gsc_position: number; // weighted by impressions
  // deltas (late vs early)
  gsc_clicks_delta?: number;
  gsc_clicks_delta_pct?: number;
  gsc_impressions_delta?: number;
  gsc_impressions_delta_pct?: number;
  amplitude_conversions_delta?: number;
  amplitude_conversions_delta_pct?: number;
  gsc_position_delta?: number; // improvement positive
  gsc_position_delta_pct?: number;
};

/**
 * Aggregate metrics per URL for a given cluster. Optionally filter by selected weeks.
 * Sorting and pagination are handled on the server to keep client simple.
 */
export async function getClusterUrlsMetrics(
  runId: string,
  clusterId: number,
  selectedWeeks?: string[],
  limit = 200,
  offset = 0,
) {
  const supabase = await createClient();
  const info = await getClusterInfo(runId, clusterId);
  const urls = info?.urls || [];
  const urlSet = new Set(urls);
  if (urlSet.size === 0) return [] as ClusterUrlAggregates[];
  const allData = await fetchArticleMetrics(selectedWeeks);
  const filtered = allData.filter((row) => row.url && urlSet.has(row.url));

  // Prepare early/late buckets
  const { early: earlyWeeksSet, late: lateWeeksSet } = splitWeeksSets(selectedWeeks);

  // Aggregate by URL
  const perUrl = filtered.reduce<Record<string, ClusterUrlAggregates & { _ctr_weighted: number; _pos_weighted: number }>>(
    (acc, item) => {
      const key = item.url;
      if (!acc[key]) {
        acc[key] = {
          url: key,
          name: null,
          gsc_clicks: 0,
          gsc_impressions: 0,
          amplitude_conversions: 0,
          gsc_ctr: 0,
          gsc_position: 0,
          _ctr_weighted: 0,
          _pos_weighted: 0,
          // deltas temp accumulators
          gsc_clicks_delta: 0,
          gsc_clicks_delta_pct: 0,
          gsc_impressions_delta: 0,
          gsc_impressions_delta_pct: 0,
          amplitude_conversions_delta: 0,
          amplitude_conversions_delta_pct: 0,
          gsc_position_delta: 0,
          gsc_position_delta_pct: 0,
        };
      }
      const u = acc[key];
      u.gsc_clicks += item.gsc_clicks || 0;
      u.gsc_impressions += item.gsc_impressions || 0;
      u.amplitude_conversions += item.amplitude_conversions || 0;
      u._ctr_weighted += (item.gsc_ctr || 0) * (item.gsc_impressions || 0);
      u._pos_weighted += (item.gsc_position || 0) * (item.gsc_impressions || 0);
      return acc;
    },
    {},
  );

  // Compute deltas per URL using early vs late buckets
  // Re-scan filtered data to accumulate early/late per URL
  const earlyAgg: Record<string, Accumulator> = {};
  const lateAgg: Record<string, Accumulator> = {};
  for (const item of filtered) {
    const key = item.url as string;
    if (!key) continue;
    const isEarly = item.week_ending && earlyWeeksSet.has(item.week_ending);
    const isLate = item.week_ending && lateWeeksSet.has(item.week_ending);
    let target: Accumulator | null = null;
    if (isEarly) {
      if (!earlyAgg[key]) earlyAgg[key] = createAccum();
      target = earlyAgg[key];
    } else if (isLate) {
      if (!lateAgg[key]) lateAgg[key] = createAccum();
      target = lateAgg[key];
    }
    if (!target) continue;
    target.clicks += item.gsc_clicks || 0;
    target.impressions += item.gsc_impressions || 0;
    target.conversions += item.amplitude_conversions || 0;
    target.posWeighted += (item.gsc_position || 0) * (item.gsc_impressions || 0);
  }

  let rows: ClusterUrlAggregates[] = Object.values(perUrl).map((u) => {
    const e = earlyAgg[u.url] || createAccum();
    const l = lateAgg[u.url] || createAccum();
    const posEarly = e.impressions > 0 ? e.posWeighted / e.impressions : 0;
    const posLate = l.impressions > 0 ? l.posWeighted / l.impressions : 0;
    return {
      url: u.url,
      name: u.name,
      gsc_clicks: u.gsc_clicks,
      gsc_impressions: u.gsc_impressions,
      amplitude_conversions: u.amplitude_conversions,
      gsc_ctr: u.gsc_impressions > 0 ? u._ctr_weighted / u.gsc_impressions : 0,
      gsc_position: u.gsc_impressions > 0 ? u._pos_weighted / u.gsc_impressions : 0,
      gsc_clicks_delta: l.clicks - e.clicks,
      gsc_clicks_delta_pct: e.clicks > 0 ? (l.clicks - e.clicks) / e.clicks : 0,
      gsc_impressions_delta: l.impressions - e.impressions,
      gsc_impressions_delta_pct: e.impressions > 0 ? (l.impressions - e.impressions) / e.impressions : 0,
      amplitude_conversions_delta: l.conversions - e.conversions,
      amplitude_conversions_delta_pct: e.conversions > 0 ? (l.conversions - e.conversions) / e.conversions : 0,
      gsc_position_delta: posEarly - posLate,
      gsc_position_delta_pct: posEarly > 0 ? (posEarly - posLate) / posEarly : 0,
    };
  });

  // Sort by clicks desc by default, then trim to page
  rows = rows.sort((a, b) => b.gsc_clicks - a.gsc_clicks).slice(offset, offset + limit);

  // Optional: enrich with article names if available
  const urlPage = rows.map((r) => r.url);
  if (urlPage.length > 0) {
    const { data: articles } = await supabase
      .from("blog_articles")
      .select("url, name")
      .in("url", urlPage);
    const nameMap = new Map<string, string | null>();
    (articles || []).forEach((a) => nameMap.set(a.url, a.name));
    rows = rows.map((r) => ({ ...r, name: nameMap.get(r.url) ?? r.name }));
  }

  return rows;
}
