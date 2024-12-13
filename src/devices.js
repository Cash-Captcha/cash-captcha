// devices.js
import { logDebug } from "./print.js";

const isNode = typeof window === "undefined" && typeof process !== "undefined";

let os;
if (isNode) {
  os = await import("os");
}

/**
 * Categorizes the device performance based on various device information.
 * @returns {Promise<{ category: number, deviceInfo: object }>} The device category and device information.
 */
export async function categorizeDevicePerformance() {
  if (isNode) {
    // Node.js environment
    const deviceInfo = {
      cores: os.cpus().length,
      memory: os.totalmem() / (1024 * 1024 * 1024), // Convert to GB
      isNode: true,
    };

    // Simple categorization for Node.js
    let category = 0;
    if (deviceInfo.cores >= 8 && deviceInfo.memory >= 16) {
      category = 0; // High-performance
    } else if (deviceInfo.cores >= 4 && deviceInfo.memory >= 8) {
      category = 1; // Moderate performance
    } else if (deviceInfo.cores >= 2 && deviceInfo.memory >= 4) {
      category = 2; // Low performance
    } else {
      category = 3; // Very low performance
    }

    logDebug(`Device category: ${category}`);

    return { category, deviceInfo };
  } else {
    const userAgent = navigator.userAgent;

    // Check if the user is Googlebot or Bingbot
    if (/Googlebot|bingbot/i.test(userAgent)) {
      return {
        category: 5,
        deviceInfo: {
          isBot: true,
          userAgent,
        },
      };
    }

    const deviceInfo = {
      cores: navigator.hardwareConcurrency || 1, // Default to 1 core if not available
      memory:
        typeof navigator.deviceMemory !== "undefined"
          ? navigator.deviceMemory
          : null, // Skip if not available
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
      },
      isMobile:
        /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        ),
      connectionType: navigator.connection
        ? navigator.connection.effectiveType
        : "unknown",
      batteryLevel: 1, // Default to full battery
      batteryCharging: true, // Default to charging
    };

    // Fetch additional battery information (if available)
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        deviceInfo.batteryLevel = battery.level;
        deviceInfo.batteryCharging = battery.charging;
      } catch (error) {
        logDebug(`Error getting battery info: ${error.message}`);
      }
    }

    // Define helper functions for performance checks

    /**
     * Checks if the device has high number of cores and memory.
     * @returns {boolean} True if the device has high number of cores and memory, false otherwise.
     */
    const highCoresAndMemory = () =>
      deviceInfo.cores >= 8 &&
      (deviceInfo.memory === null || deviceInfo.memory >= 8);

    /**
     * Checks if the device has moderate number of cores and memory.
     * @returns {boolean} True if the device has moderate number of cores and memory, false otherwise.
     */
    const midCoresAndMemory = () =>
      deviceInfo.cores >= 4 &&
      (deviceInfo.memory === null || deviceInfo.memory >= 4);

    /**
     * Checks if the device has low number of cores and memory.
     * @returns {boolean} True if the device has low number of cores and memory, false otherwise.
     */
    const lowCoresAndMemory = () =>
      deviceInfo.cores < 4 ||
      (deviceInfo.memory !== null && deviceInfo.memory < 4);

    /**
     * Checks if the device has a fast connection.
     * @returns {boolean} True if the device has a fast connection, false otherwise.
     */
    const fastConnection = () =>
      ["4g", "wifi"].includes(deviceInfo.connectionType) ||
      deviceInfo.connectionType === "unknown"; // Assume unknown connections are fast

    /**
     * Checks if the device has a slow connection.
     * @returns {boolean} True if the device has a slow connection, false otherwise.
     */
    const slowConnection = () =>
      ["2g", "slow-2g"].includes(deviceInfo.connectionType);

    /**
     * Checks if the device has a moderate connection.
     * @returns {boolean} True if the device has a moderate connection, false otherwise.
     */
    const moderateConnection = () => deviceInfo.connectionType === "3g";

    /**
     * Checks if the device is a high-end mobile device.
     * @returns {boolean} True if the device is a high-end mobile device, false otherwise.
     */
    const isHighEndMobile = () =>
      deviceInfo.isMobile && deviceInfo.cores >= 6 && deviceInfo.memory >= 4;

    /**
     * Checks if the device has a large screen.
     * @returns {boolean} True if the device has a large screen, false otherwise.
     */
    const largeScreen = () =>
      deviceInfo.screenSize.width >= 1920 &&
      deviceInfo.screenSize.height >= 1080; // Assume large screens are high-performance desktop or laptop

    /**
     * Checks if the device has low battery level and is not charging.
     * @returns {boolean} True if the device has low battery level and is not charging, false otherwise.
     */
    const lowBattery = () =>
      deviceInfo.batteryLevel < 0.2 && !deviceInfo.batteryCharging;

    // Categorization logic based on the collected device information
    let category = 0;

    // Check for low battery first
    if (lowBattery()) {
      category = 4; // Set as low-performance if the battery is under 20% and not charging
    } else if (slowConnection()) {
      category = 4; // Very slow connection, lowest priority
    } else if (
      highCoresAndMemory() &&
      fastConnection() &&
      !deviceInfo.isMobile &&
      largeScreen()
    ) {
      category = 0; // High-performance desktop/laptop with large screen and fast connection
    } else if (
      midCoresAndMemory() &&
      fastConnection() &&
      (!deviceInfo.isMobile || isHighEndMobile())
    ) {
      category = 1; // Moderate desktop or high-end mobile
    } else if (lowCoresAndMemory() || moderateConnection()) {
      category = 2; // Low-performance or mid-range mobile/low-end desktop
    } else {
      category = 3; // Very low-performance
    }

    logDebug(`Device category: ${category}`);

    return {
      category,
      deviceInfo,
    };
  }
}
