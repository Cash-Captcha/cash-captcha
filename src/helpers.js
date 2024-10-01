// helpers.js
import bs58 from "bs58";

/**
 * Converts a base64 string to a Uint8Array.
 *
 * @param {string} base64String - The base64 string to convert.
 * @returns {Uint8Array} The converted Uint8Array.
 */
export function base64ToUint8Array(base64String) {
  const binaryString = atob(base64String);
  return new Uint8Array(
    binaryString.split("").map((char) => char.charCodeAt(0))
  );
}

/**
 * Converts a Uint8Array to a hexadecimal string.
 *
 * @param {Uint8Array} uint8array - The Uint8Array to convert.
 * @returns {string} The hexadecimal string.
 */
export function uint8ArrayToHex(uint8array) {
  return Array.from(uint8array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hexadecimal string to a base58 encoded string.
 *
 * @param {string} hexString - The hexadecimal string to convert.
 * @returns {string} The base58 encoded string.
 */
export function hexToBase58(hexString) {
  const buffer = Buffer.from(hexString, "hex");
  const base58Encoded = bs58.encode(buffer);
  return base58Encoded;
}
