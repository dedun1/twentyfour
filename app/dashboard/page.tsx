'use client';

import { useEffect, useState } from 'react';
import { Calendar, MessageSquare, FileText, BarChart2, Bell, Clock, CheckCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { useClient } from '@/components/providers/ClientProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Appointment } from '@/lib/types';

export default function DashboardPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const { features, ownerName, serviceLabel, clientId } = useClient();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(ownerName || user.user_metadata?.full_name || user.email?.split('@')[0] || '');

      if (features.includes('appointments') && clientId) {
        const { data } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(20);
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
    load();
  }, [clientId, features, ownerName]);

  const today = new Date().toISOString().split('T')[0];
  const total = appointments.length;
  const todayCount = appointments.filter((a) => a.date === today).length;
  const pending = appointments.filter((a) => a.status === 'pending').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;

  const featureCards = [
    {
      key: 'appointments',
      href: '/dashboard/appointments',
      icon: Calendar,
      title: lang === 'ar' ? 'المواعيد' : 'Appointments',
      desc: lang === 'ar' ? 'إدارة مواعيد عملائك' : 'Manage your appointments',
      color: '#f0a500',
    },
    {
      key: 'whatsapp',
      href: '/dashboard/inbox',
      icon: MessageSquare,
      title: lang === 'ar' ? 'الرسائل' : 'Messages',
      desc: lang === 'ar' ? 'محادثات العملاء' : 'Client conversations',
      color: '#22c55e',
    },
    {
      key: 'scripts',
      href: '/dashboard/scripts',
      icon: FileText,
      title: lang === 'ar' ? 'السكريبتات' : 'Scripts',
      desc: lang === 'ar' ? 'ردود جاهزة للعملاء' : 'Ready replies for clients',
      color: '#3b82f6',
    },
    {
      key: 'reports',
      href: '/dashboard/reports',
      icon: BarChart2,
      title: lang === 'ar' ? 'التقارير' : 'Reports',
      desc: lang === 'ar' ? 'إحصائيات مفصلة' : 'Detailed statistics',
      color: '#f59e0b',
    },
    {
      key: 'reminders',
      href: '/dashboard/reminders',
      icon: Bell,
      title: lang === 'ar' ? 'التذكيرات' : 'Reminders',
      desc: lang === 'ar' ? 'تذكيرات تلقائية للعملاء' : 'Automatic client reminders',
      color: '#ef4444',
    },
  ].filter((card) => features.includes(card.key as Parameters<typeof features.includes>[0]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'مرحباً بعودتك' : 'Welcome back'}
            {userName ? `, ${userName}` : ''}
          </p>
          {serviceLabel ? (
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'ar'
                ? `خدمتك "${serviceLabel}" تعمل بشكل طبيعي`
                : `Your ${serviceLabel} is running smoothly`}
            </p>
          ) : null}
        </div>
        {/* Action buttons go here */}
      </div>

      {/* Appointment stats, only if feature enabled */}
      {features.includes('appointments') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t.dashboard.totalAppointments, value: loading ? '…' : total, icon: Calendar },
            { label: t.dashboard.todayAppointments, value: loading ? '…' : todayCount, icon: Clock },
            { label: t.dashboard.pendingAppointments, value: loading ? '…' : pending, icon: Users },
            { label: t.dashboard.completedAppointments, value: loading ? '…' : completed, icon: CheckCircle },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +0% from yesterday
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Feature cards */}
      {featureCards.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            {t.dashboard.quickActions}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map(({ key, href, icon: Icon, title, desc, color }) => (
              <Link
                key={key}
                href={href}
                className="glass-card-hover p-5 flex items-start gap-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Today's appointments preview */}
      {features.includes('appointments') && !loading && todayCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              {t.appointments.todayTab}
            </h2>
            <Link href="/dashboard/appointments" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              {t.dashboard.viewAll}
            </Link>
          </div>
          <div className="glass-card overflow-hidden">
            {appointments
              .filter((a) => a.date === today)
              .slice(0, 3)
              .map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(31,41,55,0.5)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {appt.client_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                      {appt.service} - {appt.time}
                    </p>
                  </div>
                  <span
                    className="badge text-xs"
                    style={{
                      background: appt.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(240,165,0,0.1)',
                      color: appt.status === 'confirmed' ? '#22c55e' : '#f0a500',
                    }}
                  >
                    {t.appointments[appt.status as keyof typeof t.appointments] || appt.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
