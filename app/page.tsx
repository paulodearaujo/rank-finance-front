import { IconBrandApple, IconBrandGooglePlay } from "@tabler/icons-react";
import { Suspense } from "react";
// Data muda diariamente; revalida a cada 24h
export const revalidate = 86400;

import { AppComparisonPair } from "@/components/rank-tracker/app-comparison-pair";
import { RankTrackerHeader } from "@/components/rank-tracker/header";
import {
  AppCardSkeleton as ImportedAppCardSkeleton,
  RankTrackerEmpty,
} from "@/components/rank-tracker/loading-states";
import { SectionTOC } from "@/components/rank-tracker/section-toc";
import { fetchAvailableRuns, fetchComparison } from "@/lib/rank-tracker/data-fetcher";
import type { ChangeType } from "@/lib/rank-tracker/types";

interface RankTrackerPageProps {
  searchParams: Promise<{
    before?: string;
    after?: string;
    stores?: string;
    search?: string;
    changeTypes?: string;
    limit?: string;
  }>;
}

export default async function RankTrackerPage({ searchParams }: RankTrackerPageProps) {
  const params = await searchParams;

  // Fetch available runs for the header
  const availableRuns = await fetchAvailableRuns();

  if (availableRuns.length === 0) {
    return (
      <div
        id="rank-tracker-page-empty"
        className="min-h-screen bg-gradient-to-b from-background to-muted/20"
      >
        <div id="empty-state-container" className="container mx-auto">
          <RankTrackerEmpty />
        </div>
      </div>
    );
  }

  // Get filter values from URL params or defaults
  const beforeRunId = params.before || availableRuns[1]?.run_id || null;
  const afterRunId = params.after || availableRuns[0]?.run_id || null;
  // Search removed
  const stores = (params.stores?.split(",") as ("apple" | "google")[]) || ["apple", "google"];
  const changeTypes = (params.changeTypes?.split(",") || []) as ChangeType[];
  const limit = Math.max(1, Math.min(50, Number.parseInt(params.limit || "10", 10) || 10));

  // Fetch comparison data
  const comparisons = await fetchComparison(beforeRunId, afterRunId);

  // Apply filters
  let filteredComparisons = comparisons;

  // Filter by store
  if (stores.length === 1) {
    filteredComparisons = filteredComparisons.filter((c) => stores.includes(c.store));
  }

  // Do not filter by change types: show all apps; highlight changes in UI only

  // Sort comparisons strictly by current rank (best rank first)
  const sortedComparisons = [...filteredComparisons].sort((a, b) => {
    const aRank = a.diff.ranking.current ?? 999;
    const bRank = b.diff.ranking.current ?? 999;
    return aRank - bRank;
  });

  // Show all apps, grouped by store
  const appleApps = sortedComparisons.filter((c) => c.store === "apple");
  const googleApps = sortedComparisons.filter((c) => c.store === "google");
  const appleSlice = appleApps.slice(0, limit);
  const googleSlice = googleApps.slice(0, limit);

  return (
    <div
      id="rank-tracker-page"
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
    >
      {/* Sticky floating header */}
      <header
        id="rank-tracker-header"
        className="sticky top-0 z-50 p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
      >
        <h1 className="sr-only">App Rank Tracker</h1>
        <RankTrackerHeader
          availableRuns={availableRuns}
          initialFilters={{
            before_run_id: beforeRunId,
            after_run_id: afterRunId,
            stores,
            change_types: changeTypes as ChangeType[],
          }}
        />
      </header>
      <main id="rank-tracker-content" className="container mx-auto py-6">
        {filteredComparisons.length === 0 ? (
          <RankTrackerEmpty />
        ) : (
          <div id="apps-container" className="space-y-10">
            {/* App Store Section */}
            {appleApps.length > 0 ? (
              <section id="app-store-section" className="space-y-4">
                <header
                  id="app-store-header"
                  className="sticky top-[calc(var(--sticky-offset,72px))] z-30 bg-background/95 backdrop-blur-sm border-b"
                >
                  <div id="app-store-header-content" className="container mx-auto px-4 py-4">
                    <div id="app-store-header-info" className="flex items-center gap-3">
                      <IconBrandApple className="h-5 w-5 text-foreground/60" aria-hidden="true" />
                      <h2 id="app-store-title" className="text-base font-semibold text-foreground">
                        App Store
                      </h2>
                      <div className="ml-2 hidden md:block flex-1 min-w-0">
                        <SectionTOC
                          headerId="app-store-header"
                          className="mt-0"
                          items={appleApps.map((c) => ({
                            id: `app-comparison-${c.store}-${c.app_id}`,
                            label: c.current.title,
                          }))}
                        />
                      </div>
                      <span id="app-store-count" className="text-sm text-muted-foreground ml-2">
                        {appleApps.length} {appleApps.length === 1 ? "app" : "apps"}
                      </span>
                    </div>
                  </div>
                </header>
                <div id="app-store-apps" className="space-y-8">
                  {appleSlice.map((comparison, index) => (
                    <Suspense
                      key={`${comparison.store}_${comparison.app_id}`}
                      fallback={<ComparisonPairSkeleton />}
                    >
                      <AppComparisonPair comparison={comparison} index={index} />
                    </Suspense>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Google Play Section */}
            {googleApps.length > 0 ? (
              <section id="google-play-section" className="space-y-4">
                <header
                  id="google-play-header"
                  className="sticky top-[calc(var(--sticky-offset,72px))] z-30 bg-background/95 backdrop-blur-sm border-b"
                >
                  <div id="google-play-header-content" className="container mx-auto px-4 py-4">
                    <div id="google-play-header-info" className="flex items-center gap-3">
                      <IconBrandGooglePlay
                        className="h-5 w-5 text-foreground/60"
                        aria-hidden="true"
                      />
                      <h2
                        id="google-play-title"
                        className="text-base font-semibold text-foreground"
                      >
                        Google Play
                      </h2>
                      <div className="ml-2 hidden md:block flex-1 min-w-0">
                        <SectionTOC
                          headerId="google-play-header"
                          className="mt-0"
                          items={googleApps.map((c) => ({
                            id: `app-comparison-${c.store}-${c.app_id}`,
                            label: c.current.title,
                          }))}
                        />
                      </div>
                      <span id="google-play-count" className="text-sm text-muted-foreground ml-2">
                        {googleApps.length} {googleApps.length === 1 ? "app" : "apps"}
                      </span>
                    </div>
                  </div>
                </header>
                <div id="google-play-apps" className="space-y-8">
                  {googleSlice.map((comparison, index) => (
                    <Suspense
                      key={`${comparison.store}_${comparison.app_id}`}
                      fallback={<ComparisonPairSkeleton />}
                    >
                      <AppComparisonPair comparison={comparison} index={index} />
                    </Suspense>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

// Loading skeleton for comparison pair
function ComparisonPairSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative items-stretch">
      <ImportedAppCardSkeleton />
      {/* Arrow indicator for desktop within skeleton */}
      <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 opacity-100">
        <div
          className="rounded-full p-2 bg-secondary text-secondary-foreground ring-1 ring-border/60 shadow-sm"
          aria-hidden="true"
        >
          {/* simple CSS arrow placeholder */}
          <span className="block h-5 w-5">→</span>
        </div>
      </div>
      <ImportedAppCardSkeleton />
    </div>
  );
}

// Removed local AppCardSkeleton in favor of shared component
