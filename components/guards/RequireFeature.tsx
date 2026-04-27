'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useClient } from '@/components/providers/ClientProvider';
import type { FeatureKey } from '@/lib/types';

interface Props {
  feature: FeatureKey;
  children: React.ReactNode;
}

export function RequireFeature({ feature, children }: Props) {
  const router = useRouter();
  const { lang } = useLanguage();
  const { role, features } = useClient();

  useEffect(() => {
    if (role === 'admin') return;
    if (feature === 'appointments' || feature === 'whatsapp' || feature === 'scripts' || feature === 'reports' || feature === 'reminders') {
      if (!features.includes(feature)) {
        toast.error(
          lang === 'ar'
            ? 'هذه الميزة غير مفعلة لحسابك. تواصل معنا للترقية.'
            : 'This feature is not enabled for your account. Contact us to upgrade.'
        );
        router.replace('/dashboard');
      }
    }
  }, [feature, features, lang, role, router]);

  if (role !== 'admin' && !features.includes(feature)) return null;
  return children;
}

