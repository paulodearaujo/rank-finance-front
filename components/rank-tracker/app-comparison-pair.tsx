"use client";

import type { AppComparison } from "@/lib/rank-tracker/types";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "@tabler/icons-react";
import { AppStateCard } from "./app-state-card";

interface AppComparisonPairProps {
  comparison: AppComparison;
  index: number;
}

export function AppComparisonPair({ comparison, index }: AppComparisonPairProps) {
  // Change list now rendered inside each AppStateCard header; remove local summary

  return (
    <article
      id={`app-comparison-${comparison.store}-${comparison.app_id}`}
      className="space-y-4"
      aria-label={`${comparison.current.title} comparison`}
    >
      {/* Summary moved inside cards */}

      {/* Cards side by side */}
      <section
        id={`cards-container-${comparison.app_id}`}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative items-stretch"
        aria-label={`${comparison.current.title} before and after cards`}
      >
        <AppStateCard comparison={comparison} state="before" index={index * 2} />

        {/* Arrow indicator for desktop */}
        <div
          id={`transition-arrow-${comparison.app_id}`}
          className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <div
            className={cn(
              "rounded-full p-2 bg-secondary text-secondary-foreground ring-1 ring-border/60 shadow-sm",
            )}
            aria-hidden="true"
          >
            <IconArrowRight className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <AppStateCard comparison={comparison} state="after" index={index * 2 + 1} />
      </section>
    </article>
  );
}
