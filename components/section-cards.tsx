"use client";

import {
  Card,
  CardAction,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import { IconClick, IconEye, IconInnerShadowTop, IconShoppingCart } from "@tabler/icons-react";

// Tipo base para métricas agregadas
type AggregatedMetrics = {
  impressions: number;
  clicks: number;
  conversions: number;
  position?: number; // average position (lower is better)
};

interface MetricsData extends AggregatedMetrics {
  previousPeriod?: AggregatedMetrics | undefined;
  averages?: AggregatedMetrics | undefined;
}

interface SectionCardsProps {
  metrics: MetricsData;
}

export function SectionCards({ metrics }: SectionCardsProps) {
  // Calculate percentage changes from previous period
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  // Position: improvement is previous - current
  const calculatePositionDelta = (current?: number, previous?: number) => {
    if (!previous || previous === 0 || current === undefined) return 0;
    return previous - current;
  };

  // Calculate changes for each metric
  const impressionsChange = calculateChange(
    metrics.impressions,
    metrics.previousPeriod?.impressions,
  );
  const clicksChange = calculateChange(metrics.clicks, metrics.previousPeriod?.clicks);
  const positionChange = calculatePositionDelta(metrics.position, metrics.previousPeriod?.position);
  const conversionsChange = calculateChange(
    metrics.conversions,
    metrics.previousPeriod?.conversions,
  );

  // Helper function to format large numbers
  const formatNumber = (num: number) => {
    const MILLION = 1_000_000;
    const THOUSAND = 1_000;

    if (num >= MILLION) {
      return `${(num / MILLION).toFixed(1)}M`;
    } else if (num >= THOUSAND) {
      return `${(num / THOUSAND).toFixed(1)}K`;
    }
    return num.toLocaleString("pt-BR");
  };

  // (badge removed) Delta cuida do estado visual

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:px-6 @5xl/main:grid-cols-4">
      {/* Conversões Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconShoppingCart className="size-3.5 text-muted-foreground" />
            Conversões
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(metrics.conversions)}
          </CardTitle>
          <CardAction>
            <Delta value={conversionsChange / 100} variant="percent" />
          </CardAction>
        </CardHeader>
        {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">Lorem ipsum dolor sit amet</div>
          <div className="text-muted-foreground">Consectetur adipiscing elit sed do</div>
        </CardFooter> */}
      </Card>

      {/* Impressões Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconEye className="size-3.5 text-muted-foreground" />
            Impressões
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(metrics.impressions)}
          </CardTitle>
          <CardAction>
            <Delta value={impressionsChange / 100} variant="percent" />
          </CardAction>
        </CardHeader>
        {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">Lorem ipsum dolor sit amet</div>
          <div className="text-muted-foreground">Eiusmod tempor incididunt ut labore</div>
        </CardFooter> */}
      </Card>

      {/* Cliques Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconClick className="size-3.5 text-muted-foreground" />
            Cliques
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(metrics.clicks)}
          </CardTitle>
          <CardAction>
            <Delta value={clicksChange / 100} variant="percent" />
          </CardAction>
        </CardHeader>
        {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">Lorem ipsum dolor sit amet</div>
          <div className="text-muted-foreground">Ut enim ad minim veniam quis</div>
        </CardFooter> */}
      </Card>

      {/* Posição Média Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconInnerShadowTop className="size-3.5 text-muted-foreground" />
            Posição Média
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {(metrics.position ?? 0).toFixed(1)}
          </CardTitle>
          <CardAction>
            <Delta value={positionChange} variant="absolute" precision={1} positiveIcon="down" />
          </CardAction>
        </CardHeader>
        {/* <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">Lorem ipsum dolor sit amet</div>
          <div className="text-muted-foreground">Nostrud exercitation ullamco laboris</div>
        </CardFooter> */}
      </Card>
    </div>
  );
}
