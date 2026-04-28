'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, MessageCircle, PauseCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import { useClient } from '@/components/providers/ClientProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SubscriptionStatus } from '@/lib/types';

interface Props {
  rejectionReason?: string | null;
  children: React.ReactNode;
}

const configs = {
  pending_approval: {
    ar: {
      title: 'مرحباً بك في TwentyFour',
      subtitle: 'يتم الآن إعداد حسابك',
      desc: 'شكراً لتسجيلك! نراجع نشاطك التجاري بشكل شخصي حتى نوصي بأفضل مسارات الأتمتة المناسبة لك. سنراسلك على واتساب خلال 24 ساعة.',
      secondary: 'هل تريد تجاوز الانتظار؟ راسلنا الآن وسنقوم بإعدادك اليوم.',
      action: 'تواصل معنا على واتساب',
    },
    en: {
      title: 'Welcome to TwentyFour',
      subtitle: 'Your account is being set up',
      desc: "Thanks for signing up! We're personally reviewing your business so we can recommend the right automation workflows. You'll hear from us on WhatsApp within 24 hours.",
      secondary: "Want to skip the wait? Message us now and we'll get you set up today.",
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
    <div className="min-h-[calc(100vh-6rem)] bg-background py-10">
      <Card className="mx-auto w-full max-w-md rounded-xl border bg-card text-card-foreground shadow-sm">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/30">
            <Icon className="size-7" />
          </div>
          <div>
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-500">
              {text.title}
            </h2>
            {status === 'pending_approval' && 'subtitle' in text ? (
              <p className="mb-3 text-sm text-muted-foreground">{text.subtitle}</p>
            ) : null}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {text.desc}
            </p>
            {status === 'pending_approval' && 'secondary' in text ? (
              <p className="mt-3 text-sm text-muted-foreground">{text.secondary}</p>
            ) : null}
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
        </CardContent>
      </Card>
    </div>
  );
}
