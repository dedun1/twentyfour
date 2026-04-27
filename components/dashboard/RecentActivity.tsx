'use client';

import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getStatusColor, formatDateTime } from '@/lib/utils';
import type { Appointment } from '@/lib/types';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

interface RecentActivityProps {
  appointments: Appointment[];
}

const statusIcons: Record<string, React.ReactNode> = {
  confirmed: <CheckCircle size={14} className="text-green-400" />,
  cancelled: <XCircle size={14} className="text-red-400" />,
  pending: <Clock size={14} className="text-yellow-400" />,
  completed: <AlertCircle size={14} className="text-blue-400" />,
};

export function RecentActivity({ appointments }: RecentActivityProps) {
  const { lang } = useLanguage();
  const t = useT(lang);

  if (!appointments.length) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 text-center">
        <Calendar size={40} className="text-[var(--muted-fg)] opacity-50" />
        <p className="text-sm text-[var(--muted-fg)]">{t.dashboard.noActivity}</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-[var(--foreground)]">{t.dashboard.recentActivity}</h3>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {appointments.map((appt) => (
          <li key={appt.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[rgba(240,165,0,0.03)] transition-colors">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(240,165,0,0.08)' }}
            >
              <Calendar size={16} style={{ color: '#f0a500' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {appt.client_name}
              </p>
              <p className="text-xs text-[var(--muted-fg)] truncate">{appt.service}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`badge text-xs ${getStatusColor(appt.status)}`}>
                <span className="flex items-center gap-1">
                  {statusIcons[appt.status]}
                  {t.appointments[appt.status as keyof typeof t.appointments]}
                </span>
              </div>
              <span className="text-xs text-[var(--muted-fg)]">
                {appt.date} {appt.time}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
