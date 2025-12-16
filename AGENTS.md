# Repository Guidelines

## Project Structure & Module Organization
Electron resources live under `main/` (IPC, database, repositories, preload). UI code is in `renderer/src/` with feature folders for routes, stores, and styles, while `shared/` keeps cross-process types and constants accessible through the `@/` path alias defined in `tsconfig.json`. Build artifacts land in `dist/` and packaged apps in `out/`; neither should be touched manually. Planning and specs are kept in `.dev/`, plus high-level briefs in `Brief.md` and the roadmap in `Plan.md`, so reference them before changing modules.

## Build, Test, and Development Commands
- `npm run dev` — runs Vite and Electron together with nodemon + wait-on for hot reload.
- `npm run build` — compiles main (`tsc`), bundles renderer (`vite build`), then packages via `electron-builder` (output at `out/mac/BMAD Studio.app`).
- `npm run typecheck` — strict TypeScript pass for both main and renderer configs.
- `npm run test` / `npm run test:coverage` — executes Vitest suites and prints coverage. Use `npm run preview` for a static preview of the renderer build if debugging UI without Electron.

## Coding Style & Naming Conventions
Write TypeScript with strict typing, favoring explicit interfaces stored in `shared/types/`. Indent with two spaces (matching existing files) and prefer single quotes, trailing commas, and descriptive PascalCase for classes/services (e.g., `ProjectService`). React components live in `renderer/src/<feature>/components` and should be functional components named in PascalCase; hooks/stores use camelCase. Keep IPC channels and constants in `shared/constants` to avoid magic strings.

## Testing Guidelines
Vitest discovers specs in `**/__tests__/**/*.test.ts`; mirror the source path (e.g., `main/services/__tests__/ProjectService.test.ts`). Use `npm run test:coverage` before opening a PR and keep regression tests near their domain (database, repositories, utils). Cover new IPC handlers and filesystem paths with unit tests plus integration tests that stub Electron APIs. Generated coverage reports live under `coverage/`; delete them before committing.

## Commit & Pull Request Guidelines
Git history favors short, descriptive subjects tied to modules (e.g., `Módulo 1.4: Sistema de Archivos`, `Tests completados`). Follow that style: start with module or feature tag, then a concise action in present tense. PRs should link the relevant module in `Plan.md`, include a summary of UI/IPC impacts, attach screenshots or screen recordings for renderer changes, and list verification steps (`npm run dev`, `npm run test`). Mention any migrations or new native dependencies so reviewers can rebuild locally.
