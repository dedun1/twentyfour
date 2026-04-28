'use client';

import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useClient } from '@/components/providers/ClientProvider';
import type { FeatureKey } from '@/lib/types';

interface Props {
  feature: FeatureKey;
  children: React.ReactNode;
}

export function RequireFeature({ feature, children }: Props) {
  const { lang } = useLanguage();
  const { role, features } = useClient();
  const hasAccess = role === 'admin' || features.includes(feature);

  if (!hasAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">
            {lang === 'ar' ? 'الميزة غير متاحة' : 'Feature not available'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'تواصل مع المسؤول لتفعيل هذه الميزة.'
              : 'Contact your admin to enable this feature.'}
          </p>
        </div>
      </div>
    );
  }

  return children;
}

