'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LayoutDashboard, LogOut, Menu, ShieldAlert } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavLinks } from './NavLinks';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { signOutAction } from '@/app/actions/auth';
import type { NavAuthState } from '@/lib/auth-state';

type NavbarMobileProps = {
  auth: NavAuthState;
};

export function NavbarMobile({ auth }: NavbarMobileProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Open menu">
            <Menu />
          </Button>
        }
      />
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>TwentyFour</SheetTitle>
        </SheetHeader>

        {auth.isAuthenticated ? (
          <div className="px-4 mt-4 pb-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {auth.displayName || (lang === 'ar' ? 'حسابي' : 'Account')}
            </p>
            {auth.email ? (
              <p className="text-xs text-muted-foreground truncate">{auth.email}</p>
            ) : null}
            {auth.isAdmin ? (
              <span className="mt-1 inline-flex items-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-[10px] font-semibold">
                ADMIN
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-1 px-4">
          <NavLinks isAuthenticated={auth.isAuthenticated} onClickItem={() => setOpen(false)} />
        </div>

        <div className="mt-4 flex flex-col gap-2 px-4">
          <LanguageSwitcher />
        </div>

        {auth.isAuthenticated ? (
          <div className="mt-4 px-4 flex flex-col gap-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition"
            >
              <LayoutDashboard className="size-4" />
              {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            {auth.isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition"
              >
                <ShieldAlert className="size-4" />
                {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
              </Link>
            ) : null}
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition"
              >
                <LogOut className="size-4" />
                {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 px-4">
            <Button variant="outline" nativeButton={false} render={<Link href="/login" onClick={() => setOpen(false)} />}>
              <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</span>
            </Button>
            <Button nativeButton={false} render={<Link href="/get-started" onClick={() => setOpen(false)} />}>
              <span>{lang === 'ar' ? 'ابدأ الآن' : 'Get Started'}</span>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
