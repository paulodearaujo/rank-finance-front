"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type WeeklyPoint = {
  week: string;
  clicks: number;
  conversions: number;
  impressions: number;
  ctr: number;
  position: number;
};

export function SeriesChart({ data, className }: { data: WeeklyPoint[]; className?: string }) {
  return (
    <ChartContainer
      config={{
        clicks: { label: "Clicks", color: "var(--chart-1)" },
        conversions: { label: "Conversions", color: "var(--chart-2)" },
      }}
      className={className ?? "w-full"}
    >
      <AreaChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} width={56} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          dataKey="clicks"
          type="monotone"
          fill="var(--color-clicks)"
          stroke="var(--color-clicks)"
          fillOpacity={0.2}
        />
        <Area
          dataKey="conversions"
          type="monotone"
          fill="var(--color-conversions)"
          stroke="var(--color-conversions)"
          fillOpacity={0.2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
