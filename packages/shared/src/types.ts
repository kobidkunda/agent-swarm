export type OS = 'darwin' | 'linux' | 'windows';

export type MachineStatus = 'online' | 'offline' | 'stale';

export type RunStatus =
  | 'queued'
  | 'matching'
  | 'claiming'
  | 'preparing_workspace'
  | 'starting_agent'
  | 'reproducing_issue'
  | 'analyzing_code'
  | 'editing_code'
  | 'running_tests'
  | 'running_rest_checks'
  | 'running_browser_checks'
  | 'running_mobile_checks'
  | 'collecting_artifacts'
  | 'awaiting_approval'
  | 'creating_pr'
  | 'completed'
  | 'failed'
  | 'stopped'
  | 'force_stopped'
  | 'timed_out'
  | 'abandoned';

export type RunPhase = Exclude<RunStatus, 'completed' | 'failed' | 'stopped' | 'force_stopped' | 'timed_out' | 'abandoned'>;

export type StopState = 'none' | 'stop_requested' | 'graceful_stopping' | 'force_stop_requested';

export type WorkItemType = 'issue' | 'pr';

export type WorkItemStatus = 'open' | 'closed' | 'merged';

export type LockType = 'scheduler' | 'repo' | 'folder' | 'issue' | 'branch';

export type LockStatus = 'active' | 'releasing' | 'released';

export type ArtifactType = 
  | 'screenshot'
  | 'video'
  | 'log'
  | 'diff'
  | 'test_report'
  | 'console_output'
  | 'api_response'
  | 'summary';

export interface Machine {
  id: string;
  name: string;
  os: OS;
  hostname: string;
  status: MachineStatus;
  lastHeartbeat: Date;
  runnerVersion: string;
  supportedAgents: string[];
  browserMcpEnabled: boolean;
  androidMcpEnabled: boolean;
  maxConcurrentRuns: number;
  capabilities: MachineCapabilities;
  createdAt: Date;
  updatedAt: Date;
}

export interface MachineCapabilities {
  cpus: number;
  memory: number;
  diskSpace: number;
  hasBrowser: boolean;
  hasEmulator: boolean;
  availableAgents: string[];
}

export interface Repository {
  id: string;
  provider: 'github';
  owner: string;
  repoName: string;
  defaultBranch: string;
  remoteUrl: string;
  active: boolean;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HostedFolder {
  id: string;
  machineId: string;
  repoId: string;
  displayName: string;
  absolutePath: string;
  branch: string;
  enabled: boolean;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderScope {
  id: string;
  hostedFolderId: string;
  pathPattern: string;
  editAllowed: boolean;
  readAllowed: boolean;
  testAllowed: boolean;
  priority: number;
  excluded: boolean;
}

export interface FolderRoutingRule {
  id: string;
  hostedFolderId: string;
  scopePath: string;
  taskType: string;
  agent: string;
  model: string;
  fallbackAgent: string;
  fallbackModel: string;
  requireApproval: boolean;
  maxDiffSize: number;
}

export interface Schedule {
  id: string;
  hostedFolderId: string;
  enabled: boolean;
  cron: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  retryInterval: number;
  maxParallel: number;
  cooldownMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkItem {
  id: string;
  repoId: string;
  type: WorkItemType;
  externalNumber: number;
  title: string;
  bodySummary: string;
  labels: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: WorkItemStatus;
  fingerprint: string;
  lastUpdated: Date;
  currentLockOwner: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderWorkItemMatch {
  id: string;
  hostedFolderId: string;
  workItemId: string;
  confidenceScore: number;
  matchedBy: string;
  matchedPaths: string[];
  reason: string;
  eligible: boolean;
}

export interface Run {
  id: string;
  workItemId: string;
  hostedFolderId: string;
  machineId: string;
  agent: string;
  model: string;
  runMode: 'auto' | 'manual';
  currentPhase: RunPhase;
  status: RunStatus;
  branchName: string;
  worktreePath: string | null;
  summary: string | null;
  stopState: StopState;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
}

export interface RunEvent {
  id: string;
  runId: string;
  sequenceNumber: number;
  eventType: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  humanSummary: string;
}

export interface Lock {
  key: string;
  lockType: LockType;
  ownerRunId: string;
  leaseExpiresAt: Date;
  heartbeatAt: Date;
  status: LockStatus;
}

export interface Artifact {
  id: string;
  runId: string;
  artifactType: ArtifactType;
  localPath: string | null;
  previewPath: string | null;
  metadata: Record<string, unknown>;
  size: number;
  createdAt: Date;
}

export interface AgentProfile {
  id: string;
  name: string;
  provider: 'claude' | 'gemini' | 'opencode';
  binaryPath: string;
  defaultModel: string;
  supportedCapabilities: string[];
  limits: {
    maxRuntime: number;
    maxPromptSize: number;
    canUseMcp: boolean;
  };
  enabled: boolean;
}

export interface PromptSnippetPack {
  id: string;
  name: string;
  targetAgent: string;
  scope: string;
  version: number;
  instructionTemplate: string;
  argumentsSchema: Record<string, unknown>;
  enabled: boolean;
}

export interface ApiContract {
  machines: Machine;
  repositories: Repository;
  hostedFolders: HostedFolder;
  folderScopes: FolderScope;
  folderRoutingRules: FolderRoutingRule;
  schedules: Schedule;
  workItems: WorkItem;
  folderWorkItemMatches: FolderWorkItemMatch;
  runs: Run;
  runEvents: RunEvent;
  locks: Lock;
  artifacts: Artifact;
  agentProfiles: AgentProfile;
  promptSnippetPacks: PromptSnippetPack;
}

export interface MachineRegistrationPayload {
  name: string;
  os: OS;
  hostname: string;
  runnerVersion: string;
  supportedAgents: string[];
  browserMcpEnabled: boolean;
  androidMcpEnabled: boolean;
  maxConcurrentRuns: number;
}

export interface HeartbeatPayload {
  machineId: string;
  status: MachineStatus;
  capabilities: MachineCapabilities;
}

export interface CreateRunPayload {
  workItemId: string;
  hostedFolderId: string;
  agent: string;
  model: string;
}

export interface StopPayload {
  runId: string;
  force: boolean;
}

export interface FolderMatchResult {
  workItemId: string;
  folderId: string;
  score: number;
  reasons: string[];
  paths: string[];
}
