import type { Database } from "@/lib/apps-scrape.types";
import type { AppComparison, AppSnapshot, ChangeType, DiffResult, Screenshot } from "./types";

type AppScrape = Database["apps"]["Views"]["apps_scrape"]["Row"];
/**
 * Normalizes screenshot URL strings.
 * - If already http(s) or data URI, return as-is
 * - If string looks like base64 image data, prefix with appropriate data URI
 */
function normalizeScreenshotUrl(raw: string): string {
  const value = String(raw).trim();
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }
  // Heuristics for common base64 image signatures
  const lower = value.slice(0, 12);
  if (lower.startsWith("/9j")) {
    // JPEG
    return `data:image/jpeg;base64,${value}`;
  }
  if (lower.startsWith("iVBORw0KGgo")) {
    // PNG
    return `data:image/png;base64,${value}`;
  }
  if (lower.startsWith("R0lGOD")) {
    // GIF
    return `data:image/gif;base64,${value}`;
  }
  if (lower.startsWith("PHN2Zy")) {
    // SVG (base64)
    return `data:image/svg+xml;base64,${value}`;
  }
  // Fallback: assume JPEG
  return `data:image/jpeg;base64,${value}`;
}

/**
 * Creates an AppSnapshot from AppScrape data
 */
export function createSnapshot(scrape: AppScrape): AppSnapshot {
  return {
    id: scrape.id,
    run_id: scrape.run_id,
    app_id: scrape.app_id,
    title: scrape.title,
    subtitle: scrape.subtitle,
    description: scrape.description,
    url: scrape.url,
    ranking_position: scrape.ranking_position,
    screenshots: parseScreenshots(scrape.screenshots),
    scraped_at: scrape.scraped_at,
  };
}

/**
 * Normalizes various store identifiers to a canonical key used by the UI.
 * Accepts values like: "apple", "app_store", "app-store", "appstore", "ios"
 * and maps them to "apple". Likewise maps Google/Android variants to "google".
 */
function normalizeStoreIdentifier(store: string): "apple" | "google" {
  const value = store.toLowerCase().trim();

  // Direct matches for common database values
  if (value === "app_store" || value === "app-store" || value === "appstore") return "apple";
  if (value === "play_store" || value === "play-store" || value === "playstore") return "google";

  // Fallback pattern matching
  const isApple =
    value.includes("apple") ||
    value.includes("ios") ||
    (value.includes("app") && value.includes("store"));

  const isGoogle = value.includes("google") || value.includes("android") || value.includes("play");

  if (isApple && !isGoogle) return "apple";
  if (isGoogle && !isApple) return "google";

  // Default based on common patterns
  return value.includes("app") ? "apple" : "google";
}

/**
 * Parses screenshots from JSON to structured array
 */
function parseScreenshots(screenshots: unknown): Screenshot[] | null {
  if (!screenshots || typeof screenshots !== "object") return null;

  if (Array.isArray(screenshots)) {
    function hasUrl(value: unknown): value is { url: unknown } {
      return (
        typeof value === "object" && value !== null && "url" in (value as Record<string, unknown>)
      );
    }
    return screenshots
      .map((item, index) => {
        // Handle both string and object formats
        if (typeof item === "string") {
          return { url: normalizeScreenshotUrl(item), index };
        } else if (hasUrl(item)) {
          return { url: normalizeScreenshotUrl(String(item.url)), index };
        }
        return null;
      })
      .filter((s): s is Screenshot => s !== null);
  }

  return null;
}

/**
 * Detects all changes between two snapshots
 */
