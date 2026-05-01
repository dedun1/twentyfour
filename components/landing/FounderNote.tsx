'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
  FOUNDER_1_NAME,
  FOUNDER_1_TITLE,
  FOUNDER_1_PHOTO,
  FOUNDER_2_NAME,
  FOUNDER_2_TITLE,
  FOUNDER_2_PHOTO,
} from '@/lib/constants';

function initials(name: string) {
  return name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
}

function FounderCard({ name, title, photo }: { name: string; title: string; photo: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="text-center space-y-3">
        <div className="mx-auto h-24 w-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 font-bold text-xl">
          {initials(name)}
        </div>
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">Based in Cairo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-3">
      <Image
        src={photo}
        alt={name}
        width={96}
        height={96}
        className="mx-auto h-24 w-24 rounded-xl object-cover border border-border"
        onError={() => setError(true)}
      />
      <div>
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">Based in Cairo</p>
      </div>
    </div>
  );
}

export function FounderNote() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">{isAr ? 'ليه بنينا TwentyFour' : 'Why we built TwentyFour'}</h2>
        <p className="max-w-2xl mx-auto text-muted-foreground mb-8">
          {isAr
            ? 'شفنا الأعمال بتخسر ساعات كل يوم في شغل يدوي — الرد على نفس الرسايل، نقل الحجوزات للإكسل، متابعة العملاء اللي ما حضروش. عرفنا إن الأتمتة هي الحل، بس كل الأدوات الموجودة كانت يا عامة جداً يا غالية أوي. فبنينا TwentyFour: سير عمل ذكي مخصص، أونبوردنج شخصي، أسعار عادلة. كل عميل بنشتغل معاه، بنتابعه شخصياً.'
            : "We watched local businesses lose hours every day to manual work — replying to the same messages, copying bookings into spreadsheets, chasing customers who didn't show up. We knew automation could fix it, but every existing tool was either too generic or too expensive. So we built TwentyFour: custom AI workflows, hands-on onboarding, fair pricing. Every client we take on, we onboard personally."}
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          <FounderCard name={FOUNDER_1_NAME} title={FOUNDER_1_TITLE} photo={FOUNDER_1_PHOTO} />
          <FounderCard name={FOUNDER_2_NAME} title={FOUNDER_2_TITLE} photo={FOUNDER_2_PHOTO} />
        </div>
      </div>
    </section>
  );
}

