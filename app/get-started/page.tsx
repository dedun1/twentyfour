'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Brain, FileBarChart, MessageSquare, Zap } from 'lucide-react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ConsultationChat, type ApiCompleteResponse } from '@/components/onboarding/ConsultationChat';
import { createClient } from '@/lib/supabase/client';
import { readStoredConsultationSessionId, clearStoredConsultationSessionId } from '@/lib/consultation-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function completionCtasLabel(lang: 'ar' | 'en') {
  if (lang === 'ar') {
    return {
      noAccountBadge: 'لا تحتاج حساباً الآن',
      alreadyAccount: 'لديك حساب؟ تسجيل الدخول',
      bookCall: 'احجز مكالمة إعداد مجانية',
      createAccount: 'أنشئ حساباً للوصول إلى لوحة التحكم',
      seeRecommendations: 'تريد فقط عرض التوصيات؟',
    };
  }

  return {
    noAccountBadge: 'No account needed yet',
    alreadyAccount: 'Already have an account? Sign in',
    bookCall: 'Book a Free Setup Call',
    createAccount: 'Create Account & Access Dashboard',
    seeRecommendations: 'Just browsing? See recommendations',
  };
}

export default function GetStartedPage() {
  const { lang } = useLanguage();
  const labels = completionCtasLabel(lang);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
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
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          setDisplayName(profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? '');
        }
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
  const capturedEmail = '';
  const capturedPhone = '';

  const recommendationsAfterComplete = '/get-started/recommendations';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-extrabold text-primary">TwentyFour</span>
          {authReady && isAuthenticated ? (
            <span className="text-sm text-muted-foreground">
              {lang === 'ar' ? `مرحباً ${displayName || ''}` : `Hi ${displayName || ''}`}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {!isAuthenticated ? (
            <span className="text-xs border border-border bg-card/60 px-2 py-1 rounded-full">{labels.noAccountBadge}</span>
          ) : null}
        </div>
      </div>

      <main className="flex flex-col items-center">
        <div className="w-full max-w-2xl p-4">
          {view === 'choice' && resumeSessionId ? (
            <Card className="mt-12">
              <CardContent className="p-6 text-center space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Continue your last consultation</h2>
                <p className="text-sm text-muted-foreground">You have a consultation you can pick up where you left off.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => setView('chat')} className="bg-amber-500 text-black hover:bg-amber-400">
                    Continue previous chat
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResumeSessionId(null);
                      if (!isAuthenticated) clearStoredConsultationSessionId();
                      setView('chat');
                    }}
                  >
                    Start fresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : view === 'intro' ? (
            <section className="min-h-[78vh] flex items-center py-16 bg-gradient-to-b from-amber-50/50 to-background rounded-2xl">
              <div className="w-full max-w-3xl mx-auto px-4 text-center space-y-8">
                <div className="space-y-2">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                    <Zap className="size-7" />
                  </div>
                  <p className="text-sm text-muted-foreground">Personal Business Consultation</p>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  Let&apos;s find out exactly how to automate your business
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  I&apos;m your TwentyFour consultant. I&apos;ll ask you about how your business runs today, what&apos;s eating your
                  team&apos;s time, and what your goals are. Then I&apos;ll build you a personalized automation plan with real numbers -
                  not generic advice.
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-start">
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="size-10 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center">
                        <MessageSquare className="size-5" />
                      </div>
                      <p className="font-semibold">Real conversation</p>
                      <p className="text-sm text-muted-foreground">
                        Chat naturally - no forms, no checkboxes. The deeper we go, the better your plan.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="size-10 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center">
                        <Brain className="size-5" />
                      </div>
                      <p className="font-semibold">Tailored to your business</p>
                      <p className="text-sm text-muted-foreground">
                        Every recommendation is built specifically around how YOUR business operates.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="size-10 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center">
                        <FileBarChart className="size-5" />
                      </div>
                      <p className="font-semibold">Concrete numbers</p>
                      <p className="text-sm text-muted-foreground">
                        You&apos;ll see exactly how many hours and dollars our automations would save you.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-sm text-muted-foreground">
                  As long as it needs to. Most consultations take 5-10 minutes - but the more details you share, the more accurate your
                  plan.
                </p>
                <p className="text-xs text-muted-foreground">What you share stays between us. We use it only to build your recommendations.</p>
                <div className="space-y-2">
                  <Button
                    className="w-full max-w-md mx-auto bg-amber-500 text-black hover:bg-amber-400 h-11"
                    onClick={() => void handleStartConsultation()}
                  >
                    Start my consultation →
                  </Button>
                  <p className="text-[11px] text-muted-foreground">No commitment. No payment required.</p>
                </div>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                  onClick={() => void handleContinuePrevious()}
                >
                  Or continue a previous consultation
                </button>
              </div>
            </section>
          ) : (
            <ConsultationChat
              isAuthenticated={isAuthenticated}
              initialSessionId={resumeSessionId}
              onComplete={(payload: ApiCompleteResponse) => {
                setCompletePayload(payload);
              }}
            />
          )}

          {completePayload && sessionId ? (
            <div className="mt-6 space-y-4 text-center">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  className="bg-amber-500 text-black hover:bg-amber-400"
                  nativeButton={false}
                  render={
                    <a href="/book-call" /* TODO: replace with real Calendly/booking URL */ />
                  }
                >
                  {labels.bookCall}
                </Button>

                <Button
                  variant="outline"
                  className="border-border"
                  nativeButton={false}
                  render={
                    <a
                      href={`/register?session=${encodeURIComponent(sessionId)}&email=${encodeURIComponent(
                        capturedEmail,
                      )}&phone=${encodeURIComponent(capturedPhone)}`}
                    />
                  }
                >
                  {labels.createAccount}
                </Button>
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

          <div className="mt-6 text-center">
            <Link className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline" href="/login">
              {labels.alreadyAccount}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
