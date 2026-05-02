'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

export function Footer() {
  const { lang } = useLanguage();
  const t = useT(lang);

  return (
    <footer className="mt-20 border-t border-border bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-300">
                <Zap size={16} className="text-black" />
              </div>
              <span className="font-extrabold text-lg text-primary">TwentyFour</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{t.footer.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">{t.footer.quickLinks}</h3>
            <ul className="space-y-2">
              {[
                { href: '/', label: t.nav.home },
                { href: '/about', label: t.nav.about },
                { href: '/pricing', label: t.nav.pricing },
                { href: '/get-started', label: t.nav.contact },
                { href: '/login', label: t.nav.login },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">{t.footer.legal}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TwentyFour. {t.footer.allRights}
          </p>
          <p className="text-xs text-muted-foreground">Made with care for growing businesses</p>
        </div>
      </div>
    </footer>
  );
}
