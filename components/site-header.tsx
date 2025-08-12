"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IconCalendar, IconRefresh } from "@tabler/icons-react";
import { format, parseISO, startOfWeek } from "date-fns";
import { useRouter } from "next/navigation";
import * as React from "react";

interface SiteHeaderProps {
  availableWeeks?: string[];
  currentWeeks?: string[];
  basePath?: string; // default "/dashboard"
  onNavigationStateChange?: (isPending: boolean) => void;
}

export function SiteHeader({
  availableWeeks = [],
  currentWeeks = [],
  basePath = "/dashboard",
  onNavigationStateChange,
}: SiteHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Notify parent component when loading state changes
  React.useEffect(() => {
    onNavigationStateChange?.(isPending);
  }, [isPending, onNavigationStateChange]);

  // Use currentWeeks directly as the initial value, or default to availableWeeks
  const defaultWeeks = currentWeeks.length > 0 ? currentWeeks : availableWeeks;
  const [selectedWeeks, setSelectedWeeks] = React.useState<string[]>(defaultWeeks);

  const formatWeekDisplay = (weekEnding: string) => {
    const date = parseISO(weekEnding);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return `${format(weekStart, "dd/MM")} - ${format(date, "dd/MM/yyyy")}`;
  };

  const handleWeekToggle = (week: string) => {
    setSelectedWeeks((prev) => {
      const newSelection = prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week];

      // Optional: Prefetch data in background (without showing loading state)
      // This makes the actual navigation feel faster when user clicks Apply
      if (newSelection.length > 0) {
        const weekParams = newSelection.join(",");
        router.prefetch(`${basePath}?weeks=${weekParams}`);
      }

      return newSelection;
    });
  };

  const handleApplySelection = () => {
    if (selectedWeeks.length > 0) {
      const sortedWeeks = [...selectedWeeks].sort();
      const weekParams = sortedWeeks.join(",");

      // Close popover immediately
      setOpen(false);

      // Navigate with transition to show loading state
      startTransition(() => {
        router.push(`${basePath}?weeks=${weekParams}`);
      });
    } else {
      setOpen(false);
    }
  };

  const displayText =
    selectedWeeks.length === 0
      ? "Selecione as semanas"
      : selectedWeeks.length === 1 && selectedWeeks[0]
        ? `Semana: ${formatWeekDisplay(selectedWeeks[0])}`
        : selectedWeeks.length === availableWeeks.length
          ? "Todas as semanas"
          : `${selectedWeeks.length} semanas selecionadas`;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">Clusters Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-80 justify-start text-left font-normal"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                    <span className="truncate">Carregando...</span>
                  </>
                ) : (
                  <>
                    <IconCalendar className="mr-2 h-4 w-4" />
                    <span className="truncate" suppressHydrationWarning>
                      {displayText}
                    </span>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(92vw,360px)] p-0" align="end">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">Selecione as Semanas</h4>
                  <span className="text-xs text-muted-foreground">
                    {selectedWeeks.length} de {availableWeeks.length} selecionadas
                  </span>
                </div>

                {/* Header checkbox para selecionar/desmarcar todas */}
                <label
                  htmlFor="select-all-weeks"
                  className="flex items-center space-x-2 p-2 mb-2 bg-muted/50 rounded-md hover:bg-muted transition-colors w-full cursor-pointer"
                >
                  <Checkbox
                    id="select-all-weeks"
                    checked={
                      selectedWeeks.length === availableWeeks.length && availableWeeks.length > 0
                    }
                    onCheckedChange={() => {
                      const newSelection =
                        selectedWeeks.length === availableWeeks.length ? [] : [...availableWeeks];

                      setSelectedWeeks(newSelection);

                      // Prefetch data for better performance
                      if (newSelection.length > 0) {
                        const weekParams = newSelection.join(",");
                        router.prefetch(`/dashboard?weeks=${weekParams}`);
                      }
                    }}
                  />
                  <span className="text-sm font-medium flex-1 select-none">Todas as semanas</span>
                </label>

                <Separator className="mb-2" />

                <ScrollArea className="h-[260px]">
                  <div className="space-y-1">
                    {availableWeeks.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        Nenhuma semana com dados disponível
                      </p>
                    ) : (
                      availableWeeks.map((week) => (
                        <label
                          key={week}
                          htmlFor={`week-checkbox-${week}`}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md transition-colors w-full cursor-pointer"
                        >
                          <Checkbox
                            id={`week-checkbox-${week}`}
                            checked={selectedWeeks.includes(week)}
                            onCheckedChange={() => handleWeekToggle(week)}
                          />
                          <span className="text-sm font-normal flex-1 select-none">
                            {formatWeekDisplay(week)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <Separator className="my-2" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedWeeks(defaultWeeks);
                      setOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleApplySelection}
                    disabled={selectedWeeks.length === 0}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" className="size-8" onClick={() => router.refresh()}>
            <IconRefresh className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
