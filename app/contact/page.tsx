'use client';

import { useState } from 'react';
import { Send, Zap, CheckCircle, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SUPPORT_WHATSAPP = '201115581594';
const DISPLAY_WHATSAPP = '01115581594';

type FormState = {
  full_name: string;
  whatsapp: string;
  email: string;
  business_name: string;
  business_type: string;
  city: string;
  team_size: string;
  years_in_business: string;
  daily_operations: string;
  client_acquisition: string;
  current_tools: string;
  daily_volume: string;
  time_wasters: string;
  recurring_problems: string;
  one_thing_to_fix: string;
  automation_goals: string;
  timeline: string;
  source: string;
};

const initialForm: FormState = {
  full_name: '', whatsapp: '', email: '', business_name: '',
  business_type: '', city: '', team_size: '', years_in_business: '',
  daily_operations: '', client_acquisition: '', current_tools: '', daily_volume: '',
  time_wasters: '', recurring_problems: '', one_thing_to_fix: '',
  automation_goals: '', timeline: '', source: '',
};

export default function ContactPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const tc = t.contact;
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateEgyptianPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(01[0-9]{9}|201[0-9]{9})$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error(lang === 'ar' ? 'أدخل اسمك' : 'Enter your name');
      return;
    }
    if (!validateEgyptianPhone(form.whatsapp)) {
      toast.error(lang === 'ar' ? 'رقم واتساب مصري غير صحيح (01xxxxxxxxx)' : 'Invalid Egyptian WhatsApp number (01xxxxxxxxx)');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      toast.error(tc.error);
    }
    setLoading(false);
  };

  const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(lang === 'ar' ? 'مرحباً، عايز أعرف أكتر عن TwentyFour' : "Hi, I'd like to know more about TwentyFour")}`;

  if (sent) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 min-h-screen flex items-center justify-center p-6 lg:p-8">
          <div className="glass-card p-10 max-w-md w-full text-center space-y-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(34,197,94,0.15)' }}
            >
              <CheckCircle size={32} style={{ color: '#22c55e' }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              {tc.successTitle}
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{tc.successBody}</p>
            <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
              {tc.successUrgent} <span style={{ color: '#22c55e', fontWeight: 600 }} dir="ltr">{DISPLAY_WHATSAPP}</span>
            </p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button className="w-full h-10">
                <MessageCircle />
                {tc.whatsappContact}
              </Button>
            </a>
          </div>
        </div>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
    <div>
      <Label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24">
        {/* Hero */}
        <section className="hero-gradient py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, #f0a500, #ffd700)' }}
            >
              <Zap size={24} className="text-[#0a0f1e]" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>{tc.title}</h1>
            <p className="leading-relaxed" style={{ color: 'var(--muted-fg)' }}>{tc.subtitle}</p>
          </div>
        </section>

        {/* Form */}
        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Basic Info */}
              <Section title={tc.sectionBasic}>
                <Field label={tc.nameLabel} required>
                  <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder={tc.namePlaceholder} required />
                </Field>
                <Field label={tc.whatsappLabel} required>
                  <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder={tc.whatsappPlaceholder} required dir="ltr" />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={tc.emailLabel}>
                    <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={tc.emailPlaceholder} />
                  </Field>
                  <Field label={tc.businessNameLabel}>
                    <Input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder={tc.businessNamePlaceholder} />
                  </Field>
                </div>
              </Section>

              {/* Section 2: Your Business */}
              <Section title={tc.sectionBusiness}>
                <Field label={tc.businessTypeLabel}>
                  <Select value={form.business_type || undefined} onValueChange={(v) => set('business_type', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tc.businessTypePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tc.businessTypes).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={tc.cityLabel}>
                    <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder={tc.cityPlaceholder} />
                  </Field>
                  <Field label={tc.teamSizeLabel}>
                    <Select value={form.team_size || undefined} onValueChange={(v) => set('team_size', v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={tc.teamSizePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tc.teamSizes).map(([k, v]) => (
                          <SelectItem key={k} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label={tc.yearsLabel}>
                  <Select value={form.years_in_business || undefined} onValueChange={(v) => set('years_in_business', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tc.yearsPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tc.years).map(([k, v]) => (
                        <SelectItem key={k} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Section>

              {/* Section 3: How You Work */}
              <Section title={tc.sectionWork}>
                <Field label={tc.dailyOperationsLabel}>
                  <Textarea value={form.daily_operations} onChange={(e) => set('daily_operations', e.target.value)} rows={4} placeholder={tc.dailyOperationsPlaceholder} />
                </Field>
                <Field label={tc.clientAcquisitionLabel}>
                  <Textarea value={form.client_acquisition} onChange={(e) => set('client_acquisition', e.target.value)} rows={3} placeholder={tc.clientAcquisitionPlaceholder} />
                </Field>
                <Field label={tc.currentToolsLabel}>
                  <Textarea value={form.current_tools} onChange={(e) => set('current_tools', e.target.value)} rows={3} placeholder={tc.currentToolsPlaceholder} />
                </Field>
                <Field label={tc.dailyVolumeLabel}>
                  <Input value={form.daily_volume} onChange={(e) => set('daily_volume', e.target.value)} placeholder={tc.dailyVolumePlaceholder} />
                </Field>
              </Section>

              {/* Section 4: Pain Points */}
              <Section title={tc.sectionPain}>
                <Field label={tc.timeWastersLabel}>
                  <Textarea value={form.time_wasters} onChange={(e) => set('time_wasters', e.target.value)} rows={3} placeholder={tc.timeWastersPlaceholder} />
                </Field>
                <Field label={tc.recurringProblemsLabel}>
                  <Textarea value={form.recurring_problems} onChange={(e) => set('recurring_problems', e.target.value)} rows={3} placeholder={tc.recurringProblemsPlaceholder} />
                </Field>
                <Field label={tc.oneThingLabel}>
                  <Textarea value={form.one_thing_to_fix} onChange={(e) => set('one_thing_to_fix', e.target.value)} rows={3} placeholder={tc.oneThingPlaceholder} />
                </Field>
              </Section>

              {/* Section 5: Goals */}
              <Section title={tc.sectionGoals}>
                <Field label={tc.automationGoalsLabel}>
                  <Textarea value={form.automation_goals} onChange={(e) => set('automation_goals', e.target.value)} rows={3} placeholder={tc.automationGoalsPlaceholder} />
                </Field>
                <Field label={tc.timelineLabel}>
                  <Select value={form.timeline || undefined} onValueChange={(v) => set('timeline', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tc.timelinePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tc.timelines).map(([k, v]) => (
                        <SelectItem key={k} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={tc.sourceLabel}>
                  <Select value={form.source || undefined} onValueChange={(v) => set('source', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tc.sourcePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tc.sources).map(([k, v]) => (
                        <SelectItem key={k} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Section>

              <Button type="submit" disabled={loading} className="w-full h-10">
                {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <Send />}
                {loading ? tc.sending : tc.send}
              </Button>

              <p className="text-center text-xs pt-2" style={{ color: 'var(--muted-fg)' }}>
                {tc.successUrgent} <span style={{ color: '#22c55e', fontWeight: 600 }} dir="ltr">{DISPLAY_WHATSAPP}</span>
              </p>
            </form>
          </div>
        </section>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
