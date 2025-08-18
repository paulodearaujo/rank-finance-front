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

  // Paginated scan to avoid large memory spikes while returning all runs
  const PAGE_SIZE = 500; // rows (per-app records), safe chunk
  let offset = 0;
  const runMap = new Map<string, RunMetadata>();

  // Cap max pages as a safety guard against infinite loops
  const MAX_PAGES = 200; // 100k rows scanned max
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data: rows, error } = await supabase
      .from("apps_scrape")
      .select("run_id, scraped_at, store")
      .order("scraped_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      logger.error({ scope: "data-fetcher.fetchAvailableRuns", err: error });
      break;
    }

    const batch = rows || [];
    if (batch.length === 0) break;

    for (const run of batch) {
      if (!runMap.has(run.run_id)) {
        runMap.set(run.run_id, {
          run_id: run.run_id,
          scraped_at: run.scraped_at,
          app_count: 0,
          store: run.store,
        });
      }
      const metadata = runMap.get(run.run_id);
      if (metadata) metadata.app_count++;
    }

    offset += PAGE_SIZE;
    if (batch.length < PAGE_SIZE) break; // reached the end
  }

  return Array.from(runMap.values()).sort(
    (a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime(),
  );
}

/**
 * Fetches app data for a specific run
 */
async function fetchRunData(runId: string, limitPerStore?: number): Promise<AppScrape[]> {
  const supabase = await createClient();

  // If a per-store limit is provided, fetch top N per store separately to cap payload size
  if (typeof limitPerStore === "number" && Number.isFinite(limitPerStore) && limitPerStore > 0) {
    const baseSelect =
      "id, run_id, app_id, store, title, subtitle, description, url, ranking_position, screenshots, scraped_at";

    const [appleRes, googleRes] = await Promise.all([
      supabase
        .from("apps_scrape")
        .select(baseSelect)
        .eq("run_id", runId)
        .eq("store", "app_store")
        .order("ranking_position", { ascending: true })
        .limit(limitPerStore),
      supabase
        .from("apps_scrape")
        .select(baseSelect)
        .eq("run_id", runId)
        .eq("store", "play_store")
        .order("ranking_position", { ascending: true })
        .limit(limitPerStore),
    ]);

    const errs = [appleRes.error, googleRes.error].filter(Boolean);
    if (errs.length) {
      logger.error({ scope: "data-fetcher.fetchRunData", err: errs[0], runId });
      return [];
    }

    const apple = (appleRes.data as AppScrape[] | null) ?? [];
    const google = (googleRes.data as AppScrape[] | null) ?? [];
    // Keep stable order by ranking within each store; concat preserves grouping
    return [...apple, ...google];
  }

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
  limitPerStore?: number,
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
    fetchRunData(effectiveAfterId, limitPerStore),
    fetchRunData(effectiveBeforeId, limitPerStore),
  ]);

  // Create comparisons
  return createComparisons(afterData, beforeData);
}
