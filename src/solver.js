// solver.js
import { createConfig } from "./config.js";
import { categorizeDevicePerformance } from "./devices.js";
import { getChallenge, submitSolution } from "./api.js";

/**
 * Emits the solving status by dispatching a custom event.
 * @param {string} status - The status to be emitted.
 */
function emitStatus(status) {
  window.dispatchEvent(new CustomEvent("solvingStatus", { detail: status }));
}

/**
 * Starts the captcha solving process.
 *
 * @param {string} apiKey - The API key to be used for solving captchas.
 */
let shouldContinueSolving = true;
export function startSolving(apiKey) {
  shouldContinueSolving = true;
  solveLoop(apiKey);
}

/**
 * Stops the captcha solving process.
 */
export function stopSolving() {
  shouldContinueSolving = false;
}

/**
 * Solves the captcha challenge in a loop until stopped.
 *
 * @param {string} apiKey - The API key used for authentication.
 * @returns {Promise<void>} - A promise that resolves when the solving loop is completed.
 */
async function solveLoop(apiKey) {
  let loopsCompleted = 0;
  let runIndefinitely = true;
  const { category } = await categorizeDevicePerformance();
  if (category >= 3) {
    runIndefinitely = false;
  }
  while (runIndefinitely && shouldContinueSolving) {
    if (loopsCompleted === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    try {
      const challengeData = await getChallenge(apiKey);
      if (!challengeData) {
        console.error(
          "[solveLoop] Failed to get challenge, retrying in 30 seconds"
        );
        emitStatus("Failed to get challenge, retrying in 30 seconds");
        await new Promise((resolve) => setTimeout(resolve, 30000));
        continue;
      } else if (challengeData.status === "not_ready") {
        const retryDelay = challengeData.retryDelay || 30000;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      if (!shouldContinueSolving) break;

      emitStatus("Starting solution search");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const deadline = new Date(challengeData.deadline);
      const nextCheckIn = new Date(challengeData.nextCheckIn);

      if (isNaN(deadline.getTime()) || isNaN(nextCheckIn.getTime())) {
        console.error("[solveLoop] Invalid deadline or nextCheckIn time");
        emitStatus("Invalid deadline or nextCheckIn time");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      const solution = await runWorker(challengeData, deadline);

      if (solution) {
        emitStatus("Submitting solution");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const submissionResult = await submitSolution(
          apiKey,
          solution,
          challengeData.challenge
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        emitStatus("No solution found");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!shouldContinueSolving) break;

      const now = new Date();
      const timeToWait = Math.max(0, nextCheckIn.getTime() - now.getTime());

      emitStatus(
        `Waiting ${Math.round(timeToWait / 1000)} seconds until next check-in`
      );
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    } catch (error) {
      console.error("[solveLoop] Error in solving loop:", error);
      emitStatus("Error in solving loop");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    loopsCompleted++;
  }
}

/**
 * Runs a web worker to solve a challenge asynchronously.
 *
 * @param {any} challengeData - The challenge data to be sent to the worker.
 * @param {Date} deadline - The deadline for solving the challenge.
 * @returns {Promise<any>} A promise that resolves with the best solution found by the worker.
 */
function runWorker(challengeData, deadline) {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
    worker.postMessage(challengeData);

    const workDuration = Math.max(0, deadline.getTime() - Date.now());

    let bestSolution = null;

    const timeoutId = setTimeout(() => {
      emitStatus("Solve duration reached, terminating worker");
      worker.terminate();
      resolve(bestSolution);
    }, workDuration);

    worker.onmessage = function (event) {
      if (event.data.type === "status") {
        emitStatus(event.data.status);
        window.dispatchEvent(
          new CustomEvent("workerUpdate", { detail: event.data })
        );
      } else if (event.data.type === "solution") {
        if (
          !bestSolution ||
          event.data.solution.difficulty > bestSolution.difficulty
        ) {
          bestSolution = event.data.solution;
        }
      }
    };

    worker.onerror = function (error) {
      clearTimeout(timeoutId);
      console.error("[runWorker] Error in worker:", error);
      console.error("Detailed worker error:", error);
      console.error("Error message:", error.message);
      console.error("Error filename:", error.filename);
      console.error("Error lineno:", error.lineno);
      emitStatus("Error in worker");
      worker.terminate();
      resolve(bestSolution);
    };
  });
}

/**
 * Solver class for solving challenges using an API key and user configuration.
 */
export class Solver {
  constructor(apiKey, userConfig = {}) {
    this.apiKey = apiKey;
    this.config = createConfig(userConfig);
    this.shouldContinueSolving = false;
  }

  async start() {
    this.shouldContinueSolving = true;
    await this.solveLoop();
  }

  stop() {
    this.shouldContinueSolving = false;
  }

  async solveLoop() {
    let loopsCompleted = 0;
    const { category } = await categorizeDevicePerformance();
    const runIndefinitely = category < this.config.performanceThreshold;

    while (runIndefinitely && this.shouldContinueSolving) {
      if (loopsCompleted === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      try {
        const challengeData = await getChallenge(
          this.apiKey,
          this.config,
          this.emitStatus.bind(this)
        );
        if (!challengeData) {
          this.emitStatus("Failed to get challenge, retrying");
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay)
          );
          continue;
        }

        if (challengeData.status === "not_ready") {
          await new Promise((resolve) =>
            setTimeout(resolve, challengeData.retryDelay)
          );
          continue;
        }

        if (!this.shouldContinueSolving) break;

        this.emitStatus("Starting solution search");
        const solution = await runWorker(
          challengeData,
          new Date(challengeData.deadline)
        );

        if (solution) {
          this.emitStatus("Submitting solution");
          await submitSolution(
            this.apiKey,
            solution,
            challengeData.challenge,
            this.config,
            this.emitStatus.bind(this)
          );
        } else {
          this.emitStatus("No solution found");
        }

        if (!this.shouldContinueSolving) break;

        const nextCheckIn = new Date(challengeData.nextCheckIn);
        const now = new Date();
        const timeToWait = Math.max(0, nextCheckIn.getTime() - now.getTime());

        this.emitStatus(
          `Waiting ${Math.round(timeToWait / 1000)} seconds until next check-in`
        );
        await new Promise((resolve) => setTimeout(resolve, timeToWait));
      } catch (error) {
        console.error("[solveLoop] Error in solving loop:", error);
        this.emitStatus("Error in solving loop");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      loopsCompleted++;
    }
  }

  emitStatus(status) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("solvingStatus", { detail: status })
      );
    }
  }

  static initialize(apiKey, userConfig = {}) {
    const solver = new Solver(apiKey, userConfig);
    solver.start();
    return solver;
  }
}
