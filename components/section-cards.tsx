"use client";

import {
  IconClick,
  IconEye,
  IconInnerShadowTop,
  IconShoppingCart,
  IconSparkles,
} from "@tabler/icons-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";

const THRESHOLDS = {
  PERFORMANCE_EXCELLENT: 20,
  PERFORMANCE_GOOD: 5,
  CVR_EXCELLENT: 3,
  CVR_GOOD: 2,
  CVR_FAIR: 1,
} as const;

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

  // Calculate insights for footer messages
  const getPerformanceInsight = (current: number, average?: number, metricType?: string) => {
    if (!average) return { message: "Coletando dados históricos", type: "neutral" };

    const percentFromAverage = ((current - average) / average) * 100;

    // Custom messages based on metric type
    if (metricType === "impressions") {
      if (percentFromAverage > THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Visibilidade excepcional! ${Math.abs(percentFromAverage).toFixed(0)}% acima do normal`,
          type: "excellent",
        };
      } else if (percentFromAverage > THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Boa visibilidade nos resultados", type: "good" };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Queda significativa: ${Math.abs(percentFromAverage).toFixed(0)}% menos impressões`,
          type: "warning",
        };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Visibilidade em queda", type: "caution" };
      }
      return { message: "Performance típica do período", type: "neutral" };
    }

    if (metricType === "clicks") {
      if (percentFromAverage > THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Cliques excelentes! ${Math.abs(percentFromAverage).toFixed(0)}% acima do padrão`,
          type: "excellent",
        };
      } else if (percentFromAverage > THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Cliques acima do esperado", type: "good" };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Alerta: ${Math.abs(percentFromAverage).toFixed(0)}% menos cliques`,
          type: "warning",
        };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Cliques abaixo do ideal", type: "caution" };
      }
      return { message: "Volume de cliques normal", type: "neutral" };
    }

    if (metricType === "conversions") {
      if (percentFromAverage > THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Conversões excepcionais! ${Math.abs(percentFromAverage).toFixed(0)}% acima`,
          type: "excellent",
        };
      } else if (percentFromAverage > THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Conversões acima da meta", type: "good" };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Atenção urgente: ${Math.abs(percentFromAverage).toFixed(0)}% menos conversões`,
          type: "warning",
        };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Conversões precisam melhorar", type: "caution" };
      }
      return { message: "Conversões dentro do esperado", type: "neutral" };
    }

    // Default generic message
    if (percentFromAverage > THRESHOLDS.PERFORMANCE_EXCELLENT) {
      return {
        message: `Performance excelente: +${Math.abs(percentFromAverage).toFixed(0)}%`,
        type: "excellent",
      };
    } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_EXCELLENT) {
      return {
        message: `Requer atenção: -${Math.abs(percentFromAverage).toFixed(0)}%`,
        type: "warning",
      };
    }
    return { message: "Performance estável", type: "neutral" };
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

  // Get insights for each metric
  const impressionsInsight = getPerformanceInsight(
    metrics.impressions,
    metrics.averages?.impressions,
    "impressions",
  );
  const clicksInsight = getPerformanceInsight(metrics.clicks, metrics.averages?.clicks, "clicks");
  const conversionsInsight = getPerformanceInsight(
    metrics.conversions,
    metrics.averages?.conversions,
    "conversions",
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
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            {conversionsInsight.type === "excellent" && (
              <IconSparkles className="size-4 text-primary" />
            )}
            {conversionsInsight.message}
          </div>
          <div className="text-muted-foreground">
            {metrics.clicks > 0
              ? (() => {
                  const cvr = (metrics.conversions / metrics.clicks) * 100;
                  if (cvr > THRESHOLDS.CVR_EXCELLENT) return `CVR ${cvr.toFixed(1)}% - Excelente!`;
                  if (cvr > THRESHOLDS.CVR_GOOD) return `CVR ${cvr.toFixed(1)}% - Bom desempenho`;
                  if (cvr > THRESHOLDS.CVR_FAIR) return `CVR ${cvr.toFixed(1)}% - Pode melhorar`;
                  return `CVR ${cvr.toFixed(1)}% - Revisar funil`;
                })()
              : "Aguardando dados de conversão"}
          </div>
        </CardFooter>
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
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            {impressionsInsight.type === "excellent" && (
              <IconSparkles className="size-4 text-primary" />
            )}
            {impressionsInsight.message}
          </div>
          <div className="text-muted-foreground">
            {impressionsInsight.type === "warning"
              ? "Revisar SEO e conteúdo"
              : impressionsInsight.type === "excellent"
                ? "Estratégia de conteúdo funcionando!"
                : "Potencial de busca orgânica"}
          </div>
        </CardFooter>
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
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            {clicksInsight.type === "excellent" && <IconSparkles className="size-4 text-primary" />}
            {clicksInsight.message}
          </div>
          <div className="text-muted-foreground">
            {clicksInsight.type === "warning"
              ? "CTR pode estar baixo - revisar títulos"
              : clicksInsight.type === "excellent"
                ? "Títulos e descrições eficazes!"
                : "Cliques via busca orgânica"}
          </div>
        </CardFooter>
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
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            {(metrics.position ?? 99) <= 5 ? (
              <>
                <IconSparkles className="size-4 text-primary" />
                Top 5 da SERP
              </>
            ) : (metrics.position ?? 99) <= 10 ? (
              "Top 10 da SERP"
            ) : (metrics.position ?? 99) <= 20 ? (
              "Competitivo (Top 20)"
            ) : (
              "Melhorar ranqueamento"
            )}
          </div>
          <div className="text-muted-foreground">Quanto menor, melhor</div>
        </CardFooter>
      </Card>
    </div>
  );
}
