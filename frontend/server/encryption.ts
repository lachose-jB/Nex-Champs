import CryptoJS from "crypto-js";

/**
 * Encryption Module - Handles data encryption and decryption
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production";
const ALGORITHM = "AES-256-GCM";

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("[Encryption] Failed to encrypt data:", error);
    throw error;
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt data:", error);
    throw error;
  }
}

/**
 * Encrypt JSON object
 */
export function encryptJSON(obj: Record<string, unknown>): string {
  try {
    const jsonString = JSON.stringify(obj);
    return encryptData(jsonString);
  } catch (error) {
    console.error("[Encryption] Failed to encrypt JSON:", error);
    throw error;
  }
}

/**
 * Decrypt JSON object
 */
export function decryptJSON<T>(encryptedData: string): T {
  try {
    const jsonString = decryptData(encryptedData);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt JSON:", error);
    throw error;
  }
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data: string): string {
  try {
    const hash = CryptoJS.SHA256(data).toString();
    return hash;
  } catch (error) {
    console.error("[Encryption] Failed to hash data:", error);
    throw error;
  }
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hash: string): boolean {
  try {
    const computedHash = hashData(data);
    return computedHash === hash;
  } catch (error) {
    console.error("[Encryption] Failed to verify hash:", error);
    return false;
  }
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  try {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    console.error("[Encryption] Failed to generate token:", error);
    throw error;
  }
}

/**
 * Encrypt sensitive fields in an object
 */
export function encryptSensitiveFields(
  obj: Record<string, unknown>,
  fieldsToEncrypt: string[]
): Record<string, unknown> {
  const encrypted = { ...obj };

  for (const field of fieldsToEncrypt) {
    if (field in encrypted && typeof encrypted[field] === "string") {
      encrypted[field] = encryptData(encrypted[field] as string);
    }
  }

  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 */
export function decryptSensitiveFields(
  obj: Record<string, unknown>,
  fieldsToDecrypt: string[]
): Record<string, unknown> {
  const decrypted = { ...obj };

  for (const field of fieldsToDecrypt) {
    if (field in decrypted && typeof decrypted[field] === "string") {
      try {
        decrypted[field] = decryptData(decrypted[field] as string);
      } catch (error) {
        console.warn(`[Encryption] Failed to decrypt field ${field}:`, error);
      }
    }
  }

  return decrypted;
}
