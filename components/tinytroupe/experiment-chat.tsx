"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useExperiment } from "@/hooks/use-experiment";
import { getInitials } from "@/lib/agents-loader";
import type { ABTestMessage, VariantResult } from "@/lib/api/types";
import type { AgentState } from "@/lib/store/experiment-store";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertCircle,
  Brain,
  CheckCircle2,
  MessageSquare,
  Minus,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ExperimentChatProps {
  className?: string;
}

export function ExperimentChat({ className }: ExperimentChatProps) {
  const {
    experiment,
    status,
    agents,
    results,
    currentVariant,
    totalAgents,
    totalVariants,
    getProgress,
    getAgentsByVariant,
    getWinner,
  } = useExperiment();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [animatingAgents, setAnimatingAgents] = useState<Set<string>>(new Set());

  // Auto-scroll quando houver novas mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [agents]);

  // Animar entrada de agentes
  useEffect(() => {
    const newAgents = new Set<string>();
    agents.forEach((agent) => {
      newAgents.add(agent.name);
    });
    setAnimatingAgents(newAgents);
  }, [agents]);

  const progress = getProgress();
  const winner = getWinner();

  // Função para obter a cor da variante
  const getVariantColor = (variant: string) => {
    const colors = {
      control: "from-primary/20 to-primary/10 border-primary/40",
      variant_a: "from-blue-500/20 to-blue-500/10 border-blue-500/40",
      variant_b: "from-emerald-500/20 to-emerald-500/10 border-emerald-500/40",
      variant_c: "from-purple-500/20 to-purple-500/10 border-purple-500/40",
      variant_d: "from-amber-500/20 to-amber-500/10 border-amber-500/40",
      variant_e: "from-rose-500/20 to-rose-500/10 border-rose-500/40",
    };
    return colors[variant as keyof typeof colors] || colors.control;
  };

  // Função para obter ícone do intent
  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case "sim":
        return <ThumbsUp className="w-3 h-3 text-green-500" />;
      case "não":
        return <ThumbsDown className="w-3 h-3 text-red-500" />;
      case "talvez":
        return <Minus className="w-3 h-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Renderizar agente
  const renderAgent = (agent: AgentState) => {
    const initials = getInitials(agent.name);
    const isThinking = agent.status === "thinking";
    const isTyping = agent.status === "typing";
    const isCompleted = agent.status === "completed";

    return (
      <div
        key={`${agent.variant}-${agent.name}`}
        className={cn("flex gap-3 mb-4 animate-in fade-in-0 slide-in-from-left-3", "duration-500")}
      >
        {/* Avatar do Agente */}
        <div className="relative">
          <Avatar
            className={cn(
              "w-9 h-9 border-2",
              isThinking && "border-yellow-500 animate-pulse",
              isTyping && "border-blue-500",
              isCompleted && "border-green-500",
            )}
          >
            <AvatarFallback
              className={cn(
                "text-xs font-medium",
                isThinking && "bg-yellow-500/20",
                isTyping && "bg-blue-500/20",
                isCompleted && "bg-green-500/20",
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Status Indicator */}
          {isThinking && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <Brain className="w-2.5 h-2.5 text-white animate-pulse" />
            </div>
          )}
          {isTyping && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <MessageSquare className="w-2.5 h-2.5 text-white animate-pulse" />
            </div>
          )}
          {isCompleted && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-foreground">{agent.name.split(" ")[0]}</span>
            {agent.score !== undefined && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                Score: {agent.score}/10
              </Badge>
            )}
            {agent.analysis && getIntentIcon(agent.analysis.intent)}
          </div>

          {/* Mensagem */}
          {isThinking && (
            <div className="text-xs text-muted-foreground italic">Analisando mensagem...</div>
          )}
          {isTyping && agent.partialText && (
            <div className="text-xs text-foreground animate-pulse">
              {agent.partialText}
              <span className="inline-block w-1 h-3 ml-0.5 bg-foreground animate-blink" />
            </div>
          )}
          {isCompleted && agent.thoughts && (
            <div className="space-y-2">
              <div className="text-xs text-foreground/90 leading-relaxed">
                {agent.thoughts.talk}
              </div>
              {agent.analysis && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {agent.analysis.positive_aspects && (
                    <div className="text-[10px] px-2 py-1 rounded-md bg-green-500/10 text-green-600 border border-green-500/20">
                      ✓ {agent.analysis.positive_aspects}
                    </div>
                  )}
                  {agent.analysis.concerns && (
                    <div className="text-[10px] px-2 py-1 rounded-md bg-red-500/10 text-red-600 border border-red-500/20">
                      ✗ {agent.analysis.concerns}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!experiment) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center space-y-3">
          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground">Crie um teste A/B para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header com Progresso */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-background via-background to-muted/30">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/25 to-primary/15 border border-primary/40 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary animate-pulse" />
                </div>
                {status === "running" && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{experiment.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {totalAgents} agentes • {totalVariants.length} variantes
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <Badge
              variant={
                status === "running" ? "default" : status === "completed" ? "secondary" : "outline"
              }
              className="gap-1.5"
            >
              {status === "running" && <Zap className="w-3 h-3 animate-pulse" />}
              {status === "completed" && <Trophy className="w-3 h-3" />}
              {status === "running"
                ? "Em execução"
                : status === "completed"
                  ? "Concluído"
                  : "Aguardando"}
            </Badge>
          </div>

          {/* Progress Bar */}
          {status === "running" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium text-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {/* Winner Badge */}
          {status === "completed" && winner && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <Trophy className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">
                Vencedor: {winner.variant} ({(winner.confidence * 100).toFixed(1)}% confiança)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Contexto */}
          <Card className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 border-muted">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Contexto do teste</p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {experiment.context || "Sem contexto definido"}
                </p>
              </div>
            </div>
          </Card>

          {/* Variantes e Agentes */}
          <div className="space-y-4">
            {totalVariants.map((variant, index) => {
              const variantAgents = getAgentsByVariant(variant);
              const message = experiment.config[
                variant as keyof typeof experiment.config
              ] as ABTestMessage;

              if (!message) return null;

              return (
                <Card
                  key={variant}
                  className={cn(
                    "p-4 bg-gradient-to-br border transition-all duration-300",
                    getVariantColor(variant),
                    currentVariant === variant &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  {/* Header da Variante */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          currentVariant === variant
                            ? "bg-primary animate-pulse"
                            : "bg-muted-foreground",
                        )}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {variant === "control"
                          ? "Controle"
                          : `Variante ${variant.split("_")[1]?.toUpperCase()}`}
                      </span>
                      {variant === "control" && (
                        <Badge variant="outline" className="h-4 text-[10px] px-1.5">
                          BASE
                        </Badge>
                      )}
                    </div>

                    {/* Score médio da variante */}
                    {results && results[variant] && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">
                          Média: {(results[variant] as VariantResult)?.mean?.toFixed(1) || 0}/10
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mensagem da Variante */}
                  <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                          Mensagem
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground">{message.hook}</p>
                      <p className="text-xs text-foreground/80">{message.body}</p>
                    </div>
                  </div>

                  {/* Agentes avaliando */}
                  {variantAgents.length > 0 && (
                    <>
                      <Separator className="mb-3" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                            Avaliações dos agentes
                          </span>
                        </div>
                        {variantAgents.map((agent) => renderAgent(agent))}
                      </div>
                    </>
                  )}

                  {/* Placeholder quando não há agentes */}
                  {variantAgents.length === 0 && status === "running" && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <div
                          className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                        <span>Aguardando agentes...</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
