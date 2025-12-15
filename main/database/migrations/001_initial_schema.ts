/**
 * Migration 001: Initial Schema
 *
 * Creates all 17 database tables for BMAD Studio:
 * - Core: projects, features, documents
 * - Multi-LLM: generation_sessions, generation_results
 * - Settings: llm_providers, app_settings
 * - BMAD: bmad_commands, bmad_skills, prompt_templates
 * - Code Review: code_review_sessions, code_review_findings
 * - Troubleshooting: troubleshooting_sessions, troubleshooting_responses
 * - Context: context_documents
 * - Improvements: improvement_suggestions
 */

import type { Database } from 'better-sqlite3';
import type { Migration } from './Migration';

const migration: Migration = {
  version: 1,
  name: 'initial_schema',

  up(db: Database): void {
    // ========================================
    // Core Tables
    // ========================================

    // Projects table
    db.exec(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        has_bmad BOOLEAN NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_opened_at TEXT
      );

      CREATE INDEX idx_projects_path ON projects(path);
    `);

    // Features table
    db.exec(`
      CREATE TABLE features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('planning', 'in-progress', 'review', 'done')),
        project_id INTEGER NOT NULL,
        spec_path TEXT,
        tech_path TEXT,
        steps_path TEXT,
        status_path TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_features_project_id ON features(project_id);
      CREATE INDEX idx_features_feature_id ON features(feature_id);
    `);

    // Documents table
    db.exec(`
      CREATE TABLE documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('spec', 'tech', 'steps', 'status', 'quick')),
        content TEXT NOT NULL,
        feature_id INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_documents_feature_id ON documents(feature_id);
      CREATE INDEX idx_documents_type ON documents(type);
    `);

    // ========================================
    // Multi-LLM Generation Tables
    // ========================================

    // Generation Sessions table
    db.exec(`
      CREATE TABLE generation_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id INTEGER NOT NULL,
        document_type TEXT NOT NULL CHECK(document_type IN ('spec', 'tech', 'steps', 'status', 'quick')),
        status TEXT NOT NULL CHECK(status IN ('pending', 'generating', 'comparing', 'merged', 'cancelled')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_generation_sessions_feature_id ON generation_sessions(feature_id);
    `);

    // Generation Results table
    db.exec(`
      CREATE TABLE generation_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        provider TEXT NOT NULL CHECK(provider IN ('openai', 'google', 'deepseek', 'anthropic')),
        model TEXT NOT NULL,
        content TEXT NOT NULL,
        generation_time_ms INTEGER NOT NULL,
        token_count INTEGER NOT NULL,
        selected_sections TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES generation_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_generation_results_session_id ON generation_results(session_id);
    `);

    // ========================================
    // Settings Tables
    // ========================================

    // LLM Providers table
    db.exec(`
      CREATE TABLE llm_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(name IN ('openai', 'google', 'deepseek', 'anthropic')) UNIQUE,
        api_key TEXT NOT NULL,
        default_model TEXT NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT 1,
        usage_this_month INTEGER NOT NULL DEFAULT 0
      );
    `);

    // App Settings table (singleton)
    db.exec(`
      CREATE TABLE app_settings (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        bmad_global_path TEXT NOT NULL,
        bmad_repo_path TEXT,
        bmad_sync_enabled BOOLEAN NOT NULL DEFAULT 0,
        theme TEXT NOT NULL CHECK(theme IN ('light', 'dark', 'system')) DEFAULT 'system',
        default_providers_spec TEXT NOT NULL,
        default_providers_tech TEXT NOT NULL,
        default_providers_steps TEXT NOT NULL,
        review_provider TEXT NOT NULL
      );
    `);

    // ========================================
    // BMAD System Tables
    // ========================================

    // BMAD Commands table
    db.exec(`
      CREATE TABLE bmad_commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        file_path TEXT NOT NULL,
        description TEXT NOT NULL,
        argument_hint TEXT,
        allowed_tools TEXT,
        content TEXT NOT NULL,
        extracted_prompt_logic TEXT,
        is_planning_command BOOLEAN NOT NULL DEFAULT 0,
        last_modified TEXT NOT NULL,
        last_extraction TEXT
      );
    `);

    // BMAD Skills table
    db.exec(`
      CREATE TABLE bmad_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        file_path TEXT NOT NULL,
        description TEXT NOT NULL,
        content TEXT NOT NULL,
        last_modified TEXT NOT NULL
      );
    `);

    // Prompt Templates table
    db.exec(`
      CREATE TABLE prompt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_type TEXT NOT NULL CHECK(document_type IN ('spec', 'tech', 'steps', 'status', 'quick')),
        base_prompt TEXT NOT NULL,
        custom_overrides TEXT,
        required_context TEXT NOT NULL,
        required_sections TEXT NOT NULL,
        critical_restrictions TEXT NOT NULL,
        source_command_id INTEGER,
        version INTEGER NOT NULL DEFAULT 1,
        last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_command_id) REFERENCES bmad_commands(id) ON DELETE SET NULL
      );
    `);

    // ========================================
    // Code Review Tables
    // ========================================

    // Code Review Sessions table
    db.exec(`
      CREATE TABLE code_review_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id INTEGER,
        branch_name TEXT NOT NULL,
        base_branch TEXT NOT NULL,
        files_changed TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'in-progress', 'completed', 'cancelled')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE SET NULL
      );

      CREATE INDEX idx_code_review_sessions_feature_id ON code_review_sessions(feature_id);
    `);

    // Code Review Findings table
    db.exec(`
      CREATE TABLE code_review_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        line_start INTEGER NOT NULL,
        line_end INTEGER NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low', 'info')),
        category TEXT NOT NULL CHECK(category IN ('duplication', 'misplacement', 'reusability', 'style', 'other')),
        message TEXT NOT NULL,
        suggestion TEXT,
        existing_component TEXT,
        FOREIGN KEY (session_id) REFERENCES code_review_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_code_review_findings_session_id ON code_review_findings(session_id);
    `);

    // ========================================
    // Troubleshooting Tables
    // ========================================

    // Troubleshooting Sessions table
    db.exec(`
      CREATE TABLE troubleshooting_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id INTEGER,
        project_id INTEGER NOT NULL,
        problem_description TEXT NOT NULL,
        error_logs TEXT,
        files_shared TEXT NOT NULL,
        context_files_used TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('open', 'in-progress', 'resolved', 'cancelled')),
        resolution_notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE SET NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_troubleshooting_sessions_project_id ON troubleshooting_sessions(project_id);
    `);

    // Troubleshooting Responses table
    db.exec(`
      CREATE TABLE troubleshooting_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        provider TEXT NOT NULL CHECK(provider IN ('openai', 'google', 'deepseek', 'anthropic')),
        model TEXT NOT NULL,
        response_content TEXT NOT NULL,
        suggested_solution TEXT,
        code_snippets TEXT,
        was_helpful BOOLEAN NOT NULL DEFAULT 0,
        used_in_solution BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES troubleshooting_sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_troubleshooting_responses_session_id ON troubleshooting_responses(session_id);
    `);

    // ========================================
    // Context Documents Table
    // ========================================

    db.exec(`
      CREATE TABLE context_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('context', 'standards', 'claude', 'agents', 'custom')),
        file_path TEXT NOT NULL,
        content TEXT NOT NULL,
        is_dirty BOOLEAN NOT NULL DEFAULT 0,
        last_synced TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified_external TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_context_documents_project_id ON context_documents(project_id);
    `);

    // ========================================
    // Improvement Suggestions Table
    // ========================================

    db.exec(`
      CREATE TABLE improvement_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_type TEXT NOT NULL CHECK(target_type IN ('command', 'skill')),
        target_id INTEGER NOT NULL,
        error_context TEXT,
        suggestion TEXT NOT NULL,
        diff TEXT,
        status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'applied')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_improvement_suggestions_target ON improvement_suggestions(target_type, target_id);
    `);

    console.log('✅ Initial schema created (17 tables)');
  },

  down(db: Database): void {
    // Drop tables in reverse order to avoid foreign key conflicts
    db.exec(`
      DROP TABLE IF EXISTS improvement_suggestions;
      DROP TABLE IF EXISTS context_documents;
      DROP TABLE IF EXISTS troubleshooting_responses;
      DROP TABLE IF EXISTS troubleshooting_sessions;
      DROP TABLE IF EXISTS code_review_findings;
      DROP TABLE IF EXISTS code_review_sessions;
      DROP TABLE IF EXISTS prompt_templates;
      DROP TABLE IF EXISTS bmad_skills;
      DROP TABLE IF EXISTS bmad_commands;
      DROP TABLE IF EXISTS app_settings;
      DROP TABLE IF EXISTS llm_providers;
      DROP TABLE IF EXISTS generation_results;
      DROP TABLE IF EXISTS generation_sessions;
      DROP TABLE IF EXISTS documents;
      DROP TABLE IF EXISTS features;
      DROP TABLE IF EXISTS projects;
    `);

    console.log('✅ Initial schema dropped');
  },
};

export default migration;
