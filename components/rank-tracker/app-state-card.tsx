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
import { computeDHash } from "@/lib/rank-tracker/image-hash";
import {
  areScreenshotsVisuallySame,
  compareScreenshot,
} from "@/lib/rank-tracker/screenshot-comparison";
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
  // undefined = não calculado ainda, array = calculado (pode ser vazio)
  const [prevAllHashes, setPrevAllHashes] = useState<(string | null)[] | undefined>(undefined);
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

  // Precompute perceptual hashes only when needed (AFTER state) to reduce main-thread work
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (state === "after") {
        if (!screenshotsInView) {
          if (!cancelled) {
            setHashes({});
            setPrevAllHashes(undefined); // Não calculado ainda
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
          // Não há screenshots anteriores - confirma array vazio
          if (!cancelled) setPrevAllHashes([]);
        }
      } else {
        // BEFORE state does not need hashes
        if (!cancelled) setPrevAllHashes(undefined);
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

  // Visual verification for screenshot diffs
  const visuallySameScreenshots = (() => {
    if (state !== "after") return false;

    // Se ainda não calculou os hashes anteriores, retorna null (calculando)
    if (prevAllHashes === undefined) return null;

    const currentHashes = Object.values(hashes);
    // Convert undefined to null for consistency
    const normalizedCurrentHashes = currentHashes.map((h) => h ?? null);

    return areScreenshotsVisuallySame(normalizedCurrentHashes, prevAllHashes);
  })();

  const changes = {
    title: diff.title.changed,
    subtitle: diff.subtitle.changed,
    description: diff.description.changed,
    // Only show screenshots changed if we've verified they're different
    // If still calculating (null), don't show the badge to avoid flashing
    screenshots: diff.screenshots.changed && visuallySameScreenshots === false,
    ranking: diff.ranking.delta !== null && diff.ranking.delta !== 0,
    newEntry: isNew,
  };
  // Só mostra "No content changes" quando temos certeza (não está calculando)
  const hasContentChanges =
    changes.title || changes.subtitle || changes.description || changes.screenshots;
  const isCalculatingScreenshots = state === "after" && visuallySameScreenshots === null;
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
                {state === "after" &&
                  !hasContentChanges &&
                  !isNew &&
                  !isRemoved &&
                  !isCalculatingScreenshots && (
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
                {state === "after" && changes.screenshots && !isCalculatingScreenshots && (
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
                <div className="w-full overflow-x-auto">
                  <div
                    id={`screenshots-row-${comparison.app_id}-${state}`}
                    className="flex items-stretch gap-3 py-1 w-max min-w-full"
                  >
                    {(() => {
                      const list = data.screenshots ?? [];

                      return list.map((screenshot, idx) => {
                        let status: "unchanged" | "moved" | "changed" | "new" = "unchanged";
                        if (state === "after") {
                          const currentHash = hashes[idx];

                          // Se ainda não calculou os hashes, não mostra badges (evita piscar)
                          if (prevAllHashes === undefined) {
                            status = "unchanged"; // Mantém sem badge até calcular
                          } else if (prevAllHashes.length === 0) {
                            // Confirmado que não há screenshots anteriores - todas são novas
                            status = "new";
                          } else {
                            // Há screenshots anteriores - compara se todos os hashes estão prontos
                            const allHashesReady =
                              currentHash !== undefined && prevAllHashes.every((h) => h !== null);

                            if (allHashesReady) {
                              const comparison = compareScreenshot(idx, currentHash, prevAllHashes);
                              status = comparison.status;
                            }
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
                            className="relative h-48 sm:h-56 md:h-64 w-[108px] sm:w-[126px] md:w-[144px] rounded-xl overflow-hidden shrink-0"
                          >
                            <a
                              href={screenshot.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "relative block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer",
                                isImageLoaded && "media-frame",
                              )}
                              title={`Open screenshot ${idx + 1} in new tab`}
                            >
                              {/* Skeleton consistente com o loading-states */}
                              {!isImageLoaded && (
                                <div
                                  className="absolute inset-0 z-10 bg-muted rounded-xl animate-pulse"
                                  aria-hidden="true"
                                />
                              )}
                              {/* Background blur elegante para App Store - preenche espaços sem cortar */}
                              {isImageLoaded && comparison.store === "apple" && (
                                <img
                                  src={screenshot.url}
                                  alt=""
                                  aria-hidden="true"
                                  className="absolute inset-0 h-full w-full object-cover scale-110 blur-xl opacity-30 saturate-150"
                                />
                              )}
                              <img
                                src={screenshot.url}
                                alt={`${data.title} screenshot ${idx + 1}`}
                                className={cn(
                                  "relative z-20 h-full w-full object-contain transition-opacity duration-200",
                                  isImageLoaded ? "opacity-100" : "opacity-0",
                                )}
                                loading={index < 4 ? "eager" : "lazy"}
                                decoding="async"
                                fetchPriority={index < 4 ? "high" : "low"}
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
                                  className={cn("absolute left-2 top-2 z-30", badgeProps.className)}
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
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {null}
    </motion.div>
  );
}
