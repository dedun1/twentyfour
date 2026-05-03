'use client';

import { useState } from 'react';
import { Monitor } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { PROOF_VIDEO_CHATBOT, PROOF_VIDEO_DASHBOARD } from '@/lib/constants';

function VideoBlock({
  src,
  title,
  description,
  fallbackText,
  isAr,
}: {
  src: string;
  title: string;
  description: string;
  fallbackText: string;
  isAr: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="card-hover rounded-xl border border-border bg-card p-5 space-y-3 h-full">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="aspect-video bg-muted">
          {failed ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Monitor size={22} className="text-amber-500" />
              </div>
              <p className="text-sm font-medium">{fallbackText}</p>
              <p className="text-xs text-muted-foreground/70">{isAr ? 'ترقب قريباً' : 'Check back soon'}</p>
            </div>
          ) : (
            <video
              src={src}
              controls
              muted
              playsInline
              className="h-full w-full object-cover"
              onError={() => setFailed(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ProofSection() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {isAr ? (
                <>شوفها شغالة <span className="text-amber-500">بجد</span></>
              ) : (
                <>See it <span className="text-amber-500">actually</span> working</>
              )}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              {isAr
                ? 'ده مش تصميم. اللي تحت ده عميل حقيقي بيحجز من خلال شات بوت، ولوحة التحكم اللي صاحب البيزنس بيشوفها في نفس اللحظة.'
                : "This is not a mockup. Below is a real customer booking through our chatbot, and the dashboard the owner sees the moment it happens."}
            </p>
          </div>
        </ScrollReveal>
        <div className="grid lg:grid-cols-2 gap-4">
          <ScrollReveal delay={0}>
            <VideoBlock
              src={PROOF_VIDEO_CHATBOT}
              title={isAr ? '1. العميل يرسل رسالة' : '1. Customer messages your business'}
              description={isAr
                ? 'عميل محتمل بيسأل عن المواعيد المتاحة. الـ AI بيرد في ثواني، بلغته، بالمواعيد المتاحة فعلاً وبيحجزله أوتوماتيكي.'
                : 'A potential customer asks about availability. The AI replies in seconds with current open slots and books them automatically.'}
              fallbackText={isAr ? 'فيديو توضيحي قريباً' : 'Demo video coming soon'}
              isAr={isAr}
            />
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <VideoBlock
              src={PROOF_VIDEO_DASHBOARD}
              title={isAr ? '2. صاحب البيزنس بيشوفه فوراً' : '2. The owner sees it instantly'}
              description={isAr
                ? 'الحجز بيظهر في لوحة التحكم، التقويم بيتحدث، بيانات العميل بتتسجل. مفيش إدخال يدوي، ولا رسايل ضايعة.'
                : "The booking appears on the dashboard, the calendar updates, the customer's info is logged. No manual entry, no lost messages."}
              fallbackText={isAr ? 'فيديو توضيحي قريباً' : 'Demo video coming soon'}
              isAr={isAr}
            />
          </ScrollReveal>
        </div>
        <ScrollReveal delay={300}>
          <p className="text-center mt-6 text-foreground font-medium">
            {isAr
              ? 'من رسالة العميل لحد الحجز المؤكد في أقل من 30 ثانية، صفر شغل يدوي.'
              : 'From customer message to confirmed booking in under 30 seconds. Zero manual work.'}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
