'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function FoldersPage() {
  const { data: folders, isLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => api.folders.list(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Folders</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Add Folder
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : folders?.length === 0 ? (
        <p className="text-muted-foreground">No folders registered</p>
      ) : (
        <div className="grid gap-4">
          {folders?.map((folder: any) => (
            <div key={folder.id} className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{folder.displayName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {folder.absolutePath} • {folder.branch}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  folder.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {folder.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
