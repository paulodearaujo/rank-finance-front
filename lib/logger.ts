import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const options: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  base: null, // don't auto-include pid/hostname
};

if (isDev) {
  // Only include pretty transport in dev; omit entirely in prod
  (options as unknown as { transport: unknown }).transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      singleLine: true,
    },
  };
}

export const logger = pino(options);
