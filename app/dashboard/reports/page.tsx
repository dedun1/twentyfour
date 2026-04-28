'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { useClient } from '@/components/providers/ClientProvider';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequireFeature } from '@/components/guards/RequireFeature';
import type { Appointment } from '@/lib/types';

export default function ReportsPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const { clientId } = useClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      if (!clientId) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('appointments').select('*').eq('client_id', clientId);
      setAppointments((data || []) as Appointment[]);
      setLoading(false);
    };
    load();
  }, [clientId]);

  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
  const pending = appointments.filter((a) => a.status === 'pending').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;

  const pieData = [
    { name: t.reports.confirmed, value: confirmed, color: '#22c55e' },
    { name: t.reports.pending, value: pending, color: '#f59e0b' },
    { name: t.reports.completed, value: completed, color: '#3b82f6' },
    { name: t.reports.cancelled, value: cancelled, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const monthLabels = [
    t.reports.january, t.reports.february, t.reports.march,
    t.reports.april, t.reports.may, t.reports.june,
    t.reports.july, t.reports.august, t.reports.september,
    t.reports.october, t.reports.november, t.reports.december,
  ];

  const monthlyData = monthLabels.map((name, i) => ({
    name: name.slice(0, 3),
    count: appointments.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === i && d.getFullYear() === new Date().getFullYear();
    }).length,
  }));

  const stats = [
    { label: t.reports.totalAppointments, value: total, icon: Calendar, color: 'text-foreground' },
    { label: t.reports.confirmed, value: confirmed, icon: CheckCircle, color: 'text-green-500' },
    { label: t.reports.completed, value: completed, icon: CheckCircle, color: 'text-blue-500' },
    { label: t.reports.pending, value: pending, icon: Clock, color: 'text-yellow-500' },
    { label: t.reports.cancelled, value: cancelled, icon: XCircle, color: 'text-red-500' },
  ];

  const tooltipStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--foreground)',
  };

  return (
    <RequireFeature feature="reports">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.reports.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'إحصائيات تفصيلية' : 'Detailed statistics'}
          </p>
        </div>
        {/* Action buttons go here */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '…' : value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +0% from yesterday
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>{t.reports.monthlyAppointments}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><span className="spinner size-8" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} barSize={18}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(240,165,0,0.04)' }} />
                  <Bar dataKey="count" fill="#f0a500" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.reports.appointmentsByStatus}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><span className="spinner size-8" /></div>
            ) : pieData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">{t.common.noData}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </RequireFeature>
  );
}
