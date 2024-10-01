// api.js
import axios from "axios";
import init, { is_valid_solution } from "./drillx/pkg/drillx_wasm.js";

/**
 * Fetches a challenge from the backend API.
 * @param {string} apiKey - The API key to authenticate the request.
 * @param {Object} config - The configuration object.
 * @param {Function} emitStatus - Function to emit status updates.
 * @returns {Promise<Object|null>} - A promise that resolves to the challenge data if successful, or null if there was an error.
 */
export async function getChallenge(apiKey, config, emitStatus) {
  emitStatus("Fetching challenge");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const captchaWorkerId = sessionStorage.getItem("captchaWorkerId");
  const params = new URLSearchParams();
  if (captchaWorkerId) {
    params.append("captchaWorkerId", captchaWorkerId);
  }

  try {
    const response = await axios.get(
      `${config.apiUrl}/captcha/challenge?${params}`,
      {
        headers: { "X-API-KEY": apiKey },
      }
    );

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
      sessionStorage.setItem("captchaWorkerId", response.data.captchaWorkerId);
    }
    return response.data;
  } catch (error) {
    console.error("[getChallenge] Error fetching challenge:", error);
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
    await init();
    const challengeArray = new Uint8Array(
      atob(challenge)
        .split("")
        .map((char) => char.charCodeAt(0))
    );
    const solutionArray = new Uint8Array([
      ...solution.digest,
      ...solution.nonce,
    ]);

    if (challengeArray.length !== 32 || solutionArray.length !== 24) {
      console.error("[submitSolution] Invalid input lengths");
      return null;
    }

    let isValid;
    try {
      isValid = is_valid_solution(challengeArray, solutionArray);
    } catch (error) {
      console.error("[submitSolution] Error validating solution:", error);
      return null;
    }

    if (!isValid) {
      console.error("[submitSolution] Invalid solution, not submitting");
      return null;
    }
    const captchaWorkerId = sessionStorage.getItem("captchaWorkerId");
    const params = new URLSearchParams();
    if (captchaWorkerId) {
      params.append("captchaWorkerId", captchaWorkerId);
    }

    const response = await axios.post(
      `${config.apiUrl}/captcha/solution?${params}`,
      solution,
      {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    emitStatus("Solution submitted");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return response.data;
  } catch (error) {
    emitStatus("Error submitting solution");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return null;
  }
}
