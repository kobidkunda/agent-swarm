'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '@/components/Dashboard';
import { Sidebar } from '@/components/Sidebar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,
    },
  },
});

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Dashboard />
        </main>
      </div>
    </QueryClientProvider>
  );
}
