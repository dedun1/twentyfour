'use client';

import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Appointment } from '@/lib/types';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

const schema = z.object({
  client_name: z.string().min(2),
  client_phone: z.string().optional(),
  service: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddAppointmentModalProps {
  onClose: () => void;
  onSave: (data: Omit<Appointment, 'id' | 'user_id' | 'created_at'>) => void;
  initial?: Appointment | null;
}

export function AddAppointmentModal({ onClose, onSave, initial }: AddAppointmentModalProps) {
  const { lang } = useLanguage();
  const t = useT(lang);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_name: initial?.client_name || '',
      client_phone: initial?.client_phone || '',
      service: initial?.service || '',
      date: initial?.date || '',
      time: initial?.time || '',
      status: initial?.status || 'pending',
      notes: initial?.notes || '',
    },
  });

  const onSubmit = (data: FormData) => {
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {initial ? t.common.edit : t.appointments.addNew}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
            style={{ color: '#9ca3af' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Client name */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.appointments.clientName} *
            </label>
            <input
              {...register('client_name')}
              className="input-base"
              placeholder={t.common.name}
            />
            {errors.client_name && (
              <p className="text-xs text-red-400 mt-1">{t.common.required}</p>
            )}
          </div>

          {/* Client phone */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.appointments.clientPhone}
            </label>
            <input
              {...register('client_phone')}
              className="input-base"
              placeholder={t.auth.phonePlaceholder}
            />
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.appointments.service} *
            </label>
            <input
              {...register('service')}
              className="input-base"
              placeholder={t.appointments.servicePlaceholder}
            />
            {errors.service && (
              <p className="text-xs text-red-400 mt-1">{t.common.required}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
                {t.appointments.date} *
              </label>
              <input
                {...register('date')}
                type="date"
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
              {errors.date && (
                <p className="text-xs text-red-400 mt-1">{t.common.required}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
                {t.appointments.time} *
              </label>
              <input
                {...register('time')}
                type="time"
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
              {errors.time && (
                <p className="text-xs text-red-400 mt-1">{t.common.required}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.appointments.status}
            </label>
            <select {...register('status')} className="input-base">
              <option value="pending" style={{ background: '#111827' }}>{t.appointments.pending}</option>
              <option value="confirmed" style={{ background: '#111827' }}>{t.appointments.confirmed}</option>
              <option value="completed" style={{ background: '#111827' }}>{t.appointments.completed}</option>
              <option value="cancelled" style={{ background: '#111827' }}>{t.appointments.cancelled}</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.appointments.notes}
            </label>
            <textarea
              {...register('notes')}
              className="input-base resize-none"
              rows={3}
              placeholder={t.appointments.notesPlaceholder}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              {t.common.cancel}
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-gold flex-1 justify-center">
              {isSubmitting ? <span className="spinner" /> : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
