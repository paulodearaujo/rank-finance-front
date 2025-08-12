"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Tables } from "@/lib/database.types";

// Constantes de configuração
const DAYS_PER_WEEK = 7;
const PERCENTAGE_MULTIPLIER = 100;

// Usando tipo do banco de dados com campos opcionais para dados agregados
type WeeklyMetric = Partial<Tables<"blog_articles_metrics">>;

interface ChartAreaInteractiveProps {
  data?: WeeklyMetric[];
  selectedWeeks?: string[];
}

const chartConfig = {
  amplitude_conversions: {
    label: "Vendas",
    color: "var(--chart-2)",
  },
  gsc_clicks: {
    label: "Cliques",
    color: "var(--chart-1)",
  },
  gsc_ctr: {
    label: "CTR",
    color: "var(--chart-3)",
  },
  gsc_position: {
    label: "Posição Média",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({ data = [], selectedWeeks = [] }: ChartAreaInteractiveProps) {
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>([
    "amplitude_conversions",
    "gsc_clicks",
  ]);

  const filteredData = React.useMemo<WeeklyMetric[]>(() => {
    if (!data || data.length === 0) return [];

    // Sort data by week and prepare CTR as percentage
    const sortedData = [...data]
      .filter((item) => item.week_ending) // Ensure week_ending exists
      .sort((a, b) => {
        const dateA = a.week_ending ? new Date(a.week_ending).getTime() : 0;
        const dateB = b.week_ending ? new Date(b.week_ending).getTime() : 0;
        return dateA - dateB;
      })
      .map((item) => ({
        ...item,
        gsc_ctr: item.gsc_ctr ? item.gsc_ctr * PERCENTAGE_MULTIPLIER : 0, // Convert to percentage
        gsc_position: item.gsc_position || 0, // Ensure position is never undefined
      }));

    // Optional: Fill in missing weeks with null values to show gaps in the chart
    // This helps visualize when data is missing
    if (sortedData.length > 1) {
      const filledData: WeeklyMetric[] = [];
      const firstItem = sortedData[0];
      const lastItem = sortedData[sortedData.length - 1];

      if (!firstItem?.week_ending || !lastItem?.week_ending) {
        return sortedData;
      }

      const startDate = new Date(firstItem.week_ending);
      const endDate = new Date(lastItem.week_ending);

      const currentDate = new Date(startDate);
      let dataIndex = 0;

      while (currentDate <= endDate) {
        const weekString = currentDate.toISOString().split("T")[0];
        const currentDataItem = sortedData[dataIndex];

        if (
          dataIndex < sortedData.length &&
          currentDataItem &&
          currentDataItem.week_ending === weekString
        ) {
          filledData.push(currentDataItem);
          dataIndex++;
        } else {
          // Add placeholder for missing week - this will create a gap in the line
          filledData.push({
            week_ending: weekString,
            gsc_clicks: null,
            gsc_impressions: null,
            amplitude_conversions: null,
            gsc_ctr: null,
            gsc_position: null,
          } as WeeklyMetric);
        }

        // Move to next week (assuming week_ending is always Sunday)
        currentDate.setDate(currentDate.getDate() + DAYS_PER_WEEK);
      }

      return filledData;
    }

    return sortedData as WeeklyMetric[];
  }, [data]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Métricas Semanais</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Vendas, Cliques, CTR e Posição Média
            {selectedWeeks.length > 0 ? ` (${selectedWeeks.length} semanas)` : ""}
            {filteredData.some((d) => d.gsc_clicks === null) && (
              <span className="ml-2 text-destructive">⚠️ Dados faltando em algumas semanas</span>
            )}
          </span>
          <span className="@[540px]/card:hidden">
            {selectedWeeks.length > 0 ? `${selectedWeeks.length} semanas` : "Todas as semanas"}
            {filteredData.some((d) => d.gsc_clicks === null) && " ⚠️"}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="multiple"
            value={selectedMetrics}
            onValueChange={(value: string[]) => {
              if (value.length > 0) {
                setSelectedMetrics(value);
              }
            }}
            variant="outline"
            className="flex flex-wrap gap-0 *:data-[slot=toggle-group-item]:!px-3 *:data-[slot=toggle-group-item]:!h-8"
          >
            <ToggleGroupItem value="amplitude_conversions" aria-label="Vendas">
              Vendas
            </ToggleGroupItem>
            <ToggleGroupItem value="gsc_clicks" aria-label="Cliques">
              Cliques
            </ToggleGroupItem>
            <ToggleGroupItem value="gsc_ctr" aria-label="CTR">
              CTR
            </ToggleGroupItem>
            <ToggleGroupItem value="gsc_position" aria-label="Posição">
              Posição
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week_ending"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                // Format as "Sem DD/MM" for week ending dates
                return `Sem ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
              }}
            />
            {/* Left Y-axis for Vendas and Cliques */}
            {(selectedMetrics.includes("amplitude_conversions") ||
              selectedMetrics.includes("gsc_clicks")) && (
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: number) => {
                  return Number(value).toLocaleString("pt-BR");
                }}
              />
            )}
            {/* Right Y-axis for CTR */}
            {selectedMetrics.includes("gsc_ctr") && (
              <YAxis
                yAxisId="ctr"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: number) => `${Number(value).toFixed(1)}%`}
              />
            )}
            {/* Another right Y-axis for Position (inverted) */}
            {selectedMetrics.includes("gsc_position") && !selectedMetrics.includes("gsc_ctr") && (
              <YAxis
                yAxisId="position"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                reversed
                domain={[1, "dataMax"]}
                tickFormatter={(value: number) => Number(value).toFixed(1)}
              />
            )}
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string) => {
                    const date = new Date(value);
                    // Keep same format as X axis: "Sem DD/MM/YYYY"
                    const day = date.getDate().toString().padStart(2, "0");
                    const month = (date.getMonth() + 1).toString().padStart(2, "0");
                    const year = date.getFullYear();

                    return `Semana ${day}/${month}/${year}`;
                  }}
                  formatter={(value, name, item) => {
                    // Skip null values
                    if (value === null || value === undefined) return null;

                    const config = chartConfig[name as keyof typeof chartConfig];
                    const label = config?.label || name;
                    const color = item?.color || config?.color;

                    // Format value with proper spacing
                    let formattedValue = "";

                    if (name === "gsc_ctr") {
                      const n = Number(value);
                      formattedValue = `${n.toFixed(2)}%`;
                    } else if (name === "gsc_position") {
                      const n = Number(value);
                      formattedValue = n.toFixed(1);
                    } else {
                      // For clicks and conversions
                      const n = Number(value);
                      formattedValue = n.toLocaleString("pt-BR");
                    }

                    // Return JSX with colored dot, label and value
                    return (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: color }}
                        />
                        <div className="flex flex-1 justify-between items-center gap-2">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {formattedValue}
                          </span>
                        </div>
                      </>
                    );
                  }}
                  indicator="dot"
                />
              }
            />
            {selectedMetrics.includes("amplitude_conversions") && (
              <Line
                yAxisId="left"
                dataKey="amplitude_conversions"
                type="monotone"
                stroke="var(--color-amplitude_conversions)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            )}
            {selectedMetrics.includes("gsc_clicks") && (
              <Line
                yAxisId="left"
                dataKey="gsc_clicks"
                type="monotone"
                stroke="var(--color-gsc_clicks)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            )}
            {selectedMetrics.includes("gsc_ctr") && (
              <Line
                yAxisId="ctr"
                dataKey="gsc_ctr"
                type="monotone"
                stroke="var(--color-gsc_ctr)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            )}
            {selectedMetrics.includes("gsc_position") && (
              <Line
                yAxisId={selectedMetrics.includes("gsc_ctr") ? "ctr" : "position"}
                dataKey="gsc_position"
                type="monotone"
                stroke="var(--color-gsc_position)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
