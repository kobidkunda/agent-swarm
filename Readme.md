 Below is the **full implementation plan + TODOs** for building your system from scratch.

This plan is for a system that:

* runs on **macOS and Ubuntu**
* uses **Claude Code / Gemini CLI / OpenCode**
* works with **Browser MCP** and **Android emulator MCP**
* scans GitHub for **issues / PRs**
* can be configured from a **web UI**
* supports **folder-based ownership**
* lets you choose **which agent works on which folder**
* creates a **Git worktree per run**
* tests via **REST + browser MCP + emulator MCP**
* shows **live status in browser**
* can be **stopped any time from the web UI**
* prevents **2 schedules from working on the same issue/folder**

---

# 1) Final system goal

Build a **self-hosted autonomous code-fix platform** with these operating rules:

1. Web UI registers one or more local folders on hosted machines.
2. Each folder is linked to a repo and one or more editable scopes.
3. Scheduler periodically scans GitHub issues/PRs relevant to that folder.
4. System claims one work item safely.
5. System creates a dedicated Git worktree.
6. Assigned agent starts inside that worktree.
7. Agent reproduces, fixes, tests, and verifies the bug.
8. Live progress is streamed to web UI.
9. User can stop gracefully or force stop from UI.
10. System archives logs/artifacts, removes worktree, releases locks.

---

# 2) Product structure

Build it as **4 major products inside one platform**:

## A. Web Control Plane

Used by humans to:

* register machines
* register folders
* map folder → repo → editable paths
* assign agent/model per folder
* configure schedule
* see live run status
* stop/pause/force-stop runs
* inspect logs, screenshots, patches, PR links

## B. Runner Agent

Installed on macOS/Ubuntu machines.
Used to:

* manage local folders and repos
* create worktrees
* launch Claude/Gemini/OpenCode
* run REST tests
* call browser MCP
* call Android emulator MCP
* stream status back

## C. Orchestration Backend

Central service used to:

* hold DB state
* queue jobs
* manage schedules
* manage locks
* track runs and artifacts
* select routing policies
* broadcast live events to browser UI

## D. Verification Layer

Used to:

* run unit/integration tests
* run REST checks
* run browser flows
* run mobile emulator flows
* capture screenshots, videos, logs, traces

---

# 3) Scope model: repo is not enough, folder is the main unit

Your system should not think in terms of only “repo”.
It should think in terms of:

* **machine**
* **hosted folder**
* **repo**
* **allowed editable scope**
* **assigned agent/model**
* **schedule**

Example:

* Machine: `ubuntu-runner-1`
* Hosted folder: `/srv/repos/event_management_system`
* Repo: `BIOLASTIC/event_management_system`
* Editable scopes:

  * `backend/`
  * `frontend/`
  * `mobile/`
* Folder-level routing:

  * `backend/` → Claude
  * `mobile/` → Gemini
  * `frontend/` → OpenCode

This becomes the foundation of the whole system.

---

# 4) Core architecture

## 4.1 Backend services

Build these internal modules:

### 1. Machine Registry Service

Tracks:

* machines
* OS
* runner version
* capabilities
* online/offline
* browser MCP available or not
* Android MCP available or not
* installed agents

### 2. Folder Registry Service

Tracks:

* absolute folder path
* linked repo
* allowed scopes
* excluded scopes
* default branch
* schedule
* assigned agent/model
* health status

### 3. Discovery Service

Responsible for:

* scanning GitHub issues
* scanning PRs
* scanning failed PR/CI states
* ranking candidates
* matching candidates to folder scopes

### 4. Lock Service

Responsible for:

* scheduler lock
* repo lock
* folder lock
* issue lock
* branch lock
* heartbeat / lease renewals

### 5. Run Orchestrator

Responsible for:

* creating a run
* selecting folder, agent, model
* preparing worktree
* preparing prompts/instructions
* triggering runner
* moving run through lifecycle states

### 6. Runner Gateway

Used for:

* machine communication
* command dispatch
* stop/force-stop
* health checks
* capability negotiation

### 7. Telemetry Service

Used for:

* structured events
* live logs
* run phase timeline
* screenshots/videos
* stdout/stderr capture
* browser WebSocket/SSE streaming

