'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, Calendar as CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(prefilledName);
      setEmail(prefilledEmail);
      setPhone(prefilledPhone);
      setBusiness(prefilledBusiness);
      setDate('');
      setTime('');
      setNotes('');
      setSuccess(false);
      setError(null);
    }
  }, [open, prefilledName, prefilledEmail, prefilledPhone, prefilledBusiness]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = today.toISOString().split('T')[0];
  const maxDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !date || !time) {
      setError(isAr ? 'من فضلك املأ كل الحقول المطلوبة.' : 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Submission failed');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? 'حصل خطأ. حاول تاني.' : 'Something went wrong. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {isAr ? 'تم الحجز بنجاح' : 'Request received'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isAr
                ? 'استلمنا طلبك. هنبعتلك تأكيد على الإيميل خلال 24 ساعة برابط المكالمة. لو معرفناش إن خدماتنا مناسبة لبيزنسك، هنقولك بصراحة بدل ما نضيع وقتك.'
                : 'We got your request. You will get a confirmation email within 24 hours with the meeting link. If we do not think our services are a fit for your business, we will tell you honestly instead of wasting your time.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-gold inline-flex px-7 py-2.5"
            >
              {isAr ? 'تمام' : 'Got it'}
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
                  <>احجز <span className="text-amber-500">مكالمتك</span></>
                ) : (
                  <>Book Your <span className="text-amber-500">Discovery</span> Call</>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? '20 دقيقة. بنشوف لو خدماتنا تناسب بيزنسك. لو لأ، هنقولك بصراحة.'
                  : '20 minutes. We see if our services fit your business. If not, we tell you honestly.'}
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

            {error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span>{isAr ? 'جاري الإرسال...' : 'Submitting...'}</span>
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
    </div>
  );
}
