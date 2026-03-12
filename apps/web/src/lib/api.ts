const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  machines: {
    list: () => request<any[]>('/api/machines'),
    get: (id: string) => request<any>(`/api/machines/${id}`),
    register: (data: any) => request<any>('/api/machines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    heartbeat: (machineId: string, data: any) => request<any>('/api/machines/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ machineId, ...data }),
    }),
    delete: (id: string) => request<void>(`/api/machines/${id}`, { method: 'DELETE' }),
  },

  folders: {
    list: () => request<any[]>('/api/folders'),
    get: (id: string) => request<any>(`/api/folders/${id}`),
    create: (data: any) => request<any>('/api/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request<any>(`/api/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request<void>(`/api/folders/${id}`, { method: 'DELETE' }),
    getScopes: (id: string) => request<any[]>(`/api/folders/${id}/scopes`),
    createScope: (data: any) => request<any>(`/api/folders/${data.hostedFolderId}/scopes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getRules: (id: string) => request<any[]>(`/api/folders/${id}/rules`),
    createRule: (data: any) => request<any>(`/api/folders/${data.hostedFolderId}/rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getSchedule: (id: string) => request<any>(`/api/folders/${id}/schedule`),
    createSchedule: (data: any) => request<any>(`/api/folders/${data.hostedFolderId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  runs: {
    list: () => request<any[]>('/api/runs'),
    get: (id: string) => request<any>(`/api/runs/${id}`),
    active: () => request<any[]>('/api/runs/active'),
    create: (data: any) => request<any>('/api/runs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request<any>(`/api/runs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    stop: (runId: string, force = false) => request<any>('/api/runs/stop', {
      method: 'POST',
      body: JSON.stringify({ runId, force }),
    }),
    getEvents: (id: string) => request<any[]>(`/api/runs/${id}/events`),
    getRecentEvents: () => request<any[]>('/api/runs/events/recent'),
  },

  locks: {
    list: () => request<any[]>('/api/locks'),
    acquire: (data: any) => request<{ acquired: boolean }>('/api/locks/acquire', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    release: (data: any) => request<void>('/api/locks/release', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  discovery: {
    syncIssues: (data: any) => request<{ synced: number }>('/api/discovery/sync/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    syncPRs: (data: any) => request<{ synced: number }>('/api/discovery/sync/prs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getOpenWorkItems: () => request<any[]>('/api/discovery/workitems'),
    match: (workItemId: string) => request<any[]>('/api/discovery/match', {
      method: 'POST',
      body: JSON.stringify({ workItemId }),
    }),
  },

  health: () => request<any>('/api/health'),
};
