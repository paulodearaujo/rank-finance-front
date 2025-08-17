"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SectionTOCItem {
  id: string; // DOM id of the target article
  label: string; // App name
}

interface SectionTOCProps {
  items: SectionTOCItem[];
  headerId: string; // e.g. "app-store-header" or "google-play-header"
  className?: string;
}

/**
 * Sticky section header TOC showing app names. Click to scroll to app, and
 * highlights the app currently in view using IntersectionObserver.
 */
export function SectionTOC({ items, headerId, className }: SectionTOCProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const targetsRef = useRef<{ id: string; el: HTMLElement }[]>([]);
  const topOffsetRef = useRef<number>(0);
  const pendingTargetIdRef = useRef<string | null>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Clamp/format labels but also keep CSS-based truncation for responsiveness
  const displayItems = useMemo(() => {
    const MAX_LEN = 18;
    return items.map((it) => ({
      id: it.id,
      label: it.label.length > MAX_LEN ? `${it.label.slice(0, MAX_LEN - 1)}\u2026` : it.label,
      full: it.label,
    }));
  }, [items]);

  const computeTopOffset = useCallback(() => {
    const globalHeader = document.getElementById("rank-tracker-header");
    const sectionHeader = document.getElementById(headerId);
    const globalH = globalHeader?.getBoundingClientRect().height || 0;
    const sectionH = sectionHeader?.getBoundingClientRect().height || 0;
    const offset = globalH + sectionH + 8;
    // Expose to CSS for sticky headers in sections
    document.documentElement.style.setProperty("--sticky-offset", `${globalH}px`);
    return offset;
  }, [headerId]);

  const ensureActiveVisible = useCallback((id: string) => {
    const btn = containerRef.current?.querySelector<HTMLButtonElement>(
      `button[data-target-id="${id}"]`,
    );
    if (!btn || !containerRef.current) return;
    const scrollRoot = containerRef.current.closest(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null;
    if (!scrollRoot) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Center the active item smoothly within the horizontal scroll viewport
    const rootRect = scrollRoot.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const current = scrollRoot.scrollLeft;
    const target = current + (btnRect.left - rootRect.left) - (rootRect.width - btnRect.width) / 2;

    const maxLeft = containerRef.current.scrollWidth - rootRect.width;
    const nextLeft = Math.max(0, Math.min(target, maxLeft));

    if (Math.abs(nextLeft - current) > 2) {
      scrollRoot.scrollTo({ left: nextLeft, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }, []);

  const refreshTargets = useCallback(() => {
    targetsRef.current = items
      .map(({ id }) => {
        const el = document.getElementById(id);
        return el ? { id, el } : null;
      })
      .filter((v): v is { id: string; el: HTMLElement } => Boolean(v));
  }, [items]);

  const spy = useCallback(() => {
    if (typeof window === "undefined") return;
    if (pendingTargetIdRef.current) return; // Pin active during programmatic scroll

    const anchorY = topOffsetRef.current; // distance from viewport top considered as anchor
    let candidateId: string | null = null;
    let candidateScore = -1; // 3: crossing anchor, 2: below anchor (next), 1: above anchor (previous)
    let bestDistance = Infinity;

    for (const t of targetsRef.current) {
      const rect = t.el.getBoundingClientRect();
      const top = rect.top;
      const bottom = rect.bottom;
      let score = 0;
      let distance = 0;

      if (top <= anchorY && bottom > anchorY) {
        // Element currently intersecting the anchor line
        score = 3;
        distance = 0;
      } else if (top > anchorY) {
        // Next element below the anchor
        score = 2;
        distance = top - anchorY;
      } else {
        // Element above the anchor
        score = 1;
        distance = anchorY - bottom;
      }

      if (score > candidateScore || (score === candidateScore && distance < bestDistance)) {
        candidateScore = score;
        bestDistance = distance;
        candidateId = t.id;
      }
    }

    if (candidateId) {
      if (candidateId !== activeIdRef.current) setActiveId(candidateId);
      ensureActiveVisible(candidateId);
    }
  }, [ensureActiveVisible]);

  useEffect(() => {
    if (items.length === 0) return;
    topOffsetRef.current = computeTopOffset();
    refreshTargets();
    // Initial sync
    requestAnimationFrame(spy);

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        spy();
      });
      // Detect scroll end (debounced) to release pending state
      if (pendingTargetIdRef.current) {
        if (scrollEndTimerRef.current) window.clearTimeout(scrollEndTimerRef.current);
        scrollEndTimerRef.current = window.setTimeout(() => {
          pendingTargetIdRef.current = null;
          spy();
        }, 140);
      }
    };
    const onResize = () => {
      topOffsetRef.current = computeTopOffset();
      refreshTargets();
      spy();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll as EventListener);
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [items, computeTopOffset, refreshTargets, spy]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - topOffsetRef.current);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    setActiveId(id);
    ensureActiveVisible(id);
    // Pin active until scroll settles
    pendingTargetIdRef.current = id;
  };

  if (displayItems.length === 0) return null;

  return (
    <nav id={`section-toc-${headerId}`} className={cn(className)} aria-label="Apps in this section">
      <div>
        <ScrollArea className="w-full">
          <div
            ref={containerRef}
            className="flex items-center gap-4 py-1 -mx-1 px-1 w-max min-w-full"
          >
            {displayItems.map((it) => {
              const isActive = it.id === activeId;
              return (
                <Tooltip key={it.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-target-id={it.id}
                      onClick={() => handleClick(it.id)}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "cursor-pointer bg-transparent text-xs md:text-sm whitespace-nowrap max-w-[11rem] min-h-[44px] px-2",
                        "transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="inline-block truncate align-bottom tracking-tight">
                        {it.label}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>{it.full}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </nav>
  );
}

export default SectionTOC;
