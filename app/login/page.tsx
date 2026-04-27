'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(t.auth.loginError);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(240,165,0,0.08) 0%, var(--bg) 60%)',
      }}
    >
      {/* Language switcher top right */}
      <div className="fixed top-4 end-4 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f0a500, #ffd700)' }}
            >
              <Zap size={20} className="text-[#0a0f1e]" />
            </div>
            <span className="font-extrabold text-xl" style={{ color: '#f0a500' }}>TwentyFour</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">{t.auth.loginTitle}</h1>
          <p className="text-[var(--muted-fg)] mt-1">{t.auth.loginSubtitle}</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">{t.auth.email}</label>
              <input
                {...register('email')}
                type="email"
                className="input-base"
                placeholder={t.auth.emailPlaceholder}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{t.common.required}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[var(--muted-fg)]">{t.auth.password}</label>
                <button type="button" className="text-xs text-[var(--primary)] hover:underline">
                  {t.auth.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  className="input-base"
                  placeholder={t.auth.passwordPlaceholder}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 end-3 flex items-center"
                  style={{ color: '#9ca3af' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{t.common.required}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gold w-full justify-center py-3 text-base"
            >
              {isSubmitting ? <span className="spinner" /> : t.auth.loginButton}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--muted-fg)] mt-6">
            {t.auth.noAccount}{' '}
            <Link href="/register" className="text-[var(--primary)] font-semibold hover:underline">
              {t.auth.registerLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
