import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_CARDS = 4;
const SKELETON_TABLE_ROWS = 10;

const SKELETON_CARD_IDS = Array.from({ length: SKELETON_CARDS }, (_, i) => `skel-card-${i}`);
const SKELETON_ROW_IDS = Array.from({ length: SKELETON_TABLE_ROWS }, (_, i) => `skel-row-${i}`);

export default function ClusterLoading() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        {/* Site Header Skeleton */}
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <Skeleton className="h-6 w-6" />
            <div className="h-4 w-px bg-border mx-2" />
            <Skeleton className="h-5 w-48" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-9 w-[320px]" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Cluster header skeleton */}
              <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex flex-col">
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>

              {/* Section cards skeleton */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 px-4 lg:px-6">
                {SKELETON_CARD_IDS.map((id) => (
                  <Card key={id}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-8 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Chart skeleton */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                    <div className="flex gap-0 mt-4">
                      <Skeleton className="h-8 w-20 rounded-r-none" />
                      <Skeleton className="h-8 w-20 rounded-none" />
                      <Skeleton className="h-8 w-16 rounded-none" />
                      <Skeleton className="h-8 w-20 rounded-l-none" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[250px] w-full rounded-lg" />
                  </CardContent>
                </Card>
              </div>

              {/* URLs Table skeleton */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-4 pb-3 border-b">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-32 flex-1" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      {SKELETON_ROW_IDS.map((id) => (
                        <div key={id} className="flex gap-4 py-3 items-center">
                          <Skeleton className="h-4 w-8" />
                          <Skeleton className="h-4 w-48 flex-1" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}