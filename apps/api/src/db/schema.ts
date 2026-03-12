import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const machines = sqliteTable('machines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  os: text('os').notNull(),
  hostname: text('hostname').notNull(),
  status: text('status').notNull().default('offline'),
  lastHeartbeat: integer('last_heartbeat', { mode: 'timestamp' }).notNull(),
  runnerVersion: text('runner_version').notNull(),
  supportedAgents: text('supported_agents').notNull(),
  browserMcpEnabled: integer('browser_mcp_enabled', { mode: 'boolean' }).notNull().default(false),
  androidMcpEnabled: integer('android_mcp_enabled', { mode: 'boolean' }).notNull().default(false),
  maxConcurrentRuns: integer('max_concurrent_runs').notNull().default(1),
  capabilities: text('capabilities'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const repositories = sqliteTable('repositories', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  owner: text('owner').notNull(),
  repoName: text('repo_name').notNull(),
  defaultBranch: text('default_branch').notNull(),
  remoteUrl: text('remote_url').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  settings: text('settings'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const hostedFolders = sqliteTable('hosted_folders', {
  id: text('id').primaryKey(),
  machineId: text('machine_id').notNull().references(() => machines.id),
  repoId: text('repo_id').references(() => repositories.id),
  displayName: text('display_name').notNull(),
  absolutePath: text('absolute_path').notNull(),
  branch: text('branch').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  healthStatus: text('health_status').notNull().default('unknown'),
  lastVerifiedAt: integer('last_verified_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const folderScopes = sqliteTable('folder_scopes', {
  id: text('id').primaryKey(),
  hostedFolderId: text('hosted_folder_id').notNull().references(() => hostedFolders.id),
  pathPattern: text('path_pattern').notNull(),
  editAllowed: integer('edit_allowed', { mode: 'boolean' }).notNull().default(true),
  readAllowed: integer('read_allowed', { mode: 'boolean' }).notNull().default(true),
  testAllowed: integer('test_allowed', { mode: 'boolean' }).notNull().default(true),
  priority: integer('priority').notNull().default(0),
  excluded: integer('excluded', { mode: 'boolean' }).notNull().default(false),
});

export const folderRoutingRules = sqliteTable('folder_routing_rules', {
  id: text('id').primaryKey(),
  hostedFolderId: text('hosted_folder_id').notNull().references(() => hostedFolders.id),
  scopePath: text('scope_path').notNull(),
  taskType: text('task_type').notNull(),
  agent: text('agent').notNull(),
  model: text('model').notNull(),
  fallbackAgent: text('fallback_agent'),
  fallbackModel: text('fallback_model'),
  requireApproval: integer('require_approval', { mode: 'boolean' }).notNull().default(false),
  maxDiffSize: integer('max_diff_size').notNull().default(10000),
});

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  hostedFolderId: text('hosted_folder_id').notNull().references(() => hostedFolders.id),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  cron: text('cron').notNull(),
  quietHoursStart: text('quiet_hours_start'),
  quietHoursEnd: text('quiet_hours_end'),
  retryInterval: integer('retry_interval').notNull().default(60),
  maxParallel: integer('max_parallel').notNull().default(1),
  cooldownMinutes: integer('cooldown_minutes').notNull().default(30),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workItems = sqliteTable('work_items', {
  id: text('id').primaryKey(),
  repoId: text('repo_id').notNull().references(() => repositories.id),
  type: text('type').notNull(),
  externalNumber: integer('external_number').notNull(),
  title: text('title').notNull(),
  bodySummary: text('body_summary'),
  labels: text('labels'),
  severity: text('severity').notNull().default('medium'),
  status: text('status').notNull().default('open'),
  fingerprint: text('fingerprint'),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
  currentLockOwner: text('current_lock_owner'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const folderWorkItemMatches = sqliteTable('folder_work_item_matches', {
  id: text('id').primaryKey(),
  hostedFolderId: text('hosted_folder_id').notNull().references(() => hostedFolders.id),
  workItemId: text('work_item_id').notNull().references(() => workItems.id),
  confidenceScore: real('confidence_score').notNull(),
  matchedBy: text('matched_by').notNull(),
  matchedPaths: text('matched_paths'),
  reason: text('reason').notNull(),
  eligible: integer('eligible', { mode: 'boolean' }).notNull().default(true),
});

export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  workItemId: text('work_item_id').notNull().references(() => workItems.id),
  hostedFolderId: text('hosted_folder_id').notNull().references(() => hostedFolders.id),
  machineId: text('machine_id').references(() => machines.id),
  agent: text('agent').notNull(),
  model: text('model').notNull(),
  runMode: text('run_mode').notNull().default('auto'),
  currentPhase: text('current_phase').notNull().default('queued'),
  status: text('status').notNull().default('queued'),
  branchName: text('branch_name'),
  worktreePath: text('worktree_path'),
  summary: text('summary'),
  stopState: text('stop_state').notNull().default('none'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
});

export const runEvents = sqliteTable('run_events', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => runs.id),
  sequenceNumber: integer('sequence_number').notNull(),
  eventType: text('event_type').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  payload: text('payload'),
  humanSummary: text('human_summary'),
});

export const locks = sqliteTable('locks', {
  key: text('key').primaryKey(),
  lockType: text('lock_type').notNull(),
  ownerRunId: text('owner_run_id'),
  leaseExpiresAt: integer('lease_expires_at', { mode: 'timestamp' }),
  heartbeatAt: integer('heartbeat_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('active'),
});

export const artifacts = sqliteTable('artifacts', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => runs.id),
  artifactType: text('artifact_type').notNull(),
  localPath: text('local_path'),
  previewPath: text('preview_path'),
  metadata: text('metadata'),
  size: integer('size').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const agentProfiles = sqliteTable('agent_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  binaryPath: text('binary_path').notNull(),
  defaultModel: text('default_model').notNull(),
  supportedCapabilities: text('supported_capabilities'),
  limits: text('limits'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
});

export const promptSnippetPacks = sqliteTable('prompt_snippet_packs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAgent: text('target_agent').notNull(),
  scope: text('scope').notNull(),
  version: integer('version').notNull().default(1),
  instructionTemplate: text('instruction_template').notNull(),
  argumentsSchema: text('arguments_schema'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
});

export type Machine = typeof machines.$inferSelect;
export type NewMachine = typeof machines.$inferInsert;
export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type HostedFolder = typeof hostedFolders.$inferSelect;
export type NewHostedFolder = typeof hostedFolders.$inferInsert;
export type FolderScope = typeof folderScopes.$inferSelect;
export type NewFolderScope = typeof folderScopes.$inferInsert;
export type FolderRoutingRule = typeof folderRoutingRules.$inferSelect;
export type NewFolderRoutingRule = typeof folderRoutingRules.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type WorkItem = typeof workItems.$inferSelect;
export type NewWorkItem = typeof workItems.$inferInsert;
export type FolderWorkItemMatch = typeof folderWorkItemMatches.$inferSelect;
export type NewFolderWorkItemMatch = typeof folderWorkItemMatches.$inferInsert;
export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type RunEvent = typeof runEvents.$inferSelect;
export type NewRunEvent = typeof runEvents.$inferInsert;
export type Lock = typeof locks.$inferSelect;
export type NewLock = typeof locks.$inferInsert;
export type Artifact = typeof artifacts.$inferSelect;
export type NewArtifact = typeof artifacts.$inferInsert;
export type AgentProfile = typeof agentProfiles.$inferSelect;
export type NewAgentProfile = typeof agentProfiles.$inferInsert;
export type PromptSnippetPack = typeof promptSnippetPacks.$inferSelect;
export type NewPromptSnippetPack = typeof promptSnippetPacks.$inferInsert;
