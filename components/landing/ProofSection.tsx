'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { PROOF_VIDEO_CHATBOT, PROOF_VIDEO_DASHBOARD } from '@/lib/constants';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function VideoBlock({
  src,
  title,
  description,
  fallbackText,
}: {
  src: string;
  title: string;
  description: string;
  fallbackText: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <Card className="rounded-xl bg-card shadow-sm border-0">
      <CardContent className="p-6 space-y-3">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="aspect-video rounded-xl overflow-hidden">
          {failed ? (
            <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2 rounded-xl bg-muted border border-dashed border-border/60">
              <Play className="size-12 text-muted-foreground/40" strokeWidth={1.25} />
              <p className="text-sm italic text-muted-foreground">{fallbackText}</p>
            </div>
          ) : (
            <video
              src={src}
              controls
              muted
              playsInline
              className="h-full w-full min-h-[200px] object-cover bg-zinc-950"
              onError={() => setFailed(true)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProofSection() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="bg-muted/30 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">{isAr ? 'شوفها شغالة بجد' : 'See it actually working'}</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              {isAr
                ? 'ده مش تصميم. اللي تحت ده عميل حقيقي بيحجز من خلال شات بوت، ولوحة التحكم اللي صاحب البيزنس بيشوفها في نفس اللحظة.'
                : "This isn't a mockup. Below is a real customer booking through our chatbot, and the dashboard the business owner sees the moment it happens."}
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="grid lg:grid-cols-2 gap-6">
            <VideoBlock
              src={PROOF_VIDEO_CHATBOT}
              title={isAr ? '1. العميل يرسل رسالة على القناة المفضلة' : '1. Customer messages your business'}
              description={
                isAr
                  ? 'عميل محتمل بيسأل عن المواعيد المتاحة. الـ AI بيرد في ثواني، بلغته، بالمواعيد المتاحة فعلاً — وبيحجزله أوتوماتيكي.'
                  : 'A potential customer asks about availability. The AI replies in seconds, in their language, with current open slots — and books them automatically.'
              }
              fallbackText={isAr ? 'فيديو توضيحي قريباً' : 'Demo video coming soon'}
            />
            <VideoBlock
              src={PROOF_VIDEO_DASHBOARD}
              title={isAr ? '2. صاحب البيزنس بيشوفه في نفس اللحظة' : '2. The business owner sees it instantly'}
              description={
                isAr
                  ? 'الحجز بيظهر في لوحة التحكم، التقويم بيتحدث، بيانات العميل بتتسجل. مفيش إدخال يدوي، ولا رسايل ضايعة، ولا مواعيد فايتة.'
                  : "The booking appears in the dashboard, the calendar updates, the customer's info is logged. No manual entry, no lost messages, no missed appointments."
              }
              fallbackText={isAr ? 'فيديو توضيحي قريباً' : 'Demo video coming soon'}
            />
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-center mt-10 text-foreground">
            {isAr
              ? 'من رسالة العميل لحد الحجز المؤكد — في أقل من 30 ثانية، صفر شغل يدوي.'
              : 'From customer message to booked appointment — under 30 seconds, zero human work.'}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
