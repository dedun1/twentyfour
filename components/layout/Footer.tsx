'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

export function Footer() {
  const { lang } = useLanguage();
  const t = useT(lang);

  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f0a500, #ffd700)' }}>
                <Zap size={16} className="text-[#0a0f1e]" />
              </div>
              <span className="font-extrabold text-lg text-amber-500">TwentyFour</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {t.footer.description}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: t.nav.home },
                { href: '/about', label: t.nav.about },
                { href: '/pricing', label: t.nav.pricing },
                { href: '/get-started', label: t.nav.contact },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-amber-500 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t.footer.legal}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-amber-500 transition-colors">
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-amber-500 transition-colors">
                  {t.footer.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TwentyFour. {t.footer.allRights}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/book-call" className="text-xs text-muted-foreground hover:text-amber-500 transition-colors">
              Book a call
            </Link>
            <span className="text-xs text-muted-foreground">Made with ❤️ for businesses</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
