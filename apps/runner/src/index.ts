import { execa, execaCommand } from 'execa';
import pino from 'pino';
import { v4 as uuid } from 'uuid';

const logger = pino({ level: 'info' });

const API_URL = process.env.API_URL || 'http://localhost:7200';
const RUNNER_ID = process.env.RUNNER_ID || uuid();
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000', 10);

interface Machine {
  id: string;
  name: string;
  status: string;
}

interface Run {
  id: string;
  workItemId: string;
  hostedFolderId: string;
  machineId: string;
  agent: string;
  model: string;
  branchName: string;
  currentPhase: string;
  status: string;
  stopState: string;
  worktreePath?: string | null;
  summary?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}

interface HostedFolder {
  id: string;
  absolutePath: string;
  branch: string;
}

let currentProcess: any = null;
let currentRunId: string | null = null;

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

async function registerRunner(): Promise<Machine> {
  const os = process.platform === 'darwin' ? 'darwin' : process.platform === 'win32' ? 'windows' : 'linux';
  
  try {
    const machine = await apiRequest<Machine>('/api/machines', {
      method: 'POST',
      body: JSON.stringify({
        id: RUNNER_ID,
        name: `runner-${RUNNER_ID.substring(0, 8)}`,
        os,
        hostname: require('os').hostname(),
        runnerVersion: '1.0.0',
        supportedAgents: ['claude', 'opencode', 'gemini'],
        maxConcurrentRuns: 1,
      }),
    });
    
    logger.info({ machineId: machine.id }, 'Registered as machine');
    return machine;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      logger.info('Runner already registered, fetching machine info');
      return apiRequest<Machine>(`/api/machines/${RUNNER_ID}`);
    }
    throw error;
  }
}

async function sendHeartbeat(): Promise<void> {
  try {
    await apiRequest('/api/machines/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ machineId: RUNNER_ID }),
    });
  } catch (error) {
    logger.warn({ error }, 'Heartbeat failed');
  }
}

async function getAssignedRun(): Promise<Run | null> {
  const runs = await apiRequest<Run[]>('/api/runs?status=assigned');
  return runs.find(r => r.machineId === RUNNER_ID) || null;
}

async function getQueuedRun(): Promise<Run | null> {
  const runs = await apiRequest<Run[]>('/api/runs');
  return runs.find(r => r.status === 'queued') || null;
}

async function getHostedFolder(folderId: string): Promise<HostedFolder> {
  return apiRequest<HostedFolder>(`/api/folders/${folderId}`);
}

async function addRunEvent(runId: string, eventType: string, payload: any, summary?: string): Promise<void> {
  try {
    await apiRequest('/api/runs/events', {
      method: 'POST',
      body: JSON.stringify({ runId, eventType, payload, humanSummary: summary }),
    });
  } catch (error) {
    logger.warn({ error, runId, eventType }, 'Failed to add event');
  }
}

