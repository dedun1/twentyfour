'use client';

import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

interface AddClientModalProps {
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
}

export function AddClientModal({ onClose, onSave }: AddClientModalProps) {
  const { lang } = useLanguage();
  const t = useT(lang);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--foreground)]">{t.admin.addClient}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
            style={{ color: '#9ca3af' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.admin.clientName} *
            </label>
            <input {...register('full_name')} className="input-base" placeholder={t.auth.fullNamePlaceholder} />
            {errors.full_name && <p className="text-xs text-red-400 mt-1">{t.common.required}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.admin.clientEmail} *
            </label>
            <input {...register('email')} type="email" className="input-base" placeholder={t.auth.emailPlaceholder} />
            {errors.email && <p className="text-xs text-red-400 mt-1">{t.common.required}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.admin.clientPhone}
            </label>
            <input {...register('phone')} className="input-base" placeholder={t.auth.phonePlaceholder} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.admin.businessName}
            </label>
            <input {...register('business_name')} className="input-base" placeholder={t.settings.businessName} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted-fg)] mb-1.5">
              {t.auth.password} *
            </label>
            <input {...register('password')} type="password" className="input-base" placeholder="••••••••" />
            {errors.password && <p className="text-xs text-red-400 mt-1">{t.common.required}</p>}
          </div>

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
