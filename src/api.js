import axios from "axios";
import init, { is_valid_solution } from "./drillx/pkg/drillx_wasm.js";
import { logError, logDebug } from "./print.js";

const isNode = typeof window === "undefined" && typeof process !== "undefined";

let Buffer, fs, path, fileURLToPath;
if (isNode) {
  Buffer = (await import("buffer")).Buffer;
  fs = await import("fs");
  path = await import("path");
  fileURLToPath = (await import("url")).fileURLToPath;
}

const storage = isNode ? new Map() : sessionStorage;

let wasmModule;

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
  if (config.nonceRangeSize) {
    params.append("nonceRangeSize", config.nonceRangeSize);
  } else {
    params.append("nonceRangeSize", 1000);
  }

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
    let challengeArray;
    if (isNode) {
      challengeArray = new Uint8Array(Buffer.from(challenge, "base64"));
    } else {
      challengeArray = new Uint8Array(
        atob(challenge)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
    }
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
