'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

export function Footer() {
  const { lang } = useLanguage();
  const t = useT(lang);

  return (
    <footer
      className="mt-20"
      style={{ borderTop: '1px solid rgba(240,165,0,0.08)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f0a500, #ffd700)' }}
              >
                <Zap size={16} className="text-[#0a0f1e]" />
              </div>
              <span className="font-extrabold text-lg" style={{ color: '#f0a500' }}>
                TwentyFour
              </span>
            </div>
            <p className="text-sm text-[var(--muted-fg)] leading-relaxed max-w-xs">
              {t.footer.description}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/', label: t.nav.home },
                { href: '/about', label: t.nav.about },
                { href: '/contact', label: t.nav.contact },
                { href: '/login', label: t.nav.login },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--muted-fg)] hover:text-[var(--primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              {t.footer.legal}
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-[var(--muted-fg)] cursor-pointer hover:text-[var(--primary)] transition-colors">
                  {t.footer.terms}
                </span>
              </li>
              <li>
                <span className="text-sm text-[var(--muted-fg)] cursor-pointer hover:text-[var(--primary)] transition-colors">
                  {t.footer.privacy}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(31,41,55,0.8)' }}
        >
          <p className="text-xs text-[var(--muted-fg)]">
            © {new Date().getFullYear()} TwentyFour. {t.footer.allRights}
          </p>
          <p className="text-xs text-[var(--muted-fg)]">
            Made with ❤️ for businesses
          </p>
        </div>
      </div>
    </footer>
  );
}
