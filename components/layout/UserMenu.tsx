'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { LogOut, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { signOutAction } from '@/app/actions/auth';

type UserMenuProps = {
  displayName: string | null;
  email: string | null;
  isAdmin: boolean;
};

export function UserMenu({ displayName, email, isAdmin }: UserMenuProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const initial = (displayName || email || 'U').trim()[0]?.toUpperCase() || 'U';
  const labelName = displayName || email?.split('@')[0] || 'Account';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-foreground hover:bg-accent transition"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-amber-500 text-black font-bold">
          {initial}
        </span>
        <span className="hidden md:inline max-w-[140px] truncate">
          {lang === 'ar' ? `مرحباً ${labelName}` : `Hi ${labelName}`}
        </span>
        {isAdmin ? (
          <span className="hidden md:inline-flex items-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-semibold">
            ADMIN
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{displayName || 'Account'}</p>
            {email ? <p className="text-xs text-muted-foreground truncate">{email}</p> : null}
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <LayoutDashboard className="size-4" />
            {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </Link>

          {isAdmin ? (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <ShieldAlert className="size-4" />
              {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
            </Link>
          ) : null}

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition"
              role="menuitem"
            >
              <LogOut className="size-4" />
              {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
