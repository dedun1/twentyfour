'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import Link from 'next/link';
import { History, Menu, Plus, Send, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type ChatSender = 'user' | 'ai';
type TranscriptEntry = { role: 'user' | 'assistant'; content: string; created_at?: string };
type Recommendation = {
  title: string;
  problem: string;
  solution: string;
  time_saved_hours_per_month: number;
  estimated_roi: string;
  priority: 'high' | 'medium' | 'low';
  channel: string;
};
type ChatMessage = { sender: ChatSender; content: string };
type ForceCompleteMessage = { role: 'user' | 'assistant'; content: string };

export type ApiCompleteResponse = {
  sessionId?: string;
  session_id?: string;
  complete: true;
  next_question: string;
  message?: string;
  show_generate_button?: boolean;
  redirect_to?: string;
};
type ApiInProgressResponse = {
  sessionId?: string;
  session_id?: string;
  complete: false;
  next_question: string;
  message?: string;
  show_generate_button?: boolean;
};
type ApiChatResponse = ApiCompleteResponse | ApiInProgressResponse;

type SessionListItem = {
  id: string;
  business_name: string | null;
  status: 'completed' | 'in_progress' | 'abandoned';
  created_at: string;
  last_activity_at: string;
  has_messages: boolean;
};

interface ConsultationChatProps {
  onComplete: (payload: ApiCompleteResponse) => void;
  mode: 'authenticated' | 'anonymous';
  initialSessionId?: string | null;
  country?: 'egypt' | 'usa' | null;
}

function formatDateShort(input: string) {
  return new Date(input).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusClass(status: SessionListItem['status']) {
  if (status === 'completed') return 'bg-green-500/15 text-green-500';
  if (status === 'in_progress') return 'bg-blue-500/15 text-blue-500';
  return 'bg-zinc-500/15 text-zinc-400';
}

function sanitizeAIMessage(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('```')) {
    try {
      const cleaned = trimmed
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as { next_question?: unknown };
      if (parsed.next_question && typeof parsed.next_question === 'string') {
        return parsed.next_question;
      }
    } catch {
      // Not valid JSON, continue
    }
  }
  return content;
}

function sanitizeCompleteMessage(message: string | undefined): string {
  const raw = String(message || '').trim();
  const looksJsonLike =
    raw.includes('"complete"') ||
    raw.includes('"capture"') ||
    raw.includes('"business_summary"') ||
    raw.includes('{') ||
    raw.includes('}');
  if (!raw || looksJsonLike) {
    return 'I have everything I need. Building your custom plan now.';
  }
  return raw;
}

function aiReplyFromApi(data: { next_question?: string; message?: string }, apiComplete: boolean): string {
  const combined = data.next_question || data.message || '';
  const extracted = sanitizeAIMessage(String(combined));
  return apiComplete ? sanitizeCompleteMessage(extracted) : extracted;
}

export function ConsultationChat({ onComplete, mode, initialSessionId = null }: ConsultationChatProps) {
  const { lang } = useLanguage();
  const placeholders = useMemo(
    () => (lang === 'ar'
      ? ['حدثني عن عملك...', 'ما أكثر شيء يستهلك وقت فريقك؟', 'كيف يتواصل العملاء معكم اليوم؟']
      : ['Tell me about your business...', "What is eating your team's time?", 'How do customers reach you today?']),
    [lang]
  );

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [history, setHistory] = useState<SessionListItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [anonHasUnfinished, setAnonHasUnfinished] = useState(false);
  const [startSeed, setStartSeed] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmNewChat, setConfirmNewChat] = useState(false);
  const [currentBusinessName, setCurrentBusinessName] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'completed' | 'in_progress' | 'abandoned'>('in_progress');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);
  const [readyBannerSessionId, setReadyBannerSessionId] = useState<string | null>(null);

  const startedRef = useRef(false);
  const inFlightRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initialLoadRef = useRef(false);
  const openingInitRef = useRef(false);
  /** After "New chat", parent may still pass initialSessionId; still run opening fetch once. */
  const skipResumePropRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [placeholders.length]);

  const loadSessionHistory = async () => {
    if (mode !== 'authenticated') return;
    const res = await fetch('/api/onboarding/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setHistory(data.sessions || []);
  };

  const loadSession = async (id: string) => {
    const res = await fetch('/api/onboarding/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'load', sessionId: id }),
    });
    if (!res.ok) {
      toast.error(lang === 'ar' ? 'تعذر تحميل الجلسة' : 'Failed to load session');
      return;
    }
    const data = await res.json();
    setSessionId(data.sessionId);
    setCurrentStatus(data.status === 'completed' ? 'completed' : 'in_progress');
    setCurrentBusinessName(data.captured_business_name || null);
    setIsComplete(data.status === 'completed');
    const loadedMessages: ChatMessage[] = (data.transcript || []).map((entry: TranscriptEntry) => ({
      sender: entry.role === 'assistant' ? 'ai' : 'user',
      content: entry.role === 'assistant' ? sanitizeAIMessage(entry.content) : entry.content,
    }));
    setMessages(loadedMessages);
    skipResumePropRef.current = false;
  };

  const performNewSession = async () => {
    skipResumePropRef.current = true;
    const res = await fetch('/api/onboarding/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'new', country: 'usa' }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setSessionId(data.sessionId ?? null);
    setMessages([]);
    setInput('');
    setIsComplete(false);
    setCurrentStatus('in_progress');
    setCurrentBusinessName(null);
    setShowGenerateButton(false);
    setReadyBannerSessionId(null);
    setConfirmNewChat(false);
    startedRef.current = false;
    openingInitRef.current = false;
    setStartSeed((s) => s + 1);
    if (mode === 'anonymous') setAnonHasUnfinished(false);
    await loadSessionHistory();
  };

  const createNewSession = async () => {
    if (messages.length > 0) {
      setConfirmNewChat(true);
      return;
    }
    await performNewSession();
  };

  const deleteSession = async (id: string) => {
    const res = await fetch(`/api/onboarding/session/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      toast.error(lang === 'ar' ? 'تعذر حذف الجلسة' : 'Failed to delete session');
      return;
    }
    setDeleteConfirmId(null);
    setHistory((prev) => prev.filter((s) => s.id !== id));
    if (sessionId === id) {
      await performNewSession();
    }
  };

  useEffect(() => {
    void loadSessionHistory();
    if (mode === 'anonymous') {
      void (async () => {
        const res = await fetch('/api/onboarding/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'anon-status' }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setAnonHasUnfinished(Boolean(data.hasMessages));
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!initialSessionId || initialLoadRef.current) return;
    initialLoadRef.current = true;
    startedRef.current = true;
    void loadSession(initialSessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  useEffect(() => {
    if (initialSessionId && !skipResumePropRef.current) return;
    if (openingInitRef.current) return;
    openingInitRef.current = true;
    startedRef.current = true;

    const runStart = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setIsLoading(true);
      try {
        const res = await fetch('/api/onboarding/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [],
            session_id: sessionId ?? undefined,
            country: 'usa',
          }),
        });
        if (!res.ok) throw new Error('Failed');
        const data: ApiChatResponse = await res.json();
        const responseSessionId = (data as ApiCompleteResponse).session_id || data.sessionId || null;
        if (responseSessionId) setSessionId(responseSessionId);
        // CHECK COMPLETE FIRST — before any message rendering
        if (data.complete) {
          const safeMessage = aiReplyFromApi(data as ApiCompleteResponse, true);
          setMessages((prev) => [...prev, {
            sender: 'ai',
            content: safeMessage,
          }]);
          setIsComplete(true);
          setCurrentStatus('completed');
          setIsLoading(true);
          setIsBuilding(true);
          const redirectSessionId = (data as ApiCompleteResponse).session_id || data.sessionId || sessionId;
          setReadyBannerSessionId(redirectSessionId || null);
          const normalizedComplete: ApiCompleteResponse = {
            ...(data as ApiCompleteResponse),
            sessionId: redirectSessionId || '',
          };
          window.setTimeout(() => {
            if (redirectSessionId) {
              window.location.href = '/onboarding/recommendations?session=' + encodeURIComponent(redirectSessionId);
            }
          }, 3000);
          onComplete(normalizedComplete);
          return;
        }
        setShowGenerateButton(Boolean((data as ApiInProgressResponse).show_generate_button));
        setCurrentStatus('in_progress');
        setMessages([{ sender: 'ai', content: aiReplyFromApi(data as ApiInProgressResponse, false) }]);
      } catch {
        toast.error(lang === 'ar' ? 'تعذر بدء الاستشارة' : 'Failed to start consultation');
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
        skipResumePropRef.current = false;
        await loadSessionHistory();
      }
    };
    void runStart();
  }, [lang, onComplete, startSeed, initialSessionId]);

  const handleSend = async () => {
    if (inFlightRef.current || isLoading || isComplete) return;
    const text = input.trim();
    if (!text) return;

    inFlightRef.current = true;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', content: text }]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId ?? undefined, country: 'usa' }),
      });
      if (!res.ok) throw new Error('Failed');
      const data: ApiChatResponse = await res.json();
      const responseSessionId = (data as ApiCompleteResponse).session_id || data.sessionId || null;
      if (responseSessionId) setSessionId(responseSessionId);

      // CHECK COMPLETE FIRST — before any message rendering
      if (data.complete) {
        const safeMessage = aiReplyFromApi(data as ApiCompleteResponse, true);
        setMessages((prev) => [...prev, {
          sender: 'ai',
          content: safeMessage,
        }]);
        setIsComplete(true);
        setCurrentStatus('completed');
        setIsLoading(true);
        setIsBuilding(true);
        const redirectSessionId = (data as ApiCompleteResponse).session_id || data.sessionId || sessionId;
        setReadyBannerSessionId(redirectSessionId || null);
        const normalizedComplete: ApiCompleteResponse = {
          ...(data as ApiCompleteResponse),
          sessionId: redirectSessionId || '',
        };
        window.setTimeout(() => {
          if (redirectSessionId) {
            window.location.href = '/onboarding/recommendations?session=' + encodeURIComponent(redirectSessionId);
          }
        }, 3000);
        onComplete(normalizedComplete);
        return;
      }
      setShowGenerateButton(Boolean((data as ApiInProgressResponse).show_generate_button));
      setMessages((prev) => [...prev, { sender: 'ai', content: aiReplyFromApi(data as ApiInProgressResponse, false) }]);
    } catch {
      toast.error(lang === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.');
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
      await loadSessionHistory();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleGeneratePlan = async () => {
    if (!sessionId || isGenerating || isLoading || isComplete) return;
    setIsGenerating(true);
    setIsLoading(true);

    try {
      const forceMessages: ForceCompleteMessage[] = messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: forceMessages,
          force_complete: true,
          session_id: sessionId,
          country: 'usa',
        }),
      });

      if (!res.ok) throw new Error('Failed to generate plan');
      const data = await res.json();

      if (data.complete === true) {
        const safeMessage = aiReplyFromApi(data as ApiCompleteResponse, true);
        setMessages((prev) => [...prev, {
          sender: 'ai',
          content: safeMessage,
        }]);
        setIsComplete(true);
        setCurrentStatus('completed');
        setIsBuilding(true);
        setReadyBannerSessionId(data.session_id || sessionId);
        window.setTimeout(() => {
          window.location.href = '/onboarding/recommendations?session=' + encodeURIComponent(data.session_id || sessionId);
        }, 3000);
      }
    } catch (err) {
      console.error('Force complete error:', err);
      toast.error(lang === 'ar' ? 'تعذر إنشاء الخطة الآن' : 'Could not generate your plan right now.');
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  const recommendationsBase = mode === 'authenticated' ? '/onboarding/recommendations' : '/get-started/recommendations';
  const assistantCount = messages.filter((m) => m.sender === 'ai').length;
  const progressHint = assistantCount <= 2
    ? (lang === 'ar' ? 'بدأنا للتو - أخبرني عن عملك' : 'Just getting started - tell me about your business')
    : assistantCount <= 5
      ? (lang === 'ar' ? 'نتعمق أكثر - كل تفصيل يساعد' : 'Going deeper - every detail helps me build a better plan')
      : assistantCount <= 9
        ? (lang === 'ar' ? 'قربنا - أبني خطتك أثناء الحديث' : "Almost there - I'm building your custom plan as we talk")
        : (lang === 'ar' ? 'اللمسات الأخيرة - خطتك تتشكل' : 'Wrapping up - your plan is taking shape');

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background py-6">
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {mode === 'authenticated' ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowHistory((v) => !v)}>
                <History className="size-4 me-1" />
                {lang === 'ar' ? 'السجل' : 'History'}
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => void createNewSession()}>
              <Plus className="size-4 me-1" />
              {lang === 'ar' ? 'محادثة جديدة' : 'New Chat'}
            </Button>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setShowHistory((v) => !v)} className="md:hidden">
            <Menu className="size-4" />
          </Button>
        </div>

        {confirmNewChat ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm flex flex-wrap items-center gap-2">
            <span>{lang === 'ar' ? 'بدء استشارة جديدة؟ سيتم حفظ الجلسة الحالية في السجل.' : 'Start a new consultation? Your current session will be saved in history.'}</span>
            <Button size="sm" onClick={() => void performNewSession()}>{lang === 'ar' ? 'نعم، ابدأ جديد' : 'Yes, start new'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmNewChat(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        ) : null}

        {mode === 'anonymous' && anonHasUnfinished ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            {lang === 'ar' ? 'لديك استشارة غير مكتملة.' : 'You have an unfinished consultation.'}{' '}
            <button className="underline" onClick={() => setAnonHasUnfinished(false)}>{lang === 'ar' ? 'متابعة' : 'Continue'}</button>{' '}
            {lang === 'ar' ? 'أو' : 'or'}{' '}
            <button className="underline" onClick={() => void performNewSession()}>{lang === 'ar' ? 'ابدأ جديد' : 'Start new'}</button>
          </div>
        ) : null}

        {mode === 'authenticated' ? (
          <aside className={`${showHistory ? 'block' : 'hidden'} rounded-xl border border-border bg-card p-3 max-h-[220px] overflow-y-auto`}>
            <p className="text-sm font-semibold mb-2">{lang === 'ar' ? 'جلسات سابقة' : 'Past sessions'}</p>
            <div className="space-y-2">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'لا توجد جلسات بعد' : 'No sessions yet'}</p>
              ) : history.map((item) => {
                const fallback = `${lang === 'ar' ? 'جلسة' : 'Session'} ${formatDateShort(item.created_at)}`;
                const recHref = `${recommendationsBase}?session=${encodeURIComponent(item.id)}`;
                return (
                  <div key={item.id} className="rounded-lg border border-border p-2 hover:bg-muted/40">
                    {deleteConfirmId === item.id ? (
                      <div className="space-y-2 py-1">
                        <p className="text-sm">{lang === 'ar' ? 'حذف هذه المحادثة؟' : 'Delete this chat?'}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className="text-sm font-medium text-red-500"
                            onClick={() => void deleteSession(item.id)}
                          >
                            {lang === 'ar' ? 'حذف' : 'Delete'}
                          </button>
                          <button
                            type="button"
                            className="text-sm text-muted-foreground"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" className="text-start min-w-0 flex-1" onClick={() => void loadSession(item.id)}>
                            <p className="text-sm font-medium truncate">{item.business_name || fallback}</p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <Badge className={statusClass(item.status)}>{item.status === 'in_progress' ? 'In Progress' : item.status === 'completed' ? 'Completed' : 'Abandoned'}</Badge>
                              <span className="text-[10px] text-muted-foreground shrink-0">{formatDateShort(item.created_at)}</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            className="shrink-0 p-1 rounded-md hover:bg-muted/60"
                            aria-label={lang === 'ar' ? 'حذف الجلسة' : 'Delete session'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(item.id);
                            }}
                          >
                            <Trash2 className="size-[14px] text-muted-foreground" strokeWidth={2} />
                          </button>
                        </div>
                        {item.status === 'completed' ? (
                          <Link
                            className="text-xs text-primary mt-2 inline-block"
                            href={recHref}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lang === 'ar' ? 'عرض التوصيات →' : 'View recommendations →'}
                          </Link>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        ) : null}

        <div className="flex h-[calc(100vh-170px)] min-h-[560px] flex-col rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Zap className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{lang === 'ar' ? 'مستشارك من TwentyFour' : 'Your TwentyFour Consultant'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="size-2 rounded-full bg-green-500 inline-block" />
                  {lang === 'ar' ? 'متصل وجاهز' : 'Online and ready'}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground pt-1">
              {lang === 'ar' ? `سؤال ${assistantCount || 1}` : `Question ${assistantCount || 1}`}
            </div>
          </div>

          {isComplete && (readyBannerSessionId || sessionId) ? (
            <div className="mx-4 mt-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm">
              {lang === 'ar' ? 'خطتك جاهزة! اعرض التوصيات →' : 'Your plan is ready! View your recommendations →'}{' '}
              <Link href={`${recommendationsBase}?session=${encodeURIComponent(readyBannerSessionId || sessionId || '')}`} className="underline font-semibold">
                {lang === 'ar' ? 'اضغط هنا' : 'Click here'}
              </Link>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3 animate-pulse">
                  <div className="size-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Zap className="size-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lang === 'ar' ? 'جاري توصيلك بمستشارك...' : 'Connecting you with your consultant...'}
                  </p>
                </div>
              </div>
            ) : null}

            {messages.map((msg, idx) => {
              const isAI = msg.sender === 'ai';
              const prev = messages[idx - 1];
              const showAIName = isAI && (!prev || prev.sender !== 'ai');
              return (
                <div key={idx} className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                  {isAI ? (
                    <div className="max-w-[80%]">
                      <div className="flex items-start gap-2">
                        <div className="size-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-1">
                          <Zap className="size-4" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm px-5 py-3 bg-amber-50 dark:bg-amber-950/30 text-foreground border border-amber-200/50 dark:border-amber-900/40">
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>
                      </div>
                      {showAIName ? (
                        <p className="text-[10px] text-muted-foreground ms-10 mt-1">
                          {lang === 'ar' ? 'مستشار TwentyFour' : 'TwentyFour Consultant'}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-5 py-3 bg-amber-500 text-white shadow-sm">
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && messages.length > 0 ? (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[80%]">
                  <p className="text-[10px] text-muted-foreground ms-10 mb-1">
                    {lang === 'ar' ? 'أفكر في وضعك الحالي...' : 'Thinking through your situation...'}
                  </p>
                  <div className="flex items-start gap-2">
                    <div className="size-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-1">
                      <Zap className="size-4" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-5 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40">
                      <div className="flex items-center gap-1.5 py-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-amber-500"
                            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            {isBuilding ? (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[80%]">
                  <p className="text-[10px] text-muted-foreground ms-10 mb-1">
                    {lang === 'ar' ? 'جاري بناء خطتك...' : 'Building your plan...'}
                  </p>
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {showGenerateButton && !isComplete ? (
            <div className="px-4 pb-2">
              <button
                type="button"
                className="w-full bg-amber-500 text-white rounded-xl py-3 font-semibold hover:bg-amber-600 transition disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={() => void handleGeneratePlan()}
                disabled={isGenerating || isLoading}
              >
                {isGenerating ? 'Building your plan...' : "I'm ready — build my plan →"}
              </button>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                Your consultant will use everything you&apos;ve shared so far
              </p>
            </div>
          ) : null}

          <div className="border-t border-border px-4 py-3 sticky bottom-0 bg-card">
            <p className="text-[11px] text-muted-foreground mb-2">{progressHint}</p>
            <div className="flex gap-2 items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholders[placeholderIndex]}
                className="h-11 rounded-full bg-background focus-visible:ring-amber-500/40"
                disabled={isLoading || isComplete || isGenerating}
              />
              <Button
                type="button"
                size="icon"
                className="size-11 rounded-full bg-amber-500 text-black hover:bg-amber-400 hover:scale-105 transition-transform"
                onClick={() => void handleSend()}
                disabled={isLoading || isComplete || isGenerating || !input.trim()}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
