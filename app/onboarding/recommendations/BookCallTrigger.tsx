'use client';

import { useState } from 'react';
import { DiscoveryCallModal } from '@/components/booking/DiscoveryCallModal';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface Props {
  sessionId?: string | null;
  prefilledEmail?: string;
  prefilledName?: string;
  prefilledPhone?: string;
  prefilledBusiness?: string;
  variant?: 'primary' | 'outline' | 'on-amber';
  className?: string;
  label?: string;
}

export function BookCallTrigger({
  sessionId,
  prefilledEmail,
  prefilledName,
  prefilledPhone,
  prefilledBusiness,
  variant = 'primary',
  className = '',
  label,
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [open, setOpen] = useState(false);

  const variantClass =
    variant === 'outline'
      ? 'btn-outline'
      : variant === 'on-amber'
        ? 'inline-flex items-center justify-center rounded-xl bg-white text-amber-700 hover:bg-amber-50 px-8 py-6 text-lg font-semibold shadow-sm border border-white/20'
        : 'btn-gold';
  const defaultLabel = isAr ? 'احجز مكالمة الاكتشاف' : 'Book My Discovery Call';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${variantClass} ${className}`.trim()}
      >
        {label || defaultLabel}
      </button>
      <DiscoveryCallModal
        open={open}
        onClose={() => setOpen(false)}
        sessionId={sessionId}
        prefilledEmail={prefilledEmail}
        prefilledName={prefilledName}
        prefilledPhone={prefilledPhone}
        prefilledBusiness={prefilledBusiness}
      />
    </>
  );
}
