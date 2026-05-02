'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { cn } from '@/lib/utils';

type NavLinksProps = {
  isAuthenticated: boolean;
  onClickItem?: () => void;
};

export function NavLinks({ isAuthenticated, onClickItem }: NavLinksProps) {
  const { lang } = useLanguage();
  const t = useT(lang);
  const pathname = usePathname();

  const links = isAuthenticated
    ? [
        { href: '/', label: t.nav.home },
        { href: '/get-started', label: lang === 'ar' ? 'استشارة جديدة' : 'New consultation' },
        { href: '/pricing', label: t.nav.pricing },
      ]
    : [
        { href: '/', label: t.nav.home },
        { href: '/about', label: t.nav.about },
        { href: '/pricing', label: t.nav.pricing },
      ];

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClickItem}
          className={cn(
            'text-sm font-medium transition-colors',
            pathname === link.href
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