### 8. Artifact Service

Stores:

* patch summaries
* test reports
* screenshots
* console logs
* API responses
* diff metadata
* PR/branch links

### 9. Policy Engine

Applies:

* folder → agent rules
* task type → model rules
* stop rules
* diff limits
* approval requirements
* retry policies
* allowed actions

---

# 5) Database / entities to build

You need a real DB model first. This is non-negotiable.

## 5.1 Machines

Fields:

* id
* name
* OS
* hostname
* status
* last heartbeat
* runner version
* supported agents
* browser MCP enabled
* Android MCP enabled
* max concurrent runs

## 5.2 Repositories

Fields:

* id
* provider
* owner
* repo name
* default branch
* remote URL
* active
* repo settings

## 5.3 Hosted Folders

Fields:

* id
* machine id
* repo id
* display name
* absolute path
* branch
* enabled
* health status
* last verified at

## 5.4 Folder Scopes

Fields:

* id
* hosted folder id
* path pattern
* edit allowed
* read allowed
* test allowed
* priority
* excluded boolean

## 5.5 Folder Routing Rules

Fields:

* id
* hosted folder id
* scope path
* task type
* agent
* model
* fallback agent
* fallback model
* require approval
* max diff size

## 5.6 Schedules

Fields:

* id
* hosted folder id
* enabled
* cron/interval
* quiet hours
* retry interval
* max parallel
* cooldown rule

## 5.7 Work Items

Fields:

* id
* repo id
* type issue/pr
* external number
* title
* body summary
* labels
* severity
* status
* fingerprint
* last updated
* current lock owner

## 5.8 Folder-Work Item Matches

Fields:

* id
* hosted folder id
* work item id
* confidence score
* matched by
* matched paths
* reason
* eligible boolean

## 5.9 Runs

Fields:

* id
* work item id
* hosted folder id
* machine id
* agent
* model
* run mode
* current phase
* status
* branch name
* worktree path
* created at
* started at
* ended at
* summary
* stop requested
* force stop requested

## 5.10 Run Events

Fields:

* id
* run id
* sequence number
* event type
* timestamp
* payload JSON
* human summary

## 5.11 Locks

Fields:

* key
* lock type
* owner run id
* lease expires at
* heartbeat at
* status

## 5.12 Artifacts

Fields:

* id
* run id
* artifact type
* local path
* preview path
* metadata
* size
* created at

## 5.13 Agent Profiles

Fields:

* id
* name
* provider
* binary path
* default model
* supported capabilities
* limits
* enabled

## 5.14 Prompt/Snippet Packs

Fields:

* id
* name
* target agent
* scope
* version
* instruction template
* arguments schema
* enabled

---

# 6) Run lifecycle states

Define lifecycle first so UI and backend stay consistent.

## Run states

* `queued`
* `matching`
* `claiming`
* `preparing_workspace`
* `starting_agent`
* `reproducing_issue`
* `analyzing_code`
* `editing_code`
* `running_tests`
* `running_rest_checks`
* `running_browser_checks`
* `running_mobile_checks`
* `collecting_artifacts`
* `awaiting_approval`
* `creating_pr`
* `completed`
* `failed`
* `stopped`
* `force_stopped`
* `timed_out`
* `abandoned`

## Stop sub-states

* `stop_requested`
* `graceful_stopping`
* `force_stop_requested`

This is important for safe UI control.

---

# 7) Folder-based issue matching logic

This is one of the hardest parts.

GitHub issues do not naturally belong to folders, so your system must infer eligibility.

Use a scoring pipeline.

## 7.1 Matching signals

### Direct path signals

Issue/PR mentions:

* file paths
* folder paths
* stack traces
* changed files

### Label signals

Map labels to folder scopes:

* `backend` → `backend/`
* `mobile` → `mobile/`
* `ui` → `frontend/`

### Component rules

Create your own component table:

* “invitation builder” → `frontend/src/invitation/`
* “mobile templates” → `mobile/lib/templates/`

### Historical mapping

When a past run solved an issue in a folder, reuse that signal later.

### PR changed files

For PRs, matching is easier:

* if changed files intersect configured scope, it is eligible

### Confidence score

Score each candidate against each folder scope.
Only enqueue if score crosses threshold.

