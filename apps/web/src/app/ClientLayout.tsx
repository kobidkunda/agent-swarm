'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Server, FolderOpen, Play, Lock, GitBranch, Settings } from 'lucide-react';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/machines', label: 'Machines', icon: Server },
  { href: '/folders', label: 'Folders', icon: FolderOpen },
  { href: '/runs', label: 'Runs', icon: Play },
  { href: '/locks', label: 'Locks', icon: Lock },
  { href: '/discovery', label: 'Discovery', icon: GitBranch },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 min-h-screen bg-card border-r">
      <div className="p-6">
        <h1 className="text-xl font-bold">Auto Code</h1>
        <p className="text-sm text-muted-foreground">Platform</p>
      </div>
      <nav className="px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1 ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}
