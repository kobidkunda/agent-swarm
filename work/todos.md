# work/todos.md

# Todo Board

## Last Updated
- 2026-03-13 01:55 UTC

## Highest Priority Next 3
1. [ ] Install runner dependencies
2. [ ] Test runner agent end-to-end
3. [ ] Implement verification engine

## In Progress
- [ ] Runner agent testing
  - Scope: apps/runner
  - Notes: Needs dependencies installed

## Backlog
- [ ] Build runner agent (apps/runner)
  - Priority: high
  - Scope: apps/runner
  - Notes: Worktree management, agent launch, subprocess control - DONE

- [ ] Implement worktree management
  - Priority: high
  - Scope: API + Runner
  - Notes: Create/delete worktrees - DONE

- [ ] Add live telemetry with SSE
  - Priority: medium
  - Scope: API + Web UI
  - Notes: Real-time run event streaming - DONE

- [ ] Build verification engine
  - Priority: low
  - Scope: API + Runner
  - Notes: REST checks, browser MCP recipes - PENDING

- [ ] Add stop/force-stop controls
  - Priority: medium
  - Scope: API + Runner + Web UI
  - Notes: Graceful and force stop - DONE

## Blocked
- Runner dependencies not installed

## Done
- [x] Create monorepo structure
- [x] Set up DB schema with Drizzle ORM
- [x] Build backend API skeleton with Fastify
- [x] Create machine registry and heartbeat
- [x] Create folder registry service
- [x] Implement lock service
- [x] Define run state machine
- [x] Set up Next.js web UI
- [x] Implement GitHub discovery service
- [x] Verify API and DB tables
- [x] Build runner agent
- [x] Implement worktree management
- [x] Add SSE for live telemetry
- [x] Add stop/force-stop controls
