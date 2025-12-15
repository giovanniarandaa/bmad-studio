/**
 * EncryptionUtil
 *
 * Handles encryption/decryption of sensitive data (API keys) using:
 * 1. keytar (system keychain) - PREFERRED for security
 * 2. Base64 encoding - FALLBACK for systems without keychain support
 *
 * Security Note:
 * - keytar stores credentials in OS keychain (Keychain on macOS, Credential Manager on Windows)
 * - Base64 is NOT encryption, only encoding. Used as last resort.
 * - Users are warned when fallback is used.
 */

const SERVICE_NAME = 'bmad-studio';
const FALLBACK_PREFIX = 'b64:'; // Prefix to identify base64-encoded values

let keytarModule: typeof import('keytar') | null = null;
let keytarAvailable: boolean | null = null;

/**
 * Lazy-load keytar and check if it's available
 * Keytar may fail on Linux systems without gnome-keyring or libsecret
 */
async function loadKeytar(): Promise<boolean> {
  if (keytarAvailable !== null) {
    return keytarAvailable;
  }

  try {
    keytarModule = await import('keytar');

    // Test if keytar actually works by attempting a simple operation
    const testKey = '__bmad_keytar_test__';
    await keytarModule.setPassword(SERVICE_NAME, testKey, 'test');
    await keytarModule.deletePassword(SERVICE_NAME, testKey);

    keytarAvailable = true;
    console.log('✅ EncryptionUtil: keytar is available - using system keychain');
    return true;
  } catch (error) {
    keytarAvailable = false;
    console.warn('⚠️  EncryptionUtil: keytar not available, falling back to base64 encoding');
    console.warn('   This is NOT secure. API keys will be stored as encoded text.');
    console.warn('   Error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Check if keytar is available on this system
 */
export async function isKeytarAvailable(): Promise<boolean> {
  return await loadKeytar();
}

/**
 * Encrypt a value using keytar or fallback to base64
 *
 * @param key - Identifier for this secret (e.g., 'openai', 'google')
 * @param value - The secret value to encrypt
 * @returns Encrypted value or base64-encoded value with prefix
 */
export async function encrypt(key: string, value: string): Promise<string> {
  const isAvailable = await loadKeytar();

  if (isAvailable && keytarModule) {
    try {
      // Store in system keychain
      await keytarModule.setPassword(SERVICE_NAME, key, value);

      // Return a token indicating keytar storage
      // The actual value is in the keychain, not in DB
      return `keytar:${key}`;
    } catch (error) {
      console.error('❌ EncryptionUtil: keytar.setPassword() failed, using fallback', error);
      // Fall through to base64 fallback
    }
  }

  // Fallback: base64 encoding (NOT secure)
  const encoded = Buffer.from(value, 'utf-8').toString('base64');
  return `${FALLBACK_PREFIX}${encoded}`;
}

/**
 * Decrypt a value using keytar or base64
 *
 * @param key - Identifier for this secret
 * @param encryptedValue - The encrypted/encoded value from encrypt()
 * @returns Decrypted value
 */
export async function decrypt(key: string, encryptedValue: string): Promise<string> {
  // Check if it's a keytar-stored value
  if (encryptedValue.startsWith('keytar:')) {
    const isAvailable = await loadKeytar();

    if (!isAvailable || !keytarModule) {
      throw new Error('Cannot decrypt: keytar is not available but value was encrypted with keytar');
    }

    try {
      const storedKey = encryptedValue.replace('keytar:', '');
      const value = await keytarModule.getPassword(SERVICE_NAME, storedKey);

      if (value === null) {
        throw new Error(`Cannot decrypt: no value found in keychain for key "${storedKey}"`);
      }

      return value;
    } catch (error) {
      console.error('❌ EncryptionUtil: keytar.getPassword() failed', error);
      throw error;
    }
  }

  // Check if it's a base64-encoded value
  if (encryptedValue.startsWith(FALLBACK_PREFIX)) {
    try {
      const encoded = encryptedValue.replace(FALLBACK_PREFIX, '');
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      return decoded;
    } catch (error) {
      console.error('❌ EncryptionUtil: base64 decoding failed', error);
      throw new Error('Cannot decrypt: invalid base64 value');
    }
  }

  // Unknown format
  throw new Error(`Cannot decrypt: unknown encryption format for value "${encryptedValue}"`);
}

/**
 * Delete a stored credential from keytar
 * Only works for keytar-stored values
 *
 * @param key - Identifier for the secret to delete
 */
export async function deleteCredential(key: string): Promise<boolean> {
  const isAvailable = await loadKeytar();

  if (!isAvailable || !keytarModule) {
    // Nothing to delete for base64 values (they're stored in DB)
    return false;
  }

  try {
    const deleted = await keytarModule.deletePassword(SERVICE_NAME, key);
    return deleted;
  } catch (error) {
    console.error('❌ EncryptionUtil: deletePassword() failed', error);
    return false;
  }
}
