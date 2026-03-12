'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Server,
  FolderOpen,
  Play,
  Lock,
  Settings,
  GitBranch,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/machines', label: 'Machines', icon: Server },
  { href: '/folders', label: 'Folders', icon: FolderOpen },
  { href: '/runs', label: 'Runs', icon: Play },
  { href: '/locks', label: 'Locks', icon: Lock },
  { href: '/discovery', label: 'Discovery', icon: GitBranch },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
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
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
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
