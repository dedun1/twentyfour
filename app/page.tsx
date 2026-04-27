'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Calendar, MessageSquare, BarChart2, Bell, ArrowRight, Star, ChevronRight, CreditCard, Workflow, Wrench, CheckCircle2, Activity,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { Navbar } from '@/components/layout/Navbar';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return count;
}

function AutomationMockup({ lang }: { lang: 'ar' | 'en' }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % 3), 1500);
    return () => clearInterval(id);
  }, []);

  const rows = lang === 'ar'
    ? [
        { label: 'حجوزات العملاء', icon: Calendar, count: '24' },
        { label: 'تذكيرات الدفع', icon: CreditCard, count: '12' },
        { label: 'التقارير اليومية', icon: BarChart2, count: '11' },
      ]
    : [
        { label: 'Client Booking', icon: Calendar, count: '24' },
        { label: 'Payment Reminders', icon: CreditCard, count: '12' },
        { label: 'Daily Reports', icon: BarChart2, count: '11' },
      ];

  return (
    <div
      className="relative rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full mx-auto"
      style={{
        background: '#111827',
        border: '1px solid rgba(240,165,0,0.2)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(240,165,0,0.1)',
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: '#1a2535', borderBottom: '1px solid rgba(240,165,0,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <Activity size={16} style={{ color: '#f0a500' }} />
          <p className="text-sm font-semibold text-white">
            {lang === 'ar' ? 'الأنظمة الشغّالة' : 'Active Workflows'}
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
          Live
        </span>
      </div>

      <div className="p-4 space-y-3">
        {rows.map(({ label, icon: Icon, count }, i) => (
          <div
            key={label}
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(31,41,55,0.6)', border: '1px solid rgba(240,165,0,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(240,165,0,0.15)' }}
              >
                <Icon size={16} style={{ color: '#f0a500' }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-xs" style={{ color: '#22c55e' }}>
                  ● {lang === 'ar' ? 'شغّال' : 'Active'}
                </p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-sm font-bold" style={{ color: '#f0a500' }}>{count}</p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                {lang === 'ar' ? 'اليوم' : 'today'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="px-5 py-3 flex items-center justify-center gap-2"
        style={{ background: 'rgba(240,165,0,0.05)', borderTop: '1px solid rgba(240,165,0,0.08)' }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: '#22c55e', opacity: pulse === 0 ? 1 : 0.4 }}
        />
        <p className="text-xs" style={{ color: '#9ca3af' }}>
          <span className="font-bold text-white">47</span>{' '}
          {lang === 'ar' ? 'مهمة اتأتمتت اليوم' : 'tasks automated today'}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const tl = t.landing;
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  const c1 = useCountUp(500, 1800, statsVisible);
  const c2 = useCountUp(200000, 1800, statsVisible);
  const c3 = useCountUp(15, 1800, statsVisible);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const features = [
    { icon: <MessageSquare size={22} />, title: tl.features.f1title, desc: tl.features.f1desc, color: '#22c55e' },
    { icon: <Calendar size={22} />, title: tl.features.f2title, desc: tl.features.f2desc, color: '#f0a500' },
    { icon: <CreditCard size={22} />, title: tl.features.f3title, desc: tl.features.f3desc, color: '#3b82f6' },
    { icon: <BarChart2 size={22} />, title: tl.features.f4title, desc: tl.features.f4desc, color: '#f59e0b' },
    { icon: <Workflow size={22} />, title: tl.features.f5title, desc: tl.features.f5desc, color: '#a855f7' },
    { icon: <Wrench size={22} />, title: tl.features.f6title, desc: tl.features.f6desc, color: '#ec4899' },
  ];

  const steps = [
    { num: '01', title: tl.howItWorks.s1title, desc: tl.howItWorks.s1desc },
    { num: '02', title: tl.howItWorks.s2title, desc: tl.howItWorks.s2desc },
    { num: '03', title: tl.howItWorks.s3title, desc: tl.howItWorks.s3desc },
  ];

  const industries = tl.industries.list;
  const double = [...industries, ...industries];

  const trustBadges = [tl.trustBadges.b1, tl.trustBadges.b2, tl.trustBadges.b3];

  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="min-h-[90vh] flex items-center pt-16 pb-16 hero-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-start order-2 lg:order-1 max-w-xl mx-auto lg:mx-0">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
              style={{ background: 'rgba(240,165,0,0.12)', color: '#f0a500', border: '1px solid rgba(240,165,0,0.2)' }}
            >
              {tl.hero.badge}
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4" style={{ color: 'var(--foreground)' }}>
              {tl.hero.title}{' '}
              <span className="gold-gradient">{tl.hero.titleHighlight}</span>
            </h1>
            <p className="text-lg mb-8 max-w-lg mx-auto lg:mx-0" style={{ color: 'var(--muted-fg)' }}>
              {tl.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <Link href="/contact" className="btn-gold glow-gold">
                {tl.hero.cta}
                {lang === 'ar' ? <ChevronRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
              </Link>
              <button onClick={scrollToHow} className="btn-outline">
                {tl.hero.ctaSecondary}
              </button>
            </div>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-xs" style={{ color: 'var(--muted-fg)' }}>
              {trustBadges.map((b) => (
                <div key={b} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
            </div>
            <div className="flex justify-center order-1 lg:order-2">
              <AutomationMockup lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: `${c1}+`, label: tl.stats.s1 },
            { value: `${(c2 / 1000).toFixed(0)}K+`, label: tl.stats.s2 },
            { value: `${c3}`, label: tl.stats.s3 },
            { value: '4.9', label: tl.stats.s4 },
          ].map(({ value, label }) => (
            <div key={label} className="glass-card p-5 text-center">
              <p className="text-3xl font-bold mb-1 gold-gradient">{value}</p>
              <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>{label}</p>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-gradient py-16 lg:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              {tl.howItWorks.title}
            </h2>
            <p style={{ color: 'var(--muted-fg)' }}>{tl.howItWorks.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="glass-card p-6 text-center">
                <div className="text-4xl font-bold mb-4 gold-gradient">{num}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>{tl.features.title}</h2>
            <p style={{ color: 'var(--muted-fg)' }}>{tl.features.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon, title, desc, color }) => (
              <div key={title} className="glass-card-hover p-6">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}18` }}
                >
                  <span style={{ color }}>{icon}</span>
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry pills */}
      <section className="py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-sm font-semibold mb-6" style={{ color: 'var(--muted-fg)' }}>
            {tl.industries.title}
          </p>
        </div>
        <div className="relative">
          <div className="marquee-track" style={{ gap: '0.75rem' }}>
            {double.map((ind, i) => (
              <span
                key={i}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                style={{
                  background: 'rgba(240,165,0,0.08)',
                  color: 'var(--muted-fg)',
                  border: '1px solid rgba(240,165,0,0.12)',
                }}
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-8 text-center">
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#f0a500" style={{ color: '#f0a500' }} />
                ))}
              </div>
              <p className="text-lg font-medium mb-6 leading-relaxed" style={{ color: 'var(--foreground)' }}>
                &ldquo;{tl.testimonial.quote}&rdquo;
              </p>
              <div>
                <p className="font-bold" style={{ color: 'var(--primary)' }}>{tl.testimonial.name}</p>
                <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>{tl.testimonial.role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-gradient py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>{tl.cta.title}</h2>
            <p className="mb-8" style={{ color: 'var(--muted-fg)' }}>{tl.cta.subtitle}</p>
            <Link href="/contact" className="btn-gold glow-gold text-base px-8 py-3 inline-flex">
              {tl.cta.button}
              {lang === 'ar' ? <ChevronRight size={20} className="rotate-180" /> : <ArrowRight size={20} />}
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
}
