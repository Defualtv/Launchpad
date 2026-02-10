'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  BarChart3,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  FileText,
  Bell,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const response = await fetch('/api/notifications?unread=true&limit=1');
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    }
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200/80 transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            'flex items-center h-16 px-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-md shadow-violet-500/20">
                  <Briefcase className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">JobPilot</span>
              </Link>
            )}
            {collapsed && (
              <Link href="/dashboard">
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-md shadow-violet-500/20">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
              </Link>
            )}
            <button
              className={cn(
                'hidden md:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-slate-100 text-muted-foreground transition-colors',
                collapsed && 'absolute -right-3.5 top-5 bg-white border border-slate-200 shadow-sm rounded-full w-7 h-7'
              )}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-3 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const showNotificationBadge = item.showBadge && unreadCount > 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
                        isActive
                          ? 'gradient-primary text-white shadow-md shadow-violet-500/20'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-foreground',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <item.icon className={cn(
                        'h-[18px] w-[18px] flex-shrink-0 transition-transform',
                        !isActive && 'group-hover:scale-110'
                      )} />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                      {showNotificationBadge && (
                        <span 
                          className={cn(
                            'flex items-center justify-center text-[10px] font-bold rounded-full',
                            isActive 
                              ? 'bg-white text-violet-600' 
                              : 'bg-violet-100 text-violet-700',
                            collapsed 
                              ? 'absolute -top-1 -right-1 h-4 min-w-4 px-1' 
                              : 'ml-auto h-5 min-w-5 px-1.5'
                          )}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* AI badge */}
            {!collapsed && (
              <div className="mt-6 mx-1 p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-semibold text-violet-900">AI Powered</span>
                </div>
                <p className="text-[11px] text-violet-600 leading-relaxed">Get match scores and cover letters instantly.</p>
              </div>
            )}
          </nav>

          {/* Admin link */}
          {session?.user?.email && (
            <div className="px-3 py-2 border-t border-slate-100">
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-foreground transition-all',
                  pathname.startsWith('/admin') && 'gradient-primary text-white shadow-md shadow-violet-500/20',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Shield className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">Admin</span>}
              </Link>
            </div>
          )}

          {/* User section */}
          <div className="p-3 border-t border-slate-100">
            {!collapsed && session?.user && (
              <div className="mb-2 px-3">
                <p className="font-medium text-sm truncate">{session.user.name || session.user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              className={cn(
                'w-full rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors',
                collapsed ? 'px-0 justify-center' : 'justify-start px-3'
              )}
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2 text-sm">Sign out</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
