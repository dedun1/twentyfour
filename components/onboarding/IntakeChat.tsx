'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChatBubble } from './ChatBubble';
import { ProgressBar } from './ProgressBar';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import type { OnboardingData } from '@/lib/types';

interface Message {
  sender: 'user' | 'ai';
  content: string;
}

const STEPS = [
  'businessName',
  'businessType',
  'services',
  'targetAudience',
  'goals',
  'challenges',
  'teamSize',
] as const;

type StepKey = typeof STEPS[number];

interface IntakeChatProps {
  onComplete?: (data: OnboardingData) => void;
}

export function IntakeChat({ onComplete }: IntakeChatProps) {
  const { lang } = useLanguage();
  const t = useT(lang);
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', content: `${t.onboarding.welcome}\n\n${t.onboarding.subtitle}` },
    { sender: 'ai', content: t.onboarding[STEPS[0] as StepKey] as string },
  ]);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState<Partial<OnboardingData>>({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { sender: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const key = STEPS[step] as StepKey;
    const updatedAnswers = { ...answers, [key]: input.trim() } as OnboardingData;
    setAnswers(updatedAnswers);

    const nextStep = step + 1;

    if (nextStep < STEPS.length) {
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 800));
      setIsTyping(false);

      const nextKey = STEPS[nextStep] as StepKey;
      const nextQuestion = t.onboarding[nextKey] as string;
      setMessages((prev) => [...prev, { sender: 'ai', content: nextQuestion }]);
      setStep(nextStep);
    } else {
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 1000));
      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        { sender: 'ai', content: t.onboarding.thinking },
      ]);

      if (onComplete) {
        onComplete(updatedAnswers);
      } else {
        await new Promise((r) => setTimeout(r, 500));
        sessionStorage.setItem('onboarding-data', JSON.stringify(updatedAnswers));
        router.push('/onboarding/suggestions');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholders = [
    t.onboarding.businessNamePlaceholder,
    t.onboarding.businessTypePlaceholder,
    t.onboarding.servicesPlaceholder,
    t.onboarding.targetAudiencePlaceholder,
    t.onboarding.goalsPlaceholder,
    t.onboarding.challengesPlaceholder,
    lang === 'ar' ? 'مثال: 1-5 أشخاص' : 'e.g., 1-5 people',
  ];

  const isComplete = step >= STEPS.length;

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(240,165,0,0.08)' }}>
        <ProgressBar current={Math.min(step + 1, STEPS.length)} total={STEPS.length} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} sender={msg.sender} content={msg.content} />
        ))}
        {isTyping && <ChatBubble sender="ai" content="" isTyping />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <div
          className="px-4 py-4"
          style={{ borderTop: '1px solid rgba(240,165,0,0.08)' }}
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-base flex-1"
              placeholder={placeholders[step] || '...'}
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="btn-gold px-4"
              style={{ borderRadius: '10px' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
