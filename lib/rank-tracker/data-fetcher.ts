import type { Database } from "@/lib/apps-scrape.types";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { createComparisons } from "./diff-utils";
import type { AppComparison, RunMetadata } from "./types";

type AppScrape = Database["apps"]["Views"]["apps_scrape"]["Row"];

/**
 * Fetches available runs/snapshots from the database
 */
export async function fetchAvailableRuns(): Promise<RunMetadata[]> {
  const supabase = await createClient();

  // Read directly from public schema to avoid PostgREST schema restrictions
  const { data: runs, error } = await supabase
    .from("apps_scrape")
    .select("run_id, scraped_at, store")
    .order("scraped_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error({ scope: "data-fetcher.fetchAvailableRuns", err: error });
    return [];
  }

  // Group by run_id and get metadata
  const runMap = new Map<string, RunMetadata>();

  for (const run of runs || []) {
    if (!runMap.has(run.run_id)) {
      runMap.set(run.run_id, {
        run_id: run.run_id,
        scraped_at: run.scraped_at,
        app_count: 0,
        store: run.store,
      });
    }
    const metadata = runMap.get(run.run_id);
    if (!metadata) continue;
    metadata.app_count++;
  }

  return Array.from(runMap.values()).sort(
    (a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime(),
  );
}

/**
 * Fetches app data for a specific run
 */
export async function fetchRunData(runId: string): Promise<AppScrape[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("apps_scrape")
    .select(
      "id, run_id, app_id, store, title, subtitle, description, url, ranking_position, screenshots, scraped_at",
    )
    .eq("run_id", runId)
    .order("ranking_position", { ascending: true });

  if (error) {
    logger.error({ scope: "data-fetcher.fetchRunData", err: error, runId });
    return [];
  }

  return data as AppScrape[];
}

/**
 * Fetches and compares data between two runs
 */
export async function fetchComparison(
  beforeRunId: string | null,
  afterRunId: string | null,
): Promise<AppComparison[]> {
  // Resolve effective run IDs (fallback to latest two)
  let effectiveBeforeId = beforeRunId;
  let effectiveAfterId = afterRunId;
  if (!effectiveBeforeId || !effectiveAfterId) {
    const runs = await fetchAvailableRuns();
    if (runs.length < 2) {
      logger.warn({ scope: "data-fetcher.fetchComparison", msg: "Not enough runs for comparison" });
      return [];
    }
    const [latest, previous] = runs;
    effectiveAfterId = effectiveAfterId ?? latest?.run_id ?? null;
    effectiveBeforeId = effectiveBeforeId ?? previous?.run_id ?? null;
  }

  // Hard assert with early return (type guard for TS)
  if (!effectiveBeforeId || !effectiveAfterId) return [];

  // Fetch both datasets in parallel
  const [afterData, beforeData] = await Promise.all([
    fetchRunData(effectiveAfterId),
    fetchRunData(effectiveBeforeId),
  ]);

  // Create comparisons
  return createComparisons(afterData, beforeData);
}
