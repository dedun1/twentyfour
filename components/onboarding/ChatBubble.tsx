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
    <div className={cn('flex gap-3 animate-fade-in', !isAI && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          isAI
            ? 'bg-gradient-to-br from-[#f0a500] to-[#ffd700]'
            : 'bg-[var(--muted)]'
        )}
      >
        {isAI ? (
          <Zap size={16} className="text-[#0a0f1e]" />
        ) : (
          <User size={16} className="text-[var(--muted-fg)]" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isAI
            ? 'text-[var(--foreground)]'
            : 'text-[var(--foreground)]'
        )}
        style={{
          background: isAI
            ? 'rgba(240,165,0,0.08)'
            : 'rgba(31,41,55,0.8)',
          border: `1px solid ${isAI ? 'rgba(240,165,0,0.15)' : 'rgba(31,41,55,0.8)'}`,
          borderRadius: isAI
            ? '4px 18px 18px 18px'
            : '18px 4px 18px 18px',
        }}
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
