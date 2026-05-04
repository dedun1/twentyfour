'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { DiscoveryCallModal } from '@/components/booking/DiscoveryCallModal';

export function BookCallButton() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 btn-gold rounded-full px-5 py-3 text-sm shadow-lg glow-gold flex items-center gap-2"
        aria-label={isAr ? 'احجز مكالمة' : 'Book a call'}
      >
        <Calendar size={16} />
        <span className="hidden sm:inline">{isAr ? 'احجز مكالمة' : 'Book a Call'}</span>
      </button>
      <DiscoveryCallModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
