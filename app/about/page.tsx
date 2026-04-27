'use client';

import { Zap, Target, Eye, Heart, TrendingUp, MessageSquare, Calendar, CreditCard, UserPlus, BarChart2, Database, Package, Users, Workflow, ArrowRight, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';

export default function AboutPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const ta = t.about;

  const values = [
    { icon: <Zap size={22} style={{ color: '#f0a500' }} />, title: ta.v1title, desc: ta.v1desc },
    { icon: <Target size={22} style={{ color: '#22c55e' }} />, title: ta.v2title, desc: ta.v2desc },
    { icon: <Heart size={22} style={{ color: '#ef4444' }} />, title: ta.v3title, desc: ta.v3desc },
    { icon: <TrendingUp size={22} style={{ color: '#3b82f6' }} />, title: ta.v4title, desc: ta.v4desc },
  ];

  const stats = lang === 'ar'
    ? [{ v: '3+', l: 'سنوات خبرة' }, { v: '30+', l: 'قطاع أعمال' }, { v: '100%', l: 'فريق مصري' }, { v: '24/7', l: 'دعم مستمر' }]
    : [{ v: '3+', l: 'Years Experience' }, { v: '30+', l: 'Business Sectors' }, { v: '100%', l: 'Egyptian Team' }, { v: '24/7', l: 'Ongoing Support' }];

  const automations = lang === 'ar'
    ? [
        { icon: MessageSquare, title: 'استفسارات العملاء', desc: 'ردود تلقائية على واتساب، الإيميل، السوشيال', color: '#22c55e' },
        { icon: Calendar, title: 'حجز المواعيد', desc: 'أنظمة حجز ذاتي للعملاء', color: '#f0a500' },
        { icon: CreditCard, title: 'تحصيل المدفوعات', desc: 'فواتير وتذكيرات تلقائية', color: '#3b82f6' },
        { icon: UserPlus, title: 'متابعة العملاء المحتملين', desc: 'سلاسل متابعة بتنمي العملاء تلقائياً', color: '#a855f7' },
        { icon: BarChart2, title: 'التقارير الداخلية', desc: 'ملخصات يومية على موبايلك', color: '#f59e0b' },
        { icon: Database, title: 'إدخال البيانات', desc: 'بنخلصك من نسخ ولصق الإكسل للأبد', color: '#ec4899' },
        { icon: Package, title: 'تتبع المخزون', desc: 'تنبيهات لحظية للمخزون وإعادة الطلب', color: '#06b6d4' },
        { icon: Users, title: 'تنسيق الفريق', desc: 'مهام وإشعارات بتتعين تلقائياً', color: '#84cc16' },
        { icon: Workflow, title: 'سير عمل مخصص', desc: 'لو بتعملها يدوي، إحنا نقدر نأتمتها', color: '#f97316' },
      ]
    : [
        { icon: MessageSquare, title: 'Customer Inquiries', desc: 'Auto-replies across WhatsApp, email, social', color: '#22c55e' },
        { icon: Calendar, title: 'Appointment Booking', desc: 'Self-service booking systems', color: '#f0a500' },
        { icon: CreditCard, title: 'Payment Collection', desc: 'Automated invoicing and reminders', color: '#3b82f6' },
        { icon: UserPlus, title: 'Lead Follow-up', desc: 'Sequences that nurture leads automatically', color: '#a855f7' },
        { icon: BarChart2, title: 'Internal Reports', desc: 'Daily summaries to your phone', color: '#f59e0b' },
        { icon: Database, title: 'Data Entry', desc: 'Eliminate spreadsheet copy-paste forever', color: '#ec4899' },
        { icon: Package, title: 'Inventory Tracking', desc: 'Real-time stock and reorder alerts', color: '#06b6d4' },
        { icon: Users, title: 'Team Coordination', desc: 'Auto-assigned tasks and notifications', color: '#84cc16' },
        { icon: Workflow, title: 'Custom Workflows', desc: 'If you do it manually, we can automate it', color: '#f97316' },
      ];

  const howWeWork = lang === 'ar'
    ? [
        { num: '01', title: 'مكالمة استكشاف مجانية', desc: 'بنتعرف على شغلتك بالتفصيل' },
        { num: '02', title: 'عرض مخصص', desc: 'بنرسم بالظبط هنأتمت إيه وإزاي' },
        { num: '03', title: 'بناء وتجريب', desc: 'عادة من 5 لـ 14 يوم لنظام شغّال' },
        { num: '04', title: 'إطلاق ودعم', desc: 'أنت بتدير شغلتك. إحنا بنحافظ على النظام شغّال' },
      ]
    : [
        { num: '01', title: 'Free Discovery Call', desc: 'We learn your business in detail.' },
        { num: '02', title: 'Custom Proposal', desc: 'We map exactly what to automate and how.' },
        { num: '03', title: 'Build & Test', desc: 'Usually 5 to 14 days to a working system.' },
        { num: '04', title: 'Launch & Support', desc: 'You run your business. We keep the system running.' },
      ];

  const whyTwentyFour = lang === 'ar'
    ? [
        'إحنا فاهمين السوق المصري وإزاي بتشتغل البيزنسات المحلية فعلياً',
        'بنبني علشان النتايج، مش الشكل',
        'الإعداد في أيام، مش شهور',
        'تسعير شفاف بعد ما نفهم احتياجاتك',
      ]
    : [
        'We understand the Egyptian market and how local businesses actually work',
        'We build for results, not for show',
        'Setup in days, not months',
        'Transparent pricing after we understand your needs',
      ];

  const whatWeBuildIntro = lang === 'ar'
    ? 'كل بيزنس عنده شغل متكرر بياخد وقت وفلوس. بنحدده، بنصمم الحل، وبنبنيه لك. أمثلة على اللي بنأتمته:'
    : 'Every business has repetitive work that drains time and money. We identify it, design a solution, and build it for you. Some examples of what we automate:';

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24">
        {/* Hero */}
        <section className="hero-gradient py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #f0a500, #ffd700)' }}
            >
              <Zap size={28} className="text-[#0a0f1e]" />
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {ta.title}
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted-fg)' }}>{ta.subtitle}</p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(({ v, l }) => (
                <div key={l} className="glass-card p-5 text-center">
                  <p className="text-3xl font-bold mb-1 gold-gradient">{v}</p>
                  <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Build */}
        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-10 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                {lang === 'ar' ? 'إيه اللي بنبنيه' : 'What We Build'}
              </h2>
              <p style={{ color: 'var(--muted-fg)' }}>{whatWeBuildIntro}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {automations.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="glass-card-hover p-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${color}18` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="font-bold mb-1.5 text-sm" style={{ color: 'var(--foreground)' }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How We Work */}
        <section className="section-gradient py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                {lang === 'ar' ? 'إزاي بنشتغل' : 'How We Work'}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {howWeWork.map(({ num, title, desc }) => (
                <div key={num} className="glass-card p-5">
                  <div className="text-3xl font-bold mb-3 gold-gradient">{num}</div>
                  <h3 className="font-bold mb-1.5 text-sm" style={{ color: 'var(--foreground)' }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 grid md:grid-cols-2 gap-6">
            <div className="glass-card p-7">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(240,165,0,0.15)' }}
                >
                  <Target size={20} style={{ color: '#f0a500' }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{ta.missionTitle}</h2>
              </div>
              <p className="leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{ta.missionDesc}</p>
            </div>
            <div className="glass-card p-7">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.15)' }}
                >
                  <Eye size={20} style={{ color: '#3b82f6' }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{ta.visionTitle}</h2>
              </div>
              <p className="leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{ta.visionDesc}</p>
            </div>
          </div>
        </section>

        {/* Why TwentyFour */}
        <section className="py-12 lg:py-16">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--foreground)' }}>
              {lang === 'ar' ? 'ليه TwentyFour' : 'Why TwentyFour'}
            </h2>
            <div className="space-y-3">
              {whyTwentyFour.map((item) => (
                <div key={item} className="glass-card p-5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(34,197,94,0.15)' }}>
                    <span style={{ color: '#22c55e', fontSize: 12 }}>✓</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section-gradient py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--foreground)' }}>
              {ta.valuesTitle}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {values.map(({ icon, title, desc }) => (
                <div key={title} className="glass-card-hover p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(31,41,55,0.8)' }}
                    >
                      {icon}
                    </div>
                    <h3 className="font-bold" style={{ color: 'var(--foreground)' }}>{title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 lg:py-16">
          <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              {lang === 'ar' ? 'مستعد تشوف إيه اللي نقدر نأتمته لشغلتك؟' : 'Ready to see what we can automate for you?'}
            </h2>
            <Link href="/contact" className="btn-gold inline-flex">
              {lang === 'ar' ? 'احجز استشارة مجانية' : 'Book Free Demo'}
              {lang === 'ar' ? <ChevronRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
            </Link>
          </div>
        </section>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
