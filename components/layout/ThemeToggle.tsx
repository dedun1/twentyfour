'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: 'rgba(31,41,55,0.5)', color: 'var(--muted-fg)' }}
      >
        <Sun size={16} />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
      style={{
        background: 'rgba(31,41,55,0.5)',
        color: 'var(--muted-fg)',
        border: '1px solid var(--border)',
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
