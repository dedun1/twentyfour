'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, CheckCircle2, CheckCheck, Clock3, XCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getAdminClientIds } from '@/lib/admin-filter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AppointmentStatus } from '@/lib/types';

type ClientRow = {
  id: string;
  business_name: string | null;
};

type AppointmentRow = {
  id: string;
  client_id: string | null;
  customer_name: string | null;
  service: string | null;
  date: string;
  time: string;
  status: AppointmentStatus;
  cost: number | null;
};

type MonthBucket = {
  month: string;
  monthKey: string;
  appointments: number;
  revenue: number;
};

const CURRENCY = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function formatUsd(value: number) {
  return `$${CURRENCY.format(value)}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-500',
  confirmed: 'bg-green-500/15 text-green-500',
  cancelled: 'bg-red-500/15 text-red-500',
  completed: 'bg-blue-500/15 text-blue-500',
};

export function TwentyFourAppointmentsTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [adminClients, setAdminClients] = useState<ClientRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all-admins');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const adminIds = await getAdminClientIds(supabase);
      const [{ data: clientRows, error: clientError }, { data: appointmentRows, error: appointmentError }] = await Promise.all([
        supabase.from('clients').select('id, business_name').in('id', adminIds).order('business_name', { ascending: true }),
        supabase
          .from('appointments')
          .select('id, client_id, customer_name, service, date, time, status, cost')
          .in('client_id', adminIds)
          .order('date', { ascending: false })
          .order('time', { ascending: false }),
      ]);

      if (clientError || appointmentError) {
        toast.error(clientError?.message || appointmentError?.message || 'Failed to load admin appointments');
        setLoading(false);
        return;
      }

      setAdminClients((clientRows || []) as ClientRow[]);
      setAppointments((appointmentRows || []) as AppointmentRow[]);
      setLoading(false);
    };

    load().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load admin appointments');
      setLoading(false);
    });
  }, [supabase]);

  const selectedAppointments = useMemo(() => {
    if (selectedClientId === 'all-admins') return appointments;
    return appointments.filter((appointment) => appointment.client_id === selectedClientId);
  }, [appointments, selectedClientId]);
  const selectedClientLabel = selectedClientId === 'all-admins'
    ? 'All Admins (Aggregated)'
    : (adminClients.find((client) => client.id === selectedClientId)?.business_name || 'Select admin client');

  const totalAppointments = selectedAppointments.length;
  const confirmedCount = selectedAppointments.filter((appointment) => appointment.status === 'confirmed').length;
  const completedCount = selectedAppointments.filter((appointment) => appointment.status === 'completed').length;
  const pendingCount = selectedAppointments.filter((appointment) => appointment.status === 'pending').length;
  const cancelledCount = selectedAppointments.filter((appointment) => appointment.status === 'cancelled').length;
  const totalRevenue = selectedAppointments
    .filter((appointment) => appointment.status !== 'cancelled')
    .reduce((sum, appointment) => sum + Number(appointment.cost || 0), 0);
  const completionDenominator = totalAppointments - cancelledCount;
  const completionRate = completionDenominator > 0
    ? `${Math.round((completedCount / completionDenominator) * 100)}%`
    : '—';

  const monthlyData = useMemo(() => {
    const now = new Date();
    const last12: Date[] = [];
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 11; i >= 0; i -= 1) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
      last12.push(dt);
    }
    const buckets: MonthBucket[] = last12.map((dt) => ({
      month: monthLabel(dt),
      monthKey: monthKey(dt),
      appointments: 0,
      revenue: 0,
    }));
    for (const appointment of selectedAppointments) {
      const dt = new Date(appointment.date);
      const key = monthKey(dt);
      const bucket = buckets.find((item) => item.monthKey === key);
      if (!bucket) continue;
      bucket.appointments += 1;
      if (appointment.status !== 'cancelled') bucket.revenue += Number(appointment.cost || 0);
    }
    return buckets;
  }, [selectedAppointments]);

  const recentAppointments = useMemo(() => {
    if (selectedClientId === 'all-admins') return [];
    return [...selectedAppointments]
      .sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : b.time.localeCompare(a.time)))
      .slice(0, 20);
  }, [selectedAppointments, selectedClientId]);

  const tooltipStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--foreground)',
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>TwentyFour Appointments</CardTitle>
          <p className="text-sm text-muted-foreground">Internal admin appointments - separate from client analytics</p>
          <Select value={selectedClientId} onValueChange={(value) => setSelectedClientId(value ?? 'all-admins')}>
            <SelectTrigger className="w-full md:w-[360px]">
              <SelectValue placeholder="Select admin client">{selectedClientLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-admins">All Admins (Aggregated)</SelectItem>
              {adminClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>{client.business_name || client.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Appointments', value: totalAppointments, Icon: Calendar },
          { label: 'Confirmed', value: confirmedCount, Icon: CheckCircle2 },
          { label: 'Completed', value: completedCount, Icon: CheckCheck },
          { label: 'Pending', value: pendingCount, Icon: Clock3 },
          { label: 'Cancelled', value: cancelledCount, Icon: XCircle },
          { label: 'Total Revenue', value: formatUsd(totalRevenue), Icon: DollarSign },
        ].map(({ label, value, Icon }) => (
          <Card key={label}>
            <CardContent className="min-h-[110px] p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Completion Rate</CardTitle></CardHeader>
        <CardContent className="text-3xl font-semibold">{completionRate}</CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Appointments</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.every((item) => item.appointments === 0) ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No appointments yet.</p>
            ) : (
              <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="appointments" fill="#f0a500" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.every((item) => item.revenue === 0) ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No revenue yet.</p>
            ) : (
              <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatUsd(Number(value || 0)), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedClientId !== 'all-admins' ? (
        <Card>
          <CardHeader><CardTitle>Recent Appointments</CardTitle></CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No appointments yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAppointments.map((appointment) => {
                    const isCancelled = appointment.status === 'cancelled';
                    return (
                      <TableRow key={appointment.id} className={isCancelled ? 'bg-red-500/5' : ''}>
                        <TableCell>{appointment.customer_name || '-'}</TableCell>
                        <TableCell>{appointment.service || '-'}</TableCell>
                        <TableCell>{appointment.date}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell><Badge className={STATUS_BADGE_CLASS[appointment.status]}>{appointment.status}</Badge></TableCell>
                        <TableCell className={isCancelled ? 'line-through decoration-red-500/70 text-red-500' : ''}>{formatUsd(Number(appointment.cost || 0))}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
