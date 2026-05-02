'use client';

import { Calendar } from 'lucide-react';

/** Floating CTA; href is a placeholder until a real booking URL is configured. */
export function BookCallButton() {
  return (
    <>
      {/* TODO: replace /book-call with real Calendly/booking URL */}
      <a
        href="/book-call"
        aria-label="Book a call"
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 bg-amber-500 text-black"
        style={{
          boxShadow: '0 10px 30px rgba(240,165,0,0.35)',
        }}
      >
        <Calendar size={24} />
      </a>
    </>
  );
}