## 7.2 Final folder eligibility rule

A work item can only be assigned to a folder when:

* score is above threshold
* issue is not already claimed
* folder is not paused
* folder lock is free
* edit scope is safe
* assigned agent is available on that machine

---

# 8) Scheduler design

Do not schedule agents directly.
Schedule **folder scans**.

## 8.1 Scheduler loop

For each active schedule:

1. check folder enabled
2. check machine online
3. check folder health
4. check no active run already exceeding concurrency
5. discover GitHub items
6. match items to folder
7. rank candidates
8. claim top eligible item
9. create run
10. dispatch to runner

## 8.2 Concurrency model

Support:

* one run per folder
* multiple folders in parallel
* same repo can run multiple jobs only when scopes do not overlap

## 8.3 Duplicate prevention

Before dispatch:

* check issue lock
* check folder lock
* check branch lock
* check identical fingerprint recently completed

---

# 9) Locking strategy

This is critical.

## 9.1 Required lock types

### Scheduler lock

Prevents two scheduler workers from scanning the same schedule simultaneously.

### Repo lock

Optional stricter lock when repo-wide serialization is needed.

### Folder lock

Prevents two runs from modifying the same folder scope at once.

### Issue/PR lock

Prevents two runs from claiming the same work item.

### Branch lock

Prevents branch naming collisions or duplicate patching.

## 9.2 Lease/heartbeat model

Every active run must renew heartbeat.
If heartbeat expires:

* mark run stale
* release lock after safety timeout
* cleanup orphan worktree

## 9.3 Stop-safe release

Locks must not be released until:

* agent stopped
* tests stopped
* MCP actions stopped
* worktree cleanup finished or marked retained

---

# 10) Worktree management

This is core behavior.

## 10.1 Rules

* never edit the main checkout
* every run gets its own worktree
* worktree name must include:

  * folder id
  * issue/pr number
  * timestamp
* each run gets its own branch

## 10.2 Worktree flow

1. validate base repo exists
2. fetch latest refs
3. create linked worktree
4. create branch
5. write run metadata locally
6. start agent in worktree
7. on finish:

   * collect diff
   * collect logs
   * cleanup
   * remove worktree

## 10.3 Edit-scope enforcement

Even inside a worktree:

* agent may read whole repo if needed
* agent may only **edit** allowed paths
* diff validator must reject changes outside scope

If out-of-scope edits occur:

* mark run `cross_scope_required`
* stop auto-commit
* require approval or reroute

---

# 11) Agent routing design

You wanted:

* Claude on some folders
* Gemini on others
* configurable from web UI

## 11.1 Routing levels

### Folder-level

Example:

* `backend/` → Claude
* `mobile/` → Gemini
* `frontend/` → OpenCode

### Task-level override

Example:

* `backend bug fix` → Claude Sonnet
* `backend triage` → Gemini Flash
* `mobile UI regression` → Gemini
* `large cross-file refactor` → Claude
* `quick lint cleanup` → cheaper model

### Fallback

If primary agent unavailable or fails:

* use fallback if policy allows

## 11.2 Agent profile settings

Per agent define:

* binary path
* launch method
* supported models
* max runtime
* max prompt size
* can use MCP or not
* supports hooks or not
* supports custom commands or not

---

# 12) Prompt/snippet pack system

You asked about reusable injected snippets like `@gsd`.

Do not implement this as browser DOM typing.
Build a **Prompt Pack Registry**.

## 12.1 What it should do

Store reusable workflows:

* `@gsd`
* `fix_api_bug`
* `review_pr`
* `reproduce_browser_bug`
* `mobile_smoke`
* `safe_refactor`

## 12.2 Prompt pack contents

Each pack should store:

* name
* target agent
* description
* instruction template
* allowed tools
* recommended model
* arguments
* version
* enabled

## 12.3 Runtime behavior

When a run starts:

* load applicable prompt packs
* attach to agent session
* use based on task type

---

# 13) Runner design

Each machine must run a long-lived local runner process.

## 13.1 Runner responsibilities

* machine heartbeat
* folder validation
* repo fetch and health checks
* worktree operations
* agent launch
* stdout/stderr capture
* MCP call execution
* test execution
* artifact upload
* graceful stop handling
* force-stop handling

