"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export type HistogramPoint = { bucket: string; count: number };

export function HistogramChart({ data }: { data: HistogramPoint[] }) {
  return (
    <ChartContainer config={{ count: { label: "Clusters", color: "var(--chart-3)" } }}>
      <AreaChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          dataKey="count"
          type="monotone"
          fill="var(--color-count)"
          stroke="var(--color-count)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
