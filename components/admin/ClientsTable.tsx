'use client';

import { Trash2, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { AdminClient } from '@/lib/types';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

interface ClientsTableProps {
  clients: AdminClient[];
  onDelete: (id: string) => void;
}

export function ClientsTable({ clients, onDelete }: ClientsTableProps) {
  const { lang } = useLanguage();
  const t = useT(lang);

  if (!clients.length) {
    return (
      <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 text-center">
        <Users size={48} className="text-[var(--muted-fg)] opacity-40" />
        <p className="text-[var(--muted-fg)]">{t.admin.noClients}</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t.admin.clientName}</th>
              <th>{t.admin.clientEmail}</th>
              <th>{t.admin.clientPhone}</th>
              <th>{t.admin.businessName}</th>
              <th>{t.admin.joinDate}</th>
              <th>{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(240,165,0,0.2), rgba(255,215,0,0.1))',
                        color: '#f0a500',
                      }}
                    >
                      {client.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-[var(--foreground)]">{client.full_name}</span>
                  </div>
                </td>
                <td className="text-[var(--muted-fg)]">{client.email}</td>
                <td className="text-[var(--muted-fg)]">{client.phone || '-'}</td>
                <td className="text-[var(--muted-fg)]">{client.business_name || '-'}</td>
                <td className="text-[var(--muted-fg)]">{formatDate(client.created_at, lang)}</td>
                <td>
                  <button
                    onClick={() => {
                      if (confirm(t.admin.confirmDelete)) {
                        onDelete(client.id);
                      }
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: '#9ca3af' }}
                    title={t.admin.deleteClient}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
