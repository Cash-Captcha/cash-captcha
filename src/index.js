// index.js - entrypoint for the cashcaptcha library
/**
 * This module exports the Solver class.
 * @module Solver
 */
export { Solver } from "./solver.js";

/**
 * This module exports the Rewards class.
 * You can optionally use this class to display rewards information and claim rewards.
 * This is useful if you want to build a UI showing the amount of rewards earned.
 * @module Rewards
 */
export { Rewards } from "./rewards.js";

/**
 * This module exports the Register class.
 * You can optionally use this class to register your users as unique entities.
 * This is useful if you want to allow your users to claim the rewards they've earned for themselves.
 * @module Register
 */
export { Register } from "./register.js";

/**
 * This module exports the categorizeDevicePerformance function.
 * You can optionally use this function to check the "performance level" of a device.
 * This is useful if you want to further customize the minimum performance behavior of the Solver.
 * @module categorizeDevicePerformance
 */
export { categorizeDevicePerformance } from "./devices.js";

/**
 * This module exports the createConfig function.
 * You can use this function to create a config object.
 * The config object can optionally be used to configure the Solver.
 * @module createConfig
 */
export { createConfig } from "./config.js";
