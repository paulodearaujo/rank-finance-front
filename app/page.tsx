"use client";

import { ABTestCreator } from "@/components/tinytroupe/ab-test-creator";
import { ExperimentChat } from "@/components/tinytroupe/experiment-chat";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useExperiment } from "@/hooks/use-experiment";
import type { ExperimentConfig } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ChevronDown, MessageSquare, PanelLeft, Settings, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface CurrentTest {
  context: string;
  messages: Record<string, { hook: string; body: string }>;
}

export default function TinyTroupeChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isABTestModalOpen, setIsABTestModalOpen] = useState(false);
  const [currentTest, setCurrentTest] = useState<CurrentTest | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook para gerenciar experimentos
  const {
    createAndRunExperiment,
    experiment,
    status,
    agents,
    results,
    error,
    clearError,
    getProgress,
    currentVariant,
    totalAgents,
    totalVariants,
    loadExperiments,
    experiments,
  } = useExperiment();

  // Carrega experimentos existentes ao montar
  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  const handleABTestSubmit = async (scenario: {
    context: string;
    messages: Record<string, { hook: string; body: string }>;
  }) => {
    // Salva o teste atual localmente
    setCurrentTest({
      context: scenario.context,
      messages: scenario.messages,
    });

    // Prepara configuração para a API
    const config: ExperimentConfig = {
      name: `Teste A/B - ${new Date().toLocaleDateString("pt-BR")}`,
      description: "Teste criado via interface",
      context: scenario.context,
      control: scenario.messages.control!,
      variant_a: scenario.messages.variant_a!,
      ...(scenario.messages.variant_b && { variant_b: scenario.messages.variant_b }),
      ...(scenario.messages.variant_c && { variant_c: scenario.messages.variant_c }),
      ...(scenario.messages.variant_d && { variant_d: scenario.messages.variant_d }),
      ...(scenario.messages.variant_e && { variant_e: scenario.messages.variant_e }),
      sample_size: 10, // Por padrão usa 10 agentes
    };

    // Cria e executa o experimento
    try {
      await createAndRunExperiment(config);
    } catch (error) {
      console.error("Erro ao criar experimento:", error);
    }
  };

  return (
    <div id="tinytroupe-container" className="flex h-screen bg-sidebar text-foreground dark">
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "flex flex-col bg-sidebar transition-[width] duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden",
        )}
      >
        {/* Sidebar Header */}
        <header
          id="sidebar-header"
          className={cn(
            "px-3 pt-4 pb-3 transition-opacity duration-300",
            isSidebarOpen ? "opacity-100" : "opacity-0",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="new-chat-button" variant="secondary" className="w-full justify-between">
                Nova conversa
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark" align="start">
              <DropdownMenuItem
                onClick={() => {
                  setIsABTestModalOpen(true);
                }}
                className="cursor-pointer"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Teste A/B</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Conversa livre</span>
                <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Users className="mr-2 h-4 w-4" />
                <span>Grupo focal</span>
                <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Sidebar Navigation */}
        <nav id="sidebar-nav" className="flex-1 flex flex-col">
          <section id="main-navigation" className="p-3 space-y-1">
            <Button
              id="nav-chat"
              variant="ghost"
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Chat</span>
            </Button>
            <Link href="/agents">
              <Button
                id="nav-agents"
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm">Agentes</span>
              </Button>
            </Link>
          </section>

          <section id="conversations-section" className="flex-1 px-3 mt-6">
            <h3 className="px-3 mb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Histórico
            </h3>
            <ScrollArea id="conversations-list" className="h-full">
              <div className="space-y-1 pr-2">
                {/* Experimento atual */}
                {experiment && (
                  <Button
                    id={`conversation-current-${experiment.id}`}
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 text-sm bg-sidebar-accent text-sidebar-foreground transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{experiment.name}</span>
                    </div>
                  </Button>
                )}

                {/* Experimentos anteriores */}
                {experiments
                  .filter((exp) => exp.id !== experiment?.id)
                  .slice(0, 5)
                  .map((exp) => (
                    <Button
                      key={exp.id}
                      id={`conversation-${exp.id}`}
                      variant="ghost"
                      className="w-full justify-start px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
                      onClick={() => {
                        // TODO: Carregar experimento anterior
                        console.log("Carregar experimento:", exp.id);
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{exp.name}</span>
                      </div>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </section>
        </nav>

        {/* Sidebar Footer */}
        <footer id="sidebar-footer" className="p-3 mt-auto">
          <Button
            id="settings-button"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </Button>
        </footer>
      </aside>

      {/* Main Content Area */}
      <main
        id="main-content"
        className={cn(
          "flex-1 flex flex-col bg-background relative overflow-hidden rounded-xl m-3",
          "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]",
          "transition-all duration-300 ease-in-out",
        )}
      >
        {/* Sidebar Toggle Button - Inside Main Content */}
        <Button
          id="sidebar-toggle-button"
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 z-50 hover:bg-accent rounded-lg transition-colors"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <PanelLeft className="w-4 h-4" />
        </Button>

        {/* Chat Area */}
        <section id="chat-area" className="flex-1 overflow-hidden">
          {/* Mostra o ExperimentChat quando há um experimento ativo */}
          {experiment || status === "running" || status === "completed" ? (
            <ExperimentChat className="h-full" />
          ) : (
            <ScrollArea id="messages-scroll-area" className="h-full">
              <div id="messages-container" className="max-w-3xl mx-auto px-4 py-8">
                {!currentTest ? (
                  <div
                    id="empty-state"
                    className="flex flex-col items-center justify-center min-h-[60vh]"
                  >
                    <div className="flex flex-col items-center">
                      {/* Minimalist icon with light sweep effect - AAA compliant */}
                      <div className="relative mb-8">
                        {/* Main icon container */}
                        <div className="relative w-12 h-12 rounded-full bg-muted/20 border border-muted/30 flex items-center justify-center overflow-hidden">
                          {/* Light sweep effect - auto plays */}
                          <div className="absolute inset-0 -translate-x-full animate-light-sweep bg-gradient-to-r from-transparent via-white/8 to-transparent" />

                          {/* Icon - higher contrast for AAA */}
                          <MessageSquare
                            className="w-4 h-4 text-muted-foreground/70"
                            strokeWidth={1.5}
                          />
                        </div>
                      </div>

                      {/* Refined typography - AAA contrast ratios */}
                      <div className="space-y-1.5 text-center">
                        <p className="text-sm text-muted-foreground/90 font-medium">
                          Inicie algo novo
                        </p>

                        {/* Subtle hint - improved contrast */}
                        <p className="text-xs text-muted-foreground/70">
                          Clique em "nova conversa" para começar
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    id="test-display"
                    className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-500"
                  >
                    {/* Context Card */}
                    <div className="bg-gradient-to-br from-background via-background to-muted/30 rounded-xl p-5 border border-border shadow-sm">
                      <div className="flex items-center gap-3 mb-3.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/25 to-primary/15 border border-primary/40 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-bold text-foreground">Contexto do teste</h3>
                          <p className="text-xs text-muted-foreground font-medium">
                            Como os agentes interpretarão as mensagens
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {currentTest.context}
                      </p>
                    </div>

                    {/* Variants Display */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-foreground">
                          Variantes configuradas
                        </h3>
                        <span className="text-xs text-muted-foreground font-medium">
                          {Object.keys(currentTest.messages).length} variantes • 10 agentes cada
                        </span>
                      </div>

                      <div className="grid gap-3">
                        {Object.entries(currentTest.messages).map(([variant, message], index) => (
                          <div
                            key={variant}
                            className={cn(
                              "rounded-xl border transition-all duration-300",
                              "hover:shadow-sm animate-in fade-in-0 slide-in-from-left-3",
                              variant === "control"
                                ? "p-5 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/40 ring-1 ring-primary/20"
                                : "p-4 bg-gradient-to-br from-card to-background/50 border-border hover:border-accent",
                            )}
                            style={{ animationDelay: `${index * 60}ms` }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    variant === "control"
                                      ? "bg-gradient-to-br from-primary to-primary/60 animate-pulse shadow-sm"
                                      : "bg-muted-foreground",
                                  )}
                                />
                                <span className="text-sm font-medium text-foreground">
                                  {variant === "control"
                                    ? "Controle"
                                    : `Variante ${variant.split("_")[1]?.toUpperCase()}`}
                                </span>
                                {variant === "control" && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-primary/20 to-primary/10 text-primary rounded">
                                    BASE
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                  HOOK
                                </span>
                                <p className="text-[13px] text-foreground font-medium leading-relaxed">
                                  {message.hook}
                                </p>
                              </div>

                              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                              <div className="space-y-1">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                  MENSAGEM
                                </span>
                                <p className="text-[13px] text-foreground/85 leading-relaxed">
                                  {message.body}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div id="scroll-anchor" ref={scrollRef} />
              </div>
            </ScrollArea>
          )}
        </section>
      </main>

      {/* A/B Test Creator Modal */}
      <ABTestCreator
        isOpen={isABTestModalOpen}
        onClose={() => setIsABTestModalOpen(false)}
        onSubmit={handleABTestSubmit}
      />
    </div>
  );
}
