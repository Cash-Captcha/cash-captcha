// print.js
import { getGlobalConfig } from "./config.js";

const isNode = typeof window === "undefined" && typeof process !== "undefined";

if (isNode) {
  const dotenv = await import("dotenv");
  dotenv.config();
}

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function log(level, message) {
  const config = getGlobalConfig();
  const LOG_LEVEL = config.logLevel || "info";
  if (logLevels[level] <= logLevels[LOG_LEVEL]) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    const emoji = {
      error: "🟥",
      warn: "🟧",
      info: "🟨",
      debug: "🟪",
    };
    console.log(`${emoji[level]} ${formattedMessage}`);
  }
}

export function logError(message) {
  log("error", message);
}

export function logWarn(message) {
  log("warn", message);
}

export function logInfo(message) {
  log("info", message);
}

export function logDebug(message) {
  log("debug", message);
}
