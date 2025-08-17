"use client";

import * as React from "react";
import type { DiffSegment } from "@/lib/rank-tracker/diff-utils";
import { computeDiffSegments } from "@/lib/rank-tracker/diff-utils";
import { cn } from "@/lib/utils";

interface InlineTextDiffProps {
  before: string | null;
  after: string | null;
  mode: "before" | "after";
  className?: string;
  /**
   * If true, shows subtle underlines for equal text to help scanning.
   * Defaults to false to reduce noise.
   */
  subtleEqual?: boolean;
}

/**
 * Renders a compact, accessible inline diff for short/medium texts.
 * - In `before` mode, emphasizes removed parts.
 * - In `after` mode, emphasizes added parts.
 */
export function InlineTextDiff({
  before,
  after,
  mode,
  className,
  subtleEqual = false,
}: InlineTextDiffProps) {
  const segments = React.useMemo<DiffSegment[]>(
    () => computeDiffSegments(before, after),
    [before, after],
  );

  // Filter to only render content that existed in that state
  const filtered = React.useMemo(() => {
    if (mode === "before") return segments.filter((s) => s.type !== "added");
    return segments.filter((s) => s.type !== "removed");
  }, [mode, segments]);

  return (
    <span className={cn("[&_mark]:px-0.5 [&_mark]:rounded-sm", className)}>
      {filtered.map((seg, idx) => {
        if (seg.type === "equal") {
          return (
            <span
              key={`eq-${idx}`}
              className={cn(subtleEqual ? "underline decoration-foreground/10" : undefined)}
            >
              {seg.value}
            </span>
          );
        }
        if (seg.type === "added") {
          return (
            <mark
              key={`add-${idx}`}
              aria-label="Added text"
              className={
                // success-tinted background with subtle ring for contrast in both themes
                "bg-[var(--success)]/14 text-foreground ring-1 ring-[var(--success)]/25"
              }
            >
              {seg.value}
            </mark>
          );
        }
        // removed
        return (
          <mark
            key={`rem-${idx}`}
            aria-label="Removed text"
            className={
              "bg-[var(--danger)]/14 text-foreground ring-1 ring-[var(--danger)]/25 line-through"
            }
          >
            {seg.value}
          </mark>
        );
      })}
    </span>
  );
}
