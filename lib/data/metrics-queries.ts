import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

// Type aliases dos tipos existentes
type BlogArticlesMetrics = Tables<"blog_articles_metrics">;
type BlogClusterMetrics = Tables<"blog_cluster_metrics">;

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

export async function getWeeklyMetrics(
  startDate?: string,
  endDate?: string,
  selectedWeeks?: string[],
) {
  const supabase = await createClient();

  // Fetch data in batches to handle large datasets
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

    // Apply filters
    if (selectedWeeks && selectedWeeks.length > 0) {
      query = query.in("week_ending", selectedWeeks);
    } else {
      if (startDate) {
        query = query.gte("week_ending", startDate);
      }
      if (endDate) {
        query = query.lte("week_ending", endDate);
      }
    }

    const { data, error } = await query;

    if (error) {
      // Silently handle error in production
      break;
    }

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

  // Aggregate by week
  const weeklyData =
    allData.reduce<Record<string, WeeklyAggregated>>((acc, item) => {
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

      const weekData = acc[week];
      weekData.gsc_clicks += item.gsc_clicks || 0;
      weekData.gsc_impressions += item.gsc_impressions || 0;
      weekData.amplitude_conversions += item.amplitude_conversions || 0;
      weekData.gsc_ctr_weighted += (item.gsc_ctr || 0) * (item.gsc_impressions || 0);
      weekData.gsc_position_weighted += (item.gsc_position || 0) * (item.gsc_impressions || 0);
      weekData.count += 1;

      return acc;
    }, {}) || {};

  // Calculate weighted averages
  return Object.values(weeklyData).map((week) => ({
    week_ending: week.week_ending,
    gsc_clicks: week.gsc_clicks,
    gsc_impressions: week.gsc_impressions,
    amplitude_conversions: week.amplitude_conversions,
    gsc_ctr: week.gsc_impressions > 0 ? week.gsc_ctr_weighted / week.gsc_impressions : 0,
    gsc_position: week.gsc_impressions > 0 ? week.gsc_position_weighted / week.gsc_impressions : 0,
  }));
}

export async function getClusterLeaderboard(
  runId: string,
  startDate?: string,
  endDate?: string,
  selectedWeeks?: string[],
) {
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

  // Get article metrics for the period using pagination
  const allMetrics: BlogArticlesMetrics[] = [];
  const batchSize = BATCH_SIZE;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let metricsQuery = supabase
      .from("blog_articles_metrics")
      .select("*")
      .range(offset, offset + batchSize - 1);

    if (selectedWeeks && selectedWeeks.length > 0) {
      // Filter by selected weeks
      metricsQuery = metricsQuery.in("week_ending", selectedWeeks);
    } else {
      // Use date range
      if (startDate) {
        metricsQuery = metricsQuery.gte("week_ending", startDate);
      }

      if (endDate) {
        metricsQuery = metricsQuery.lte("week_ending", endDate);
      }
    }

    const { data, error } = await metricsQuery;

    if (error) {
      // Silently handle error in production
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    allMetrics.push(...data);

    if (data.length < batchSize) {
      hasMore = false;
    } else {
      offset += batchSize;
    }
  }

  const articleMetrics = allMetrics;

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
      });
    }
    const clusterData = clusterMap.get(cluster.cluster_id);
    if (clusterData) {
      clusterData.urls.push(cluster.url);
    }
  });

  // Aggregate metrics by cluster
  articleMetrics?.forEach((metric: BlogArticlesMetrics) => {
    const cluster = clusters.find(
      (c: { cluster_id: number; cluster_name: string | null; url: string }) => c.url === metric.url,
    );
    if (cluster && clusterMap.has(cluster.cluster_id)) {
      const clusterData = clusterMap.get(cluster.cluster_id);
      if (clusterData) {
        clusterData.gsc_clicks += metric.gsc_clicks || 0;
        clusterData.gsc_impressions += metric.gsc_impressions || 0;
        clusterData.amplitude_conversions += metric.amplitude_conversions || 0;
      }
    }
  });

  // Calculate CTR and Position, and fix cluster_size for outliers
  const leaderboard = Array.from(clusterMap.values()).map((cluster) => ({
    ...cluster,
    // Use URL count as cluster size if not set (important for outliers)
    cluster_size: cluster.cluster_size || (cluster.urls ? cluster.urls.length : 0),
    gsc_ctr: cluster.gsc_impressions > 0 ? cluster.gsc_clicks / cluster.gsc_impressions : 0,
    gsc_position: 0, // Will need weighted average calculation
  }));

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
