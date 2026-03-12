'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatRelativeTime, getStatusColor, getPhaseColor, cn } from '@/lib/utils';
import { Server, FolderOpen, Play, Lock, Activity, Clock, AlertTriangle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}

function StatCard({ title, value, icon: Icon, color = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={cn('w-8 h-8', color)} />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: api.machines.list,
  });

  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: api.folders.list,
  });

  const { data: activeRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['active-runs'],
    queryFn: api.runs.active,
  });

  const { data: locks } = useQuery({
    queryKey: ['locks'],
    queryFn: api.locks.list,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 30000,
  });

  const onlineMachines = machines?.filter((m: any) => m.status === 'online') ?? [];
  const healthyFolders = folders?.filter((f: any) => f.healthStatus === 'healthy') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          System overview • Last updated {formatRelativeTime(health?.timestamp)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Online Machines"
          value={`${onlineMachines.length}/${machines?.length ?? 0}`}
          icon={Server}
          color="text-blue-500"
        />
        <StatCard
          title="Healthy Folders"
          value={`${healthyFolders.length}/${folders?.length ?? 0}`}
          icon={FolderOpen}
          color="text-green-500"
        />
        <StatCard
          title="Active Runs"
          value={activeRuns?.length ?? 0}
          icon={Play}
          color="text-purple-500"
        />
        <StatCard
          title="Active Locks"
          value={locks?.length ?? 0}
          icon={Lock}
          color="text-orange-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold">Active Runs</h3>
          </div>
          
          {runsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : activeRuns?.length === 0 ? (
            <p className="text-muted-foreground">No active runs</p>
          ) : (
            <div className="space-y-3">
              {activeRuns?.slice(0, 5).map((run: any) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{run.branchName}</p>
                    <p className={cn('text-sm', getPhaseColor(run.currentPhase))}>
                      {run.currentPhase}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {formatRelativeTime(run.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">System Status</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Status</span>
              <span className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500')} />
                <span className="text-sm">{health?.status === 'ok' ? 'Healthy' : 'Unhealthy'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Uptime</span>
              <span className="text-sm text-muted-foreground">
                {health?.uptime ? `${Math.floor(health.uptime / 60)}m` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Locks</span>
              <span className="text-sm text-muted-foreground">{locks?.length ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
