/**
 * Utility functions for encryption and decryption of sensitive data
 * Uses Web Crypto API for secure cryptographic operations
 */

// Encryption constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATION_COUNT = 100000;

/**
 * Get the appropriate crypto object for current environment
 * Works in both browser and service worker contexts
 */
function getCrypto() {
  // Service worker and background script environment
  if (typeof crypto !== 'undefined') {
    return crypto;
  }
  // Browser environment
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  // Fallback (should never happen in modern browsers)
  throw new Error('Web Crypto API is not available in this environment');
}

/**
 * Get text encoder/decoder that works in all environments
 */
const getTextEncoder = () => new TextEncoder();
const getTextDecoder = () => new TextDecoder();

/**
 * Generate an encryption key from a password and salt using PBKDF2
 * @param password Password string
 * @param salt Salt as Uint8Array
 * @returns CryptoKey
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoObj = getCrypto();
  
  // Convert password to buffer
  const passwordBuffer = getTextEncoder().encode(password);
  
  // Import password as a key
  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive actual encryption key
  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATION_COUNT,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get extension-specific encryption password
 * Uses extension ID as the basis for a stable password
 * @returns Password string
 */
function getExtensionPassword(): string {
  // Use extension ID as a basis for stable encryption password
  try {
    const extensionId = chrome.runtime.id || 'default-extension-id';
    return `zunda-metan-secure-key-${extensionId}`;
  } catch (e) {
    // Fallback if runtime ID is not available
    return `zunda-metan-secure-key-default`;
  }
}

/**
 * Encrypt a text string
 * @param plaintext Text to encrypt
 * @returns Encrypted data as base64 string
 */
export async function encryptText(plaintext: string): Promise<string> {
  try {
    const cryptoObj = getCrypto();
    
    // Generate salt and IV
    const salt = cryptoObj.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = cryptoObj.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive key
    const key = await deriveKey(getExtensionPassword(), salt);
    
    // Encrypt data
    const dataBuffer = getTextEncoder().encode(plaintext);
    const encryptedBuffer = await cryptoObj.subtle.encrypt(
      {
        name: ALGORITHM,
        iv
      },
      key,
      dataBuffer
    );
    
    // Combine all parts (salt + iv + encrypted data)
    const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
    
    // Convert to base64 for storage - handling large arrays safely
    const fromCharCodes = (bytes: Uint8Array): string => {
      const chunks: string[] = [];
      const chunkSize = 0x8000; // 32KB chunks to avoid callstack limits
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
      }
      
      return chunks.join('');
    };
    
    return btoa(fromCharCodes(result));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt an encrypted string
 * @param encryptedText Encrypted data as base64 string
 * @returns Decrypted plaintext
 */
export async function decryptText(encryptedText: string): Promise<string> {
  try {
    const cryptoObj = getCrypto();
    
    // Convert base64 to buffer - handling large inputs safely
    const decodeBase64 = (base64: string): Uint8Array => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    };
    
    const encryptedBuffer = decodeBase64(encryptedText);
    
    // Extract salt, IV, and encrypted data
    const salt = encryptedBuffer.slice(0, SALT_LENGTH);
    const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const data = encryptedBuffer.slice(SALT_LENGTH + IV_LENGTH);
    
    // Derive key
    const key = await deriveKey(getExtensionPassword(), salt);
    
    // Decrypt data
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: ALGORITHM,
        iv
      },
      key,
      data
    );
    
    // Convert to text
    return getTextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    return ''; // Return empty string on failure
  }
}
