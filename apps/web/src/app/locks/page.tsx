'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function LocksPage() {
  const { data: locks, isLoading } = useQuery({
    queryKey: ['locks'],
    queryFn: () => api.locks.list(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Locks</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : locks?.length === 0 ? (
        <p className="text-muted-foreground">No active locks</p>
      ) : (
        <div className="grid gap-4">
          {locks?.map((lock: any) => (
            <div key={lock.key} className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{lock.key}</h3>
                  <p className="text-sm text-muted-foreground">
                    {lock.lockType} • {lock.ownerRunId?.slice(0, 8) || 'no owner'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  lock.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {lock.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