async function updateRun(runId: string, data: Partial<Run>): Promise<Run> {
  return apiRequest<Run>(`/api/runs/${runId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function claimRun(runId: string): Promise<Run> {
  return apiRequest<Run>(`/api/runs/${runId}/claim`, {
    method: 'POST',
  });
}

async function createWorktree(folder: HostedFolder, branchName: string): Promise<string> {
  const worktreePath = `${folder.absolutePath}/.worktrees/${branchName}`;
  
  logger.info({ folder: folder.absolutePath, branch: branchName, worktreePath }, 'Creating worktree');
  
  try {
    await execaCommand(`git worktree add "${worktreePath}" ${branchName}`, {
      cwd: folder.absolutePath,
    });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      logger.info({ worktreePath }, 'Worktree already exists');
    } else {
      throw error;
    }
  }
  
  return worktreePath;
}

async function deleteWorktree(worktreePath: string): Promise<void> {
  logger.info({ worktreePath }, 'Removing worktree');
  
  try {
    await execaCommand(`git worktree remove "${worktreePath}" --force`, {
      cwd: require('path').dirname(worktreePath),
    });
  } catch (error) {
    logger.warn({ error, worktreePath }, 'Failed to remove worktree');
  }
}

async function runAgent(worktreePath: string, agent: string, model: string, workItemId: string): Promise<string> {
  let summary = '';
  
  logger.info({ worktreePath, agent, model, workItemId }, 'Starting agent');
  
  try {
    if (agent === 'claude') {
      currentProcess = execaCommand(`claude`, {
        cwd: worktreePath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, CLAUDE_MODEL: model },
      });
    } else if (agent === 'opencode') {
      currentProcess = execaCommand(`opencode`, {
        cwd: worktreePath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } else {
      throw new Error(`Unknown agent: ${agent}`);
    }
    
    if (currentProcess.stdout) {
      currentProcess.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        summary += text;
        logger.info({ agent: 'stdout' }, text.substring(0, 200));
      });
    }
    
    if (currentProcess.stderr) {
      currentProcess.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        logger.info({ agent: 'stderr' }, text.substring(0, 200));
      });
    }
    
    const result = await currentProcess;
    
    if (result.failed) {
      throw new Error(`Agent exited with code ${result.exitCode}`);
    }
    
    return summary;
  } finally {
    currentProcess = null;
  }
}

async function handleStop(runId: string): Promise<void> {
  if (currentProcess) {
    logger.info({ runId }, 'Stopping agent process');
    currentProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (currentProcess) {
        currentProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

async function processRun(run: Run): Promise<void> {
  currentRunId = run.id;
  
  try {
    logger.info({ runId: run.id }, 'Processing run');
    
    await addRunEvent(run.id, 'run_started', { agent: run.agent, model: run.model }, 'Run started');
    
    const folder = await getHostedFolder(run.hostedFolderId);
    
    await addRunEvent(run.id, 'worktree_creating', { branch: run.branchName }, 'Creating worktree');
    
    const worktreePath = await createWorktree(folder, run.branchName);
    
    await updateRun(run.id, {
      status: 'running',
      currentPhase: 'working',
      worktreePath,
      startedAt: new Date().toISOString(),
    });
    
    await addRunEvent(run.id, 'worktree_ready', { path: worktreePath }, 'Worktree ready');
    
    await addRunEvent(run.id, 'agent_starting', { agent: run.agent, model: run.model }, `Starting ${run.agent}`);
    
    const runStopState = async () => {
      const r = await apiRequest<Run>(`/api/runs/${run.id}`);
      return r.stopState;
    };
    
    const checkStop = async () => {
      const state = await runStopState();
      if (state === 'stop_requested' || state === 'force_stop_requested') {
        logger.info({ runId: run.id, state }, 'Stop requested');
        await handleStop(run.id);
        
        if (state === 'force_stop_requested') {
          await updateRun(run.id, { status: 'force_stopped', currentPhase: 'stopped' });
          await addRunEvent(run.id, 'run_force_stopped', {}, 'Run force stopped');
        } else {
          await updateRun(run.id, { status: 'stopped', currentPhase: 'stopped' });
          await addRunEvent(run.id, 'run_stopped', {}, 'Run stopped gracefully');
        }
        
        return true;
      }
      return false;
    };
    
    const stopChecker = setInterval(async () => {
      if (await checkStop()) {
        clearInterval(stopChecker);
      }
    }, 2000);
    
    try {
      const summary = await runAgent(worktreePath, run.agent, run.model, run.workItemId);
      
      clearInterval(stopChecker);
      
      await updateRun(run.id, {
        status: 'completed',
        currentPhase: 'completed',
        summary: summary.substring(0, 10000),
        endedAt: new Date().toISOString(),
      });
      
      await addRunEvent(run.id, 'run_completed', { summaryLength: summary.length }, 'Run completed');
      
    } catch (error: any) {
      clearInterval(stopChecker);
      
      logger.error({ error: error.message }, 'Agent failed');
      
      await updateRun(run.id, {
        status: 'failed',
        currentPhase: 'failed',
        summary: error.message,
        endedAt: new Date().toISOString(),
      });
      
      await addRunEvent(run.id, 'run_failed', { error: error.message }, 'Run failed');
    }
    
    await addRunEvent(run.id, 'worktree_cleaning', {}, 'Cleaning up worktree');
    await deleteWorktree(worktreePath);
    
  } catch (error: any) {
    logger.error({ error: error.message, runId: run.id }, 'Run failed');
    
    await updateRun(run.id, {
      status: 'failed',
      currentPhase: 'failed',
      summary: error.message,
      endedAt: new Date().toISOString(),
    });
    
    await addRunEvent(run.id, 'run_error', { error: error.message }, 'Run error');
  } finally {
    currentRunId = null;
  }
}

async function main(): Promise<void> {
  logger.info({ runnerId: RUNNER_ID, apiUrl: API_URL }, 'Starting runner');
  
  await registerRunner();
  
  let heartbeatInterval: NodeJS.Timeout;
  
  heartbeatInterval = setInterval(async () => {
    await sendHeartbeat();
  }, 30000);
  
  logger.info('Entering main loop');
  
  while (true) {
    try {
      const assignedRun = await getAssignedRun();
      
      if (assignedRun) {
        logger.info({ runId: assignedRun.id }, 'Found assigned run');
        await processRun(assignedRun);
        continue;
      }
      
      const queuedRun = await getQueuedRun();
      
      if (queuedRun) {
        logger.info({ runId: queuedRun.id }, 'claiming queued run');
        
        try {
          const claimed = await apiRequest<Run>(`/api/runs/${queuedRun.id}/claim`, {
            method: 'POST',
            body: JSON.stringify({ machineId: RUNNER_ID }),
          });
          
          if (claimed.machineId === RUNNER_ID) {
            await processRun(claimed);
            continue;
          }
        } catch (error: any) {
          if (!error.message.includes('already claimed')) {
            logger.warn({ error: error.message }, 'Failed to claim run');
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      
    } catch (error: any) {
      logger.error({ error: error.message }, 'Main loop error');
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down');
  
  if (currentRunId) {
    await handleStop(currentRunId);
  }
  
  process.exit(0);
});

main().catch(error => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
