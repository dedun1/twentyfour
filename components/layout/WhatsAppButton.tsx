'use client';

import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '201115581594';
const PREFILLED = encodeURIComponent("Hi, I'd like to know more about TwentyFour");

export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${PREFILLED}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
      style={{
        background: '#22c55e',
        boxShadow: '0 10px 30px rgba(34,197,94,0.4)',
      }}
    >
      <MessageCircle size={26} className="text-white" />
    </a>
  );
}
