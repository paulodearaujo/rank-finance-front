/**
 * Configuração da aplicação
 * Este arquivo centraliza todas as configurações de API e ambiente
 */

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000",
    apiKey: process.env.NEXT_PUBLIC_API_KEY || "sk-infinitepay-test-key-do-not-use-in-production",
    timeout: 30000, // 30 segundos
  },
  environment: process.env.NEXT_PUBLIC_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
} as const;

// Headers padrão para requisições
export const defaultHeaders = {
  "Content-Type": "application/json",
  "X-API-Key": config.api.apiKey,
} as const;
