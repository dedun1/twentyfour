'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { useClient } from '@/components/providers/ClientProvider';
import { Calendar, CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequireFeature } from '@/components/guards/RequireFeature';
import type { Appointment } from '@/lib/types';

export default function ReportsPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const { clientId } = useClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      if (!clientId) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('appointments').select('*').eq('client_id', clientId);
      setAppointments(((data || []) as Appointment[]).map((row) => ({
        ...row,
        client_name: row.client_name ?? (row as Appointment & { customer_name?: string }).customer_name ?? '',
      })));
      setLoading(false);
    };
    load();
  }, [clientId]);

  const total = appointments.length;
  const confirmedAppointments = appointments.filter((a) => a.status === 'confirmed');
  const completedAppointments = appointments.filter((a) => a.status === 'completed');
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');
  const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled');

  const confirmed = confirmedAppointments.length;
  const completed = completedAppointments.length;
  const pending = pendingAppointments.length;
  const cancelled = cancelledAppointments.length;

  // Revenue rule: cancelled appointments are never part of active revenue.
  const confirmedRevenue = confirmedAppointments.reduce((sum, a) => sum + Number(a.cost || 0), 0);
  const completedRevenue = completedAppointments.reduce((sum, a) => sum + Number(a.cost || 0), 0);
  const expectedRevenue = pendingAppointments.reduce((sum, a) => sum + Number(a.cost || 0), 0);
  const lostRevenue = cancelledAppointments.reduce((sum, a) => sum + Number(a.cost || 0), 0);
  const totalRevenue = confirmedRevenue + completedRevenue;

  const revenueByStatusData = [
    {
      name: t.reports.confirmed,
      value: confirmedRevenue,
      color: '#22c55e',
    },
    {
      name: t.reports.pending,
      value: expectedRevenue,
      color: '#f59e0b',
    },
    {
      name: t.reports.completed,
      value: completedRevenue,
      color: '#3b82f6',
    },
    {
      name: lang === 'ar' ? `${t.reports.cancelled} (فاقد)` : `${t.reports.cancelled} (Lost)`,
      value: lostRevenue,
      color: '#ef4444',
    },
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
    revenue: appointments
      .filter((a) => {
        const d = new Date(a.date);
        return d.getMonth() === i
          && d.getFullYear() === new Date().getFullYear()
          && (a.status === 'confirmed' || a.status === 'completed');
      })
      .reduce((sum, a) => sum + Number(a.cost || 0), 0),
  }));

  const topStats = [
    { label: t.reports.totalAppointments, value: total, icon: Calendar, color: 'text-foreground' },
    { label: t.reports.confirmed, value: confirmed, icon: CheckCircle, color: 'text-green-500' },
    { label: t.reports.completed, value: completed, icon: CheckCircle, color: 'text-blue-500' },
    { label: t.reports.pending, value: pending, icon: Clock, color: 'text-yellow-500' },
    { label: t.reports.cancelled, value: cancelled, icon: XCircle, color: 'text-red-500' },
    { label: lang === 'ar' ? 'إجمالي الإيراد' : 'Total Revenue', value: `${totalRevenue.toLocaleString()} EGP`, icon: BarChart2, color: 'text-green-500' },
    { label: lang === 'ar' ? 'الإيراد المحصل' : 'Collected Revenue', value: `${completedRevenue.toLocaleString()} EGP`, icon: BarChart2, color: 'text-blue-500' },
  ];

  const appointmentsTableRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...appointments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((a) => {
        if (!q) return true;
        const customer = (a.client_name || '').toLowerCase();
        const service = (a.service || '').toLowerCase();
        return customer.includes(q) || service.includes(q);
      });
  }, [appointments, search]);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        {topStats.map(({ label, value, icon: Icon, color }) => (
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-amber-500/20">
          <CardHeader><CardTitle className="text-amber-500">{lang === 'ar' ? 'الإيراد المتوقع' : 'Expected Revenue'}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{expectedRevenue.toLocaleString()} EGP</p>
            <p className="text-xs text-muted-foreground mt-2">{lang === 'ar' ? 'بانتظار التحصيل' : 'Awaiting collection'}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader><CardTitle className="text-green-500">{lang === 'ar' ? 'إيراد المؤكد' : 'Confirmed Revenue'}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{confirmedRevenue.toLocaleString()} EGP</p>
            <p className="text-xs text-muted-foreground mt-2">{lang === 'ar' ? 'حجوزات مؤكدة' : 'Bookings confirmed'}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardHeader><CardTitle className="text-red-500">{lang === 'ar' ? 'الإيراد المفقود' : 'Lost Revenue'}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold line-through decoration-red-500/70">{lostRevenue.toLocaleString()} EGP</p>
            <p className="text-xs text-muted-foreground mt-2">{lang === 'ar' ? 'من الحجوزات الملغاة' : 'From cancelled bookings'}</p>
          </CardContent>
        </Card>
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
          <CardHeader><CardTitle>{lang === 'ar' ? 'الإيراد حسب الحالة' : 'Revenue by Status'}</CardTitle></CardHeader>
          <CardContent>
            {loading || revenueByStatusData.length === 0 ? (
              <div className="flex justify-center py-12"><span className="spinner size-8" /></div>
            ) : (
              <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={revenueByStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {revenueByStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-xs">
                    {lang === 'ar' ? 'الإيراد النشط' : 'Active Revenue'}
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" className="fill-foreground text-sm font-semibold">
                    {totalRevenue.toLocaleString()} EGP
                  </text>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${Number(value || 0).toLocaleString()} EGP`, lang === 'ar' ? 'الإيراد' : 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {revenueByStatusData.map((row) => (
                  <div key={row.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="text-muted-foreground">{row.name}</span>
                    </div>
                    <span>{Number(row.value || 0).toLocaleString()} EGP</span>
                  </div>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{lang === 'ar' ? 'الإيراد الشهري' : 'Monthly Revenue'}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><span className="spinner size-8" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} barSize={20}>
                <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(240,165,0,0.06)' }}
                  formatter={(value) => [`${Number(value || 0).toLocaleString()} EGP`, lang === 'ar' ? 'الإيراد' : 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#f0a500" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>{lang === 'ar' ? 'كل المواعيد' : 'All Appointments'}</CardTitle>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={lang === 'ar' ? 'ابحث بالعميل أو الخدمة...' : 'Search by customer or service...'}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><span className="spinner size-8" /></div>
          ) : appointmentsTableRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t.common.noData}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium text-muted-foreground">{lang === 'ar' ? 'اسم العميل' : 'Customer Name'}</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">{lang === 'ar' ? 'الخدمة' : 'Service'}</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">{lang === 'ar' ? 'التكلفة' : 'Cost'}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsTableRows.map((appointment) => {
                    const isCancelled = appointment.status === 'cancelled';
                    const statusColor =
                      appointment.status === 'confirmed' ? 'bg-green-500/15 text-green-500' :
                      appointment.status === 'completed' ? 'bg-blue-500/15 text-blue-500' :
                      appointment.status === 'pending' ? 'bg-amber-500/15 text-amber-500' :
                      'bg-red-500/15 text-red-500';
                    return (
                      <tr key={appointment.id} className={`border-b ${isCancelled ? 'bg-red-500/5' : ''}`}>
                        <td className="py-2">{appointment.client_name || '-'}</td>
                        <td className="py-2">{appointment.service}</td>
                        <td className="py-2">{appointment.date}</td>
                        <td className="py-2">
                          <Badge className={statusColor}>{appointment.status}</Badge>
                        </td>
                        <td className={`py-2 ${isCancelled ? 'text-red-500 line-through decoration-red-500/70' : ''}`}>
                          {Number(appointment.cost || 0).toLocaleString()} EGP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </RequireFeature>
  );
}
