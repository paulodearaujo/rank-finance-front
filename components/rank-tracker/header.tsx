"use client";

import {
  IconAdjustmentsHorizontal,
  IconBrandApple,
  IconBrandGooglePlay,
  IconChevronRight,
} from "@tabler/icons-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState, useTransition } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChangeType, RankTrackerFilters, RunMetadata } from "@/lib/rank-tracker/types";

interface RankTrackerHeaderProps {
  availableRuns: RunMetadata[];
  isLoading?: boolean;
  initialFilters?: RankTrackerFilters;
}

export function RankTrackerHeader({ availableRuns, initialFilters }: RankTrackerHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Generate unique IDs for elements
  const navId = useId();
  const filtersMobileId = useId();
  const beforeDateId = useId();
  const afterDateId = useId();
  const filtersButtonId = useId();
  // Filter states
  const VISIBLE_CHANGE_TYPES: ChangeType[] = [
    "ranking",
    "title",
    "subtitle",
    "description",
    "screenshots",
  ];
  const [beforeRunId, setBeforeRunId] = useState<string | null>(
    initialFilters?.before_run_id ?? availableRuns[1]?.run_id ?? null,
  );
  const [afterRunId, setAfterRunId] = useState<string | null>(
    initialFilters?.after_run_id ?? availableRuns[0]?.run_id ?? null,
  );
  const [selectedStores, setSelectedStores] = useState<("apple" | "google")[]>(
    initialFilters?.stores ?? ["apple", "google"],
  );
  const [changeTypes, setChangeTypes] = useState<ChangeType[]>(
    initialFilters?.change_types && initialFilters.change_types.length > 0
      ? (initialFilters.change_types as ChangeType[])
      : VISIBLE_CHANGE_TYPES,
  );

  // Handle date selection with validation
  const handleBeforeRunChange = useCallback(
    (newBeforeRunId: string) => {
      setBeforeRunId(newBeforeRunId);

      // If afterRunId is equal to or after the new beforeRunId, reset it
      const beforeIndex = availableRuns.findIndex((r) => r.run_id === newBeforeRunId);
      const afterIndex = availableRuns.findIndex((r) => r.run_id === afterRunId);

      if (afterRunId && afterIndex >= beforeIndex) {
        // Find the first available run before the new beforeRunId
        const firstValidAfter = availableRuns.find((_, index) => index < beforeIndex);
        setAfterRunId(firstValidAfter?.run_id ?? null);
      }
    },
    [afterRunId, availableRuns],
  );

  const handleAfterRunChange = useCallback((newAfterRunId: string) => {
    setAfterRunId(newAfterRunId);
  }, []);

  // Store filter moved into Filters menu; ensure pelo menos 1 selecionado
  const toggleStore = useCallback((store: "apple" | "google") => {
    setSelectedStores((prev) => {
      const has = prev.includes(store);
      if (has) {
        // avoid empty selection
        return prev.length === 1 ? prev : prev.filter((s) => s !== store);
      }
      // add store; keep at most 2 unique values
      return Array.from(new Set([...prev, store])) as ("apple" | "google")[];
    });
  }, []);

  // Defaults and auto-apply with debounce

  // Sync current filters to URL (client-side)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (beforeRunId) params.set("before", beforeRunId);
      if (afterRunId) params.set("after", afterRunId);
      if (selectedStores.length === 1) params.set("stores", selectedStores.join(","));
      // Sempre refletir changeTypes atuais na URL (inclusive default)
      if (changeTypes.length > 0) {
        params.set("changeTypes", changeTypes.join(","));
      }

      const normalize = (p: URLSearchParams) => {
        const entries = Array.from(p.entries()).sort(([a], [b]) => a.localeCompare(b));
        return entries.map(([k, v]) => `${k}=${v}`).join("&");
      };
      const next = normalize(params);
      const current = normalize(new URLSearchParams(searchParams?.toString() || ""));
      if (next === current) return;
      // Avoid exploding headers: do not write excessively long params
      if (next.length > 1500) return; // safe cap for query length
      const href = next ? `${pathname}?${next}` : pathname;
      // Prefetch para reduzir tempo de espera percebido
      try {
        router.prefetch(href);
      } catch {}
      // Transição concorrente para sinalizar UI pendente (skeleton/overlay)
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [beforeRunId, afterRunId, selectedStores, changeTypes, pathname, router, searchParams]);

  const toggleChangeType = useCallback((type: ChangeType) => {
    setChangeTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  // Format date for display - São Paulo timezone
  const formatRunDate = (run: RunMetadata | undefined) => {
    if (!run) return "Select date";
    const formatted = new Date(run.scraped_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
      timeZoneName: "short",
    });
    // Replace GMT with BRT for clarity (Brazil Time)
    return formatted.replace("GMT-3", "BRT");
  };

  // Expose sticky offset for section headers (global header height + approx section header)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateVar = () => {
      const globalHeader = document.getElementById("rank-tracker-header");
      const globalH = globalHeader?.getBoundingClientRect().height || 0;
      document.documentElement.style.setProperty("--sticky-offset", `${globalH}px`);
    };
    updateVar();
    window.addEventListener("resize", updateVar);
    return () => window.removeEventListener("resize", updateVar);
  }, []);

  return (
    <nav
      id={navId}
      className="rounded-xl border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm p-2.5 md:p-3 grid grid-cols-1 items-center gap-2.5 md:grid-cols-[1fr_auto_1fr]"
      aria-label="Filter controls"
      aria-busy={isPending}
    >
      {/* Mobile: brand + filters */}
      <div className="flex md:hidden items-center justify-between gap-2 flex-wrap">
        <span className="text-base tracking-tight text-foreground">
          <span className="font-light text-foreground">App</span>
          <span className="font-semibold text-foreground">Tracker</span>
        </span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id={filtersMobileId}
                variant="outline"
                size="sm"
                className="touch-target"
                aria-label="Open filters"
              >
                <IconAdjustmentsHorizontal className="h-4 w-4 opacity-70" aria-hidden="true" />
                <span className="text-foreground/80">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel>Change types</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                className="touch-target"
                checked={changeTypes.includes("ranking")}
                onCheckedChange={() => toggleChangeType("ranking")}
              >
                Ranking
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="touch-target"
                checked={changeTypes.includes("title")}
                onCheckedChange={() => toggleChangeType("title")}
              >
                Title
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="touch-target"
                checked={changeTypes.includes("subtitle")}
                onCheckedChange={() => toggleChangeType("subtitle")}
              >
                Subtitle
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="touch-target"
                checked={changeTypes.includes("description")}
                onCheckedChange={() => toggleChangeType("description")}
              >
                Description
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="touch-target"
                checked={changeTypes.includes("screenshots")}
                onCheckedChange={() => toggleChangeType("screenshots")}
              >
                Screenshots
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Store</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                className="touch-target"
                checked={selectedStores.includes("apple")}
                onCheckedChange={() => toggleStore("apple")}
              >
                <span className="inline-flex items-center gap-2">
                  <IconBrandApple className="h-4 w-4 opacity-70" aria-hidden="true" /> App Store
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                className="touch-target"
                checked={selectedStores.includes("google")}
                onCheckedChange={() => toggleStore("google")}
              >
                <span className="inline-flex items-center gap-2">
                  <IconBrandGooglePlay className="h-4 w-4 opacity-70" aria-hidden="true" /> Google
                  Play
                </span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserMenu />
        </div>
      </div>
      {/* Mobile: Date Selectors */}
      <div className="flex md:hidden items-center gap-2 w-full">
        <Select value={beforeRunId || ""} onValueChange={handleBeforeRunChange}>
          <SelectTrigger
            aria-label="Before run"
            size="sm"
            className="flex-1 min-w-0 [&>*]:text-foreground/80 [&_svg]:!opacity-70 bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <SelectValue placeholder="Before">
              {formatRunDate(availableRuns.find((r) => r.run_id === beforeRunId))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableRuns.slice(1).map((run) => (
              <SelectItem key={run.run_id} value={run.run_id}>
                {formatRunDate(run)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <IconChevronRight className="h-4 w-4 text-foreground/50 flex-shrink-0" />

        <Select value={afterRunId || ""} onValueChange={handleAfterRunChange}>
          <SelectTrigger
            aria-label="After run"
            size="sm"
            className="flex-1 min-w-0 [&>*]:text-foreground/80 [&_svg]:!opacity-70 bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <SelectValue placeholder="After">
              {formatRunDate(availableRuns.find((r) => r.run_id === afterRunId))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableRuns.map((run, index) => (
              <SelectItem
                key={run.run_id}
                value={run.run_id}
                disabled={index >= availableRuns.findIndex((r) => r.run_id === beforeRunId)}
              >
                {formatRunDate(run)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Left: Date Selectors */}
      <div className="hidden md:flex items-center gap-2">
        <Select value={beforeRunId || ""} onValueChange={handleBeforeRunChange}>
          <SelectTrigger
            id={beforeDateId}
            aria-label="Before run"
            size="sm"
            className="w-[220px] [&>*]:text-foreground/80 [&_svg]:!opacity-70 bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <SelectValue placeholder="Before">
              {formatRunDate(availableRuns.find((r) => r.run_id === beforeRunId))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableRuns.slice(1).map((run) => (
              <SelectItem key={run.run_id} value={run.run_id}>
                {formatRunDate(run)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <IconChevronRight className="h-4 w-4 text-foreground/50" />

        <Select value={afterRunId || ""} onValueChange={handleAfterRunChange}>
          <SelectTrigger
            id={afterDateId}
            aria-label="After run"
            size="sm"
            className="w-[220px] [&>*]:text-foreground/80 [&_svg]:!opacity-70 bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <SelectValue placeholder="After">
              {formatRunDate(availableRuns.find((r) => r.run_id === afterRunId))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableRuns.map((run, index) => (
              <SelectItem
                key={run.run_id}
                value={run.run_id}
                disabled={index >= availableRuns.findIndex((r) => r.run_id === beforeRunId)}
              >
                {formatRunDate(run)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand (minimal, elegant) */}
      <div className="hidden md:flex items-center justify-self-center gap-2 md:gap-4 px-2 select-none text-center leading-none">
        <span className="text-[1.25rem] lg:text-[1.375rem] tracking-tight text-foreground">
          <span className="font-light text-foreground">App</span>
          <span className="font-semibold text-foreground">Tracker</span>
        </span>
        <span className="text-[0.75rem] md:text-[0.8125rem] text-muted-foreground/80 tracking-[0.04em]">
          by
        </span>
        <span className="inline-flex items-center gap-1.5 text-[1.25rem] lg:text-[1.375rem] font-medium tracking-tight text-foreground">
          <Image
            src="/postcss.svg"
            alt="InLab Logo"
            width={20}
            height={20}
            className="relative"
            style={{ top: "2px" }}
            priority
            fetchPriority="high"
          />
          InLab
        </span>
      </div>

      {/* Right: Filters & Stores */}
      <div className="hidden md:flex items-center justify-end gap-2">
        {/* Filters dropdown (inclui Store) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button id={filtersButtonId} variant="outline" size="sm" aria-label="Open filters">
              <IconAdjustmentsHorizontal className="h-4 w-4 opacity-70" aria-hidden="true" />
              <span className="hidden md:inline text-foreground/80">Filters</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuLabel>Change types</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={changeTypes.includes("ranking")}
              onCheckedChange={() => toggleChangeType("ranking")}
            >
              Ranking
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={changeTypes.includes("title")}
              onCheckedChange={() => toggleChangeType("title")}
            >
              Title
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={changeTypes.includes("subtitle")}
              onCheckedChange={() => toggleChangeType("subtitle")}
            >
              Subtitle
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={changeTypes.includes("description")}
              onCheckedChange={() => toggleChangeType("description")}
            >
              Description
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={changeTypes.includes("screenshots")}
              onCheckedChange={() => toggleChangeType("screenshots")}
            >
              Screenshots
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Store</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={selectedStores.includes("apple")}
              onCheckedChange={() => toggleStore("apple")}
            >
              <span className="inline-flex items-center gap-2">
                <IconBrandApple className="h-4 w-4 opacity-70" /> App Store
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={selectedStores.includes("google")}
              onCheckedChange={() => toggleStore("google")}
            >
              <span className="inline-flex items-center gap-2">
                <IconBrandGooglePlay className="h-4 w-4 opacity-70" /> Google Play
              </span>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UserMenu />
      </div>
    </nav>
  );
}
