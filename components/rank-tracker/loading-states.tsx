"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Loading skeleton for app cards
 */
export function AppCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-24" />
        </div>
        {/* Screenshots row placeholder: matches real component exactly */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <div className="relative">
            <div className="w-full overflow-x-auto">
              <div className="flex items-stretch gap-3 py-1">
                {/* 4 screenshots como na Play Store - largura fixa para evitar shift */}
                <div className="relative h-48 sm:h-56 md:h-64 w-[108px] sm:w-[126px] md:w-[144px] rounded-xl overflow-hidden shrink-0 bg-muted">
                  <div className="absolute inset-0 animate-pulse" />
                </div>
                <div className="relative h-48 sm:h-56 md:h-64 w-[108px] sm:w-[126px] md:w-[144px] rounded-xl overflow-hidden shrink-0 bg-muted">
                  <div className="absolute inset-0 animate-pulse" />
                </div>
                <div className="relative h-48 sm:h-56 md:h-64 w-[108px] sm:w-[126px] md:w-[144px] rounded-xl overflow-hidden shrink-0 bg-muted">
                  <div className="absolute inset-0 animate-pulse" />
                </div>
                <div className="relative h-48 sm:h-56 md:h-64 w-[108px] sm:w-[126px] md:w-[144px] rounded-xl overflow-hidden shrink-0 bg-muted">
                  <div className="absolute inset-0 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading state for the entire list
 */
export function RankTrackerLoading() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.25 }}
      className="space-y-6"
    >
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm">Loading comparisons...</span>
        </div>
      </div>
      <div className="space-y-4">
        <AppCardSkeleton key="skeleton-1" />
        <AppCardSkeleton key="skeleton-2" />
        <AppCardSkeleton key="skeleton-3" />
      </div>
    </motion.div>
  );
}

/**
 * Empty state when no data is available
 */
export function RankTrackerEmpty() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.25 }}
      className="flex flex-col items-center justify-center py-20 px-4"
      aria-label="No data available"
    >
      <Card className="max-w-lg w-full">
        <CardContent className="py-10">
          <div className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="text-base md:text-lg font-semibold">No data available</h3>
            <p className="text-sm text-muted-foreground">
              There are no app snapshots to compare. Please check back later when new data is
              available.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