export function detectChanges(current: AppSnapshot, previous: AppSnapshot | null): DiffResult {
  const changeTypes: ChangeType[] = [];

  // Handle new entry case
  if (!previous) {
    return {
      ranking: {
        current: current.ranking_position,
        previous: null,
        delta: null,
        status: "new",
      },
      title: {
        changed: false,
        before: null,
        after: current.title,
      },
      subtitle: {
        changed: false,
        before: null,
        after: current.subtitle,
      },
      description: {
        changed: false,
        before: null,
        after: current.description,
      },
      screenshots: {
        changed: false,
        added: current.screenshots?.length || 0,
        removed: 0,
        total_before: 0,
        total_after: current.screenshots?.length || 0,
      },
      has_changes: true,
      change_types: ["new_entry"],
    };
  }

  // Ranking changes
  const rankingDelta = calculateRankDelta(current.ranking_position, previous.ranking_position);

  const rankingStatus = getRankingStatus(
    rankingDelta,
    current.ranking_position,
    previous.ranking_position,
  );

  if (rankingDelta !== 0 && rankingDelta !== null) {
    changeTypes.push("ranking");
  }

  // Title changes
  const titleChanged = current.title !== previous.title;
  if (titleChanged) changeTypes.push("title");

  // Subtitle changes
  const subtitleChanged = current.subtitle !== previous.subtitle;
  if (subtitleChanged) changeTypes.push("subtitle");

  // Description changes
  const descriptionChanged = current.description !== previous.description;
  if (descriptionChanged) changeTypes.push("description");

  // Screenshot changes
  const screenshotComparison = compareScreenshots(
    current.screenshots || [],
    previous.screenshots || [],
  );

  const screenshotsChanged = Boolean((screenshotComparison as { changed?: boolean }).changed);

  if (screenshotsChanged) changeTypes.push("screenshots");

  return {
    ranking: {
      current: current.ranking_position,
      previous: previous.ranking_position,
      delta: rankingDelta,
      status: rankingStatus,
    },
    title: {
      changed: titleChanged,
      before: previous.title,
      after: current.title,
    },
    subtitle: {
      changed: subtitleChanged,
      before: previous.subtitle,
      after: current.subtitle,
    },
    description: {
      changed: descriptionChanged,
      before: previous.description,
      after: current.description,
    },
    screenshots: screenshotComparison,
    has_changes: changeTypes.length > 0,
    change_types: changeTypes,
  };
}

/**
 * Calculates rank delta (positive = improved)
 */
export function calculateRankDelta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  // Lower rank number = better position
  // So if went from 5 to 1, delta is +4 (improved by 4 positions)
  return previous - current;
}

/**
 * Determines ranking status based on delta
 */
function getRankingStatus(
  delta: number | null,
  current: number | null,
  previous: number | null,
): DiffResult["ranking"]["status"] {
  if (previous === null) return "new";
  if (current === null) return "removed";
  if (delta === null || delta === 0) return "unchanged";
  return delta > 0 ? "improved" : "declined";
}

/**
 * Compares two arrays of screenshots
 */
/**
 * Canonical key for screenshot content.
 * - Strips data URI header to compare base64 payloads
 * - Normalizes http(s) by dropping hash fragments
 */
