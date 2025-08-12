"use client";

import {
  IconClick,
  IconEye,
  IconPercentage,
  IconShoppingCart,
  IconSparkles,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const THRESHOLDS = {
  PERFORMANCE_EXCELLENT: 20,
  PERFORMANCE_GOOD: 5,
  CTR_TOP: 0.05,
  CTR_GOOD: 0.03,
  CTR_FAIR: 0.02,
  CVR_EXCELLENT: 3,
  CVR_GOOD: 2,
  CVR_FAIR: 1,
} as const;

// Tipo base para métricas agregadas
type AggregatedMetrics = {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
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
          message: `Tráfego excelente! ${Math.abs(percentFromAverage).toFixed(0)}% acima do padrão`,
          type: "excellent",
        };
      } else if (percentFromAverage > THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Tráfego acima do esperado", type: "good" };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Alerta: ${Math.abs(percentFromAverage).toFixed(0)}% menos visitantes`,
          type: "warning",
        };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Tráfego abaixo do ideal", type: "caution" };
      }
      return { message: "Volume de tráfego normal", type: "neutral" };
    }

    if (metricType === "conversions") {
      if (percentFromAverage > THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Vendas excepcionais! ${Math.abs(percentFromAverage).toFixed(0)}% acima`,
          type: "excellent",
        };
      } else if (percentFromAverage > THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Conversões acima da meta", type: "good" };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_EXCELLENT) {
        return {
          message: `Atenção urgente: ${Math.abs(percentFromAverage).toFixed(0)}% menos vendas`,
          type: "warning",
        };
      } else if (percentFromAverage < -THRESHOLDS.PERFORMANCE_GOOD) {
        return { message: "Conversões precisam melhorar", type: "caution" };
      }
      return { message: "Vendas dentro do esperado", type: "neutral" };
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
  const ctrChange = calculateChange(metrics.ctr, metrics.previousPeriod?.ctr);
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

  // Helper function to get badge variant based on change
  const getBadgeVariant = (change: number, isPositiveGood = true) => {
    if (change === 0) return "secondary";
    const isPositive = change > 0;
    if (isPositiveGood) {
      return isPositive ? "default" : "destructive";
    }
    return isPositive ? "destructive" : "default";
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
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
            {impressionsChange !== 0 && (
              <Badge variant={getBadgeVariant(impressionsChange)} className="gap-1">
                {impressionsChange > 0 ? (
                  <IconTrendingUp className="size-3.5" />
                ) : (
                  <IconTrendingDown className="size-3.5" />
                )}
                {Math.abs(impressionsChange).toFixed(1)}%
              </Badge>
            )}
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

      {/* Tráfego/Clicks Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconClick className="size-3.5 text-muted-foreground" />
            Tráfego
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(metrics.clicks)}
          </CardTitle>
          <CardAction>
            {clicksChange !== 0 && (
              <Badge variant={getBadgeVariant(clicksChange)} className="gap-1">
                {clicksChange > 0 ? (
                  <IconTrendingUp className="size-3.5" />
                ) : (
                  <IconTrendingDown className="size-3.5" />
                )}
                {Math.abs(clicksChange).toFixed(1)}%
              </Badge>
            )}
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
                : "Visitantes via busca orgânica"}
          </div>
        </CardFooter>
      </Card>

      {/* CTR Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconPercentage className="size-3.5 text-muted-foreground" />
            CTR
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {(metrics.ctr * 100).toFixed(2)}%
          </CardTitle>
          <CardAction>
            {ctrChange !== 0 && (
              <Badge variant={getBadgeVariant(ctrChange)} className="gap-1">
                {ctrChange > 0 ? (
                  <IconTrendingUp className="size-3.5" />
                ) : (
                  <IconTrendingDown className="size-3.5" />
                )}
                {Math.abs(ctrChange).toFixed(1)}%
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            {metrics.ctr > THRESHOLDS.CTR_TOP ? (
              <>
                <IconSparkles className="size-4 text-primary" />
                Top 10% do mercado!
              </>
            ) : metrics.ctr > THRESHOLDS.CTR_GOOD ? (
              "Performance competitiva"
            ) : metrics.ctr > THRESHOLDS.CTR_FAIR ? (
              "Melhorar títulos e meta descrições"
            ) : (
              "Urgente: Otimizar SERP"
            )}
          </div>
          <div className="text-muted-foreground">
            {metrics.ctr > THRESHOLDS.CTR_TOP
              ? "Destaque nos resultados de busca"
              : metrics.ctr > THRESHOLDS.CTR_GOOD
                ? "Benchmark do setor: 3-5%"
                : "Ação: Testar novos títulos"}
          </div>
        </CardFooter>
      </Card>

      {/* Checkouts/Conversões Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <IconShoppingCart className="size-3.5 text-muted-foreground" />
            Checkouts
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(metrics.conversions)}
          </CardTitle>
          <CardAction>
            {conversionsChange !== 0 && (
              <Badge variant={getBadgeVariant(conversionsChange)} className="gap-1">
                {conversionsChange > 0 ? (
                  <IconTrendingUp className="size-3.5" />
                ) : (
                  <IconTrendingDown className="size-3.5" />
                )}
                {Math.abs(conversionsChange).toFixed(1)}%
              </Badge>
            )}
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
    </div>
  );
}
