/**
 * Gerenciador de WebSocket para streaming em tempo real
 */

import { config } from "@/lib/config";
import type { WebSocketEvent, WebSocketEventType } from "./types";

export type WebSocketEventHandler = (event: WebSocketEvent) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private apiKey: string;
  private handlers: Map<WebSocketEventType | "*", Set<WebSocketEventHandler>>;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;

  constructor(experimentId: string, apiKey?: string) {
    this.url = `${config.api.wsBaseUrl}/ws/experiments/${experimentId}`;
    this.apiKey = apiKey || config.api.apiKey;
    this.handlers = new Map();
  }

  /**
   * Conecta ao WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;

          // Envia a chave API como primeira mensagem
          this.ws?.send(this.apiKey);

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket closed");

          // Tenta reconectar se não foi fechamento intencional
          if (!this.isIntentionallyClosed) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Tenta reconectar ao WebSocket
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      this.emit({
        event: "error",
        data: { message: "Failed to reconnect after multiple attempts" },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * 2 ** (this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }

  /**
   * Processa mensagem recebida
   */
  private handleMessage(event: WebSocketEvent) {
    // Emite para handlers específicos do tipo de evento
    const typeHandlers = this.handlers.get(event.event);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => handler(event));
    }

    // Emite para handlers globais
    const globalHandlers = this.handlers.get("*");
    if (globalHandlers) {
      globalHandlers.forEach((handler) => handler(event));
    }
  }

  /**
   * Registra um handler para eventos
   */
  on(eventType: WebSocketEventType | "*", handler: WebSocketEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)?.add(handler);
  }

  /**
   * Remove um handler
   */
  off(eventType: WebSocketEventType | "*", handler: WebSocketEventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  /**
   * Emite um evento manualmente (útil para testes)
   */
  private emit(event: WebSocketEvent) {
    this.handleMessage(event);
  }

  /**
   * Fecha a conexão WebSocket
   */
  disconnect() {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Envia mensagem (se necessário para funcionalidades futuras)
   */
  send(data: unknown) {
    if (this.isConnected()) {
      this.ws?.send(JSON.stringify(data));
    } else {
      console.error("WebSocket is not connected");
    }
  }
}
