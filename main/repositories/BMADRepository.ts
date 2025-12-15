/**
 * BMADRepository
 *
 * Repository for CRUD operations on bmad_commands, bmad_skills, and prompt_templates tables.
 */

import type { Database } from 'better-sqlite3';
import type { BMADCommand, BMADSkill, PromptTemplate } from '../../shared/types/database';

export class BMADRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // ========================================
  // BMAD Commands
  // ========================================

  findAllCommands(): BMADCommand[] {
    const stmt = this.db.prepare('SELECT * FROM bmad_commands ORDER BY name ASC');
    return stmt.all() as BMADCommand[];
  }

  findCommandByName(name: string): BMADCommand | null {
    const stmt = this.db.prepare('SELECT * FROM bmad_commands WHERE name = ?');
    return (stmt.get(name) as BMADCommand) || null;
  }

  createCommand(data: Omit<BMADCommand, 'id'>): BMADCommand {
    const stmt = this.db.prepare(`
      INSERT INTO bmad_commands (name, file_path, description, argument_hint, allowed_tools, content, extracted_prompt_logic, is_planning_command, last_modified, last_extraction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.file_path,
      data.description,
      data.argument_hint || null,
      data.allowed_tools || null,
      data.content,
      data.extracted_prompt_logic || null,
      data.is_planning_command ? 1 : 0,
      data.last_modified,
      data.last_extraction || null
    );

    const stmt2 = this.db.prepare('SELECT * FROM bmad_commands WHERE id = ?');
    return stmt2.get(result.lastInsertRowid) as BMADCommand;
  }

  updateCommand(id: number, data: Partial<Omit<BMADCommand, 'id'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_planning_command' ? (value ? 1 : 0) : value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE bmad_commands SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  deleteCommand(id: number): void {
    const stmt = this.db.prepare('DELETE FROM bmad_commands WHERE id = ?');
    stmt.run(id);
  }

  // ========================================
  // BMAD Skills
  // ========================================

  findAllSkills(): BMADSkill[] {
    const stmt = this.db.prepare('SELECT * FROM bmad_skills ORDER BY name ASC');
    return stmt.all() as BMADSkill[];
  }

  findSkillByName(name: string): BMADSkill | null {
    const stmt = this.db.prepare('SELECT * FROM bmad_skills WHERE name = ?');
    return (stmt.get(name) as BMADSkill) || null;
  }

  createSkill(data: Omit<BMADSkill, 'id'>): BMADSkill {
    const stmt = this.db.prepare(`
      INSERT INTO bmad_skills (name, file_path, description, content, last_modified)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(data.name, data.file_path, data.description, data.content, data.last_modified);

    const stmt2 = this.db.prepare('SELECT * FROM bmad_skills WHERE id = ?');
    return stmt2.get(result.lastInsertRowid) as BMADSkill;
  }

  updateSkill(id: number, data: Partial<Omit<BMADSkill, 'id'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE bmad_skills SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  deleteSkill(id: number): void {
    const stmt = this.db.prepare('DELETE FROM bmad_skills WHERE id = ?');
    stmt.run(id);
  }

  // ========================================
  // Prompt Templates
  // ========================================

  findAllTemplates(): PromptTemplate[] {
    const stmt = this.db.prepare('SELECT * FROM prompt_templates ORDER BY document_type ASC');
    const templates = stmt.all() as PromptTemplate[];

    // Parse JSON fields
    return templates.map(t => ({
      ...t,
      required_context: JSON.parse(t.required_context as any),
      required_sections: JSON.parse(t.required_sections as any),
      critical_restrictions: JSON.parse(t.critical_restrictions as any),
      custom_overrides: t.custom_overrides ? JSON.parse(t.custom_overrides as any) : null
    }));
  }

  findTemplateByType(documentType: PromptTemplate['document_type']): PromptTemplate | null {
    const stmt = this.db.prepare('SELECT * FROM prompt_templates WHERE document_type = ?');
    const template = stmt.get(documentType) as PromptTemplate | undefined;

    if (!template) return null;

    // Parse JSON fields
    return {
      ...template,
      required_context: JSON.parse(template.required_context as any),
      required_sections: JSON.parse(template.required_sections as any),
      critical_restrictions: JSON.parse(template.critical_restrictions as any),
      custom_overrides: template.custom_overrides ? JSON.parse(template.custom_overrides as any) : null
    };
  }

  createTemplate(data: Omit<PromptTemplate, 'id' | 'last_updated'>): PromptTemplate {
    const stmt = this.db.prepare(`
      INSERT INTO prompt_templates (document_type, base_prompt, custom_overrides, required_context, required_sections, critical_restrictions, source_command_id, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.document_type,
      data.base_prompt,
      data.custom_overrides ? JSON.stringify(data.custom_overrides) : null,
      JSON.stringify(data.required_context),
      JSON.stringify(data.required_sections),
      JSON.stringify(data.critical_restrictions),
      data.source_command_id || null,
      data.version
    );

    return this.findTemplateByType(data.document_type)!;
  }

  updateTemplate(id: number, data: Partial<Omit<PromptTemplate, 'id' | 'document_type' | 'last_updated'>>): void {
    const fields: string[] = ['last_updated = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (data.base_prompt !== undefined) {
      fields.push('base_prompt = ?');
      values.push(data.base_prompt);
    }
    if (data.custom_overrides !== undefined) {
      fields.push('custom_overrides = ?');
      values.push(data.custom_overrides ? JSON.stringify(data.custom_overrides) : null);
    }
    if (data.required_context !== undefined) {
      fields.push('required_context = ?');
      values.push(JSON.stringify(data.required_context));
    }
    if (data.required_sections !== undefined) {
      fields.push('required_sections = ?');
      values.push(JSON.stringify(data.required_sections));
    }
    if (data.critical_restrictions !== undefined) {
      fields.push('critical_restrictions = ?');
      values.push(JSON.stringify(data.critical_restrictions));
    }
    if (data.version !== undefined) {
      fields.push('version = ?');
      values.push(data.version);
    }

    values.push(id);
    const stmt = this.db.prepare(`UPDATE prompt_templates SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  deleteTemplate(id: number): void {
    const stmt = this.db.prepare('DELETE FROM prompt_templates WHERE id = ?');
    stmt.run(id);
  }
}
