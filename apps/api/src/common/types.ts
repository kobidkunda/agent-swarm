export type OS = 'darwin' | 'linux' | 'windows';
export type MachineStatus = 'online' | 'offline' | 'stale';

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
  capabilities: any;
  createdAt: Date;
  updatedAt: Date;
}
