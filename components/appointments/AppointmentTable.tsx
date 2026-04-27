'use client';

import { Pencil, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import type { Appointment } from '@/lib/types';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

interface AppointmentTableProps {
  appointments: Appointment[];
  onDelete: (id: string) => void;
  onEdit: (appointment: Appointment) => void;
  onStatusChange: (id: string, status: Appointment['status']) => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  confirmed: <CheckCircle size={13} />,
  cancelled: <XCircle size={13} />,
  pending: <Clock size={13} />,
  completed: <AlertCircle size={13} />,
};

export function AppointmentTable({ appointments, onDelete, onEdit, onStatusChange }: AppointmentTableProps) {
  const { lang } = useLanguage();
  const t = useT(lang);

  if (!appointments.length) {
    return (
      <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 text-center">
        <Calendar size={48} className="text-[var(--muted-fg)] opacity-40" />
        <p className="text-[var(--muted-fg)]">{t.appointments.noAppointments}</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t.appointments.clientName}</th>
              <th>{t.appointments.service}</th>
              <th>{t.appointments.date}</th>
              <th>{t.appointments.time}</th>
              <th>{t.appointments.status}</th>
              <th>{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{appt.client_name}</p>
                    {appt.client_phone && (
                      <p className="text-xs text-[var(--muted-fg)] mt-0.5">{appt.client_phone}</p>
                    )}
                  </div>
                </td>
                <td className="text-[var(--muted-fg)]">{appt.service}</td>
                <td className="text-[var(--muted-fg)]">{appt.date}</td>
                <td className="text-[var(--muted-fg)]">{appt.time}</td>
                <td>
                  <select
                    value={appt.status}
                    onChange={(e) => onStatusChange(appt.id, e.target.value as Appointment['status'])}
                    className={`badge cursor-pointer outline-none ${getStatusColor(appt.status)}`}
                    style={{ background: 'transparent', border: 'none' }}
                  >
                    {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
                      <option key={s} value={s} style={{ background: '#111827', color: '#f5f5f5' }}>
                        {t.appointments[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(appt)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--muted)]"
                      style={{ color: '#9ca3af' }}
                      title={t.common.edit}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(appt.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                      style={{ color: '#9ca3af' }}
                      title={t.common.delete}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
