import axios from "axios";
import init, { is_valid_solution } from "./drillx/pkg/drillx_wasm.js";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logError, logDebug } from "./print.js";

// Check if we're in a Node.js environment
const isNode = typeof window === "undefined" && typeof process !== "undefined";

// Create a storage object that works in both environments
const storage = isNode ? new Map() : sessionStorage;

let wasmModule;

// Initialize WASM module
async function initializeWasm() {
  if (wasmModule) return;

  if (isNode) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const wasmPath = path.join(
      __dirname,
      "drillx",
      "pkg",
      "drillx_wasm_bg.wasm"
    );
    const wasmBuffer = fs.readFileSync(wasmPath);
    wasmModule = await init(wasmBuffer);
  } else {
    wasmModule = await init();
  }
}

/**
 * Fetches a challenge from the backend API.
 * @param {string} apiKey - The API key to authenticate the request.
 * @param {Object} config - The configuration object.
 * @param {Function} emitStatus - Function to emit status updates.
 * @returns {Promise<Object|null>} - A promise that resolves to the challenge data if successful, or null if there was an error.
 */
export async function getChallenge(apiKey, config, emitStatus) {
  logDebug("Fetching challenge", config);
  emitStatus("Fetching challenge");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const captchaWorkerId = storage.getItem
    ? storage.getItem("captchaWorkerId")
    : storage.get("captchaWorkerId");
  const params = new URLSearchParams();
  if (captchaWorkerId) {
    params.append("captchaWorkerId", captchaWorkerId);
  }
  logDebug(`captchaWorkerId: ${captchaWorkerId}`);

  try {
    logDebug("Calling cash captcha API for challenge");
    const response = await axios.get(
      `${config.apiUrl}/captcha/challenge?${params.toString()}`,
      {
        headers: { "X-API-KEY": apiKey },
      }
    );
    logDebug(`response status: ${response.data.status}`);
    if (response.data.status === "not_ready") {
      const nextCheckIn = new Date(response.data.nextCheckIn);
      const now = new Date();
      const timeUntilNextCheckIn = nextCheckIn - now;

      emitStatus(
        `Waiting ${Math.ceil(
          timeUntilNextCheckIn / 1000
        )} seconds until next check-in`
      );

      return {
        status: "not_ready",
        retryDelay: timeUntilNextCheckIn,
        nextCheckIn: response.data.nextCheckIn,
      };
    }
    if (response.data.captchaWorkerId) {
      if (storage.setItem) {
        storage.setItem("captchaWorkerId", response.data.captchaWorkerId);
      } else {
        storage.set("captchaWorkerId", response.data.captchaWorkerId);
      }
    }
    return response.data;
  } catch (error) {
    logError(`[getChallenge] Error fetching challenge: ${error.message}`);
    emitStatus("Error fetching challenge");
    await new Promise((resolve) => setTimeout(resolve, 30000));
    return null;
  }
}

/**
 * Submits a solution to the backend API.
 * @param {string} apiKey - The API key for authentication.
 * @param {object} solution - The solution object containing the solution digest and nonce.
 * @param {string} challenge - The challenge string.
 * @param {Object} config - The configuration object.
 * @param {Function} emitStatus - Function to emit status updates.
 * @returns {Promise<object|null>} - A promise that resolves to the response data from the backend API, or null if there was an error.
 */
export async function submitSolution(
  apiKey,
  solution,
  challenge,
  config,
  emitStatus
) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  try {
    await initializeWasm();
    const challengeArray = new Uint8Array(Buffer.from(challenge, "base64"));
    const solutionArray = new Uint8Array([
      ...solution.digest,
      ...solution.nonce,
    ]);

    if (challengeArray.length !== 32 || solutionArray.length !== 24) {
      logError("[submitSolution] Invalid input lengths");
      emitStatus("Error: Invalid input lengths");
      return { status: "error", message: "Invalid input lengths" };
    }

    let isValid;
    try {
      isValid = is_valid_solution(challengeArray, solutionArray);
    } catch (error) {
      logError(`[submitSolution] Error validating solution: ${error.message}`);
      emitStatus(`Error validating solution: ${error.message}`);
      return {
        status: "error",
        message: `Error validating solution: ${error.message}`,
      };
    }

    if (!isValid) {
      logError("[submitSolution] Invalid solution, not submitting");
      emitStatus("Error: Invalid solution");
      return { status: "error", message: "Invalid solution" };
    }
    const captchaWorkerId = storage.getItem
      ? storage.getItem("captchaWorkerId")
      : storage.get("captchaWorkerId");
    const params = new URLSearchParams();
    if (captchaWorkerId) {
      params.append("captchaWorkerId", captchaWorkerId);
    }

    logDebug(`Calling cash captcha API to submit solution`);
    const response = await axios.post(
      `${config.apiUrl}/captcha/solution?${params.toString()}`,
      solution,
      {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    logDebug(`response status: ${response.data.status}`);
    emitStatus("Solution submitted successfully");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { status: "success", data: response.data };
  } catch (error) {
    logError(`[submitSolution] Error submitting solution: ${error.message}`);
    emitStatus(`Error submitting solution: ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { status: "error", message: error.message };
  }
}