## 13.2 Runner startup validation

At boot:

* verify git installed
* verify configured agents installed
* verify repo folders exist
* verify browser MCP reachable
* verify Android MCP reachable
* verify credentials available
* verify artifact storage writable

## 13.3 Machine capability report

Runner must report:

* OS
* available CPUs/RAM
* browser MCP yes/no
* Android MCP yes/no
* agent binaries available
* emulator status
* local disk space

---

# 14) Browser MCP integration

## 14.1 Purpose

Use browser MCP for:

* reproduction
* navigation
* clicking/typing
* visual checks
* screenshot capture
* console error collection

## 14.2 Structure

Build browser test recipes:

* login flow
* open page
* reproduce issue
* verify fix
* capture final screenshot

## 14.3 Logging

Every browser MCP step must emit:

* step start
* action
* target
* result
* screenshot path
* console errors if any

---

# 15) Android emulator MCP integration

## 15.1 Purpose

Use emulator MCP for:

* launching app
* reproducing mobile bug
* verifying fix
* screenshots
* simple regression flows

## 15.2 Mobile recipe structure

* boot emulator if needed
* install/open app
* navigate to target screen
* perform scenario
* validate expected state
* capture screenshot/video
* stop app / cleanup

## 15.3 Guardrails

* only on staging/dev env
* predefined credentials
* avoid destructive flows by default

---

# 16) REST/API verification engine

This must exist even if browser/emulator tests exist.

## 16.1 Purpose

Fast validation for:

* reproduce issue
* verify response codes
* verify payload
* verify regression endpoints

## 16.2 Define reusable API test packs

Examples:

* create event
* update invitation
* fetch guest list
* template preview
* auth login
* save settings

## 16.3 Results

Store:

* request summary
* response status
* response body preview
* duration
* pass/fail

---

# 17) Live web UI

You asked for exact live visibility.

Build these screens.

## 17.1 Dashboard

Show:

* active machines
* active folders
* running jobs
* queue depth
* failures
* stale locks
* recent completed runs

## 17.2 Machines page

Show:

* online/offline
* OS
* capabilities
* current runs
* resource usage
* last heartbeat

## 17.3 Hosted folders page

Show for each folder:

* machine
* repo
* local path
* allowed scopes
* assigned agent/model
* enabled/paused
* schedule
* health
* active lock
* last run

Actions:

* run now
* pause
* disable
* edit routing
* verify folder
* stop current run

## 17.4 Active runs page

Show:

* run id
* issue/pr
* folder
* agent/model
* current phase
* worktree path
* elapsed time
* last event
* stop / force stop

## 17.5 Run detail page

Show:

* phase timeline
* structured events
* stdout/stderr
* screenshots
* diff summary
* API test results
* browser steps
* emulator steps
* final artifacts
* PR link if created

## 17.6 Policy page

Configure:

* routing rules
* folder match rules
* retry/cooldown
* max file changes
* approval rules

---

# 18) Stop / force-stop design

This must be first-class.

## 18.1 Graceful stop

When user clicks Stop:

* backend sets `stop_requested = true`
* runner receives stop signal
* runner stops at next safe checkpoint
* agent session ends cleanly
* artifacts saved
* locks released
* worktree removed or preserved based on setting
* run marked `stopped`

## 18.2 Force stop

When user clicks Force Stop:

* kill agent process
* kill child processes
* stop MCP recipes
* finalize partial logs
* mark run `force_stopped`
* cleanup via recovery worker

## 18.3 Safe checkpoints

Check stop flag:

* before agent prompt
* after tool step
* before running tests
* after test batch
* before PR creation
* between browser recipe steps
* between emulator recipe steps

---

# 19) Security and guardrails

This system can be dangerous if not controlled.

## 19.1 Repo safety

* never commit to default branch
* branch-per-run only
* worktree-only edits
* no direct push to protected branches

## 19.2 Path safety

* whitelist editable scopes
* reject out-of-scope diff
* reject secret file modifications unless approved

## 19.3 Machine safety

* run under dedicated OS user
* isolate temp directories
* limit file permissions
* limit shell environment exposure

## 19.4 Credential safety

Store separately:

