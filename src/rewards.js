import axios from "axios";
import { logError, logDebug } from "./print.js";

/**
 * Represents a Rewards object.
 */
export class Rewards {
  /**
   * Creates a new Rewards object.
   * @param {string} apiKey - The API key.
   * @param {string} claimKey - The claim key.
   * @param {object} config - The configuration object.
   */
  constructor(apiKey, claimKey, config) {
    this.apiKey = apiKey;
    this.claimKey = claimKey;
    this.config = config;
  }

  /**
   * Retrieves information about rewards.
   * @returns {Promise<object>} - The rewards information.
   */
  async info() {
    logDebug(`Fetching rewards info`);
    try {
      const response = await axios.get(`${this.config.apiUrl}/rewards/info`, {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
      });
      logDebug(`Response status: ${response.data.status}`);
      return response.data;
    } catch (error) {
      logError(`[info] Error fetching rewards info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves the rewards history.
   * @param {number} epoch - The epoch number.
   * @param {number} [page=0] - The page number.
   * @param {number} [itemsPerPage=10] - The number of items per page.
   * @returns {Promise<object>} - The rewards history.
   */
  async history(epoch, page = 0, itemsPerPage = 10) {
    try {
      logDebug(`Fetching rewards history for epoch: ${epoch}`);
      const response = await axios.get(
        `${this.config.apiUrl}/rewards/history`,
        {
          params: {
            epoch,
            offset: page * itemsPerPage,
            limit: itemsPerPage,
          },
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": this.apiKey,
          },
        }
      );
      logDebug(`Response status: ${response.data.status}`);
      return response.data;
    } catch (error) {
      logError(`[history] Error fetching rewards history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initiates a rewards claim.
   * @param {number} amount - The amount to claim.
   * @param {string} withdrawalToken - The withdrawal token.
   * @param {string} withdrawalAddress - The withdrawal address.
   * @returns {Promise<object>} - The claim response.
   */
  async claim(amount, withdrawalToken, withdrawalAddress) {
    logDebug(`Initiating rewards claim with amount: ${amount}`);
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/rewards/claim`,
        {
          amount,
          withdrawalToken,
          withdrawalAddress,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": this.apiKey,
            "X-CLAIM-KEY": this.claimKey,
          },
        }
      );
      logDebug(`Response status: ${response.data.status}`);
      return response.data;
    } catch (error) {
      logError(`[claim] Error claiming rewards: ${error.message}`);
      throw error;
    }
  }
}
