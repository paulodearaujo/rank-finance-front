import { RankTrackerLoading } from "@/components/rank-tracker/loading-states";

export default function Loading() {
  return (
    <div
      id="rank-tracker-page"
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
    >
      <main id="rank-tracker-content" className="container mx-auto py-6">
        <RankTrackerLoading />
      </main>
    </div>
  );
}
