'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, MessageCircle, PauseCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import { useClient } from '@/components/providers/ClientProvider';
import { Button } from '@/components/ui/button';
import type { SubscriptionStatus } from '@/lib/types';

interface Props {
  rejectionReason?: string | null;
  children: React.ReactNode;
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
  paused: {
    ar: {
      title: 'الحساب متوقف',
      desc: 'تم إيقاف حسابك مؤقتاً. يرجى التواصل مع الدعم لإعادة التفعيل.',
      action: 'تواصل عبر واتساب',
    },
    en: {
      title: 'Account Paused',
      desc: 'Your account has been temporarily paused. Please contact support to reactivate.',
      action: 'Contact Us on WhatsApp',
    },
    icon: PauseCircle,
  },
  rejected: {
    ar: {
      title: 'لم تتم الموافقة على الحساب',
      desc: 'يرجى التواصل مع فريقنا لمعرفة سبب الرفض أو إعادة التقديم.',
      action: 'تواصل عبر واتساب',
    },
    en: {
      title: 'Account Not Approved',
      desc: 'Please contact our team for clarification or to reapply.',
      action: 'Contact Us on WhatsApp',
    },
    icon: XCircle,
  },
  cancelled: {
    ar: {
      title: 'انتهى الاشتراك',
      desc: 'انتهى اشتراكك. تواصل معنا إذا أردت إعادة التفعيل.',
      action: 'تواصل عبر واتساب',
    },
    en: {
      title: 'Subscription Ended',
      desc: 'Your subscription has ended.',
      action: 'Contact Us on WhatsApp',
    },
    icon: XCircle,
  },
};

export function SubscriptionGate({ rejectionReason, children }: Props) {
  const { lang } = useLanguage();
  const router = useRouter();
  const { userRole = 'client', subscriptionStatus } = useClient();
  const status = subscriptionStatus;

  // Admin bypass must always be the first gate condition.
  if (userRole === 'admin') return <>{children}</>;
  if (status === 'active' || status === 'trial') return <>{children}</>;

  const config = configs[status as keyof typeof configs];
  if (!config) return null;

  const text = config[lang];
  const Icon = config.icon;
  const whatsappNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '201115581594';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        router.push('/dashboard');
        return;
      }

      const clientId = profile?.client_id;
      if (!clientId) return;

      const { data: client } = await supabase
        .from('clients')
        .select('subscription_status')
        .eq('id', clientId)
        .maybeSingle();

      if (client?.subscription_status === 'active') {
        router.push('/dashboard');
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 30000);
    return () => clearInterval(intervalId);
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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
          {status === 'rejected' && rejectionReason ? (
            <p className="mt-2 text-sm leading-relaxed text-destructive">
              {rejectionReason}
            </p>
          ) : null}
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
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut size={14} />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
          </Button>
        </div>
      </div>
    </div>
  );
}
