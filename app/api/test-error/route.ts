import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type BlogClusters = Tables<"blog_clusters">;
type BlogClusterMetrics = Tables<"blog_cluster_metrics">;

export async function GET() {
  try {
    const supabase = await createClient();

    // Step 1: Get run ID from blog_clusters
    const { data: runData, error: runError } = await supabase
      .from("blog_clusters")
      .select("run_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (runError) {
      return NextResponse.json(
        {
          step: "getting_run_id",
          error: runError.message,
          code: runError.code,
        },
        { status: 500 },
      );
    }

    const runId = runData?.run_id;
    if (!runId) {
      return NextResponse.json(
        {
          step: "no_run_id",
          error: "No run ID found",
        },
        { status: 404 },
      );
    }

    // Step 2: Get clusters
    const { data: clusters, error: clustersError } = await supabase
      .from("blog_clusters")
      .select("*")
      .eq("run_id", runId);

    if (clustersError) {
      return NextResponse.json(
        {
          step: "getting_clusters",
          error: clustersError.message,
          code: clustersError.code,
        },
        { status: 500 },
      );
    }

    // Step 3: Get cluster metrics
    const { data: clusterMetrics, error: metricsError } = await supabase
      .from("blog_cluster_metrics")
      .select("*")
      .eq("run_id", runId);

    if (metricsError) {
      return NextResponse.json(
        {
          step: "getting_cluster_metrics",
          error: metricsError.message,
          code: metricsError.code,
        },
        { status: 500 },
      );
    }

    // Step 4: Get article metrics (limit to test)
    const { data: articleMetrics, error: articleError } = await supabase
      .from("blog_articles_metrics")
      .select("*")
      .limit(100);

    if (articleError) {
      return NextResponse.json(
        {
          step: "getting_article_metrics",
          error: articleError.message,
          code: articleError.code,
        },
        { status: 500 },
      );
    }

    // Step 5: Test basic Map operations
    const clusterMap = new Map();

    try {
      // Test with a small subset
      const testClusters = clusters?.slice(0, 5) || [];

      testClusters.forEach((cluster: BlogClusters) => {
        if (!clusterMap.has(cluster.cluster_id)) {
          const meta = clusterMetrics?.find(
            (m: BlogClusterMetrics) => m.cluster_id === cluster.cluster_id,
          );
          clusterMap.set(cluster.cluster_id, {
            cluster_id: cluster.cluster_id,
            cluster_name:
              cluster.cluster_name ||
              (cluster.cluster_id === -1 ? "Outliers" : `Cluster ${cluster.cluster_id}`),
            cluster_size: meta?.cluster_size || 0,
            urls: [],
            test: true,
          });
        }
      });

      return NextResponse.json({
        success: true,
        runId,
        clustersCount: clusters?.length || 0,
        clusterMetricsCount: clusterMetrics?.length || 0,
        articleMetricsCount: articleMetrics?.length || 0,
        mapSize: clusterMap.size,
        mapEntries: Array.from(clusterMap.values()),
      });
    } catch (mapError) {
      const error = mapError as Error;
      return NextResponse.json(
        {
          step: "map_operations",
          error: error.message,
          stack: error.stack,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        step: "general_error",
        error: err.message,
        stack: err.stack,
      },
      { status: 500 },
    );
  }
}
