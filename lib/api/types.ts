/**
 * Tipos TypeScript para a API de A/B Testing
 */

// ====== Mensagens e Experimentos ======

export interface ABTestMessage {
  hook: string;
  body: string;
  cta?: string;
}

export interface ExperimentConfig {
  name: string;
  description?: string;
  context: string;
  control: ABTestMessage;
  variant_a: ABTestMessage;
  variant_b?: ABTestMessage;
  variant_c?: ABTestMessage;
  variant_d?: ABTestMessage;
  variant_e?: ABTestMessage;
  sample_size?: number;
}

export interface ExperimentCreateResponse {
  id: string;
  name: string;
  status: ExperimentStatus;
  created_at: string;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  context?: string;
  status: ExperimentStatus;
  config: {
    control: ABTestMessage;
    variant_a: ABTestMessage;
    variant_b?: ABTestMessage;
    [key: string]: ABTestMessage | undefined;
  };
  created_at: string;
  completed_at?: string;
}

export type ExperimentStatus = "created" | "running" | "completed" | "failed" | "cancelled";

// ====== Resultados ======

export interface VariantResult {
  scores: number[];
  mean: number;
  std_dev: number;
  confidence_interval: [number, number];
}

export interface ExperimentResults {
  control: VariantResult;
  variant_a: VariantResult;
  variant_b?: VariantResult;
  [key: string]: VariantResult | undefined | string | number;
  winner: string;
  statistical_significance: number;
}

// ====== Pensamentos dos Agentes ======

export interface AgentThought {
  agent_name: string;
  variant: "control" | "variant_a" | "variant_b" | "variant_c" | "variant_d" | "variant_e";
  timestamp: string;
  score: number;
  intent: "sim" | "não" | "talvez";
  concerns: string;
  positive_aspects: string;
  user_message: string;
  think: string;
  talk: string;
}

export interface AgentAnalysis {
  intent: "sim" | "não" | "talvez";
  concerns: string;
  positive_aspects: string;
}

// ====== WebSocket Events ======

export type WebSocketEventType =
  | "connected"
  | "auth_error"
  | "experiment.started"
  | "agent.thinking"
  | "agent.typing"
  | "agent.responded"
  | "variant.completed"
  | "experiment.completed"
  | "error";

export interface WebSocketEvent<T = unknown> {
  event: WebSocketEventType;
  data: T;
  timestamp: string;
}

export interface ExperimentStartedData {
  experiment_id: string;
  total_agents: number;
  variants: string[];
}

export interface AgentThinkingData {
  agent_name: string;
  variant: string;
}

export interface AgentTypingData {
  agent_name: string;
  partial_text: string;
}

export interface AgentRespondedData {
  agent_name: string;
  variant: string;
  score: number;
  response_text: string;
  analysis: AgentAnalysis;
  agent_thoughts: {
    user_message: string;
    think: string;
    talk: string;
  };
}

export interface VariantCompletedData {
  variant: string;
  results: Array<{
    agent: string;
    score: number;
  }>;
}

export interface ExperimentCompletedData {
  experiment_id: string;
}

// ====== API Responses ======

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
}

export interface ListExperimentsResponse {
  experiments: Array<{
    id: string;
    name: string;
    status: ExperimentStatus;
    created_at: string;
    completed_at?: string;
  }>;
}

export interface RunExperimentResponse {
  message: string;
  experiment_id: string;
  status: ExperimentStatus;
}

// ====== Erros ======

export interface APIError {
  detail: string;
  status?: number;
  type?: string;
}
