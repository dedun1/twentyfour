'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Calendar, MessageSquare, FileText, BarChart2, Bell, Settings, Shield, LogOut, Zap,
  Globe, Moon, Sun,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { toast } from 'sonner';
import type { FeatureKey } from '@/lib/types';
import { useTheme } from 'next-themes';

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  key: keyof ReturnType<typeof useT>['sidebar'];
  feature?: FeatureKey;
  alwaysShow?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard', alwaysShow: true },
  { href: '/dashboard/appointments', icon: Calendar, key: 'appointments', feature: 'appointments' },
  { href: '/dashboard/inbox', icon: MessageSquare, key: 'whatsapp', feature: 'whatsapp' },
  { href: '/dashboard/scripts', icon: FileText, key: 'scripts', feature: 'scripts' },
  { href: '/dashboard/reports', icon: BarChart2, key: 'reports', feature: 'reports' },
  { href: '/dashboard/reminders', icon: Bell, key: 'reminders', feature: 'reminders' },
  { href: '/dashboard/settings', icon: Settings, key: 'settings', alwaysShow: true },
];

interface SidebarProps {
  userEmail?: string;
  userName?: string;
  isAdmin?: boolean;
  features?: FeatureKey[];
  serviceLabel?: string | null;
}

export function Sidebar({ isAdmin = false, features = [], serviceLabel = null }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const t = useT(lang);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const visibleItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (item.alwaysShow) return true;
    if (!item.feature) return false;
    return features.includes(item.feature);
  });

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success(lang === 'ar' ? 'تم تسجيل الخروج' : 'Logged out');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const renderLink = (href: string, label: string, Icon: typeof LayoutDashboard, active: boolean) => (
    <Link
      href={href}
      className={cn(
        'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span
        className={cn(
          'whitespace-nowrap transition-opacity',
          expanded ? 'opacity-100 delay-75' : 'opacity-0 pointer-events-none'
        )}
      >
        {label}
      </span>
    </Link>
  );

  const renderAction = (
    label: string,
    Icon: typeof LayoutDashboard,
    onClick: () => void,
    end?: React.ReactNode
  ) => (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Icon className="size-[18px] shrink-0" />
      <span
        className={cn(
          'whitespace-nowrap transition-opacity',
          expanded ? 'opacity-100 delay-75' : 'opacity-0 pointer-events-none'
        )}
      >
        {label}
      </span>
      {end ? (
        <span
          className={cn(
            'ms-auto text-xs font-semibold text-muted-foreground transition-opacity',
            expanded ? 'opacity-100 delay-75' : 'opacity-0 pointer-events-none'
          )}
        >
          {end}
        </span>
      ) : null}
    </button>
  );

  return (
    <TooltipProvider delay={0}>
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-[width] duration-200 ease-out',
          expanded ? 'w-60' : 'w-16'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Zap className="size-4 text-primary-foreground" />
            </div>
            <div
              className={cn(
                'min-w-0 whitespace-nowrap transition-opacity',
                expanded ? 'opacity-100 delay-75' : 'opacity-0'
              )}
            >
              <span className="block text-sm font-semibold">TwentyFour</span>
              {serviceLabel ? (
                <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {serviceLabel}
                </span>
              ) : null}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-2">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              const label = t.sidebar[item.key];
              if (expanded) {
                return <div key={item.href}>{renderLink(item.href, label, item.icon, active)}</div>;
              }
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={renderLink(item.href, label, item.icon, active)} />
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            })}

            {isAdmin && (() => {
              const active = pathname.startsWith('/admin');
              const label = t.sidebar.admin;
              if (expanded) {
                return renderLink('/admin', label, Shield, active);
              }
              return (
                <Tooltip>
                  <TooltipTrigger render={renderLink('/admin', label, Shield, active)} />
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            })()}
          </nav>

          <Separator />

          {/* Bottom actions */}
          <div className="p-2">
            {/* Theme toggle */}
            {expanded ? (
              renderAction(
                lang === 'ar' ? 'المظهر' : 'Theme',
                (resolvedTheme === 'dark' ? Sun : Moon) as unknown as typeof LayoutDashboard,
                () => {
                  const next = (resolvedTheme === 'dark' ? 'light' : 'dark');
                  setTheme(next);
                }
              )
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={renderAction(
                    lang === 'ar' ? 'المظهر' : 'Theme',
                    (resolvedTheme === 'dark' ? Sun : Moon) as unknown as typeof LayoutDashboard,
                    () => {
                      const next = (resolvedTheme === 'dark' ? 'light' : 'dark');
                      setTheme(next);
                    }
                  )}
                />
                <TooltipContent side="right">{lang === 'ar' ? 'المظهر' : 'Theme'}</TooltipContent>
              </Tooltip>
            )}

            {/* Language toggle */}
            {expanded ? (
              renderAction(
                lang === 'ar' ? 'اللغة' : 'Language',
                Globe as unknown as typeof LayoutDashboard,
                () => setLang(lang === 'ar' ? 'en' : 'ar'),
                lang === 'ar' ? 'AR' : 'EN'
              )
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={renderAction(
                    lang === 'ar' ? 'اللغة' : 'Language',
                    Globe as unknown as typeof LayoutDashboard,
                    () => setLang(lang === 'ar' ? 'en' : 'ar'),
                    lang === 'ar' ? 'AR' : 'EN'
                  )}
                />
                <TooltipContent side="right">{lang === 'ar' ? 'اللغة' : 'Language'}</TooltipContent>
              </Tooltip>
            )}

            <div className="py-2">
              <Separator />
            </div>

            {/* Logout */}
            {expanded ? (
              <button
                onClick={handleLogout}
                className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-[18px] shrink-0" />
                <span className="whitespace-nowrap">{t.sidebar.logout}</span>
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      onClick={handleLogout}
                      className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="size-[18px] shrink-0" />
                    </button>
                  }
                />
                <TooltipContent side="right">{t.sidebar.logout}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
