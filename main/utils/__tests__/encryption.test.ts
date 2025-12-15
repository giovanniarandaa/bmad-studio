/**
 * EncryptionUtil Tests
 *
 * Tests for encryption/decryption functionality with keytar and fallback.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt, isKeytarAvailable } from '../encryption';

describe('EncryptionUtil', () => {
  const testKey = 'test-provider';
  const testValue = 'sk-1234567890abcdef';

  describe('isKeytarAvailable', () => {
    it('should return a boolean', async () => {
      const available = await isKeytarAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a value correctly', async () => {
      const encrypted = await encrypt(testKey, testValue);
      const decrypted = await decrypt(testKey, encrypted);

      expect(decrypted).toBe(testValue);
    });

    it('should return different encrypted values (not plaintext)', async () => {
      const encrypted = await encrypt(testKey, testValue);

      // Encrypted value should NOT be the same as original
      expect(encrypted).not.toBe(testValue);

      // Should be a non-empty string
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should handle empty strings', async () => {
      const emptyValue = '';
      const encrypted = await encrypt(testKey, emptyValue);
      const decrypted = await decrypt(testKey, encrypted);

      expect(decrypted).toBe(emptyValue);
    });

    it('should handle special characters', async () => {
      const specialValue = 'test!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = await encrypt(testKey, specialValue);
      const decrypted = await decrypt(testKey, encrypted);

      expect(decrypted).toBe(specialValue);
    });

    it('should handle long values', async () => {
      const longValue = 'a'.repeat(1000);
      const encrypted = await encrypt(testKey, longValue);
      const decrypted = await decrypt(testKey, encrypted);

      expect(decrypted).toBe(longValue);
    });
  });

  describe('fallback behavior', () => {
    it('should use base64 fallback format when keytar unavailable', async () => {
      // Check if using fallback (base64 format has 'b64:' prefix)
      const encrypted = await encrypt(testKey, testValue);

      // If fallback is used, encrypted value starts with 'b64:'
      // If keytar is used, encrypted value starts with 'keytar:'
      expect(
        encrypted.startsWith('b64:') || encrypted.startsWith('keytar:')
      ).toBe(true);
    });

    it('should decrypt base64 fallback values', async () => {
      // Manually create a base64-encoded value
      const base64Value = 'b64:' + Buffer.from(testValue, 'utf-8').toString('base64');

      const decrypted = await decrypt(testKey, base64Value);
      expect(decrypted).toBe(testValue);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid encrypted format', async () => {
      await expect(decrypt(testKey, 'invalid-format')).rejects.toThrow();
    });

    // Note: Buffer.from() doesn't throw errors for invalid base64,
    // it just returns corrupted data. This is expected Node.js behavior.
  });
});