* GitHub token
* MCP tokens
* test credentials
* browser credentials
* artifact storage credentials

## 19.5 Action safety

Require approval for:

* dependency upgrades
* migrations
* deleting files
* large diffs
* auth/security/payment changes
* cross-scope edits

---

# 20) Failure handling

You need explicit failure classes.

## 20.1 Failure types

* agent startup failure
* repo fetch failure
* worktree creation failure
* lock failure
* issue not reproducible
* tests flaky
* browser MCP unavailable
* emulator unavailable
* diff out of scope
* runtime timeout
* stop requested
* force stop
* crash / abandoned run

## 20.2 Retry rules

* infrastructure failures: retry
* reproducibility failures: cooldown
* out-of-scope failures: require review
* repeated same-fingerprint failures: do not loop endlessly

---

# 21) Approval flow

You likely need human review before PR or patch submission.

## 21.1 Approval points

* before commit
* before push
* before PR creation
* when cross-scope diff detected
* when file-change threshold exceeded

## 21.2 UI controls

* approve and continue
* reject and stop
* reroute to another agent
* allow cross-scope once
* preserve worktree for manual review

---

# 22) Deployment plan

## 22.1 Central components

Host centrally:

* backend API
* DB
* WebSocket/SSE
* artifact storage
* scheduler workers

## 22.2 Per-machine components

Install:

* runner service
* agent binaries
* git
* browser MCP setup
* emulator MCP setup
* local repo folders
* working temp directories

## 22.3 OS targets

Support:

* Ubuntu server/workstation
* macOS desktop/mini

Use same runner logic, OS-specific adapters for:

* process management
* browser startup
* emulator startup
* credential store
* path handling

---

# 23) Recommended build order

This is the best practical sequence.

## Phase 1 — Foundations

Build:

* DB schema
* backend API skeleton
* machine heartbeat
* folder registry
* run states
* lock service

### TODO

* create DB models
* create migration plan
* define API contracts
* define run state machine
* define lock keys
* define heartbeat intervals

---

## Phase 2 — Machine and folder management

Build:

* runner registration
* machine health check
* folder registration from UI
* folder verification flow

### TODO

* add machine onboarding flow
* add folder verification endpoint
* build folder health checker
* show capabilities in UI
* store local folder metadata

---

## Phase 3 — Discovery and matching

Build:

* GitHub issue/PR fetch
* work item storage
* folder matching engine
* ranking engine

### TODO

* fetch issues and PRs periodically
* store normalized work items
* build label/path/component matcher
* compute confidence score
* show “matched folder” in UI
* add skip reasons

---

## Phase 4 — Worktree engine

Build:

* repo fetch/update
* worktree creation
* branch naming
* cleanup worker
* scope validator

### TODO

* define worktree naming rules
* implement branch naming policy
* implement worktree cleanup rules
* validate editable scope before run
* validate diff scope after run

---

## Phase 5 — Agent runners

Build:

* Claude wrapper
* Gemini wrapper
* OpenCode wrapper
* unified runtime interface

### TODO

* define common runner interface
* capture stdout/stderr
* capture step summaries
* handle environment variables
* support prompt pack loading
* support graceful stop
* support hard kill

---

## Phase 6 — Live telemetry

Build:

* structured event emission
* run timeline
* browser live updates

### TODO

* define event types
* implement event persistence
* implement WebSocket/SSE stream
* show live logs in UI
* show current phase, current file, current action

---

## Phase 7 — Verification engine

Build:

* API test runner
* browser MCP recipes
* emulator MCP recipes

### TODO

* define reusable test recipes
* store results as artifacts
* emit pass/fail step events
* show screenshots in UI
* support skip when capability missing

---

## Phase 8 — Stop controls

Build:

* stop requested
* force stop requested
* recovery worker

### TODO

* add UI stop button
* add UI force stop button
* implement safe checkpoints
* kill agent subprocess tree
* release locks safely
* preserve partial artifacts

---

## Phase 9 — Routing and policies

Build:

* folder → agent rules
* task → model rules
* fallback rules
* approval rules

### TODO

* build policy editor UI
* build agent assignment UI
* add folder-specific task routing
* add cost/runtime/diff thresholds
* add approval-required flags

---

