'use client';

import { Clock, KeyRound, MessageCircle, PauseCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { SubscriptionStatus } from '@/lib/types';

interface Props {
  status: SubscriptionStatus;
}

const configs = {
  pending_approval: {
    ar: {
      title: 'في انتظار الموافقة',
      desc: 'حسابك قيد المراجعة. سيتواصل معك فريقنا خلال 24 ساعة لتفعيل خدماتك.',
      action: 'تواصل معنا على واتساب',
    },
    en: {
      title: 'Pending Approval',
      desc: 'Your account is under review. Our team will contact you within 24 hours to activate your services.',
      action: 'Contact Us on WhatsApp',
    },
    icon: Clock,
  },
  trial: {
    ar: {
      title: 'الفترة التجريبية',
      desc: 'أنت حالياً في الفترة التجريبية. تواصل معنا لتفعيل اشتراكك الكامل والوصول لجميع الميزات.',
      action: 'تفعيل الاشتراك',
    },
    en: {
      title: 'Trial Period',
      desc: "You're currently in the trial period. Contact us to activate your full subscription and access all features.",
      action: 'Activate Subscription',
    },
    icon: KeyRound,
  },
  paused: {
    ar: {
      title: 'الاشتراك متوقف',
      desc: 'تم إيقاف اشتراكك مؤقتاً. تواصل معنا لإعادة تفعيل حسابك.',
      action: 'إعادة التفعيل',
    },
    en: {
      title: 'Subscription Paused',
      desc: 'Your subscription has been temporarily paused. Contact us to reactivate your account.',
      action: 'Reactivate',
    },
    icon: PauseCircle,
  },
  cancelled: {
    ar: {
      title: 'تم إلغاء الاشتراك',
      desc: 'اشتراكك غير نشط. تواصل معنا لإعادة التفعيل.',
      action: 'تفعيل الاشتراك',
    },
    en: {
      title: 'Subscription Cancelled',
      desc: 'Your subscription is inactive. Contact us to reactivate.',
      action: 'Reactivate',
    },
    icon: XCircle,
  },
};

export function SubscriptionGate({ status }: Props) {
  const { lang } = useLanguage();
  const config = configs[status as keyof typeof configs];
  if (!config) return null;

  const text = config[lang];
  const Icon = config.icon;
  const whatsappNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '201000000000';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(12px)' }}
    >
      <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-3" style={{ color: 'var(--primary)' }}>
            {text.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-fg)' }}>
            {text.desc}
          </p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold w-full justify-center text-sm"
        >
          <MessageCircle size={18} />
          {text.action}
        </a>
      </div>
    </div>
  );
}
