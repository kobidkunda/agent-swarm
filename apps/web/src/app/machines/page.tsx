'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function MachinesPage() {
  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Machines</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Add Machine
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : machines?.length === 0 ? (
        <p className="text-muted-foreground">No machines registered</p>
      ) : (
        <div className="grid gap-4">
          {machines?.map((machine: any) => (
            <div key={machine.id} className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{machine.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {machine.os} • {machine.hostname}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  machine.status === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {machine.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
