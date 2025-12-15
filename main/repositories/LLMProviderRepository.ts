/**
 * LLMProviderRepository
 *
 * Repository for CRUD operations on llm_providers table.
 * Handles encryption/decryption of API keys.
 */

import type { Database } from 'better-sqlite3';
import type { LLMProvider } from '../../shared/types/database';
import { encrypt, decrypt } from '../utils/encryption';

export class LLMProviderRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Find all providers
   */
  async findAll(): Promise<LLMProvider[]> {
    const stmt = this.db.prepare('SELECT * FROM llm_providers ORDER BY name ASC');
    const providers = stmt.all() as LLMProvider[];

    // Decrypt API keys
    for (const provider of providers) {
      try {
        provider.api_key = await decrypt(provider.name, provider.api_key);
      } catch (error) {
        console.error(`Failed to decrypt API key for ${provider.name}:`, error);
        provider.api_key = ''; // Return empty instead of encrypted value
      }
    }

    return providers;
  }

  /**
   * Find provider by name
   */
  async findByName(name: LLMProvider['name']): Promise<LLMProvider | null> {
    const stmt = this.db.prepare('SELECT * FROM llm_providers WHERE name = ?');
    const provider = stmt.get(name) as LLMProvider | undefined;

    if (!provider) {
      return null;
    }

    // Decrypt API key
    try {
      provider.api_key = await decrypt(provider.name, provider.api_key);
    } catch (error) {
      console.error(`Failed to decrypt API key for ${provider.name}:`, error);
      provider.api_key = '';
    }

    return provider;
  }

  /**
   * Find provider by ID
   */
  async findById(id: number): Promise<LLMProvider | null> {
    const stmt = this.db.prepare('SELECT * FROM llm_providers WHERE id = ?');
    const provider = stmt.get(id) as LLMProvider | undefined;

    if (!provider) {
      return null;
    }

    // Decrypt API key
    try {
      provider.api_key = await decrypt(provider.name, provider.api_key);
    } catch (error) {
      console.error(`Failed to decrypt API key for ${provider.name}:`, error);
      provider.api_key = '';
    }

    return provider;
  }

  /**
   * Create a new provider with encrypted API key
   */
  async create(data: Omit<LLMProvider, 'id' | 'usage_this_month'>): Promise<LLMProvider> {
    // Encrypt API key
    const encryptedKey = await encrypt(data.name, data.api_key);

    const stmt = this.db.prepare(`
      INSERT INTO llm_providers (name, api_key, default_model, is_enabled)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(data.name, encryptedKey, data.default_model, data.is_enabled ? 1 : 0);

    const created = await this.findById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error('Failed to create LLM provider');
    }

    return created;
  }

  /**
   * Update a provider
   */
  async update(id: number, data: Partial<Omit<LLMProvider, 'id' | 'name'>>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    // Encrypt API key if provided
    if (data.api_key !== undefined) {
      const provider = await this.findById(id);
      if (!provider) {
        throw new Error('Provider not found');
      }

      const encryptedKey = await encrypt(provider.name, data.api_key);
      fields.push('api_key = ?');
      values.push(encryptedKey);
    }

    if (data.default_model !== undefined) {
      fields.push('default_model = ?');
      values.push(data.default_model);
    }
    if (data.is_enabled !== undefined) {
      fields.push('is_enabled = ?');
      values.push(data.is_enabled ? 1 : 0);
    }
    if (data.usage_this_month !== undefined) {
      fields.push('usage_this_month = ?');
      values.push(data.usage_this_month);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE llm_providers SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  /**
   * Delete a provider
   */
  delete(id: number): void {
    const stmt = this.db.prepare('DELETE FROM llm_providers WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Increment usage counter
   */
  incrementUsage(id: number, amount: number = 1): void {
    const stmt = this.db.prepare('UPDATE llm_providers SET usage_this_month = usage_this_month + ? WHERE id = ?');
    stmt.run(amount, id);
  }

  /**
   * Reset usage counters for all providers (e.g., monthly reset)
   */
  resetAllUsage(): void {
    const stmt = this.db.prepare('UPDATE llm_providers SET usage_this_month = 0');
    stmt.run();
  }
}