export function getScreenshotKey(url: string): string {
  const value = String(url);
  if (value.startsWith("data:")) {
    const idx = value.indexOf("base64,");
    if (idx !== -1) return value.slice(idx + 7).trim();
    const comma = value.indexOf(",");
    return comma !== -1 ? value.slice(comma + 1).trim() : value.trim();
  }
  // Normalize http(s) by dropping hash only
  return value.replace(/#.*$/, "").trim();
}

function compareScreenshots(current: Screenshot[], previous: Screenshot[]) {
  const toKey = getScreenshotKey;

  const currKeys = current.map((s) => toKey(s.url));
  const prevKeys = previous.map((s) => toKey(s.url));

  // Multiset counts to avoid false positives/negatives and ignore order
  const count = (arr: string[]) => {
    const map = new Map<string, number>();
    for (const k of arr) map.set(k, (map.get(k) ?? 0) + 1);
    return map;
  };

  const currMap = count(currKeys);
  const prevMap = count(prevKeys);

  let added = 0;
  let removed = 0;
  const allKeys = new Set<string>([...currMap.keys(), ...prevMap.keys()]);
  for (const k of allKeys) {
    const c = currMap.get(k) ?? 0;
    const p = prevMap.get(k) ?? 0;
    if (c > p) added += c - p;
    else if (p > c) removed += p - c;
  }

  // Detect reordering without content change
  let reordered = false;
  if (added === 0 && removed === 0 && currKeys.length === prevKeys.length) {
    for (let i = 0; i < currKeys.length; i++) {
      if (currKeys[i] !== prevKeys[i]) {
        reordered = true;
        break;
      }
    }
  }

  return {
    changed: added > 0 || removed > 0 || reordered,
    added,
    removed,
    total_before: previous.length,
    total_after: current.length,
    // Note: reordered is metadata not declared in the interface but safe to carry
    // for downstream UI decisions where supported (ignored elsewhere)
    ...(reordered ? { reordered } : {}),
  };
}

/**
 * Pairs screenshots by content key to facilitate visual diffing.
 * Useful to render side-by-side where the same image moved position.
 */
export function pairScreenshots(
  current: Screenshot[],
  previous: Screenshot[],
): Array<{
  key: string;
  current?: Screenshot | undefined;
  previous?: Screenshot | undefined;
  currentIndex?: number | undefined;
  previousIndex?: number | undefined;
  reordered?: boolean;
}> {
  const prevQueues = new Map<string, number[]>();
  previous?.forEach((s, idx) => {
    const k = getScreenshotKey(s.url);
    const q = prevQueues.get(k) ?? [];
    q.push(idx);
    prevQueues.set(k, q);
  });

  const usedPrev = new Set<number>();
  const pairs: Array<{
    key: string;
    current?: Screenshot | undefined;
    previous?: Screenshot | undefined;
    currentIndex?: number | undefined;
    previousIndex?: number | undefined;
    reordered?: boolean;
  }> = [];

  current?.forEach((s, idx) => {
    const k = getScreenshotKey(s.url);
    const q = prevQueues.get(k);
    if (q?.length) {
      const prevIdx = q.shift();
      if (prevIdx === undefined) {
        pairs.push({ key: k, current: s, currentIndex: idx });
        return;
      }
      usedPrev.add(prevIdx);
      const prevShot = previous?.[prevIdx];
      pairs.push({
        key: k,
        current: s,
        previous: prevShot ?? undefined,
        currentIndex: idx,
        previousIndex: prevIdx,
        reordered: prevIdx !== idx,
      });
    } else {
      pairs.push({ key: k, current: s, currentIndex: idx });
    }
  });

  previous.forEach((s, idx) => {
    if (usedPrev.has(idx)) return;
    const k = getScreenshotKey(s.url);
    pairs.push({ key: k, previous: s, previousIndex: idx });
  });

  return pairs;
}

/**
 * Creates AppComparison objects from current and previous data
 */
export function createComparisons(
  currentData: AppScrape[],
  previousData: AppScrape[],
): AppComparison[] {
  const previousMap = new Map(previousData.map((app) => [`${app.store}_${app.app_id}`, app]));

  const comparisons: AppComparison[] = [];

  for (const current of currentData) {
    const key = `${current.store}_${current.app_id}`;
    const previous = previousMap.get(key);

    const currentSnapshot = createSnapshot(current);
    const previousSnapshot = previous ? createSnapshot(previous) : null;

    comparisons.push({
      app_id: current.app_id,
      store: normalizeStoreIdentifier(current.store),
      current: currentSnapshot,
      previous: previousSnapshot,
      diff: detectChanges(currentSnapshot, previousSnapshot),
      comparison_date: new Date().toISOString(),
    });
  }

  // Also include apps that were removed (existed in previous but not in current)
  const currentKeys = new Set(currentData.map((app) => `${app.store}_${app.app_id}`));

  for (const previous of previousData) {
    const key = `${previous.store}_${previous.app_id}`;
    if (!currentKeys.has(key)) {
      // App was removed
      comparisons.push({
        app_id: previous.app_id,
        store: normalizeStoreIdentifier(previous.store),
        current: createSnapshot(previous), // Use previous as placeholder
        previous: createSnapshot(previous),
        diff: {
          ranking: {
            current: null,
            previous: previous.ranking_position,
            delta: null,
            status: "removed",
          },
          title: {
            changed: false,
            before: previous.title,
            after: previous.title,
          },
          subtitle: {
            changed: false,
            before: previous.subtitle,
            after: previous.subtitle,
          },
          description: {
            changed: false,
            before: previous.description,
            after: previous.description,
          },
          screenshots: {
            changed: false,
            added: 0,
            removed: 0,
            total_before: 0,
            total_after: 0,
          },
          has_changes: true,
          change_types: ["removed_entry"],
        },
        comparison_date: new Date().toISOString(),
      });
    }
  }

  return comparisons;
}

/**
 * Formats ranking display
 */
export function formatRankingDisplay(
  current: number | null,
  previous: number | null,
  delta: number | null,
): string {
  if (previous === null && current !== null) {
    return `NEW → #${current}`;
  }

  if (current === null && previous !== null) {
    return `#${previous} → REMOVED`;
  }

  if (current === null || previous === null) {
    return "-";
  }

  if (delta === 0 || delta === null) {
    return `#${current} (―)`;
  }

  const arrow = delta > 0 ? "↑" : "↓";
  return `#${previous} → #${current} (${arrow}${Math.abs(delta)})`;
}

/**
 * Diff segment representing a contiguous run of tokens
 */
export type DiffSegment = { value: string; type: "equal" | "added" | "removed" };

/**
 * Tokenizes text while preserving whitespace as separate tokens.
 */
function tokenizeForDiff(input: string): string[] {
  if (!input) return [];
  // Split by whitespace but keep it as tokens to preserve spacing
  return input.split(/(\s+)/).filter((token) => token.length > 0);
}

/**
 * Computes a word/whitespace aware diff between two strings using LCS.
 * Returns an ordered list of segments with types: equal | added | removed.
 *
 * Note: Optimized for typical app metadata lengths. Avoids heavy deps.
 */
export function computeDiffSegments(before: string | null, after: string | null): DiffSegment[] {
  const a = tokenizeForDiff(before ?? "");
  const b = tokenizeForDiff(after ?? "");

  const n = a.length;
  const m = b.length;

  if (n === 0 && m === 0) return [];
  if (n === 0) return [{ value: b.join(""), type: "added" }];
  if (m === 0) return [{ value: a.join(""), type: "removed" }];

  // Guardrail to avoid quadratic blow-up on pathological inputs
  const LIMIT = 4000; // tokens, very conservative for our use-case
  if (n * m > LIMIT * LIMIT) {
    if (before === after) return [{ value: after ?? "", type: "equal" }];
    return [
      { value: before ?? "", type: "removed" },
      { value: after ?? "", type: "added" },
    ];
  }

  // Build LCS length table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const ai = a[i - 1] ?? "";
    const row: number[] = dp[i] as number[];
    const prevRow: number[] = dp[i - 1] as number[];
    for (let j = 1; j <= m; j++) {
      const bj = b[j - 1] ?? "";
      const up = prevRow[j] ?? 0;
      const left = row[j - 1] ?? 0;
      const diag = prevRow[j - 1] ?? 0;
      row[j] = ai === bj ? diag + 1 : up >= left ? up : left;
    }
  }

  // Backtrack to build segments
  const segments: DiffSegment[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const aiTok = a[i - 1] ?? "";
    const bjTok = b[j - 1] ?? "";
    const row: number[] = dp[i] as number[];
    const prevRow: number[] = dp[i - 1] as number[];
    const up = prevRow[j] ?? 0;
    const left = row[j - 1] ?? 0;
    if (aiTok === bjTok) {
      segments.push({ value: aiTok, type: "equal" });
      i--;
      j--;
    } else if (up >= left) {
      segments.push({ value: aiTok, type: "removed" });
      i--;
    } else {
      segments.push({ value: bjTok, type: "added" });
      j--;
    }
  }
  while (i > 0) {
    const ai = a[i - 1] ?? "";
    segments.push({ value: ai, type: "removed" });
    i--;
  }
  while (j > 0) {
    const bj = b[j - 1] ?? "";
    segments.push({ value: bj, type: "added" });
    j--;
  }

  // Reverse to original order and merge adjacent same-type segments
  segments.reverse();
  const merged: DiffSegment[] = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === seg.type) prev.value += seg.value;
    else merged.push({ value: seg.value ?? "", type: seg.type });
  }
  return merged;
}
