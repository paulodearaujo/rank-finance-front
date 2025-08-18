import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const options: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  base: null, // don't auto-include pid/hostname
};

// Pretty transport can spawn a worker thread via thread-stream, which breaks under
// certain Next.js dev/RSC bundling scenarios. Keep it opt-in to avoid crashes.
const enablePretty = isDev && process.env.PINO_PRETTY === "1";
if (enablePretty) {
  try {
    (options as unknown as { transport: unknown }).transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        singleLine: true,
      },
    };
  } catch {
    // Fallback silently to plain JSON logs
  }
}

export const logger = pino(options);
