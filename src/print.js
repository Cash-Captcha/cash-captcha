import dotenv from "dotenv";
import { getGlobalConfig } from "./config.js";

dotenv.config();

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Logs a message with a specified log level.
 *
 * @param {string} level - The log level (e.g., "error", "warn", "info", "debug").
 * @param {string} message - The message to log.
 */
function log(level, message) {
  const config = getGlobalConfig();
  const LOG_LEVEL = config.logLevel || "info";
  if (logLevels[level] <= logLevels[LOG_LEVEL]) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    //message emoji
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
