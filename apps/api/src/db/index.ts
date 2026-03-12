import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import * as schema from './schema';

let db: any;
let sqlDb: any;

export async function initDb(): Promise<any> {
  if (db) return db;

  const SQL = await initSqlJs();
  sqlDb = new SQL.Database();
  db = drizzle(sqlDb, { schema });

  // Create tables
  const createTables = `
    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      os TEXT NOT NULL,
      hostname TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      last_heartbeat TEXT NOT NULL,
      runner_version TEXT NOT NULL,
      supported_agents TEXT NOT NULL DEFAULT '[]',
      browser_mcp_enabled INTEGER NOT NULL DEFAULT 0,
      android_mcp_enabled INTEGER NOT NULL DEFAULT 0,
      max_concurrent_runs INTEGER NOT NULL DEFAULT 1,
      capabilities TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      owner TEXT NOT NULL,
      repo_name TEXT NOT NULL,
      default_branch TEXT NOT NULL,
      remote_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      settings TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hosted_folders (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      repo_id TEXT,
      display_name TEXT NOT NULL,
      absolute_path TEXT NOT NULL,
      branch TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      health_status TEXT NOT NULL DEFAULT 'unknown',
      last_verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folder_scopes (
      id TEXT PRIMARY KEY,
      hosted_folder_id TEXT NOT NULL,
      path_pattern TEXT NOT NULL,
      edit_allowed INTEGER NOT NULL DEFAULT 1,
      read_allowed INTEGER NOT NULL DEFAULT 1,
      test_allowed INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 0,
      excluded INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS folder_routing_rules (
      id TEXT PRIMARY KEY,
      hosted_folder_id TEXT NOT NULL,
      scope_path TEXT NOT NULL,
      task_type TEXT NOT NULL,
      agent TEXT NOT NULL,
      model TEXT NOT NULL,
      fallback_agent TEXT,
      fallback_model TEXT,
      require_approval INTEGER NOT NULL DEFAULT 0,
      max_diff_size INTEGER NOT NULL DEFAULT 10000
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      hosted_folder_id TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      cron TEXT NOT NULL,
      quiet_hours_start TEXT,
      quiet_hours_end TEXT,
      retry_interval INTEGER NOT NULL DEFAULT 60,
      max_parallel INTEGER NOT NULL DEFAULT 1,
      cooldown_minutes INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS work_items (
      id TEXT PRIMARY KEY,
      repo_id TEXT NOT NULL,
      type TEXT NOT NULL,
      external_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      body_summary TEXT,
      labels TEXT NOT NULL DEFAULT '[]',
      severity TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      fingerprint TEXT,
      last_updated TEXT NOT NULL,
      current_lock_owner TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folder_work_item_matches (
      id TEXT PRIMARY KEY,
      hosted_folder_id TEXT NOT NULL,
      work_item_id TEXT NOT NULL,
      confidence_score REAL NOT NULL,
      matched_by TEXT NOT NULL,
      matched_paths TEXT NOT NULL DEFAULT '[]',
      reason TEXT NOT NULL,
      eligible INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      work_item_id TEXT NOT NULL,
      hosted_folder_id TEXT NOT NULL,
      machine_id TEXT,
      agent TEXT NOT NULL,
      model TEXT NOT NULL,
      run_mode TEXT NOT NULL DEFAULT 'auto',
      current_phase TEXT NOT NULL DEFAULT 'queued',
      status TEXT NOT NULL DEFAULT 'queued',
      branch_name TEXT,
      worktree_path TEXT,
      summary TEXT,
      stop_state TEXT NOT NULL DEFAULT 'none',
      created_at TEXT NOT NULL,
      started_at TEXT,
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS run_events (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      human_summary TEXT
    );

    CREATE TABLE IF NOT EXISTS locks (
      key TEXT PRIMARY KEY,
      lock_type TEXT NOT NULL,
      owner_run_id TEXT,
      lease_expires_at TEXT,
      heartbeat_at TEXT,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      artifact_type TEXT NOT NULL,
      local_path TEXT,
      preview_path TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      size INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      binary_path TEXT NOT NULL,
      default_model TEXT NOT NULL,
      supported_capabilities TEXT NOT NULL DEFAULT '[]',
      limits TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS prompt_snippet_packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_agent TEXT NOT NULL,
      scope TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      instruction_template TEXT NOT NULL,
      arguments_schema TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1
    );
  `;

  sqlDb.run(createTables);

  return db;
}

export function getDb(): any {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function closeDb(): void {
  if (sqlDb) {
    sqlDb.close();
    sqlDb = undefined;
    db = undefined;
  }
}

export { schema };
