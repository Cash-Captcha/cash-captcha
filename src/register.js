import axios from "axios";
import { logError, logDebug } from "./print.js";

/**
 * Represents a Register object.
 * @class
 */
export class Register {
  /**
   * Creates a new Register object.
   * @constructor
   * @param {string} apiKey - The API key of the parent user.
   * @param {string} claimKey - The claim key of the parent user.
   * @param {object} config - The configuration object.
   */
  constructor(apiKey, claimKey, config) {
    this.apiKey = apiKey;
    this.claimKey = claimKey;
    this.config = config;
  }

  /**
   * Registers a new user.
   * @async
   * @param {string} email - The email of the user being registered.
   * @param {string} [referredBy=""] - The referral code of the user who referred this user (optional).
   * @returns {Promise<object>} - The response data.
   * @throws {Error} - If there is an error registering the user.
   */
  async registerUser(email, referredBy = "") {
    logDebug(`Registering user with email: ${email}`);
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/captcha/new-user`,
        { email, referredBy },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": this.apiKey,
          },
        }
      );
      logDebug(`Response status: ${response.data.status}`);
      return response.data;
    } catch (error) {
      logError(`[registerUser] Error registering user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resets the claim key for a user.
   * @async
   * @param {string} userApiKey - The API key of the user being registered.
   * @returns {Promise<object>} - The response data.
   * @throws {Error} - If there is an error resetting the claim key.
   */
  async resetClaimKey(userApiKey) {
    logDebug(`Resetting claim key for user with API key: ${userApiKey}`);
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/captcha/new-claim-key`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": this.apiKey,
            "X-CLAIM-KEY": this.claimKey,
            "USER-API-KEY": userApiKey,
          },
        }
      );
      logDebug(`Response status: ${response.data.status}`);
      return response.data;
    } catch (error) {
      logError(`[resetClaimKey] Error resetting claim key: ${error.message}`);
      throw error;
    }
  }
}
