'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Users,
  UserCheck,
  Clock3,
  PauseCircle,
  DollarSign,
  UserPlus,
  Mail,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getAdminClientIds } from '@/lib/admin-filter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SubscriptionStatus } from '@/lib/types';

type StatsClientRow = {
  id: string;
  business_name: string | null;
  plan: string | null;
  subscription_status: SubscriptionStatus | null;
  monthly_price: number | null;
  created_at: string;
};

type ContactRequestRow = {
  id: string;
};

const CURRENCY = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function formatEgp(value: number) {
  return `${CURRENCY.format(value)} EGP`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  active: 'bg-green-500/15 text-green-500',
  trial: 'bg-blue-500/15 text-blue-500',
  pending_approval: 'bg-amber-500/15 text-amber-500',
  paused: 'bg-yellow-500/15 text-yellow-500',
  rejected: 'bg-red-500/15 text-red-500',
  cancelled: 'bg-zinc-500/15 text-zinc-400',
};

export function TwentyFourStatsTab() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<StatsClientRow[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequestRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: clientRows, error: clientError }, { data: contactRows, error: contactError }, adminClientIds] = await Promise.all([
        supabase
          .from('clients')
          .select('id, business_name, plan, subscription_status, monthly_price, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('contact_requests').select('id'),
        getAdminClientIds(supabase),
      ]);

      if (clientError || contactError) {
        toast.error(clientError?.message || contactError?.message || 'Failed to load platform stats');
        setLoading(false);
        return;
      }

      const filteredClients = ((clientRows || []) as StatsClientRow[]).filter((client) => !adminClientIds.includes(client.id));
      setClients(filteredClients);
      setContactRequests((contactRows || []) as ContactRequestRow[]);
      setLoading(false);
    };

    load();
  }, [supabase]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totals = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter((client) => client.subscription_status === 'active').length;
    const pendingApprovals = clients.filter((client) => client.subscription_status === 'pending_approval').length;
    const pausedCancelled = clients.filter((client) => (
      client.subscription_status === 'paused'
      || client.subscription_status === 'cancelled'
      || client.subscription_status === 'rejected'
    )).length;
    const monthlyRecurringRevenue = clients
      .filter((client) => client.subscription_status === 'active')
      .reduce((sum, client) => sum + Number(client.monthly_price || 0), 0);
    const newClientsThisMonth = clients.filter((client) => new Date(client.created_at) >= monthStart).length;
    const totalContactRequests = contactRequests.length;
    const arpa = activeClients > 0 ? monthlyRecurringRevenue / activeClients : null;

    return {
      totalClients,
      activeClients,
      pendingApprovals,
      pausedCancelled,
      monthlyRecurringRevenue,
      newClientsThisMonth,
      totalContactRequests,
      arpa,
    };
  }, [clients, contactRequests, monthStart]);

  const revenueByPlan = useMemo(() => {
    const byPlan = new Map<string, number>();
    for (const client of clients) {
      if (client.subscription_status !== 'active') continue;
      const plan = (client.plan || 'Unknown').trim() || 'Unknown';
      const current = byPlan.get(plan) || 0;
      byPlan.set(plan, current + Number(client.monthly_price || 0));
    }
    return Array.from(byPlan.entries())
      .map(([plan, revenue]) => ({ plan, revenue }))
      .filter((row) => row.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [clients]);

  const clientGrowth = useMemo(() => {
    const last12: Date[] = [];
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 11; i >= 0; i -= 1) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
      last12.push(dt);
    }
    return last12.map((dt) => {
      const key = monthKey(dt);
      const count = clients.filter((client) => {
        const created = new Date(client.created_at);
        return monthKey(created) === key;
      }).length;
      return {
        month: monthLabel(dt),
        count,
      };
    });
  }, [clients, now]);

  const topClients = useMemo(() => {
    return [...clients]
      .filter((client) => client.subscription_status === 'active')
      .sort((a, b) => Number(b.monthly_price || 0) - Number(a.monthly_price || 0))
      .slice(0, 10);
  }, [clients]);

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Clients', value: totals.totalClients, Icon: Users },
          { label: 'Active Clients', value: totals.activeClients, Icon: UserCheck },
          { label: 'Pending Approvals', value: totals.pendingApprovals, Icon: Clock3 },
          { label: 'Paused/Cancelled', value: totals.pausedCancelled, Icon: PauseCircle },
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Monthly Recurring Revenue', value: formatEgp(totals.monthlyRecurringRevenue), Icon: DollarSign },
          { label: 'New Clients This Month', value: totals.newClientsThisMonth, Icon: UserPlus },
          { label: 'Total Contact Requests', value: totals.totalContactRequests, Icon: Mail },
          { label: 'Average Revenue Per Active Client', value: totals.arpa === null ? '—' : formatEgp(totals.arpa), Icon: TrendingUp },
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue by Plan</CardTitle></CardHeader>
          <CardContent>
            {revenueByPlan.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No active plan revenue yet.</p>
            ) : (
              <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByPlan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="plan" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatEgp(Number(value || 0)), 'MRR']}
                  />
                  <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client Growth</CardTitle></CardHeader>
          <CardContent>
            {clientGrowth.every((row) => row.count === 0) ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No new client growth yet.</p>
            ) : (
              <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clientGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line dataKey="count" stroke="#f0a500" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top Clients by Monthly Price</CardTitle></CardHeader>
        <CardContent>
          {topClients.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No active clients yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monthly Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.business_name || '-'}</TableCell>
                    <TableCell>{client.plan || '-'}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[client.subscription_status || 'pending_approval']}>
                        {client.subscription_status || 'pending_approval'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatEgp(Number(client.monthly_price || 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
