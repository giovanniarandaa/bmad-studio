# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BMAD Studio is an Electron desktop application for macOS that centralizes management of the BMAD system (planning commands and skills), enables multi-LLM feature documentation generation, and provides AI-powered code review tools.

## Development Commands

```bash
# Start the application in development mode (opens DevTools)
npm run dev

# Start the application in production mode
npm start
```

## Architecture

### Technology Stack

- **Electron**: v39.2.7+ - Desktop application framework
- **Node.js**: Native integration enabled (nodeIntegration: true, contextIsolation: false)
- **HTML/CSS**: Simple frontend with system fonts and gradient design

### Project Structure (Current - MVP)

```
bmad-studio/
├── main.js           # Electron main process (window creation, app lifecycle)
├── index.html        # Renderer process UI
├── package.json      # Dependencies and scripts
├── Brief.md          # Product requirements document
└── Plan.md           # Modular development plan (10 phases, 31 modules)
```

### Project Structure (Planned - from Plan.md)

```
bmad-studio/
├── main/             # Electron main process code
├── renderer/         # React frontend code
├── shared/           # Shared types and utilities
└── migrations/       # SQLite database migrations
```

## Implementation Plan

The project follows a 10-phase modular development plan (see Plan.md):

1. **Phase 1: Fundamentos** - Electron + React setup, SQLite database, layout, filesystem
2. **Phase 2: Gestión de Proyectos** - Project CRUD, BMAD detection, feature indexing
3. **Phase 3: Visualización de Docs** - Feature view, markdown rendering, document editor
4. **Phase 4: Providers LLM** - API key management, unified LLM client
5. **Phase 5: Chat Discovery** - Chat UI, discovery flow for new features
6. **Phase 6: Generación Multi-LLM** - Core feature: parallel LLM generation, comparison, merge
7. **Phase 7: BMAD Manager** - BMAD file explorer, prompt extractor, editor, improvement chat
8. **Phase 8: Terminal Integrada** - Terminal emulator, test parser
9. **Phase 9: Code Review** - Git integration, AI analysis, review UI
10. **Phase 10: Troubleshooting Multi-LLM** - Context document management, multi-LLM problem solving

**Current Status**: Phase 1, Module 1.1 (basic Electron setup complete)

## Key Technical Decisions

### Electron Configuration

- **Node Integration**: Enabled (nodeIntegration: true) for direct filesystem access
- **Context Isolation**: Disabled (contextIsolation: false) for simplified IPC
- **DevTools**: Auto-open in development mode when NODE_ENV=development
- **Window Size**: 1200x800 default

### Planned Technical Stack (from Plan.md)

- **UI Framework**: React 18+ with TypeScript 5+
- **Styling**: Tailwind + shadcn/ui (macOS native look)
- **State Management**: Zustand
- **Database**: better-sqlite3 with migrations
- **Terminal**: node-pty + xterm.js
- **Markdown**: react-markdown + remark-gfm + rehype-highlight + mermaid.js
- **Git Operations**: simple-git
- **Code Editor**: CodeMirror or Monaco

## BMAD System Integration

BMAD Studio manages and enhances the BMAD method used by Claude Code:

### BMAD Directory Structure

```
~/.claude/                    # Global BMAD path (Claude Code reads from here)
├── commands/                 # Slash commands
│   ├── plan-spec.md
│   ├── plan-tech.md
│   ├── plan-steps.md
│   └── plan-quick.md
└── skills/                   # Reusable skills
    └── _shared/              # Shared helpers and templates
```

### Dual Sync Feature

BMAD Studio supports two locations:
1. **Global Path** (~/.claude/) - Where Claude Code reads commands
2. **Repo Path** (optional) - User's BMAD method repo for git version control

Changes in BMAD Studio sync to both locations automatically.

## Multi-LLM Generation System

### Supported Providers

- **OpenAI**: gpt-4o, gpt-4o-mini
- **Google**: gemini-1.5-pro, gemini-1.5-flash
- **DeepSeek**: deepseek-chat, deepseek-coder
- **Anthropic**: claude-sonnet-4, claude-3-5-haiku

### Document Types

Each document type has specialized prompts derived from BMAD commands:

- **Spec.md**: Business specification (from plan-spec.md)
  - NO code, only problem/solution definition
  - Sections: Problem, Solution, Benefits, Rules, Edge cases, KPIs, Out of Scope

- **Tech.md**: Technical design (from plan-tech.md)
  - NO implementation code, only architecture
  - Sections: Architecture, Models/Data, APIs, Flows (Mermaid), Decisions, Testing, Risks

- **Steps.md**: Implementation steps (from plan-steps.md)
  - NO code, only prose action steps
  - Steps of 15-60 minutes with checkpoints
  - Phases: DB → Backend → Frontend → Tests

- **Quick.md**: Simplified for features <2h (from plan-quick.md)
  - Structure: QUÉ, CÓMO, PASOS
  - 3-5 steps of 15-30 min

### Critical Restrictions

- **Tech.md MUST NOT contain implementation code** - only architectural design, method signatures, contracts
- **Steps.md MUST NOT contain code** - only action descriptions in prose
- All document generation uses Context.md and Standards.md from project

## Database Schema

See Brief.md section 3 for complete entity definitions. Key entities:

- **Project**: Linked development projects
- **Feature**: Features within projects (.dev/features/XXX-name/)
- **Document**: Spec/Tech/Steps/Status files
- **GenerationSession**: Multi-LLM generation sessions
- **GenerationResult**: Individual LLM outputs
- **BMADCommand/BMADSkill**: BMAD system files
- **PromptTemplate**: Extracted prompt logic from BMAD commands
- **CodeReviewSession/Finding**: AI code review results
- **TroubleshootingSession/Response**: Multi-LLM problem solving
- **ContextDocument**: Context.md, Standards.md, CLAUDE.md, AGENTS.md

## Code Review Categories

When implementing code review features, findings are classified as:

- **duplication**: Duplicate code, similar component exists
- **misplacement**: Code in wrong location (should be util/service)
- **reusability**: Existing component/service could be reused
- **style**: Standards violation
- **other**: Other issues

## Development Guidelines

### File Organization

Follow the planned structure from Plan.md:
- Main process code in `main/`
- Renderer (React) code in `renderer/`
- Shared types/utils in `shared/`
- Database migrations in `migrations/`

### IPC Communication

Use typed IPC bridges between main and renderer processes.

### API Key Security

- Store encrypted in SQLite using keytar or equivalent
- Never log or expose in UI
- Validate with "Test Connection" before enabling provider

### Filesystem Operations

All BMAD file operations must:
1. Create backups before modifications
2. Handle external changes via file watchers
3. Detect conflicts between ~/.claude/ and repo locations
4. Support merge resolution UI for conflicts

### Context Injection

When calling LLMs for document generation or troubleshooting:
- Always include Context.md (stack, architecture, inventory)
- Always include Standards.md (conventions, limits)
- Include CLAUDE.md/AGENTS.md if they exist
- Include previous feature documents (Spec → Tech → Steps flow)
- Respect ~100k token limit per provider
