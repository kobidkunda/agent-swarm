Okay — then use **SQLite**, but change the architecture a bit.

For your system, the best **SQLite-first stack** is:

* **TypeScript monorepo**
* **NestJS + Fastify** for API/control plane
* **SQLite in WAL mode**
* **Drizzle ORM**
* **custom DB-backed orchestrator** instead of Temporal
* **Next.js** for web UI
* **Go runner daemon** on macOS/Ubuntu
* **Playwright + MCP adapters + REST checks** for verification
* **MinIO** for artifacts

The important part is the architecture change: SQLite supports multiple readers, but only **one write transaction at a time**. In WAL mode, reads and writes can overlap better, but you still only get one writer, and long-lived readers can prevent checkpoints from completing and let the WAL file grow. SQLite also advises against shared multi-machine access over flaky network filesystems like NFS. ([SQLite][1])

So with SQLite, I would do this:

### Best design with SQLite

Keep **one central control-plane instance** as the main writer:

* scheduler
* lock manager
* run state machine
* event persistence
* stop/force-stop flags

Then have many **runner agents** on machines, but they should not all write heavily to the DB directly. They should mostly:

* receive work
* stream events to API
* upload artifacts
* heartbeat

That fits SQLite much better because it reduces write contention. SQLite is excellent for internal/local databases and single-server app designs, and it can be very fast, but it is not the right foundation for a heavily multi-writer distributed control plane. ([SQLite][2])

### What to remove

Do **not** use Temporal for production if you are insisting on SQLite. Temporal’s own persistence docs say SQLite persistence is for **development and testing**, not production usage. ([Temporal Docs][3])

So replace Temporal with:

* your own **run state machine**
* DB tables for `runs`, `run_events`, `locks`, `leases`, `schedules`
* one scheduler loop
* one recovery loop
* heartbeat-based stale lock cleanup

### Exact stack I recommend now

**Backend**

* NestJS
* Fastify
* Drizzle
* SQLite
* Pino
* Zod

**Web UI**

* Next.js
* React
* Tailwind
* shadcn/ui
* TanStack Query
* SSE for live status

**Runner**

* Go
* native `git worktree`
* subprocess control for Claude Code / Gemini CLI / OpenCode
* MCP wrappers
* REST/browser/mobile verification adapters

**Storage**

* SQLite for core metadata/state
* MinIO for screenshots, logs, videos, traces, diffs

### SQLite-specific rules you should follow

With SQLite, I’d enforce these from day one:

* run the DB on **local disk**, not shared network storage ([SQLite][2])
* enable **WAL mode** ([SQLite][4])
* keep write transactions **very short** because only one writer can exist at a time ([SQLite][1])
* avoid long open read transactions, otherwise checkpoint starvation can grow the WAL file indefinitely ([SQLite][4])
* keep only **one active scheduler/orchestrator leader**
* treat live logs as append events, and batch them when needed

### Final answer

If you want **SQLite no matter what**, then the best stack is:

**Next.js + NestJS + Drizzle + SQLite + Go runner + Playwright + MinIO**

And the most important architectural decision is:

**single central writer / orchestrator, many remote runners**

That is the cleanest and safest SQLite-based version of your platform.

I can turn this into a **full SQLite-specific implementation stack doc** next: exact packages, folder structure, DB schema, lock queries, and run loop design.

[1]: https://sqlite.org/lang_transaction.html "Transaction"
[2]: https://sqlite.org/whentouse.html "Appropriate Uses For SQLite"
[3]: https://docs.temporal.io/temporal-service/persistence "Persistence | Temporal Platform Documentation"
[4]: https://sqlite.org/wal.html "Write-Ahead Logging"
