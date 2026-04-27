'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Zap } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useT } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/about', label: t.nav.about },
    { href: '/contact', label: t.nav.contact },
  ];

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-extrabold text-primary">TwentyFour</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            {t.nav.login}
          </Button>
          <Button size="sm" render={<Link href="/register" />}>
            {t.nav.register}
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
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
              <div className="mt-6 flex flex-col gap-1 p-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2 px-4">
                <LanguageSwitcher />
                <Button variant="outline" render={<Link href="/login" onClick={() => setOpen(false)} />}>
                  {t.nav.login}
                </Button>
                <Button render={<Link href="/register" onClick={() => setOpen(false)} />}>
                  {t.nav.register}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
