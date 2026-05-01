'use client';

import { Zap, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  sender: 'user' | 'ai';
  content: string;
  isTyping?: boolean;
}

export function ChatBubble({ sender, content, isTyping }: ChatBubbleProps) {
  const isAI = sender === 'ai';

  return (
    <div className={cn('flex gap-3 animate-fade-in w-full', !isAI && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          isAI
            ? 'bg-gradient-to-br from-[#f0a500] to-[#ffd700]'
            : 'bg-amber-500/20 dark:bg-amber-600/30'
        )}
      >
        {isAI ? (
          <Zap size={16} className="text-[#0a0f1e]" />
        ) : (
          <User size={16} className="text-amber-700 dark:text-amber-200" />
        )}
      </div>

      <div
        className={cn(
          'max-w-[75%] px-4 py-2 text-sm leading-relaxed',
          isAI
            ? 'text-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-[4px_18px_18px_18px]'
            : 'ml-auto rounded-2xl bg-amber-500 text-white dark:bg-amber-600 dark:text-white'
        )}
      >
        {isTyping ? (
          <div className="flex items-center gap-1.5 py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-[var(--primary)]"
                style={{
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            <style>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); opacity: 0.5; }
                50% { transform: translateY(-4px); opacity: 1; }
              }
            `}</style>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
