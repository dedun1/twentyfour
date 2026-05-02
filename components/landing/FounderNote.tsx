'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
  FOUNDER_1_NAME,
  FOUNDER_1_TITLE,
  FOUNDER_1_PHOTO,
  FOUNDER_2_NAME,
  FOUNDER_2_TITLE,
  FOUNDER_2_PHOTO,
} from '@/lib/constants';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function initials(name: string) {
  return name
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const QUOTE_1 =
  'Ran service businesses, felt the pain of manual operations firsthand. Built TwentyFour to fix what off-the-shelf tools could not.';
const QUOTE_2 =
  'Spent years building systems for businesses that deserved better tooling. TwentyFour is what happens when engineering meets real operations.';

function FounderCard({
  name,
  title,
  photo,
  quote,
}: {
  name: string;
  title: string;
  photo: string;
  quote: string;
}) {
  const [error, setError] = useState(false);

  return (
    <div className="rounded-xl bg-card shadow-sm border-0 p-8 text-center space-y-4">
      {error ? (
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-500/20 text-2xl font-bold text-amber-700 dark:text-amber-400">
          {initials(name)}
        </div>
      ) : (
        <Image
          src={photo}
          alt={name}
          width={96}
          height={96}
          className="mx-auto h-24 w-24 rounded-xl object-cover border border-border"
          onError={() => setError(true)}
        />
      )}
      <div>
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed text-start">{quote}</p>
    </div>
  );
}

export function FounderNote() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {isAr ? 'ليه بنينا TwentyFour' : 'Why we built TwentyFour'}
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground">
              {isAr
                ? 'شفنا الأعمال بتخسر ساعات كل يوم في شغل يدوي — الرد على نفس الرسايل، نقل الحجوزات، متابعة العملاء. بنينا TwentyFour عشان نقدم أتمتة مخصصة، أونبوردنج شخصي، وأسعار عادلة.'
                : 'We saw businesses lose hours every day to manual work: repeat messages, booking admin, and follow-ups. TwentyFour exists to deliver custom automation, hands-on onboarding, and fair pricing.'}
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <FounderCard name={FOUNDER_1_NAME} title={FOUNDER_1_TITLE} photo={FOUNDER_1_PHOTO} quote={QUOTE_1} />
            <FounderCard name={FOUNDER_2_NAME} title={FOUNDER_2_TITLE} photo={FOUNDER_2_PHOTO} quote={QUOTE_2} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
