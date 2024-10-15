// solver.js
import { createConfig, setGlobalConfig } from "./config.js";
import { categorizeDevicePerformance } from "./devices.js";
import { getChallenge, submitSolution } from "./api.js";
import { fileURLToPath } from "url";
import path from "path";
import { Worker } from "worker_threads";
import { logInfo, logError, logWarn, logDebug } from "./print.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isNode = typeof window === "undefined" && typeof process !== "undefined";

setGlobalConfig();

/**
 * Emits the solving status by dispatching a custom event or logging.
 * @param {string} status - The status to be emitted.
 */
function emitStatus(status) {
  if (isNode) {
    logInfo(`Status: ${status}`);
  } else {
    logDebug(`Status: ${status}`);
    window.dispatchEvent(new CustomEvent("solvingStatus", { detail: status }));
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
    let worker;

    if (isNode) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      worker = new Worker(path.join(__dirname, "worker.js"), {
        workerData: challengeData,
        type: "module",
      });
    } else {
      worker = new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      });
      worker.postMessage(challengeData);
    }

    const workDuration = Math.max(0, deadline.getTime() - Date.now());

    let bestSolution = null;

    const timeoutId = setTimeout(() => {
      emitStatus("Solve duration reached, terminating worker");
      worker.terminate();
      logDebug(`Best solution found: ${JSON.stringify(bestSolution, null, 2)}`);
      resolve(bestSolution);
    }, workDuration);

    function handleMessage(event) {
      const data = isNode ? event : event.data;
      logInfo(`Received message from worker: ${JSON.stringify(data, null, 2)}`);
      if (data.type === "status") {
        emitStatus(data.status);
        if (!isNode) {
          window.dispatchEvent(
            new CustomEvent("workerUpdate", { detail: data })
          );
        }
      } else if (data.type === "solution") {
        if (
          !bestSolution ||
          data.solution.difficulty > bestSolution.difficulty
        ) {
          bestSolution = data.solution;
          logInfo(`New best solution: ${bestSolution}`);
        }
      }
    }

    function handleError(error) {
      clearTimeout(timeoutId);
      logError(`[runWorker] Error in worker: ${error.message}`);
      emitStatus("Error in worker");
      worker.terminate();
      resolve(bestSolution);
    }

    if (isNode) {
      worker.on("message", handleMessage);
      worker.on("error", handleError);
    } else {
      worker.onmessage = handleMessage;
      worker.onerror = handleError;
    }
  });
}

/**
 * Solver class for solving challenges using an API key and user configuration.
 */
export class Solver {
  constructor(apiKey, userConfig = {}) {
    this.apiKey = apiKey;
    this.config = createConfig(userConfig);
    setGlobalConfig(this.config);
    this.shouldContinueSolving = false;
  }

  async start() {
    logDebug(`Starting solver with API key: ${this.apiKey}`);
    this.shouldContinueSolving = true;
    await this.solveLoop();
  }

  stop() {
    this.shouldContinueSolving = false;
    logDebug(`Stopping solver with API key: ${this.apiKey}`);
  }

  async solveLoop() {
    logDebug(`Starting solve loop.`);
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
          logWarn(`Failed to get challenge, retrying`);
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

        logDebug(`Starting solution search`);
        this.emitStatus("Starting solution search");
        const solution = await runWorker(
          challengeData,
          new Date(challengeData.deadline)
        );

        if (solution) {
          logDebug(`Submitting solution`);
          this.emitStatus("Submitting solution");
          try {
            const submissionResult = await submitSolution(
              this.apiKey,
              solution,
              challengeData.challenge,
              this.config,
              this.emitStatus.bind(this)
            );
            logDebug(
              `Submission result: ${JSON.stringify(submissionResult, null, 2)}`
            );
            this.emitStatus(`Solution submitted: ${submissionResult.status}`);
          } catch (error) {
            logError(`Error submitting solution: ${error.message}`);
            this.emitStatus(`Error submitting solution: ${error.message}`);
          }
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
        logError(`[solveLoop] Error in solving loop: ${error.message}`);
        this.emitStatus("Error in solving loop");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      loopsCompleted++;
    }
  }

  emitStatus(status) {
    if (isNode) {
      logInfo(`Status: ${status}`);
    } else if (typeof window !== "undefined") {
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
