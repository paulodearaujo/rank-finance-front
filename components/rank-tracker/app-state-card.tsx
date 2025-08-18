"use client";

import {
  IconBrandApple,
  IconBrandGooglePlay,
  IconExternalLink,
  IconPhoto,
  IconSparkles,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExpandableRichTextWithGradient } from "@/components/ui/expandable-text";
import { InlineTextDiff } from "@/components/ui/inline-text-diff";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { pairScreenshots } from "@/lib/rank-tracker/diff-utils";
import { computeDHash, hammingDistance } from "@/lib/rank-tracker/image-hash";
import type { AppComparison, AppSnapshot } from "@/lib/rank-tracker/types";
import { cn } from "@/lib/utils";

interface AppStateCardProps {
  comparison: AppComparison;
  state: "before" | "after";
  index?: number;
  animateIn?: boolean;
}

export function AppStateCard({
  comparison,
  state,
  index = 0,
  animateIn = true,
}: AppStateCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref: screenshotsRef, inView: screenshotsInView } = useInView({
    // Start work slightly before entering viewport to hide latency
    rootMargin: "200px",
    triggerOnce: true,
  });
  const data: AppSnapshot | null = state === "before" ? comparison.previous : comparison.current;
  const { diff } = comparison;
  const [hashes, setHashes] = useState<Record<number, string | null>>({});
  // Hashes do estado oposto para validação de mudanças
  const [prevAllHashes, setPrevAllHashes] = useState<(string | null)[]>([]);
  // Control loading state for each individual screenshot
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const screenshotCount = data?.screenshots?.length ?? 0;
  const allImagesLoaded = loadedImages.size >= screenshotCount && screenshotCount > 0;

  // Reset loaded images when screenshots change
  useEffect(() => {
    setLoadedImages(new Set());

    // Fallback: force remove skeletons after 3 seconds to prevent permanent overlay
    if (screenshotCount > 0) {
      const timer = setTimeout(() => {
        setLoadedImages(new Set(Array.from({ length: screenshotCount }, (_, i) => i)));
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [screenshotCount]);

  // No explicit readiness signaling; arrow is always visible on desktop

  // Precompute perceptual hashes only when needed (AFTER state) to reduce main-thread work
  // Note: this effect depends on showRowSkeleton defined below; keep the hook order consistent
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (state === "after") {
        if (!screenshotsInView) {
          if (!cancelled) {
            setHashes({});
            setPrevAllHashes([]);
          }
          return;
        }
        // Avoid heavy work until all images are loaded
        if (!allImagesLoaded) return;
        const list = data?.screenshots ?? [];
        const nextHashes: Record<number, string | null> = {};
        await Promise.all(
          list.map(async (s, idx) => {
            nextHashes[idx] = await computeDHash(s.url);
          }),
        );
        if (!cancelled) setHashes(nextHashes);

        if (comparison.previous?.screenshots) {
          const prevList = comparison.previous.screenshots ?? [];
          const all: (string | null)[] = new Array(prevList.length).fill(null);
          await Promise.all(
            prevList.map(async (s, idx) => {
              all[idx] = await computeDHash(s.url);
            }),
          );
          if (!cancelled) setPrevAllHashes(all);
        } else {
          if (!cancelled) setPrevAllHashes([]);
        }
      } else {
        // BEFORE state does not need hashes; keep empty to avoid layout reflows
        if (!cancelled) setPrevAllHashes([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    state,
    comparison.previous?.screenshots,
    data?.screenshots,
    screenshotsInView,
    allImagesLoaded,
  ]);

  // Get store icon
  const StoreIcon = comparison.store === "apple" ? IconBrandApple : IconBrandGooglePlay;

  // Determine visual state
  const isNew = state === "after" && diff.change_types.includes("new_entry");
  const isRemoved = state === "before" && diff.change_types.includes("removed_entry");

  // Get ranking for this state
  const ranking = state === "before" ? diff.ranking.previous : diff.ranking.current;

  // Card styling based on state
  const cardClassName = cn(
    "transition-all duration-300 hover:shadow-md h-full",
    "border-border/60 hover:border-border",
    {
      "ring-1 ring-[var(--success)]/25": isNew,
      "ring-1 ring-[var(--danger)]/25 opacity-80": isRemoved,
      "bg-muted/20": state === "before",
    },
  );

  // Change summary chips
  // Visual verification for screenshot diffs using dHash to suppress false positives
  const DHASH_THRESHOLD = 6; // <=6 bits difference = visually identical
  const visuallySameScreenshots = (() => {
    if (state !== "after") return false;
    const curr = comparison.current.screenshots ?? [];
    const prev = comparison.previous?.screenshots ?? [];
    if (curr.length !== prev.length) return false;
    if (curr.length === 0) return true;
    // Require all hashes to be available to make a strong claim; otherwise fall back to backend flag
    for (let i = 0; i < curr.length; i++) if (hashes[i] == null) return false;
    for (let j = 0; j < prev.length; j++) if (prevAllHashes[j] == null) return false;
    // Greedy matching by nearest hash to detect reorder without changes
    const used = new Set<number>();
    for (let i = 0; i < curr.length; i++) {
      const hi = hashes[i] as string;
      let best = Number.POSITIVE_INFINITY;
      let bestJ = -1;
      for (let j = 0; j < prev.length; j++) {
        if (used.has(j)) continue;
        const hj = prevAllHashes[j] as string;
        const d = hammingDistance(hi, hj);
        if (d < best) {
          best = d;
          bestJ = j;
        }
      }
      if (bestJ === -1 || best > DHASH_THRESHOLD) return false;
      used.add(bestJ);
    }
    return true;
  })();

  // No longer used to gate a DIFF overlay

  const changes = {
    title: diff.title.changed,
    subtitle: diff.subtitle.changed,
    description: diff.description.changed,
    screenshots: diff.screenshots.changed && !visuallySameScreenshots,
    ranking: diff.ranking.delta !== null && diff.ranking.delta !== 0,
    newEntry: isNew,
  };
  const hasContentChanges =
    changes.title || changes.subtitle || changes.description || changes.screenshots;
  const RankingIcon = diff.ranking.delta
    ? diff.ranking.delta > 0
      ? IconTrendingUp
      : IconTrendingDown
    : null;

  // Skip if no data for this state OR removed in the after state
  if (!data || (state === "after" && diff.change_types.includes("removed_entry"))) {
    return (
      <Card
        id={`app-card-${comparison.app_id}-${state}-empty`}
        className="h-full border-dashed opacity-50"
      >
        <CardContent className="flex items-center justify-center py-12">
          <div id={`empty-state-${comparison.app_id}-${state}`} className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {state === "before" ? "Not ranked" : "Removed from ranking"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion || !animateIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
      transition={
        prefersReducedMotion || !animateIn
          ? { duration: 0 }
          : { duration: 0.25, delay: index * 0.03 }
      }
      className="h-full"
    >
      <Card
        id={`app-card-${comparison.app_id}-${state}`}
        className={cardClassName}
        aria-labelledby={`app-title-${comparison.app_id}-${state}`}
      >
        <CardHeader id={`app-header-${comparison.app_id}-${state}`} className="pb-3">
          <div className="space-y-3">
            {/* State indicator */}
            <div
              id={`state-badges-${comparison.app_id}-${state}`}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={state === "before" ? "outline" : "default"} className="text-xs">
                  {state === "before" ? "Before" : "After"}
                </Badge>
                {state === "after" && changes.ranking && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs gap-1",
                      diff.ranking.delta && diff.ranking.delta > 0
                        ? "bg-[var(--success)]/10 text-[var(--success)] border-[color:var(--success)]/30 dark:bg-[var(--success)]/20"
                        : "bg-[var(--danger)]/10 text-[var(--danger)] border-[color:var(--danger)]/30 dark:bg-[var(--danger)]/20",
                    )}
                  >
                    {RankingIcon && <RankingIcon className="h-3 w-3" />}
                    Rank{" "}
                    {diff.ranking.delta && diff.ranking.delta > 0
                      ? `+${diff.ranking.delta}`
                      : diff.ranking.delta}
                  </Badge>
                )}
                {state === "after" && !hasContentChanges && !isNew && !isRemoved && (
                  <Badge variant="secondary" className="text-xs">
                    No content changes
                  </Badge>
                )}
                {state === "after" && changes.title && (
                  <Badge variant="outline" className="text-xs">
                    Title changed
                  </Badge>
                )}
                {state === "after" && changes.subtitle && (
                  <Badge variant="outline" className="text-xs">
                    Subtitle changed
                  </Badge>
                )}
                {state === "after" && changes.description && (
                  <Badge variant="outline" className="text-xs">
                    Description changed
                  </Badge>
                )}
                {state === "after" && changes.screenshots && (
                  <Badge variant="outline" className="text-xs">
                    Screenshots updated
                  </Badge>
                )}
                {state === "after" && changes.newEntry && (
                  <Badge variant="outline" className="text-xs">
                    <IconSparkles className="h-3 w-3" /> New
                  </Badge>
                )}
              </div>
              {ranking && (
                <Badge variant="secondary" className="font-mono tabular-nums">
                  #{ranking}
                </Badge>
              )}
            </div>

            {/* App title and store */}
            <div id={`app-info-${comparison.app_id}-${state}`}>
              <h3
                id={`app-title-${comparison.app_id}-${state}`}
                className="flex items-center gap-2 text-base font-semibold"
              >
                <StoreIcon className="h-4 w-4" aria-hidden="true" />
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block line-clamp-1 pr-5 hover:underline focus-visible:underline"
                  title={`${data.title} – open in ${comparison.store === "apple" ? "App Store" : "Google Play"}`}
                >
                  <InlineTextDiff
                    before={comparison.previous?.title ?? null}
                    after={comparison.current.title}
                    mode={state === "before" ? "before" : "after"}
                  />
                  <IconExternalLink
                    className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground"
                    aria-hidden="true"
                  />
                </a>
                {null}
              </h3>
              {data.subtitle && (
                <p
                  id={`app-subtitle-${comparison.app_id}-${state}`}
                  className="text-sm text-muted-foreground mt-1 line-clamp-1"
                  title={data.subtitle || undefined}
                >
                  <InlineTextDiff
                    before={comparison.previous?.subtitle ?? null}
                    after={comparison.current.subtitle}
                    mode={state === "before" ? "before" : "after"}
                  />
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent id={`app-content-${comparison.app_id}-${state}`} className="space-y-4 pt-0">
          {/* Description */}
          {data.description && (
            <div id={`description-section-${comparison.app_id}-${state}`} className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </div>
              <div className="rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 p-4 border border-border/40 backdrop-blur-sm">
                <ExpandableRichTextWithGradient
                  lines={3}
                  className="text-sm"
                  showMoreText="See more"
                  showLessText="See less"
                >
                  <InlineTextDiff
                    before={comparison.previous?.description ?? null}
                    after={comparison.current.description}
                    mode={state === "before" ? "before" : "after"}
                  />
                </ExpandableRichTextWithGradient>
              </div>
            </div>
          )}

          {/* Screenshots */}
          {data.screenshots && data.screenshots.length > 0 && (
            <div
              id={`screenshots-section-${comparison.app_id}-${state}`}
              className="space-y-2"
              ref={screenshotsRef}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <IconPhoto className="h-3 w-3" aria-hidden="true" />
                Screenshots
                <span>({data.screenshots.length})</span>
              </div>
              <div className="relative">
                <ScrollArea className="w-full">
                  <div
                    id={`screenshots-row-${comparison.app_id}-${state}`}
                    className="flex items-stretch gap-3 py-1 w-max min-w-full"
                  >
                    {(() => {
                      const curr = comparison.current.screenshots ?? [];
                      const prev = comparison.previous?.screenshots ?? [];
                      const list = data.screenshots ?? [];
                      const DHASH_THRESHOLD = 6;
                      const pairs =
                        state === "after" && prev.length ? pairScreenshots(curr, prev) : [];
                      const prevMap = new Map<number, number>();
                      for (const p of pairs) {
                        if (
                          typeof p.currentIndex === "number" &&
                          typeof p.previousIndex === "number"
                        ) {
                          prevMap.set(p.currentIndex, p.previousIndex);
                        }
                      }
                      return list.map((screenshot, idx) => {
                        let status: "unchanged" | "moved" | "changed" | "new" = "unchanged";
                        if (state === "after") {
                          let matchIdx: number | null = prevMap.get(idx) ?? null;
                          const hi = hashes[idx];
                          if (matchIdx === null) {
                            if (hi && prevAllHashes.length) {
                              let best = Number.POSITIVE_INFINITY;
                              let bestJ = -1;
                              for (let j = 0; j < prevAllHashes.length; j++) {
                                const h = prevAllHashes[j];
                                if (!h) continue;
                                const d = hammingDistance(hi, h);
                                if (d < best) {
                                  best = d;
                                  bestJ = j;
                                }
                              }
                              if (bestJ >= 0 && best <= DHASH_THRESHOLD) {
                                matchIdx = bestJ;
                              }
                            }
                          }
                          if (matchIdx === null) {
                            // Evita "new" provisório: só marca como novo quando temos hashes
                            // (ou quando não havia nenhum screenshot anterior)
                            if ((hi && prevAllHashes.length) || prev.length === 0) {
                              status = "new";
                            } else {
                              status = "unchanged";
                            }
                          } else {
                            if (hi && typeof matchIdx === "number") {
                              const hPrev = prevAllHashes[matchIdx];
                              if (hPrev) {
                                const d = hammingDistance(hi, hPrev);
                                if (d > DHASH_THRESHOLD) status = "changed";
                              }
                            }
                            if (status === "unchanged" && matchIdx !== idx) status = "moved";
                          }
                        }
                        const badgeProps =
                          status !== "unchanged"
                            ? {
                                variant: "outline" as const,
                                className: `badge-glass border-white/15 ${
                                  status === "changed"
                                    ? "text-destructive"
                                    : status === "new"
                                      ? "text-[var(--success)]"
                                      : "text-foreground"
                                }`,
                              }
                            : null;
                        const isImageLoaded = loadedImages.has(idx);
                        return (
                          <div
                            key={screenshot.url || `${idx}`}
                            className="relative h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden shrink-0"
                          >
                            {/* Individual skeleton for each image */}
                            {!isImageLoaded && (
                              <div
                                className="absolute inset-0 bg-muted animate-pulse rounded-xl"
                                aria-hidden="true"
                              />
                            )}
                            <a
                              href={screenshot.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer media-frame"
                              title={`Open screenshot ${idx + 1} in new tab`}
                            >
                              <img
                                src={screenshot.url}
                                alt={`${data.title} screenshot ${idx + 1}`}
                                className={cn(
                                  "object-contain h-full w-auto mx-auto transition-opacity duration-200",
                                  isImageLoaded ? "opacity-100" : "opacity-0",
                                )}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                onLoad={() => {
                                  setLoadedImages((prev) => {
                                    const next = new Set(prev);
                                    next.add(idx);
                                    return next;
                                  });
                                }}
                                onError={() => {
                                  // Also mark as loaded on error to remove skeleton
                                  setLoadedImages((prev) => {
                                    const next = new Set(prev);
                                    next.add(idx);
                                    return next;
                                  });
                                }}
                              />
                              {state === "after" && badgeProps && isImageLoaded && (
                                <Badge
                                  variant={badgeProps.variant}
                                  className={cn("absolute left-2 top-2 z-10", badgeProps.className)}
                                >
                                  {status}
                                </Badge>
                              )}
                            </a>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {null}
    </motion.div>
  );
}
