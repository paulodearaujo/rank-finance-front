/**
 * Store global para gerenciar experimentos A/B
 */

import { apiClient } from "@/lib/api/client";
import type {
  AgentAnalysis,
  AgentRespondedData,
  AgentThinkingData,
  AgentThought,
  AgentTypingData,
  Experiment,
  ExperimentCompletedData,
  ExperimentConfig,
  ExperimentResults,
  ExperimentStartedData,
  VariantCompletedData,
} from "@/lib/api/types";
import { WebSocketManager } from "@/lib/api/websocket";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Estado de um agente durante o teste
export interface AgentState {
  name: string;
  variant: string;
  status: "waiting" | "thinking" | "typing" | "completed";
  score?: number;
  analysis?: AgentAnalysis;
  thoughts?: {
    user_message: string;
    think: string;
    talk: string;
  };
  partialText?: string;
}

// Estado do experimento
export interface ExperimentState {
  // Experimento atual
  currentExperiment: Experiment | null;

  // Status
  status: "idle" | "creating" | "running" | "completed" | "failed";

  // Agentes e suas respostas
  agents: Map<string, AgentState>;

  // Resultados finais
  results: ExperimentResults | null;

  // Pensamentos detalhados dos agentes
  thoughts: AgentThought[];

  // WebSocket manager
  wsManager: WebSocketManager | null;

  // Lista de experimentos
  experiments: Experiment[];

  // Mensagens de erro
  error: string | null;

  // Variante atual sendo testada
  currentVariant: string | null;

  // Total de agentes e variantes
  totalAgents: number;
  totalVariants: string[];
}

// Ações do store
export interface ExperimentActions {
  // Criar novo experimento
  createExperiment: (config: ExperimentConfig) => Promise<void>;

  // Carregar lista de experimentos
  loadExperiments: () => Promise<void>;

  // Carregar experimento específico
  loadExperiment: (experimentId: string) => Promise<void>;

  // Iniciar execução do experimento
  runExperiment: (experimentId: string) => Promise<void>;

  // Conectar ao WebSocket
  connectWebSocket: (experimentId: string) => Promise<void>;

  // Desconectar WebSocket
  disconnectWebSocket: () => void;

  // Buscar resultados
  fetchResults: (experimentId: string) => Promise<void>;

  // Buscar pensamentos
  fetchThoughts: (experimentId: string) => Promise<void>;

  // Limpar estado
  reset: () => void;

  // Limpar erro
  clearError: () => void;
}

type ExperimentStore = ExperimentState & ExperimentActions;

const initialState: ExperimentState = {
  currentExperiment: null,
  status: "idle",
  agents: new Map(),
  results: null,
  thoughts: [],
  wsManager: null,
  experiments: [],
  error: null,
  currentVariant: null,
  totalAgents: 0,
  totalVariants: [],
};

export const useExperimentStore = create<ExperimentStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      createExperiment: async (config) => {
        set({ status: "creating", error: null });

        try {
          const response = await apiClient.createExperiment(config);
          const experiment = await apiClient.getExperiment(response.id);

          set({
            currentExperiment: experiment,
            status: "idle",
          });
        } catch (error) {
          set({
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to create experiment",
          });
          throw error;
        }
      },

      loadExperiments: async () => {
        try {
          const response = await apiClient.listExperiments();
          set({ experiments: response.experiments as Experiment[] });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load experiments",
          });
        }
      },

      loadExperiment: async (experimentId) => {
        try {
          const experiment = await apiClient.getExperiment(experimentId);
          set({ currentExperiment: experiment });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load experiment",
          });
        }
      },

      runExperiment: async (experimentId) => {
        const { connectWebSocket } = get();

        set({ status: "running", error: null, agents: new Map() });

        try {
          // Conecta ao WebSocket primeiro
          await connectWebSocket(experimentId);

          // Inicia o experimento
          await apiClient.runExperiment(experimentId);
        } catch (error) {
          set({
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to run experiment",
          });
          throw error;
        }
      },

      connectWebSocket: async (experimentId) => {
        const { wsManager, disconnectWebSocket } = get();

        // Desconecta WebSocket existente se houver
        if (wsManager) {
          disconnectWebSocket();
        }

        const newWsManager = new WebSocketManager(experimentId);

        // Registra handlers para eventos
        newWsManager.on("experiment.started", (event) => {
          const data = event.data as ExperimentStartedData;
          set({
            totalAgents: data.total_agents,
            totalVariants: data.variants,
          });
        });

        newWsManager.on("agent.thinking", (event) => {
          const data = event.data as AgentThinkingData;
          const { agents } = get();
          const newAgents = new Map(agents);

          newAgents.set(data.agent_name, {
            name: data.agent_name,
            variant: data.variant,
            status: "thinking",
          });

          set({
            agents: newAgents,
            currentVariant: data.variant,
          });
        });

        newWsManager.on("agent.typing", (event) => {
          const data = event.data as AgentTypingData;
          const { agents } = get();
          const newAgents = new Map(agents);

          const agent = newAgents.get(data.agent_name);
          if (agent) {
            agent.status = "typing";
            agent.partialText = data.partial_text;
          }

          set({ agents: newAgents });
        });

        newWsManager.on("agent.responded", (event) => {
          const data = event.data as AgentRespondedData;
          const { agents } = get();
          const newAgents = new Map(agents);

          const completedAgent: AgentState = {
            name: data.agent_name,
            variant: data.variant,
            status: "completed",
            score: data.score,
            analysis: data.analysis,
            thoughts: data.agent_thoughts,
          };
          newAgents.set(data.agent_name, completedAgent);

          set({ agents: newAgents });
        });

        newWsManager.on("variant.completed", (event) => {
          const data = event.data as VariantCompletedData;
          console.log("Variant completed:", data.variant);
        });

        newWsManager.on("experiment.completed", async (event) => {
          const data = event.data as ExperimentCompletedData;
          set({ status: "completed" });

          // Busca resultados e pensamentos automaticamente
          const { fetchResults, fetchThoughts } = get();
          await Promise.all([fetchResults(data.experiment_id), fetchThoughts(data.experiment_id)]);
        });

        newWsManager.on("error", (event) => {
          const data = event.data as { message: string };
          set({
            status: "failed",
            error: data.message,
          });
        });

        newWsManager.on("auth_error", (event) => {
          const data = event.data as { detail: string };
          set({
            status: "failed",
            error: `Authentication failed: ${data.detail}`,
          });
        });

        set({ wsManager: newWsManager });

        // Conecta ao WebSocket
        await newWsManager.connect();
      },

      disconnectWebSocket: () => {
        const { wsManager } = get();
        if (wsManager) {
          wsManager.disconnect();
          set({ wsManager: null });
        }
      },

      fetchResults: async (experimentId) => {
        try {
          const results = await apiClient.getResults(experimentId);
          set({ results });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to fetch results",
          });
        }
      },

      fetchThoughts: async (experimentId) => {
        try {
          const thoughts = await apiClient.getThoughts(experimentId);
          set({ thoughts });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to fetch thoughts",
          });
        }
      },

      reset: () => {
        const { disconnectWebSocket } = get();
        disconnectWebSocket();
        set(initialState);
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "experiment-store",
    },
  ),
);
