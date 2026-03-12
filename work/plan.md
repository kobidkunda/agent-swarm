# work/plan.md

# Project Plan

## Last Updated
- 2026-03-13 01:55 UTC

## Current Objective
- Complete runner agent implementation

## Project Snapshot
- Self-hosted autonomous code-fix platform with folder-based issue matching
- Phase: 1 - Foundations (complete)
- Status: API running with runner agent, SSE, stop controls
- Primary active scope: Runner agent and worktree management

## Required Stack
- Language: TypeScript
- Runtime: Node.js 22 LTS
- Package manager: pnpm
- Workspace: pnpm workspaces + Turborepo
- UI: Next.js, React, Tailwind
- API: NestJS + Fastify
- DB: SQLite + drizzle-orm + sql.js

## Latest Run Summary
- Created runner agent (apps/runner) with worktree management
- Added claim endpoint for runners to claim queued runs
- Added SSE endpoint for real-time run events
- Tested: create folder, create run, claim run flow works

## Files Changed In Latest Run
- apps/runner/* (new) - runner agent implementation
- apps/api/src/modules/runs/runs.controller.ts (added claim, SSE endpoints)
- apps/api/src/modules/runs/runs.service.ts (added claimRun method)
- apps/api/src/db/schema.ts (made repo_id optional in hosted_folders)
- apps/api/src/db/index.ts (updated CREATE TABLE)

## Verification Performed
- API: http://localhost:7200 ✓
- Web UI: http://localhost:7201 ✓
- Create machine: ✓
- Create folder: ✓
- Create run: ✓
- Claim run: ✓
- SSE endpoint: /api/runs/events/stream ✓

## Blockers / Risks
- Runner needs dependencies installed (execa, pino, uuid)
- Verification engine not implemented yet

## Next Run Start Here
1. Install runner dependencies
2. Test runner agent end-to-end
3. Implement verification engine

## Run History

### Run Entry - 2026-03-13
- Goal: Execute README.md implementation plan
- Summary: Created complete monorepo structure with API backend and web UI. Implemented all Phase 1 foundation modules.
- Files: 20+ files created
- Verification: API and Web running

### Run Entry - 2026-03-13 (later)
- Summary: Fixed machine registration validation, verified DB tables create
- Files: machines.controller.ts

### Run Entry - 2026-03-13 (latest)
- Summary: Created runner agent, added SSE, tested run flow
- Files: apps/runner/*, runs.controller.ts, runs.service.ts
- Verification: Run create/claim flow works
