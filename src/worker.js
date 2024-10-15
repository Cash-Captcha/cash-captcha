// worker.js
import init, {
  WasmSolverMemory,
  hash_with_memory,
  difficulty,
} from "./drillx/pkg/drillx_wasm.js";
import { base64ToUint8Array, uint8ArrayToHex } from "./helpers.js";

// worker.js
const isNode = typeof self === "undefined" && typeof process !== "undefined";

let parentPort, workerData;

if (isNode) {
  const workerThreads = await import("worker_threads");
  parentPort = workerThreads.parentPort;
  workerData = workerThreads.workerData;
}

let wasmMemory;

/**
 * Initializes the solver memory by initializing the WebAssembly module and creating a new instance of WasmSolverMemory.
 * @returns {Promise<void>} A promise that resolves when the solver memory is initialized.
 */
async function initializeSolverMemory() {
  try {
    await init();
    wasmMemory = new WasmSolverMemory();
  } catch (error) {
    console.error("[initializeSolverMemory] Error initializing WASM:", error);
    sendMessage({ type: "error", message: error.message });
  }
}

/**
 * Sends a message to the appropriate context (Node.js or Web Worker).
 *
 * @param {any} message - The message to be sent.
 */
function sendMessage(message) {
  if (isNode) {
    parentPort.postMessage(message);
  } else {
    self.postMessage(message);
  }
}

/**
 * Handles incoming messages for the captcha worker.
 *
 * @param {Object} data - The data object containing the challenge parameters.
 * @param {string} data.challenge - The base64 encoded challenge string.
 * @param {number} data.nonceStart - The starting nonce value.
 * @param {number} data.nonceEnd - The ending nonce value.
 * @param {string} data.deadline - The deadline for solving the challenge.
 * @param {string} data.deviceId - The device identifier.
 * @returns {Promise<void>} - A promise that resolves when the message is handled.
 */
async function handleMessage(data) {
  const { challenge, nonceStart, nonceEnd, deadline, deviceId } = data;
  if (!wasmMemory) {
    try {
      await initializeSolverMemory();
    } catch (error) {
      console.error("[Worker] Error initializing WASM memory:", error);
      sendMessage({ type: "status", status: "Error initializing WASM memory" });
      return;
    }
  }

  try {
    const challengeArray = base64ToUint8Array(challenge);

    if (challengeArray.length !== 32) {
      throw new Error(
        `Invalid challenge length: ${challengeArray.length}. Expected 32 bytes.`
      );
    }

    const solution = await solveChallenge(
      challengeArray,
      nonceStart,
      nonceEnd,
      new Date(deadline)
    );

    if (solution) {
      sendMessage({ type: "solution", solution });
    } else {
      sendMessage({
        type: "status",
        status: "No solution found within the time limit",
      });
    }
  } catch (error) {
    console.error("[Worker] Error in captcha process:", error);
    sendMessage({
      type: "status",
      status: `Error in captcha process: ${error.message}`,
    });
  }
}

/**
 * Handles the message event from the main thread.
 * @param {MessageEvent} event - The message event containing the challenge data.
 */
if (isNode) {
  parentPort.on("message", handleMessage);
} else {
  self.onmessage = function (event) {
    handleMessage(event.data);
  };
}

/**
 * Solves a challenge by iterating through a range of nonces and finding the best solution.
 *
 * @param {Array} challengeArray - The challenge array to solve.
 * @param {number} nonceStart - The starting nonce value.
 * @param {number} nonceEnd - The ending nonce value.
 * @param {number} deadline - The deadline for solving the challenge.
 * @returns {Promise} - A promise that resolves with the best solution found.
 */
function solveChallenge(challengeArray, nonceStart, nonceEnd, deadline) {
  return new Promise((resolve) => {
    let bestSolution = null;
    let bestDifficulty = 0;
    let nonce = nonceStart;

    const startTime = Date.now();
    const target = 8;
    const totalSolvingTime = deadline - startTime;

    let lastUpdateTime = Date.now();
    const updateInterval = 100;

    let lastPostedSolution = null;

    function solutionIteration() {
      const currentTime = new Date();

      if (
        bestSolution &&
        (!lastPostedSolution ||
          bestSolution.difficulty > lastPostedSolution.difficulty)
      ) {
        sendMessage({
          type: "solution",
          solution: bestSolution,
        });
        lastPostedSolution = { ...bestSolution };
      }

      if (nonce <= nonceEnd && currentTime < deadline) {
        const nonceBytes = new Uint8Array(8);

        const timeRemaining = deadline - currentTime;
        const timeElapsed = currentTime - startTime;

        const highPart = Math.floor(nonce / 0x100000000);
        const lowPart = nonce >>> 0;

        const view = new DataView(nonceBytes.buffer);
        view.setUint32(0, lowPart, true);
        view.setUint32(4, highPart, true);

        if (!wasmMemory) {
          console.error("WasmSolverMemory is not initialized");
          sendMessage({
            type: "status",
            status: "Error: WasmSolverMemory is not initialized",
          });
          return;
        }

        try {
          const hash = hash_with_memory(wasmMemory, challengeArray, nonceBytes);
          const currentDifficulty = difficulty(hash.h);

          if (
            currentDifficulty >= target &&
            (!bestSolution || currentDifficulty > bestDifficulty)
          ) {
            bestSolution = {
              digest: Array.from(hash.d),
              nonce: Array.from(nonceBytes),
              difficulty: currentDifficulty,
              hash: Array.from(hash.h),
              challenge: Array.from(challengeArray),
            };
            bestDifficulty = currentDifficulty;
            sendMessage({
              type: "solution",
              solution: bestSolution,
            });

            sendMessage({
              type: "status",
              status: `New best solution found. Difficulty: ${currentDifficulty}`,
              bestDifficulty: currentDifficulty,
            });
          }
        } catch (error) {
          if (error.message !== "No solutions" && error.message) {
            console.error("[solveChallenge] Error in hash calculation:", error);
          }
        }

        if (nonce % 1000 === 0) {
          const noncesChecked = nonce - nonceStart + 1;
          const noncesPerSecond =
            (noncesChecked / (Date.now() - startTime)) * 1000;
        }

        const now = Date.now();
        if (now - lastUpdateTime >= updateInterval) {
          const noncesChecked = nonce - nonceStart + 1;
          const noncesPerSecond = (noncesChecked / (now - startTime)) * 1000;
          const noncesRemaining = nonceEnd - nonce + 1;
          sendMessage({
            type: "status",
            status: "Checking solutions...",
            noncesChecked: noncesChecked,
            noncesPerSecond: noncesPerSecond.toFixed(2),
            noncesRemaining: noncesRemaining,
            challenge: uint8ArrayToHex(Array.from(challengeArray)),
            nonceStart: nonceStart,
            nonceEnd: nonceEnd,
            totalSolvingTime: totalSolvingTime,
            timeRemaining: timeRemaining,
            timeElapsed: timeElapsed,
            bestDifficulty: bestDifficulty,
          });
          lastUpdateTime = now;
        }
        nonce += 1;
        setTimeout(solutionIteration, 0);
      } else {
        if (bestSolution) {
          sendMessage({
            type: "status",
            status: `Solving completed. Best solution found with difficulty: ${bestSolution.difficulty}`,
            bestDifficulty: bestSolution.difficulty,
          });
        } else {
          sendMessage({
            type: "status",
            status:
              "Solving completed. No solution found meeting the target difficulty.",
          });
        }
        resolve(bestSolution);
      }
    }

    solutionIteration();
  });
}
