'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function RunsPage() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => api.runs.list(),
  });

  const { data: activeRuns } = useQuery({
    queryKey: ['runs', 'active'],
    queryFn: () => api.runs.active(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Runs</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Create Run
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-lg border p-4">
          <h2 className="font-semibold mb-4">Active Runs ({activeRuns?.length || 0})</h2>
          {activeRuns?.length === 0 ? (
            <p className="text-muted-foreground">No active runs</p>
          ) : (
            <div className="space-y-2">
              {activeRuns?.map((run: any) => (
                <div key={run.id} className="border-b pb-2">
                  <p className="font-medium">{run.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {run.agent} • {run.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h2 className="font-semibold mb-4">All Runs ({runs?.length || 0})</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : runs?.length === 0 ? (
            <p className="text-muted-foreground">No runs</p>
          ) : (
            <div className="space-y-2">
              {runs?.slice(0, 10).map((run: any) => (
                <div key={run.id} className="border-b pb-2">
                  <p className="font-medium">{run.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {run.agent} • {run.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
