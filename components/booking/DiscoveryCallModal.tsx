'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar as CalendarIcon, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId?: string | null;
  prefilledEmail?: string;
  prefilledName?: string;
  prefilledPhone?: string;
  prefilledBusiness?: string;
}

type PrefillData = {
  email?: string | null;
  phone?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  city?: string | null;
  team_size?: string | null;
  years_in_business?: string | null;
  daily_operations?: string | null;
  client_acquisition?: string | null;
  current_tools?: string | null;
  daily_volume?: string | null;
  time_wasters?: string | null;
  recurring_problems?: string | null;
  one_thing_to_fix?: string | null;
  automation_goals?: string | null;
  timeline?: string | null;
};

export function DiscoveryCallModal({
  open,
  onClose,
  sessionId,
  prefilledEmail = '',
  prefilledName = '',
  prefilledPhone = '',
  prefilledBusiness = '',
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [name, setName] = useState(prefilledName);
  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState(prefilledPhone);
  const [business, setBusiness] = useState(prefilledBusiness);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [city, setCity] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [dailyOperations, setDailyOperations] = useState('');
  const [clientAcquisition, setClientAcquisition] = useState('');
  const [currentTools, setCurrentTools] = useState('');
  const [dailyVolume, setDailyVolume] = useState('');
  const [timeWasters, setTimeWasters] = useState('');
  const [recurringProblems, setRecurringProblems] = useState('');
  const [oneThingToFix, setOneThingToFix] = useState('');
  const [automationGoals, setAutomationGoals] = useState('');
  const [timeline, setTimeline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(prefilledName);
      setEmail(prefilledEmail);
      setPhone(prefilledPhone);
      setBusiness(prefilledBusiness);
      setDate('');
      setTime('');
      setNotes('');
      setBusinessType('');
      setCity('');
      setTeamSize('');
      setYearsInBusiness('');
      setDailyOperations('');
      setClientAcquisition('');
      setCurrentTools('');
      setDailyVolume('');
      setTimeWasters('');
      setRecurringProblems('');
      setOneThingToFix('');
      setAutomationGoals('');
      setTimeline('');
      setSuccess(false);
      setError(null);
      setDetailsOpen(false);
    }
  }, [open, prefilledName, prefilledEmail, prefilledPhone, prefilledBusiness]);

  useEffect(() => {
    if (!open || !sessionId) return;

    let cancelled = false;
    const fetchPrefill = async () => {
      try {
        const res = await fetch(`/api/onboarding/session/${encodeURIComponent(sessionId)}/prefill`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || cancelled) return;

        const p = (data.prefill ?? {}) as PrefillData;
        setEmail((prev) => prev || p.email || '');
        setPhone((prev) => prev || p.phone || '');
        setBusiness((prev) => prev || p.business_name || '');
        setBusinessType((prev) => prev || p.business_type || '');
        setCity((prev) => prev || p.city || '');
        setTeamSize((prev) => prev || p.team_size || '');
        setYearsInBusiness((prev) => prev || p.years_in_business || '');
        setDailyOperations((prev) => prev || p.daily_operations || '');
        setClientAcquisition((prev) => prev || p.client_acquisition || '');
        setCurrentTools((prev) => prev || p.current_tools || '');
        setDailyVolume((prev) => prev || p.daily_volume || '');
        setTimeWasters((prev) => prev || p.time_wasters || '');
        setRecurringProblems((prev) => prev || p.recurring_problems || '');
        setOneThingToFix((prev) => prev || p.one_thing_to_fix || '');
        setAutomationGoals((prev) => prev || p.automation_goals || '');
        setTimeline((prev) => prev || p.timeline || '');
      } catch {
        // Silent fallback, manual entry still works.
      }
    };

    void fetchPrefill();
    return () => {
      cancelled = true;
    };
  }, [open, sessionId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split('T')[0];
  const maxDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!name.trim() || !phone.trim() || !date || !time) {
      setError(isAr ? 'من فضلك املأ كل الحقول المطلوبة.' : 'Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/discovery-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim(),
          business_name: business.trim() || null,
          preferred_date: date,
          preferred_time: time,
          notes: notes.trim() || null,
          session_id: sessionId || null,
          business_type: businessType.trim() || null,
          city: city.trim() || null,
          team_size: teamSize.trim() || null,
          years_in_business: yearsInBusiness.trim() || null,
          daily_operations: dailyOperations.trim() || null,
          client_acquisition: clientAcquisition.trim() || null,
          current_tools: currentTools.trim() || null,
          daily_volume: dailyVolume.trim() || null,
          time_wasters: timeWasters.trim() || null,
          recurring_problems: recurringProblems.trim() || null,
          one_thing_to_fix: oneThingToFix.trim() || null,
          automation_goals: automationGoals.trim() || null,
          timeline: timeline.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok === true) {
        setError(null);
        setSuccess(true);
        return;
      }
      setError(
        (typeof data?.error === 'string' && data.error) ||
          (isAr ? 'حصل خطأ. حاول تاني.' : 'Something went wrong. Please try again.')
      );
    } catch {
      setError(isAr ? 'حصل خطأ. حاول تاني.' : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  if (typeof window === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl my-8"
        style={{ background: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors z-10"
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {isAr ? 'تم استلام الطلب' : 'Request received'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isAr
                ? 'سنتواصل معك خلال 24 ساعة لتأكيد مكالمة الاكتشاف.'
                : "We'll be in touch within 24 hours to confirm your discovery call."}
            </p>
            <button type="button" onClick={onClose} className="btn-gold w-full py-3 text-base">
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2 pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center">
                <CalendarIcon size={22} className="text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {isAr ? (
                  <>
                    احجز <span className="text-amber-500">مكالمتك</span>
                  </>
                ) : (
                  <>
                    Book Your <span className="text-amber-500">Discovery</span> Call
                  </>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? '20-30 دقيقة. بنشوف لو خدماتنا تناسب بيزنسك. لو لأ، هنقولك بصراحة.'
                  : '20-30 minutes. We see if our services fit your business. If not, we tell you honestly.'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isAr ? 'الاسم' : 'Full name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base w-full"
                  placeholder={isAr ? 'اسمك الكامل' : 'Your full name'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isAr ? 'الإيميل' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base w-full"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isAr ? 'رقم التليفون' : 'Phone number'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-base w-full"
                  placeholder="+1 555 123 4567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isAr ? 'اسم البيزنس' : 'Business name'}
                </label>
                <input
                  type="text"
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  className="input-base w-full"
                  placeholder={isAr ? 'اسم شركتك' : 'Your company'}
                />
              </div>

              <details
                className="rounded-xl border border-border bg-card/40 p-3"
                open={detailsOpen}
                onToggle={(e) => setDetailsOpen((e.currentTarget as HTMLDetailsElement).open)}
              >
                <summary className="cursor-pointer select-none flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {isAr ? 'تفاصيل البيزنس' : 'Business details'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAr
                        ? 'راجع اللي اتسحب من المحادثة وعدل أي حاجة مش دقيقة.'
                        : "Verify what we captured from your conversation. Edit anything that's wrong."}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`mt-0.5 text-muted-foreground transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                  />
                </summary>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Business type</label>
                    <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Team size</label>
                    <input value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Years in business</label>
                    <input value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} className="input-base w-full" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Daily operations</label>
                    <textarea rows={2} value={dailyOperations} onChange={(e) => setDailyOperations(e.target.value)} className="input-base resize-y w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Client acquisition</label>
                    <input value={clientAcquisition} onChange={(e) => setClientAcquisition(e.target.value)} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Current tools</label>
                    <input value={currentTools} onChange={(e) => setCurrentTools(e.target.value)} className="input-base w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Daily volume</label>
                    <input value={dailyVolume} onChange={(e) => setDailyVolume(e.target.value)} className="input-base w-full" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Time wasters</label>
                    <textarea rows={2} value={timeWasters} onChange={(e) => setTimeWasters(e.target.value)} className="input-base resize-y w-full" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Recurring problems</label>
                    <textarea rows={2} value={recurringProblems} onChange={(e) => setRecurringProblems(e.target.value)} className="input-base resize-y w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">One thing to fix</label>
                    <input value={oneThingToFix} onChange={(e) => setOneThingToFix(e.target.value)} className="input-base w-full" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Automation goals</label>
                    <textarea rows={2} value={automationGoals} onChange={(e) => setAutomationGoals(e.target.value)} className="input-base resize-y w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Timeline</label>
                    <input value={timeline} onChange={(e) => setTimeline(e.target.value)} className="input-base w-full" />
                  </div>
                </div>
              </details>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {isAr ? 'التاريخ' : 'Date'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    className="input-base w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {isAr ? 'الوقت' : 'Time'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input-base w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-base min-h-[80px] resize-y w-full"
                  placeholder={isAr ? 'أي تفاصيل عايز تشاركها قبل المكالمة' : 'Anything you want to share before the call'}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span>{isAr ? 'جاري الحجز...' : 'Booking...'}</span>
                </>
              ) : (
                <span>{isAr ? 'احجز مكالمتي' : 'Book My Call'}</span>
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {isAr
                ? 'بنرد على كل الطلبات خلال 24 ساعة. لو خدماتنا مش مناسبة لبيزنسك، هنقولك بصراحة بدل ما نضيع وقتك.'
                : 'We respond to every request within 24 hours. If our services are not a fit for your business, we tell you honestly instead of wasting your time.'}
            </p>
          </form>
        )}
      </div>
      <style jsx global>{`
        details > summary {
          list-style: none;
        }
        details > summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}