## Phase 10 — Prompt/snippet packs

Build:

* reusable instruction packs
* versioning
* folder-scoped packs
* agent-scoped packs

### TODO

* build pack registry
* add pack version control
* attach packs to runs
* add enable/disable from UI
* add arguments schema

---

## Phase 11 — PR / output flow

Build:

* commit message generation
* push branch
* create/update PR
* attach artifacts summary

### TODO

* add push policy
* add PR policy
* add summary generation
* add link-back to run page
* add approval-before-push option

---

## Phase 12 — Recovery and hardening

Build:

* stale run reaper
* orphan worktree cleanup
* dead lock cleanup
* crash recovery

### TODO

* scan stale locks periodically
* scan stale worktrees periodically
* mark runs abandoned
* repair machine state after restart
* alert on repeated failures

---

# 24) Detailed TODO checklist by area

## Backend TODO

* define all entities and migrations
* build REST API for machines, folders, runs, policies, schedules
* build lock manager
* build scheduler
* build GitHub sync worker
* build run orchestrator
* build event ingestion
* build artifact metadata service

## Runner TODO

* machine registration
* heartbeat loop
* repo validation
* worktree lifecycle
* agent launch process management
* stop/force-stop process handling
* REST test execution
* MCP recipe execution
* artifact upload
* local cleanup

## Web UI TODO

* dashboard
* machines page
* hosted folders page
* folder health page
* policies page
* active runs page
* run detail page
* artifacts viewer
* stop/force-stop controls
* approval modal
* schedule editor

## Discovery TODO

* issue fetcher
* PR fetcher
* label matcher
* path matcher
* changed-file matcher
* confidence scoring
* ranking engine

## Policy TODO

* folder → agent
* task → model
* diff limit
* file count limit
* retry policy
* cooldown policy
* approval policy
* stop policy

## Verification TODO

* API recipe library
* browser recipe library
* emulator recipe library
* result normalization
* screenshot storage
* regression summary

## Security TODO

* secrets management
* OS user isolation
* scope enforcement
* protected branch policy
* audit log
* permission checks for stop/force-stop

---

# 25) Minimum viable version

If you want a realistic first deliverable, build this first:

## MVP scope

* one backend service
* one runner
* one repo
* multiple hosted folders
* folder → agent assignment
* GitHub issue scanning
* issue lock + folder lock
* one worktree per run
* Claude + Gemini support
* live event stream
* stop button
* REST verification
* browser MCP only
* no emulator in MVP
* no PR automation in first version

Then add:

* OpenCode
* Android emulator MCP
* approval flow
* PR creation
* prompt pack registry
* cross-folder routing sophistication

---

# 26) Best practical team split

If multiple people are building this:

## Engineer 1

Backend + DB + lock service + scheduler

## Engineer 2

Runner + worktree + agent wrappers

## Engineer 3

Web UI + live telemetry + stop controls

## Engineer 4

Verification engine + browser MCP + emulator MCP

## Engineer 5

Policy engine + GitHub matching + prompt pack registry

---

# 27) Final build philosophy

The most important design rules are:

1. **Folder is the main operational unit**
2. **One run = one worktree**
3. **Every run must be stoppable**
4. **Live status must be event-driven**
5. **Locking must happen before any work begins**
6. **Diff scope must be enforced after the run**
7. **Agent/model choice must be policy-driven**
8. **No uncontrolled direct edits in the main repo**
9. **Recovery workers are mandatory**
10. **Artifacts and logs must always survive failures**

---

# 28) Final concise system blueprint

Build a **central orchestration platform** with a web UI and DB-backed control plane, plus lightweight runners on macOS/Ubuntu machines. The web UI registers hosted folders and maps each folder or subpath to an agent/model. Schedulers scan GitHub, match issues/PRs to folder scopes, claim work safely with locks, create isolated Git worktrees, run Claude/Gemini/OpenCode inside those worktrees, verify changes using REST/browser/emulator flows, stream live status to the browser, and allow graceful or force stop at any point before cleaning up and releasing locks.

If you want next, I can turn this into a **very detailed product specification document** with:

* exact API route list
* exact DB tables with fields
* exact UI page-by-page requirements
* exact run event names
* exact folder-matching scoring rules
