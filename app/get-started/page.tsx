'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Brain, FileBarChart, MessageSquare, Zap } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ConsultationChat, type ApiCompleteResponse } from '@/components/onboarding/ConsultationChat';
import { createClient } from '@/lib/supabase/client';
import { readStoredConsultationSessionId, clearStoredConsultationSessionId } from '@/lib/consultation-storage';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function completionCtasLabel(lang: 'ar' | 'en') {
  if (lang === 'ar') {
    return {
      bookCall: 'احجز مكالمة إعداد مجانية',
      createAccount: 'أنشئ حساباً للوصول إلى لوحة التحكم',
      seeRecommendations: 'عايز تشوف التوصيات بس؟',
    };
  }
  return {
    bookCall: 'Book a Free Setup Call',
    createAccount: 'Create Account & Access Dashboard',
    seeRecommendations: 'Just browsing? See recommendations',
  };
}

export default function GetStartedPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const router = useRouter();
  const labels = completionCtasLabel(lang);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [_authReady, setAuthReady] = useState(false);
  const [completePayload, setCompletePayload] = useState<ApiCompleteResponse | null>(null);
  const [view, setView] = useState<'intro' | 'choice' | 'chat'>('intro');
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        setIsAuthenticated(Boolean(user));
      } finally {
        setAuthReady(true);
      }
    };
    void run();
  }, []);

  const handleStartConsultation = async () => {
    if (isAuthenticated) {
      const listRes = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      if (!listRes.ok) {
        setResumeSessionId(null);
        setView('chat');
        return;
      }
      const listData = await listRes.json();
      const inProgress = (listData.sessions || []).find(
        (s: { status?: string; has_messages?: boolean }) => s.status === 'in_progress' && s.has_messages,
      );
      if (inProgress?.id) {
        setResumeSessionId(inProgress.id);
        setView('choice');
        return;
      }
      setResumeSessionId(null);
      setView('chat');
      return;
    }

    const stored = readStoredConsultationSessionId();
    if (stored) {
      setResumeSessionId(stored);
      setView('choice');
      return;
    }
    setResumeSessionId(null);
    setView('chat');
  };

  const handleContinuePrevious = async () => {
    if (isAuthenticated) {
      const listRes = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const inProgress = (listData.sessions || []).find(
          (s: { status?: string; has_messages?: boolean }) => s.status === 'in_progress' && s.has_messages,
        );
        if (inProgress?.id) {
          setResumeSessionId(inProgress.id);
          setView('choice');
          return;
        }
      }
    }
    const stored = readStoredConsultationSessionId();
    if (stored) {
      setResumeSessionId(stored);
      setView('choice');
    }
  };

  const sessionId = completePayload?.sessionId ?? completePayload?.session_id ?? null;
  const recommendationsAfterComplete = '/get-started/recommendations';

  return (
    <div className="min-h-screen bg-background">
      <main className="flex flex-col items-center">
        <div className="w-full">
          {view === 'choice' && resumeSessionId ? (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
            <ScrollReveal>
              <div className="mt-12 card-hover rounded-xl border border-border bg-card p-6 text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {isAr ? 'كمل استشارتك السابقة' : 'Continue your last consultation'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isAr ? 'عندك استشارة تقدر تكملها من اللي وقفت فيه.' : "You have a consultation you can pick up where you left off."}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => setView('chat')}
                    className="btn-gold px-6 py-2.5"
                  >
                    {isAr ? 'كمل الشات السابق' : 'Continue previous chat'}
                  </button>
                  <button
                    onClick={() => {
                      setResumeSessionId(null);
                      if (!isAuthenticated) clearStoredConsultationSessionId();
                      setView('chat');
                    }}
                    className="btn-outline px-6 py-2.5"
                  >
                    {isAr ? 'ابدأ من جديد' : 'Start fresh'}
                  </button>
                </div>
              </div>
            </ScrollReveal>
            </div>
          ) : view === 'intro' ? (
            <section className="relative w-full min-h-[78vh] flex items-center py-16 hero-gradient overflow-hidden">
              <ScrollReveal className="w-full">
                <div className="w-full max-w-3xl mx-auto px-4 text-center space-y-8">
                  <div className="space-y-3">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/15">
                      <Zap className="size-7 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isAr ? 'استشارة شخصية لعملك' : 'Personal Business Consultation'}
                    </p>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
                    {isAr ? (
                      <>خلينا نعرف بالظبط إزاي <span className="text-amber-500">نأتمت</span> عملك</>
                    ) : (
                      <>Let&apos;s find out exactly how to <span className="text-amber-500">automate</span> your business</>
                    )}
                  </h1>
                  <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {isAr
                      ? 'أنا مستشار TwentyFour. هسألك عن إزاي شغلك ماشي دلوقتي، إيه اللي بياكل وقت فريقك، وإيه أهدافك. وبعدين هبنيلك خطة أتمتة شخصية بأرقام حقيقية، مش نصايح عامة.'
                      : "I'm your TwentyFour consultant. I'll ask about how your business runs today, what's eating your team's time, and what your goals are. Then I'll build you a personalized automation plan with real numbers, not generic advice."}
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-start">
                    {[
                      {
                        icon: MessageSquare,
                        title: isAr ? 'محادثة حقيقية' : 'Real conversation',
                        desc: isAr
                          ? 'كلام طبيعي. مفيش فورمات ولا تشيك بوكسات. كل ما نتكلم أكتر، خطتك بتطلع أحسن.'
                          : 'Chat naturally. No forms, no checkboxes. The deeper we go, the better your plan.',
                      },
                      {
                        icon: Brain,
                        title: isAr ? 'مخصصة لعملك' : 'Tailored to your business',
                        desc: isAr
                          ? 'كل توصية مبنية حسب طريقة شغل بيزنسك بالظبط.'
                          : 'Every recommendation is built specifically around how your business operates.',
                      },
                      {
                        icon: FileBarChart,
                        title: isAr ? 'أرقام واضحة' : 'Concrete numbers',
                        desc: isAr
                          ? 'هتشوف بالظبط كام ساعة وكام دولار الأتمتة هتوفّرلك.'
                          : "You'll see exactly how many hours and dollars our automations would save you.",
                      },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <ScrollReveal key={item.title} delay={i * 100}>
                          <div className="card-hover rounded-xl border border-border bg-card p-4 space-y-2 h-full">
                            <div className="size-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                              <Icon className="size-5 text-amber-500" />
                            </div>
                            <p className="font-semibold text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </ScrollReveal>
                      );
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isAr
                      ? 'بنخد الوقت اللي تحتاجه. معظم الاستشارات بتاخد 5-10 دقائق. كل ما تشارك تفاصيل أكتر، خطتك بتطلع أدق.'
                      : 'As long as it needs to. Most consultations take 5-10 minutes. The more details you share, the more accurate your plan.'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? 'اللي بتشاركه بيفضل بينا. بنستخدمه بس عشان نبنيلك توصياتك.'
                      : 'What you share stays between us. We use it only to build your recommendations.'}
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="btn-gold glow-gold w-full max-w-md mx-auto py-3 text-base"
                      onClick={() => void handleStartConsultation()}
                    >
                      {isAr ? 'ابدأ استشارتي ←' : 'Start my consultation →'}
                    </button>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? 'بدون التزام. بدون دفع.' : 'No commitment. No payment required.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                    onClick={() => void handleContinuePrevious()}
                  >
                    {isAr ? 'أو كمل استشارة سابقة' : 'Or continue a previous consultation'}
                  </button>
                </div>
              </ScrollReveal>
            </section>
          ) : (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
              <ConsultationChat
                isAuthenticated={isAuthenticated}
                initialSessionId={resumeSessionId}
                onComplete={(payload: ApiCompleteResponse) => {
                  setCompletePayload(payload);
                  const sid = payload.sessionId || payload.session_id || '';
                  if (sid) router.push(`${recommendationsAfterComplete}?session=${encodeURIComponent(sid)}`);
                }}
              />
            </div>
          )}

          {completePayload && sessionId ? (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 space-y-4 text-center">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/book-call" className="btn-gold inline-flex px-7 py-2.5">
                  {labels.bookCall}
                </Link>
                <Link
                  href={`/register?session=${encodeURIComponent(sessionId)}`}
                  className="btn-outline inline-flex px-7 py-2.5"
                >
                  {labels.createAccount}
                </Link>
              </div>
              <div>
                <Link
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                  href={`${recommendationsAfterComplete}?session=${encodeURIComponent(sessionId)}`}
                >
                  {labels.seeRecommendations}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
