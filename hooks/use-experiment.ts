/**
 * Hook customizado para gerenciar experimentos A/B
 */

import type { ExperimentConfig } from "@/lib/api/types";
import { useExperimentStore } from "@/lib/store/experiment-store";
import { useCallback, useEffect } from "react";

export function useExperiment() {
  const store = useExperimentStore();

  // Limpa o estado quando o componente é desmontado
  useEffect(() => {
    return () => {
      store.disconnectWebSocket();
    };
  }, [store]);

  // Criar e executar experimento
  const createAndRunExperiment = useCallback(
    async (config: ExperimentConfig) => {
      try {
        // Cria o experimento
        await store.createExperiment(config);

        // Se criou com sucesso, executa
        if (store.currentExperiment) {
          await store.runExperiment(store.currentExperiment.id);
        }
      } catch (error) {
        console.error("Failed to create and run experiment:", error);
      }
    },
    [store],
  );

  // Reconectar WebSocket se necessário
  const reconnectWebSocket = useCallback(
    async (experimentId: string) => {
      if (!store.wsManager?.isConnected()) {
        await store.connectWebSocket(experimentId);
      }
    },
    [store],
  );

  // Obter agentes por variante
  const getAgentsByVariant = useCallback(
    (variant: string) => {
      return Array.from(store.agents.values()).filter((agent) => agent.variant === variant);
    },
    [store.agents],
  );

  // Calcular progresso
  const getProgress = useCallback(() => {
    const total = store.totalAgents * store.totalVariants.length;
    const completed = Array.from(store.agents.values()).filter(
      (agent) => agent.status === "completed",
    ).length;

    return total > 0 ? (completed / total) * 100 : 0;
  }, [store.agents, store.totalAgents, store.totalVariants]);

  // Obter variante vencedora
  const getWinner = useCallback(() => {
    if (!store.results) return null;

    const { winner, statistical_significance } = store.results;
    return {
      variant: winner,
      confidence: statistical_significance,
      isSignificant: statistical_significance >= 0.95,
    };
  }, [store.results]);

  return {
    // Estado
    experiment: store.currentExperiment,
    status: store.status,
    agents: store.agents,
    results: store.results,
    thoughts: store.thoughts,
    error: store.error,
    experiments: store.experiments,
    currentVariant: store.currentVariant,
    totalAgents: store.totalAgents,
    totalVariants: store.totalVariants,

    // Ações
    createExperiment: store.createExperiment,
    loadExperiments: store.loadExperiments,
    loadExperiment: store.loadExperiment,
    runExperiment: store.runExperiment,
    fetchResults: store.fetchResults,
    fetchThoughts: store.fetchThoughts,
    reset: store.reset,
    clearError: store.clearError,

    // Helpers
    createAndRunExperiment,
    reconnectWebSocket,
    getAgentsByVariant,
    getProgress,
    getWinner,
  };
}
