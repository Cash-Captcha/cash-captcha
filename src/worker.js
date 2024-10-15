// worker.js
const isNode = typeof self === "undefined" && typeof process !== "undefined";

let initWasm, WasmSolverMemory, hash_with_memory, difficulty;
let base64ToUint8Array, uint8ArrayToHex;
let parentPort, workerData;
let wasmMemory;

let logError, logDebug;

async function initializeWorker() {
  if (isNode) {
    const { parentPort: pp, workerData: wd } = await import("worker_threads");
    parentPort = pp;
    workerData = wd;

    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const drillxWasm = await import("./drillx/pkg/drillx_wasm.js");
    const helpers = await import("./helpers.js");
    const { logError: nodeLogError, logDebug: nodeLogDebug } = await import(
      "./print.js"
    );

    logError = nodeLogError;
    logDebug = nodeLogDebug;

    initWasm = drillxWasm.default;
    ({ WasmSolverMemory, hash_with_memory, difficulty } = drillxWasm);
    ({ base64ToUint8Array, uint8ArrayToHex } = helpers);

    global.initializeWasm = async function () {
      if (global.wasm) return;

      const wasmPath = path.join(
        __dirname,
        "drillx",
        "pkg",
        "drillx_wasm_bg.wasm"
      );
      const wasmBuffer = fs.readFileSync(wasmPath);

      global.wasm = await initWasm(wasmBuffer);
    };
  } else {
    self.importScripts(
      "./drillx/pkg/drillx_wasm.js",
      "./helpers.js",
      "./print.js"
    );
    initWasm = self.wasm_bindgen;
    ({ WasmSolverMemory, hash_with_memory, difficulty } = self.wasm_bindgen);
    ({ base64ToUint8Array, uint8ArrayToHex } = self);
    ({ logError, logDebug } = self);

    self.initializeWasm = async function () {
      if (self.wasm) return;

      await initWasm();
      self.wasm = { WasmSolverMemory, hash_with_memory, difficulty };
    };
  }

  await initializeSolverMemory();
  logDebug(`Worker initialized successfully`);

  // Set up message handling after initialization is complete
  if (isNode) {
    handleMessage(workerData);
  } else {
    self.onmessage = function (event) {
      handleMessage(event.data);
    };
  }
}

// Initialize the worker
initializeWorker()
  .then(() => {
    logDebug("Status: Worker initialized successfully");
  })
  .catch((error) => {
    logError(`Error initializing worker: ${error.message}`);
  });

async function initializeSolverMemory() {
  try {
    await (isNode ? global.initializeWasm() : self.initializeWasm());
    wasmMemory = new WasmSolverMemory();
  } catch (error) {
    logError(
      `[initializeSolverMemory] Error initializing WASM: ${error.message}`
    );
    sendMessage({ type: "error", message: error.message });
  }
}

function sendMessage(message) {
  if (isNode) {
    parentPort.postMessage(message);
  } else {
    self.postMessage(message);
  }
}

async function handleMessage(data) {
  logDebug(`Worker received message: ${JSON.stringify(data, null, 2)}`);
  const { challenge, nonceStart, nonceEnd, deadline, deviceId } = data;
  if (!wasmMemory) {
    try {
      await initializeSolverMemory();
    } catch (error) {
      logError(`[Worker] Error initializing WASM memory: ${error.message}`);
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

    logDebug("Starting solution search");
    const solution = await solveChallenge(
      challengeArray,
      nonceStart,
      nonceEnd,
      new Date(deadline)
    );

    if (solution) {
      logDebug(`Solution found: ${JSON.stringify(solution, null, 2)}`);
      sendMessage({ type: "solution", solution });
    } else {
      logDebug("No solution found within the time limit");
      sendMessage({
        type: "status",
        status: "No solution found within the time limit",
      });
    }
  } catch (error) {
    logError(`[Worker] Error in captcha process: ${error.message}`);
    sendMessage({
      type: "status",
      status: `Error in captcha process: ${error.message}`,
    });
  }
}

function solveChallenge(challengeArray, nonceStart, nonceEnd, deadline) {
  return new Promise((resolve) => {
    logDebug(`Starting solveChallenge`);
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
          logError("WasmSolverMemory is not initialized");
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
            logError(
              `[solveChallenge] Error in hash calculation: ${error.message}`
            );
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
