/**
 * Cliente API para comunicação com o backend
 */

import { config, defaultHeaders } from "@/lib/config";
import type {
  AgentThought,
  Experiment,
  ExperimentConfig,
  ExperimentCreateResponse,
  ExperimentResults,
  HealthCheckResponse,
  ListExperimentsResponse,
  RunExperimentResponse,
} from "./types";

export class APIClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(apiKey?: string) {
    this.baseUrl = config.api.baseUrl;
    this.headers = {
      ...defaultHeaders,
      ...(apiKey && { "X-API-Key": apiKey }),
    };
  }

  /**
   * Realiza uma requisição HTTP
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: `HTTP error! status: ${response.status}`,
        }));

        throw new Error(error.detail || `Request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unknown error occurred");
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>("/health");
  }

  /**
   * Criar novo experimento
   */
  async createExperiment(config: ExperimentConfig): Promise<ExperimentCreateResponse> {
    return this.request<ExperimentCreateResponse>("/experiments", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  /**
   * Listar todos os experimentos
   */
  async listExperiments(): Promise<ListExperimentsResponse> {
    return this.request<ListExperimentsResponse>("/experiments");
  }

  /**
   * Buscar experimento específico
   */
  async getExperiment(experimentId: string): Promise<Experiment> {
    return this.request<Experiment>(`/experiments/${experimentId}`);
  }

  /**
   * Iniciar execução do experimento
   */
  async runExperiment(experimentId: string): Promise<RunExperimentResponse> {
    return this.request<RunExperimentResponse>(`/experiments/${experimentId}/run`, {
      method: "POST",
    });
  }

  /**
   * Buscar resultados do experimento
   */
  async getResults(experimentId: string): Promise<ExperimentResults> {
    return this.request<ExperimentResults>(`/experiments/${experimentId}/results`);
  }

  /**
   * Buscar pensamentos dos agentes
   */
  async getThoughts(experimentId: string): Promise<AgentThought[]> {
    return this.request<AgentThought[]>(`/experiments/${experimentId}/thoughts`);
  }
}

// Instância singleton para uso global
export const apiClient = new APIClient();
