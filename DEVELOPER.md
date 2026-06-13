# DEVELOPER.md - AI Coding Instructions

This file serves as a guide for AI assistants (like Claude, Cursor, Antigravity, etc.) to understand the SmartyEvents project structure, command guidelines, code conventions, and development state.

---

## 🛠 Command Reference

### Build & Run
- **Start dev servers (All Workspaces)**: `npm run dev`
- **Compile all workspaces for production**: `npm run build`
- **Start Docker stack (Database + API + Web + Studio)**: `./manage.sh start`
- **Stop Docker stack**: `./manage.sh stop`
- **Rebuild Docker images**: `./manage.sh rebuild`

### Code Quality & Validation
- **Run ESLint workspace-wide**: `npm run lint`
- **Validate TypeScript type compilation**: `npm run check-types`
- **Format codebase**: `npm run format`

### Test Suites
- **Run TypeScript Jest tests**: `npm run test`
- **Run Soroban contract Rust tests**: `npm run test:rust`

---

## 🎨 Code Conventions & Style Guide

- **Strict Type Safety**: Avoid using explicit `any` types. Prefer declaring explicit TypeScript interfaces/types or using `unknown` with safe type guards.
- **Shared Workspace Imports**: Internal monorepo packages (such as `@repo/stellar` and `@repo/database`) must export their source `.ts` files directly in `package.json` to prevent typecheck compile loop failures in CI pipelines.
- **React/Next.js**:
  - Use Next.js optimized `<Image>` components instead of native `<img>` tags. Use the `unoptimized` prop for external dynamic links (such as QR codes or avatars) to bypass domain limits.
  - Always wrap side-effect functions inside `useCallback` when referencing them in `useEffect` arrays to prevent render loops.
  - Escape unescaped quote literals (`'` -> `&apos;` and `"` -> `&quot;`) inside JSX markup.
- **Testing Standard**: Every feature change, backend service update, or smart contract logic change must be accompanied by comprehensive tests.
- **Git & Branching Workflow (Mandatory)**:
  - After every fix or task, you must: **test**, **commit**, **push**, and **raise a PR to the `main` branch**.
  - **Branch Naming**: New features must be developed on a new branch named `new-feature-branch` or prefixed with `feature/`. Bug fixes must be developed on a branch named `new-fix-branch` or prefixed with `fix/`.
  - Follow the conventional commits specification (e.g. `fix(web): ...`, `refactor(web): ...`, `test(api): ...`). Commit complete, building blocks of code.

---

## 📝 Development Status & Roadmap

### What Has Been Done
- [x] Containerized dev stack with multi-tenant configurations.
- [x] Implemented on-chain Soroban verifier Rust contract (`ZkTicketVerifier`) deployed to Stellar Testnet.
- [x] Integrated ZK verification into the backend NestJS service layer.
- [x] Integrated client-side commitment generation & actual mathematical proving in Next.js portal checkout.
- [x] Implemented actual client-side ZK-SNARK provers (Pedersen commitments + Fiat-Shamir NIZKP) and backend/frontend verifiers.
- [x] Resolved all Next.js frontend ESLint and type compiler warnings (monorepo checks pass with 0 errors/warnings).
- [x] Added unit tests coverage for all backend service suites and Rust contract functions.
- [x] Configured `@repo/stellar` to export TypeScript sources directly, resolving CI typechecking issues.

### Upcoming Backlog
- [ ] Set up automated frontend/E2E test suite (e.g., using Vitest or Playwright).
- [ ] Configure live testnet check-in scans rather than simulator fallback registry.

