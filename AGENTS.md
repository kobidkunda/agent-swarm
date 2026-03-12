# AGENTS.md

## Purpose
Always Use virtual enviroment for python 
## test it via http calls , browser mcp before finish 
stick work/stack.md
This repository is operated by autonomous or semi-autonomous coding agents.  
The agent must preserve context between runs by reading and updating markdown state files.

The goal is:
1. continue work safely from the last run,
2. keep a clear plan,
3. keep a reliable todo list,
4. leave a precise summary after every run.

---

## Mandatory working memory files

The agent must always use these files:

- `/AGENTS.md` → permanent repo operating instructions
- `/work/plan.md` → current project state, latest summary, decisions, architecture notes, next-run context
- `/work/todos.md` → actionable tasks, status, blockers, completed work

If `/work/plan.md` or `/work/todos.md` does not exist, create them from the required structure in this repo.

---

## Mandatory run flow

### Before starting any work
1. Read `/AGENTS.md`
2. Read `/work/plan.md`
3. Read `/work/todos.md`
4. Understand:
   - current objective
   - last completed work
   - open blockers
   - next required tasks
   - required stack and package constraints

The agent must not start implementation blindly.

### During the run
The agent must:
- follow the stack defined below
- keep work aligned with the current plan
- avoid changing architecture casually
- create or update todos when new work appears
- record important decisions in `/work/plan.md`

### Before ending every run
The agent must update **all required markdown files**.

At minimum it must:
- update `/work/plan.md`
- update `/work/todos.md`
- update any architecture notes in `/AGENTS.md` only if the permanent operating rules or required stack changed

A run is not complete until the markdown state is updated.

---

## Mandatory stack

Use this stack unless explicitly changed in `/work/plan.md` and approved there.

### Languages
- **TypeScript** only for application code
- **SQL** for database migrations and queries where needed
- **Markdown** for persistent agent memory and documentation

Do **not** introduce Python, Go, Rust, Java, or other languages unless there is a documented reason in `/work/plan.md`.

### Runtime and tooling
- **Node.js 22 LTS**
- **pnpm**
- **pnpm workspaces**
- **Turborepo**

### Frontend / Web UI
Use:
- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **lucide-react**
- **@tanstack/react-query**
- **react-hook-form**
- **zod**

### Backend / Control plane / APIs
Use:
- **Fastify**
- **zod**
- **pino**
- **@fastify/cors**
- **@fastify/sensible**
- **socket.io** or **ws** for live status streaming

### Database
Use:
- **PostgreSQL**
- **drizzle-orm**
- **drizzle-kit**
- **pg**

### Scheduler / queue / jobs
Use:
- **pg-boss**

### GitHub integration
Use:
- **octokit**

### Process execution / local runner
Use:
- **execa**
- **simple-git**
- native `git` CLI where needed

### Shared utilities
Use:
- **date-fns**
- **nanoid**
- **dotenv**
- **fs-extra**

### Validation and typing
Use:
- **zod**

### Testing
Use:
- **vitest**
- **playwright**

### Logging and observability
Use:
- **pino**

---

## Recommended workspace structure

Use this repo structure unless already established differently:

- `/apps/web` → dashboard / web UI
- `/apps/api` → orchestration backend / control plane
- `/apps/runner` → local machine runner
- `/packages/shared` → shared types, schemas, helpers
- `/packages/ui` → shared UI components if needed
- `/work/plan.md`
- `/work/todos.md`

If the repo already has a different layout, document it in `/work/plan.md` and continue consistently.

---

## Persistent documentation rules

### `/work/plan.md` must contain
- current objective
- current system status
- architecture notes
- decisions made
- latest run summary
- files changed in the latest run
- verification performed
- blockers / risks
- next-run starting point

### `/work/todos.md` must contain
- backlog
- in progress
- blocked
- done
- next highest-priority tasks

---

## Update rules after every run

At the end of each run, the agent must:

### In `/work/plan.md`
- update the timestamp
- update current objective if it changed
- write a concise latest run summary
- list files created/changed/removed
- note major implementation decisions
- record verification completed
- record blockers and risks
- write exact next steps for the next run

### In `/work/todos.md`
- move completed items to Done
- move active items to In Progress if still ongoing
- add newly discovered tasks
- add blockers clearly
- keep priority order clean
- ensure the next 3 highest-priority tasks are obvious

---

## Quality rules for markdown memory

The markdown files must be:
- concise but complete
- accurate
- updated at the end of every run
- easy for a future agent to resume from
- free of vague notes like “continue later” without specifics

Bad:
- “worked on API stuff”
- “fixed some issues”
- “continue from here”

Good:
- “Added run stop-request API and runner polling hook; still need force-stop subprocess tree cleanup and UI button wiring.”

---

## Required behavior when new work appears

If the agent discovers:
- a new bug,
- a missing dependency,
- an architectural mismatch,
- a blocker,
- an unplanned but necessary task,

it must:
1. add it to `/work/todos.md`
2. mention it in `/work/plan.md` if it affects architecture, priority, or next steps

---

## Required behavior when changing the stack

If the agent needs to change language, framework, or package choices:
1. do not change casually
2. document the reason in `/work/plan.md`
3. update this `AGENTS.md`
4. keep package sprawl minimal

---

## Completion rule

A run is only considered complete when:
- implementation work is saved,
- `/work/plan.md` is updated,
- `/work/todos.md` is updated,
- next-run context is clear.

If code changed but markdown memory was not updated, the run is incomplete.

---

## Agent output style for persistent memory

Always write persistent notes in a way that another agent can resume instantly.

Use:
- exact file paths
- exact feature names
- exact blockers
- exact next steps

Keep history useful, not verbose.
