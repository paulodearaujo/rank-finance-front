"use client";

import { SiteHeader } from "@/components/site-header";
import * as React from "react";

interface DashboardWrapperProps {
  availableWeeks: string[];
  currentWeeks: string[];
  children: React.ReactNode;
}

export function DashboardWrapper({
  availableWeeks,
  currentWeeks,
  children,
}: DashboardWrapperProps) {
  const [isPending, setIsPending] = React.useState(false);

  // Pass isPending state from SiteHeader through a callback
  const handleNavigationState = React.useCallback((pending: boolean) => {
    setIsPending(pending);
  }, []);

  return (
    <>
      <SiteHeader
        availableWeeks={availableWeeks}
        currentWeeks={currentWeeks}
        onNavigationStateChange={handleNavigationState}
      />
      <div className="flex flex-1 flex-col relative">
        {/* Loading overlay that shows during navigation */}
        {isPending && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-primary" />
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
