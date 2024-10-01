import axios from "axios";

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
    try {
      const response = await axios.get(`${this.config.apiUrl}/rewards/info`, {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error("[info] Error fetching rewards info:", error);
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
      return response.data;
    } catch (error) {
      console.error("[history] Error fetching rewards history:", error);
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
      return response.data;
    } catch (error) {
      console.error("[claim] Error claiming rewards:", error);
      throw error;
    }
  }
}
