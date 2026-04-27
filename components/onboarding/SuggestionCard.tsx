'use client';

import { Calendar, FileText, Bell, BarChart2, MessageSquare, Star, Zap, Target } from 'lucide-react';
import type { Suggestion } from '@/lib/types';

const iconMap: Record<string, React.ReactNode> = {
  Calendar: <Calendar size={22} />,
  FileText: <FileText size={22} />,
  Bell: <Bell size={22} />,
  BarChart2: <BarChart2 size={22} />,
  MessageSquare: <MessageSquare size={22} />,
  Star: <Star size={22} />,
  Zap: <Zap size={22} />,
  Target: <Target size={22} />,
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
}

export function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const icon = iconMap[suggestion.icon] || <Zap size={22} />;

  return (
    <div
      className="glass-card-hover p-5 animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(240,165,0,0.15), rgba(255,215,0,0.08))',
            color: '#f0a500',
          }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-[var(--foreground)] mb-1">{suggestion.title}</h3>
          <p className="text-sm text-[var(--muted-fg)] leading-relaxed">{suggestion.description}</p>
          <span
            className="badge badge-gold mt-2 text-xs"
          >
            {suggestion.category}
          </span>
        </div>
      </div>
    </div>
  );
}
