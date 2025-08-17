/**
 * Represents a comparison between two app snapshots
 */
export interface AppComparison {
  app_id: string;
  store: "apple" | "google";

  // Current snapshot data
  current: AppSnapshot;

  // Previous snapshot data (null if new app)
  previous: AppSnapshot | null;

  // Computed diff results
  diff: DiffResult;

  // Metadata
  comparison_date: string;
}

/**
 * Represents a single app snapshot at a point in time
 */
export interface AppSnapshot {
  id: number;
  run_id: string;
  app_id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  url: string;
  ranking_position: number | null;
  screenshots: Screenshot[] | null;
  scraped_at: string;
}

/**
 * Represents comparison results between two snapshots
 */
export interface DiffResult {
  // Ranking changes
  ranking: {
    current: number | null;
    previous: number | null;
    delta: number | null; // positive = improved (moved up)
    status: "improved" | "declined" | "unchanged" | "new" | "removed";
  };

  // Content changes
  title: {
    changed: boolean;
    before: string | null;
    after: string;
  };

  subtitle: {
    changed: boolean;
    before: string | null;
    after: string | null;
  };

  description: {
    changed: boolean;
    before: string | null;
    after: string | null;
  };

  screenshots: {
    changed: boolean;
    added: number;
    removed: number;
    total_before: number;
    total_after: number;
  };

  // Overall change summary
  has_changes: boolean;
  change_types: ChangeType[];
}

/**
 * Types of changes detected
 */
export type ChangeType =
  | "ranking"
  | "title"
  | "subtitle"
  | "description"
  | "screenshots"
  | "new_entry"
  | "removed_entry";

/**
 * Screenshot comparison data
 */
export interface ScreenshotComparison {
  before: Screenshot[];
  after: Screenshot[];
  changes: {
    added: Screenshot[];
    removed: Screenshot[];
    unchanged: Screenshot[];
  };
}

/**
 * Individual screenshot data
 */
export interface Screenshot {
  url: string;
  index: number;
  hash?: string; // for comparison
}

/**
 * Filter options for the rank tracker
 */
export interface RankTrackerFilters {
  // Date/run selection
  before_run_id: string | null;
  after_run_id: string | null;

  // Store filter
  stores: ("apple" | "google")[];

  // Reserved (future use)
  search_query?: string;
  selected_apps?: string[]; // app_ids

  // Change type filter
  change_types: ChangeType[];
}

/**
 * Run/snapshot metadata
 */
export interface RunMetadata {
  run_id: string;
  scraped_at: string;
  app_count: number;
  store: string;
}
