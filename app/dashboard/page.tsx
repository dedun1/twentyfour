'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CheckCircle, AlertCircle, XCircle, Plus, BarChart2, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { useClient } from '@/components/providers/ClientProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Appointment } from '@/lib/types';

const STATUS_CLASS: Record<Appointment['status'], string> = {
  pending: 'bg-amber-500/15 text-amber-500',
  confirmed: 'bg-green-500/15 text-green-500',
  completed: 'bg-blue-500/15 text-blue-500',
  cancelled: 'bg-red-500/15 text-red-500',
};

function getGreetingHourLabel(hour: number, lang: 'ar' | 'en') {
  if (hour < 12) return lang === 'ar' ? 'صباح الخير' : 'Good morning';
  if (hour < 18) return lang === 'ar' ? 'مساء الخير' : 'Good afternoon';
  return lang === 'ar' ? 'مساء الخير' : 'Good evening';
}

export default function DashboardPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const router = useRouter();
  const { features, ownerName, clientId } = useClient();
  const hasFeature = (feature: string) => features?.includes(feature as typeof features[number]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    service: '',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'pending' as Appointment['status'],
    notes: '',
  });

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const monthStart = `${today.slice(0, 7)}-01`;
  const greeting = getGreetingHourLabel(now.getHours(), lang);
  const dateLabel = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserName(ownerName || user.user_metadata?.full_name || user.email?.split('@')[0] || '');

    if ((hasFeature('appointments') || hasFeature('reports')) && clientId) {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .order('time', { ascending: true });
      setAppointments(((data || []) as Appointment[]).map((row) => ({
        ...row,
        client_name: row.client_name ?? (row as Appointment & { customer_name?: string }).customer_name ?? '',
        client_phone: row.client_phone ?? (row as Appointment & { customer_phone?: string }).customer_phone ?? undefined,
      })));
    } else {
      setAppointments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [clientId, features, ownerName]);

  const todaysAppointments = useMemo(
    () => appointments
      .filter((a) => a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today]
  );

  const todaysRevenue = todaysAppointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + Number(a.cost || 0), 0);
  const confirmedToday = todaysAppointments.filter((a) => a.status === 'confirmed').length;
  const completedToday = todaysAppointments.filter((a) => a.status === 'completed').length;
  const pendingToday = todaysAppointments.filter((a) => a.status === 'pending').length;
  const cancelledToday = todaysAppointments.filter((a) => a.status === 'cancelled').length;

  const monthRevenue = appointments
    .filter((a) => a.date >= monthStart && a.date <= today && a.status === 'completed')
    .reduce((sum, a) => sum + Number(a.cost || 0), 0);
  const uniqueCustomers = new Set(
    appointments
      .map((a) => (a.client_name || '').trim().toLowerCase())
      .filter(Boolean)
  ).size;
  const completionRate = appointments.length > 0
    ? Math.round((appointments.filter((a) => a.status === 'completed').length / appointments.length) * 100)
    : 0;

  const weekDays = useMemo(() => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const days: Array<{ key: string; label: string; dateText: string; count: number; isToday: boolean }> = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const key = day.toISOString().split('T')[0];
      const count = appointments.filter((a) => a.date === key).length;
      days.push({
        key,
        label: new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }).format(day),
        dateText: new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' }).format(day),
        count,
        isToday: key === today,
      });
    }
    return days;
  }, [appointments, lang, now, today]);

  const handleCreateAppointment = async () => {
    if (!clientId) return;
    if (!form.client_name.trim() || !form.service.trim()) {
      toast.error(lang === 'ar' ? 'أدخل اسم العميل والخدمة' : 'Enter customer name and service');
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      client_id: clientId,
      customer_name: form.client_name.trim(),
      customer_phone: form.client_phone.trim() || null,
      service: form.service.trim(),
      cost: Number(form.cost || 0),
      date: form.date,
      time: form.time,
      status: form.status,
      notes: form.notes.trim() || null,
    };
    const { error } = await supabase.from('appointments').insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAppointmentDialogOpen(false);
    setForm({
      client_name: '',
      client_phone: '',
      service: '',
      cost: 0,
      date: today,
      time: '10:00',
      status: 'pending',
      notes: '',
    });
    toast.success(lang === 'ar' ? 'تم إنشاء الموعد' : 'Appointment created');
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'ar' ? 'إليك ما يحدث اليوم في عملك' : "Here's what's happening today with your business"}
        </p>
        <p className="text-xs text-muted-foreground">{dateLabel}</p>
      </div>

      {(hasFeature('appointments') || hasFeature('reports')) && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              { label: lang === 'ar' ? 'مواعيد اليوم' : "Today's Appointments", value: loading ? '…' : todaysAppointments.length, icon: Calendar, iconClass: 'text-muted-foreground' },
              { label: lang === 'ar' ? 'مؤكد اليوم' : 'Confirmed Today', value: loading ? '…' : confirmedToday, icon: CheckCircle, iconClass: 'text-green-500' },
              { label: lang === 'ar' ? 'مكتمل اليوم' : 'Completed Today', value: loading ? '…' : completedToday, icon: CheckCircle, iconClass: 'text-blue-500' },
              { label: lang === 'ar' ? 'بانتظار الإجراء اليوم' : 'Pending Today', value: loading ? '…' : pendingToday, icon: Clock, iconClass: 'text-amber-500' },
              { label: lang === 'ar' ? 'ملغي اليوم' : 'Cancelled Today', value: loading ? '…' : cancelledToday, icon: XCircle, iconClass: 'text-red-500' },
              ...(hasFeature('reports')
                ? [{ label: lang === 'ar' ? 'إيراد اليوم' : "Today's Revenue", value: loading ? '…' : `${todaysRevenue.toLocaleString()} EGP`, icon: BarChart2, iconClass: 'text-blue-500' }]
                : []),
            ].map(({ label, value, icon: Icon, iconClass }) => (
              <Card key={label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  <Icon className={`h-4 w-4 ${iconClass}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasFeature('appointments') ? (
              <Card className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setAppointmentDialogOpen(true)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Plus className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium">{lang === 'ar' ? 'موعد جديد' : 'New Appointment'}</p>
                      <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'أضف حجزًا بسرعة' : 'Create a booking instantly'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
            {hasFeature('reports') ? (
              <Link href="/dashboard/reports">
                <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <BarChart2 className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{lang === 'ar' ? 'عرض التقارير' : 'View Reports'}</p>
                        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'تحليل أعمق للأداء' : 'Open deep analytics'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : null}
            {hasFeature('appointments') ? (
              <Link href="/dashboard/appointments">
                <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <ListChecks className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{lang === 'ar' ? 'كل المواعيد' : 'View All Appointments'}</p>
                        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'إدارة كافة الحجوزات' : 'Manage full schedule'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : null}
          </div>

          {hasFeature('appointments') ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{lang === 'ar' ? 'جدول اليوم' : "Today's Schedule"}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{dateLabel}</p>
              </div>
              <Link href="/dashboard/appointments" className="text-sm font-medium text-primary">
                {t.dashboard.viewAll}
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center"><span className="spinner size-8" /></div>
              ) : todaysAppointments.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {lang === 'ar' ? 'لا توجد مواعيد مجدولة اليوم' : 'No appointments scheduled for today'}
                </p>
              ) : (
                <div className="space-y-2">
                  {todaysAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-20 text-sm font-semibold">{appointment.time}</div>
                        <div>
                          <p className="text-sm font-medium">{appointment.client_name}</p>
                          <p className="text-xs text-muted-foreground">{appointment.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${STATUS_CLASS[appointment.status]}`}>{appointment.status}</span>
                        <span className="text-sm font-medium">{Number(appointment.cost || 0).toLocaleString()} EGP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          ) : null}

          {hasFeature('appointments') ? (
          <Card>
            <CardHeader><CardTitle>{lang === 'ar' ? 'نظرة على الأسبوع' : 'This Week at a Glance'}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {weekDays.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => router.push(`/dashboard/appointments?date=${day.key}`)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/40 ${day.isToday ? 'border-amber-500 bg-amber-500/10' : 'border-border'}`}
                  >
                    <p className="text-xs text-muted-foreground">{day.label}</p>
                    <p className="text-sm font-medium">{day.dateText}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{day.count} {lang === 'ar' ? 'موعد' : 'appt'}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {hasFeature('reports') ? (
            <Card>
              <CardHeader><CardTitle>{lang === 'ar' ? 'إيراد هذا الشهر' : "This Month's Revenue"}</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{monthRevenue.toLocaleString()} EGP</CardContent>
            </Card>
            ) : null}
            <Card>
              <CardHeader><CardTitle>{lang === 'ar' ? 'إجمالي العملاء المخدومين' : 'Total Clients Served'}</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{uniqueCustomers}</CardContent>
            </Card>
            {hasFeature('reports') ? (
            <Card>
              <CardHeader><CardTitle>{lang === 'ar' ? 'معدل الإكمال' : 'Completion Rate'}</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{completionRate}%</CardContent>
            </Card>
            ) : null}
          </div>
        </>
      )}

      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{lang === 'ar' ? 'موعد جديد' : 'New Appointment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{lang === 'ar' ? 'اسم العميل' : 'Customer Name'}</Label>
              <Input value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'ar' ? 'هاتف العميل' : 'Customer Phone'}</Label>
              <Input value={form.client_phone} onChange={(e) => setForm((p) => ({ ...p, client_phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'ar' ? 'الخدمة' : 'Service'}</Label>
              <Input value={form.service} onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{lang === 'ar' ? 'تكلفة الحجز (EGP)' : 'Booking Cost (EGP)'}</Label>
              <Input type="number" min="0" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: Number(e.target.value || 0) }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'التاريخ' : 'Date'}</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{lang === 'ar' ? 'الوقت' : 'Time'}</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'ar' ? 'الحالة' : 'Status'}</Label>
              <Select value={form.status} onValueChange={(value) => setForm((p) => ({ ...p, status: value as Appointment['status'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="confirmed">confirmed</SelectItem>
                  <SelectItem value="completed">completed</SelectItem>
                  <SelectItem value="cancelled">cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleCreateAppointment}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
