'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function NavbarScrollWrapper({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'border-border bg-background/95 backdrop-blur-xl shadow-sm h-14'
          : 'border-transparent bg-background/60 backdrop-blur-sm h-16'
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 transition-all duration-300 ${
          scrolled ? 'h-14' : 'h-16'
        }`}
      >
        {children}
      </div>
    </nav>
  );
}
