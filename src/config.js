// config.js

/**
 * Default configuration object for the application.
 *
 * @typedef {Object} DefaultConfig
 * @property {string} apiUrl - The API endpoint URL for the application. Use the default endpoint unless you have been provided with a custom endpoint by Cashcaptcha.
 * @property {string} logLevel - The log level for the application.
 * @property {number} maxRetries - The maximum number of retries for API requests.
 * @property {number} retryDelay - The delay (in milliseconds) between retries for API requests.
 * @property {number} performanceThreshold - The minimum performance threshold required to active the application ranging from 0 (high performance) to 4 (low performance).
 */

/**
 * Default configuration for the application.
 *
 * @type {DefaultConfig}
 */
const defaultConfig = {
  apiUrl: process.env.CASHCAPTCHA_API_ENDPOINT || "https://api.cashcaptcha.com",
  logLevel: "warn",
  maxRetries: 3,
  retryDelay: 5000,
  performanceThreshold: 3,
};

let cashCaptchaGlobalConfig = { ...defaultConfig };

export function setGlobalConfig(userConfig = {}) {
  cashCaptchaGlobalConfig = { ...defaultConfig, ...userConfig };
}

export function getGlobalConfig() {
  return cashCaptchaGlobalConfig;
}

export function createConfig(userConfig = {}) {
  return { ...defaultConfig, ...userConfig };
}
