# BMAD Studio

Desktop application for macOS that centralizes BMAD system management, enables multi-LLM feature documentation generation, and provides AI-powered code review tools.

## Requirements

- **Node.js**: 18.0.0 or higher
- **macOS**: 10.15 (Catalina) or higher
- **Xcode Command Line Tools**: Required for native module compilation

### Installing Xcode Command Line Tools

```bash
xcode-select --install
```

## Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/giovanniarandaa/bmad-studio.git
cd bmad-studio
npm install
```

## Development

Start the application in development mode with hot module replacement:

```bash
npm run dev
```

This will:
- Start Vite dev server on port 5173 (or auto-select alternative if occupied)
- Launch Electron with auto-restart on main process changes
- Open DevTools automatically for debugging
- Enable React hot reload (<2s for UI changes)

### Development Features

- ✅ **Hot Module Replacement**: React changes visible in <2 seconds
- ✅ **Auto-restart**: Main process restarts automatically on code changes
- ✅ **DevTools**: Opens automatically in development mode
- ✅ **TypeScript**: Full type checking with strict mode
- ✅ **Security**: Context isolation + sandbox enabled

## Build

Generate production builds:

```bash
npm run build
```

This command:
1. Compiles TypeScript (main process) → `dist/main/`
2. Bundles React (renderer process) with Vite → `dist/renderer/`
3. Packages application with electron-builder → `out/`

The generated `.app` will be located at:
```
out/mac/BMAD Studio.app
```

### Opening the Built App

```bash
open "out/mac/BMAD Studio.app"
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode (Vite + Electron with hot reload) |
| `npm run build` | Full production build (TypeScript + Vite + electron-builder) |
| `npm run build:main` | Compile main process TypeScript only |
| `npm run build:renderer` | Bundle renderer process with Vite only |
| `npm run typecheck` | Type-check all TypeScript files (no emit) |
| `npm run preview` | Preview Vite build locally |
| `npm start` | Run built application from dist/ |

## Project Structure

```
bmad-studio/
├── main/                    # Main process (Electron/Node.js)
│   ├── index.ts            # Entry point, window management
│   ├── preload.ts          # IPC bridge (contextBridge)
│   └── types/              # Type definitions
├── renderer/               # Renderer process (React)
│   ├── src/
│   │   ├── App.tsx         # Root React component
│   │   ├── main.tsx        # React entry point
│   │   └── vite-env.d.ts   # Vite types
│   └── index.html          # HTML template
├── shared/                 # Shared code (main + renderer)
│   ├── types/              # Shared TypeScript types
│   └── constants/          # Global constants
├── dist/                   # Compiled output (gitignored)
├── out/                    # electron-builder output (gitignored)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # Base TypeScript config
├── tsconfig.main.json      # Main process TS config
├── tsconfig.renderer.json  # Renderer process TS config
├── vite.config.ts          # Vite bundler config
└── electron-builder.yml    # Build configuration
```

## Architecture

**Electron Multi-Process Architecture**:
- **Main Process**: Window management, IPC handlers, native APIs (Node.js)
- **Renderer Process**: UI (React 19 + TypeScript)
- **IPC Bridge**: Secure communication via preload script (contextBridge)

### Security

- ✅ **Context Isolation**: Enabled (`contextIsolation: true`)
- ✅ **Sandbox**: Enabled (`sandbox: true`)
- ✅ **Node Integration**: Disabled in renderer (`nodeIntegration: false`)
- ✅ **Preload Script**: Exposes safe, whitelisted APIs to renderer

## Troubleshooting

### Port 5173 Already in Use

Vite automatically selects an alternative port (5174, 5175, etc.). Check terminal output for the actual port.

### Xcode Command Line Tools Missing

If `electron-builder` fails with signing errors:

```bash
xcode-select --install
# Restart terminal after installation
```

### node_modules Corrupted

Delete and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

Run type checking to see all errors:

```bash
npm run typecheck
```

### Electron Window Not Opening in Dev Mode

1. Check terminal for errors
2. Ensure Vite dev server started successfully (should show "ready in Xms")
3. Try killing any running Electron processes: `pkill -f electron`

## Tech Stack

- **Desktop Framework**: Electron 28+
- **UI Framework**: React 19
- **Language**: TypeScript 5+ (strict mode)
- **Bundler**: Vite 5
- **Build Tool**: electron-builder 24+
- **Dev Tools**: Concurrently, Wait-on, Nodemon

## What's Next

This is **Phase 1, Module 1.1** (Electron + React + TypeScript infrastructure).

Next modules:
- **Module 1.2**: SQLite database setup with better-sqlite3
- **Module 1.3**: Layout implementation (sidebar + content area)
- **Module 1.4**: Testing setup (Vitest, E2E with Playwright)

See `Plan.md` for the complete development roadmap (10 phases, 31 modules).

## Documentation

- **Brief.md**: Product requirements and feature specifications
- **Plan.md**: Modular development plan (10 phases)
- **.dev/features/001-electron-react-setup/**: Planning documents for this module
  - `Spec.md`: Business specification
  - `Tech.md`: Technical design
  - `Steps.md`: Implementation steps
  - `STATUS.md`: Progress tracking

## Contributing

For development workflow and conventions, see:
- `.dev/context/Context.md`: Project context and inventory
- `.dev/context/Standards.md`: Code standards and conventions
- `CLAUDE.md`: Instructions for Claude Code AI assistant

## License

ISC
