'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, Check, Clock3, MoreHorizontal, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminClient, ContactRequest, FeatureKey, QAScript, ServiceType, SubscriptionStatus } from '@/lib/types';

type TabKey = 'pending' | 'clients' | 'contacts' | 'appointments' | 'scripts' | 'stats';
type PlanType = 'Starter' | 'Growth' | 'Scale' | 'Custom';

type AppointmentAdmin = {
  id: string;
  user_id: string;
  client_name: string;
  client_phone?: string;
  service: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
};
type AdminClientRow = AdminClient & { client_id?: string | null; service_type?: ServiceType; service_label?: string | null; notes?: string | null };

const FEATURES: FeatureKey[] = ['appointments', 'whatsapp', 'scripts', 'reports', 'reminders'];
const SERVICE_LABELS: Record<Exclude<ServiceType, null>, string> = {
  ai_chatbot: 'AI Chatbot Service',
  booking_system: 'Booking System',
  crm_automation: 'CRM Automation',
  custom_workflow: 'Custom Workflow',
  full_suite: 'Full Suite',
};
const SERVICE_DEFAULTS: Record<Exclude<ServiceType, null>, FeatureKey[]> = {
  ai_chatbot: ['whatsapp', 'scripts', 'reports'],
  booking_system: ['appointments', 'reminders', 'reports'],
  crm_automation: ['whatsapp', 'appointments', 'reminders', 'reports'],
  custom_workflow: [],
  full_suite: FEATURES,
};

export default function AdminPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<TabKey>('pending');
  const [clients, setClients] = useState<AdminClientRow[]>([]);
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [appointments, setAppointments] = useState<AppointmentAdmin[]>([]);
  const [scripts, setScripts] = useState<(QAScript & { client_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<AdminClientRow | null>(null);
  const [declineTarget, setDeclineTarget] = useState<AdminClientRow | null>(null);
  const [editClient, setEditClient] = useState<AdminClientRow | null>(null);
  const [featureTarget, setFeatureTarget] = useState<AdminClientRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminClientRow | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [scriptEdit, setScriptEdit] = useState<(QAScript & { client_id: string }) | null>(null);

  const [clientSearch, setClientSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | Exclude<ServiceType, null>>('all');
  const [clientPageSize, setClientPageSize] = useState(10);
  const [contactFilter, setContactFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'closed'>('all');
  const [contactSearch, setContactSearch] = useState('');
  const [appointmentClientFilter, setAppointmentClientFilter] = useState('all');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [appointmentFrom, setAppointmentFrom] = useState('');
  const [appointmentTo, setAppointmentTo] = useState('');
  const [scriptClientFilter, setScriptClientFilter] = useState('all');
  const [scriptCategoryFilter, setScriptCategoryFilter] = useState('all');

  const [approvalForm, setApprovalForm] = useState({
    service_type: 'ai_chatbot' as Exclude<ServiceType, null>,
    service_label: 'AI Chatbot Service',
    features: SERVICE_DEFAULTS.ai_chatbot,
    monthly_price: '',
    plan: 'Starter' as PlanType,
    notes: '',
  });
  const [declineReason, setDeclineReason] = useState('');

  const load = async () => {
    setLoading(true);
    const [{ data: auth }, { data: profiles }, { data: clientRows }, { data: contactRows }, { data: appointmentRows }, { data: scriptRows }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }),
      supabase.from('clients').select('*'),
      supabase.from('contact_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').order('created_at', { ascending: false }),
      supabase.from('qa_scripts').select('*').order('created_at', { ascending: false }),
    ]);
    setMyProfileId(auth.user?.id ?? null);
    const merged = (profiles || []).map((p) => {
      const c = (clientRows || []).find((x) => x.id === p.client_id || x.profile_id === p.id);
      return {
        ...p,
        subscription_status: c?.subscription_status ?? 'pending_approval',
        features: c?.features ?? [],
        monthly_price: c?.monthly_price ?? null,
        plan: c?.plan ?? '',
        service_type: c?.service_type ?? null,
        service_label: c?.service_label ?? '',
        notes: c?.notes ?? '',
        rejection_reason: c?.rejection_reason ?? '',
      } as AdminClientRow;
    });
    setClients(merged);
    setContacts((contactRows || []) as ContactRequest[]);
    setAppointments((appointmentRows || []) as AppointmentAdmin[]);
    setScripts((scriptRows || []) as (QAScript & { client_id: string })[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pending = useMemo(() => clients.filter((c) => c.subscription_status === 'pending_approval'), [clients]);
  const unreadContacts = useMemo(() => contacts.filter((c) => !c.status || c.status === 'new').length, [contacts]);
  const clientsById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  const approve = async () => {
    if (!approveTarget) return;
    const label = approvalForm.service_label.trim() || SERVICE_LABELS[approvalForm.service_type];
    const { error } = await supabase.from('clients').upsert({
      id: approveTarget.client_id,
      profile_id: approveTarget.id,
      subscription_status: 'active',
      service_type: approvalForm.service_type,
      service_label: label,
      monthly_price: Number(approvalForm.monthly_price || 0),
      plan: approvalForm.plan,
      notes: approvalForm.notes || null,
      features: approvalForm.features,
      approved_at: new Date().toISOString(),
      approved_by: myProfileId,
    }, { onConflict: 'id' });
    if (error) return toast.error(error.message);
    await supabase.from('notifications').insert({
      recipient_id: approveTarget.id,
      type: 'account_approved',
      title: 'Your account is approved!',
      message: `You now have access to ${label}. Start exploring your dashboard.`,
      is_read: false,
    });
    toast.success(`${approveTarget.business_name || approveTarget.full_name} approved`);
    setApproveTarget(null);
    await load();
  };

  const decline = async () => {
    if (!declineTarget || declineReason.trim().length < 10) return toast.error('Reason must be at least 10 characters');
    await supabase.from('clients').upsert({
      id: declineTarget.client_id,
      profile_id: declineTarget.id,
      subscription_status: 'rejected',
      rejection_reason: declineReason.trim(),
    }, { onConflict: 'id' });
    toast.success(`${declineTarget.business_name || declineTarget.full_name} declined`);
    setDeclineTarget(null);
    setDeclineReason('');
    await load();
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = clientSearch.toLowerCase();
      const matchesQuery = !q || c.business_name?.toLowerCase().includes(q) || c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.subscription_status === statusFilter;
      const matchesService = serviceFilter === 'all' || c.service_type === serviceFilter;
      return Boolean(matchesQuery && matchesStatus && matchesService);
    }).slice(0, clientPageSize);
  }, [clients, clientSearch, statusFilter, serviceFilter, clientPageSize]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const activeClients = clients.filter((c) => c.subscription_status === 'active');
  const monthlyRevenue = activeClients.reduce((sum, c) => sum + Number(c.monthly_price || 0), 0);
  const conversionRate = contacts.length ? (contacts.filter((c) => c.status === 'converted').length / contacts.length) * 100 : 0;
  const appointmentsToday = appointments.filter((a) => a.date === new Date().toISOString().slice(0, 10)).length;

  const activity = useMemo(() => {
    const fromApprovals = clients.filter((c) => c.subscription_status === 'active').map((c) => ({ id: `ap-${c.id}`, date: c.created_at, text: `Approved ${c.business_name || c.full_name}` }));
    const fromAppointments = appointments.map((a) => ({ id: `at-${a.id}`, date: a.created_at, text: `Appointment: ${a.client_name} - ${a.service}` }));
    const fromContacts = contacts.map((c) => ({ id: `ct-${c.id}`, date: c.created_at, text: `Lead: ${c.full_name}` }));
    return [...fromApprovals, ...fromAppointments, ...fromContacts].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 10);
  }, [clients, appointments, contacts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control clients, leads, appointments, scripts, and platform operations.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="flex w-full flex-wrap justify-start gap-2">
          <TabsTrigger value="pending">Pending Approvals {pending.length > 0 && <Badge className="ms-2 bg-red-500/15 text-red-500">{pending.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="clients">All Clients</TabsTrigger>
          <TabsTrigger value="contacts">Contact Requests {unreadContacts > 0 && <Badge className="ms-2 bg-red-500/15 text-red-500">{unreadContacts}</Badge>}</TabsTrigger>
          <TabsTrigger value="appointments">All Appointments</TabsTrigger>
          <TabsTrigger value="scripts">Scripts Library</TabsTrigger>
          <TabsTrigger value="stats">System Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? <Card><CardContent className="py-12 text-center">Loading...</CardContent></Card> : pending.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{c.business_name || c.full_name}</p>
                    <p className="text-sm text-muted-foreground">{c.full_name}</p>
                    <p className="text-sm text-muted-foreground">{c.email}</p>
                    <p className="text-sm text-muted-foreground">{c.phone || '-'}</p>
                    <p className="text-xs text-muted-foreground">Signed up {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => { setApproveTarget(c); setApprovalForm((prev) => ({ ...prev, service_label: 'AI Chatbot Service', service_type: 'ai_chatbot', features: SERVICE_DEFAULTS.ai_chatbot })); }}>Approve</Button>
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setDeclineTarget(c)}>Decline</Button>
                    <Button variant="outline" onClick={() => setEditClient(c)}>View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <Input className="md:col-span-2" placeholder="Search business, owner, email" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v ?? 'all') as typeof statusFilter)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="trial">Trial</SelectItem><SelectItem value="pending_approval">Pending Approval</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={(v) => setServiceFilter((v ?? 'all') as typeof serviceFilter)}>
              <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem><SelectItem value="ai_chatbot">AI Chatbot</SelectItem><SelectItem value="booking_system">Booking</SelectItem><SelectItem value="crm_automation">CRM</SelectItem><SelectItem value="custom_workflow">Custom</SelectItem><SelectItem value="full_suite">Full Suite</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(clientPageSize)} onValueChange={(v) => setClientPageSize(Number(v ?? '10'))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Owner</TableHead><TableHead>Service</TableHead><TableHead>Status</TableHead><TableHead>Plan</TableHead><TableHead>Monthly Price</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredClients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.business_name || '-'}</TableCell><TableCell>{c.full_name}</TableCell>
                    <TableCell><Badge variant="secondary">{(c.service_type && SERVICE_LABELS[c.service_type]) || '-'}</Badge></TableCell>
                    <TableCell><Badge>{c.subscription_status}</Badge></TableCell>
                    <TableCell>{c.plan || '-'}</TableCell><TableCell>{Number(c.monthly_price || 0).toLocaleString()} EGP</TableCell><TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"><MoreHorizontal /></Button>} />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditClient(c)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setFeatureTarget(c)}>Manage Features</DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => { await supabase.from('clients').upsert({ id: c.client_id, profile_id: c.id, subscription_status: c.subscription_status === 'paused' ? 'active' : 'paused' }, { onConflict: 'id' }); await load(); }}>{c.subscription_status === 'paused' ? 'Activate' : 'Pause'}</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => { setDeleteTarget(c); setDeleteName(''); }}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input placeholder="Search contact requests" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
            <Select value={contactFilter} onValueChange={(v) => setContactFilter((v ?? 'all') as typeof contactFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="converted">Converted</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
            </Select>
          </div>
          {contacts
            .filter((c) => (contactFilter === 'all' || (c.status || 'new') === contactFilter) && (!contactSearch || `${c.full_name} ${c.business_name || ''}`.toLowerCase().includes(contactSearch.toLowerCase())))
            .map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Badge>{c.status || 'new'}</Badge><p className="font-medium">{c.full_name}</p><p className="text-muted-foreground">{c.business_name || '-'}</p></div>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.business_type || '-'} | {c.city || '-'} | {c.team_size || '-'}</p>
                  <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p>{c.daily_operations || '-'}</p><p>{c.client_acquisition || '-'}</p><p>{c.current_tools || '-'}</p><p>{c.daily_volume || '-'}</p><p>{c.time_wasters || '-'}</p><p>{c.recurring_problems || '-'}</p><p>{c.one_thing_to_fix || '-'}</p><p>{c.automation_goals || '-'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a className="inline-flex" target="_blank" rel="noreferrer" href={`https://wa.me/${(c.whatsapp || '').replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(c.full_name)}%2C%20thanks%20for%20reaching%20out%20to%20TwentyFour`}><Button variant="outline">Reply on WhatsApp</Button></a>
                    <Button variant="outline" onClick={async () => { const { data: newProfile } = await supabase.from('profiles').insert({ full_name: c.full_name, email: c.email, phone: c.phone, business_name: c.business_name, role: 'client' }).select('*').single(); if (newProfile) { const { data: newClient } = await supabase.from('clients').insert({ profile_id: newProfile.id, subscription_status: 'pending_approval' }).select('*').single(); await supabase.from('profiles').update({ client_id: newClient?.id }).eq('id', newProfile.id); setApproveTarget({ ...newProfile, client_id: newClient?.id, subscription_status: 'pending_approval', role: 'client' } as AdminClient); await supabase.from('contact_requests').update({ status: 'converted' }).eq('id', c.id); await load(); } }}>Convert to Client</Button>
                    <Button variant="outline" onClick={async () => { await supabase.from('contact_requests').update({ status: 'contacted' }).eq('id', c.id); await load(); }}>Mark Contacted</Button>
                    <Button variant="outline" onClick={async () => { await supabase.from('contact_requests').update({ status: 'closed' }).eq('id', c.id); await load(); }}>Mark Closed</Button>
                    <Button variant="destructive" onClick={async () => { await supabase.from('contact_requests').delete().eq('id', c.id); await load(); }}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Select value={appointmentClientFilter} onValueChange={(v) => setAppointmentClientFilter(v ?? 'all')}><SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger><SelectContent><SelectItem value="all">All clients</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name || c.full_name}</SelectItem>)}</SelectContent></Select>
            <Select value={appointmentStatusFilter} onValueChange={(v) => setAppointmentStatusFilter(v ?? 'all')}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>
            <Input type="date" value={appointmentFrom} onChange={(e) => setAppointmentFrom(e.target.value)} />
            <Input type="date" value={appointmentTo} onChange={(e) => setAppointmentTo(e.target.value)} />
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Customer Name</TableHead><TableHead>Phone</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {appointments.filter((a) => {
                  const owner = clientsById[a.user_id];
                  const okClient = appointmentClientFilter === 'all' || owner?.id === appointmentClientFilter;
                  const okStatus = appointmentStatusFilter === 'all' || a.status === appointmentStatusFilter;
                  const okFrom = !appointmentFrom || a.date >= appointmentFrom;
                  const okTo = !appointmentTo || a.date <= appointmentTo;
                  return okClient && okStatus && okFrom && okTo;
                }).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{clientsById[a.user_id]?.business_name || '-'}</TableCell><TableCell>{a.client_name}</TableCell><TableCell>{a.client_phone || '-'}</TableCell><TableCell>{a.service}</TableCell><TableCell>{a.date}</TableCell><TableCell>{a.time}</TableCell><TableCell><Badge>{a.status}</Badge></TableCell>
                    <TableCell><div className="flex gap-2"><Button variant="outline" size="sm" onClick={async () => { await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', a.id); await load(); }}>Cancel</Button><Button variant="destructive" size="sm" onClick={async () => { await supabase.from('appointments').delete().eq('id', a.id); await load(); }}>Delete</Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select value={scriptClientFilter} onValueChange={(v) => setScriptClientFilter(v ?? 'all')}><SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger><SelectContent><SelectItem value="all">All clients</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.client_id || c.id}>{c.business_name || c.full_name}</SelectItem>)}</SelectContent></Select>
            <Input placeholder="Filter by category" value={scriptCategoryFilter === 'all' ? '' : scriptCategoryFilter} onChange={(e) => setScriptCategoryFilter(e.target.value || 'all')} />
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Category</TableHead><TableHead>Question</TableHead><TableHead>Answer</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {scripts.filter((s) => (scriptClientFilter === 'all' || s.client_id === scriptClientFilter) && (scriptCategoryFilter === 'all' || s.category.toLowerCase().includes(scriptCategoryFilter.toLowerCase()))).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{clients.find((c) => c.client_id === s.client_id)?.business_name || '-'}</TableCell>
                    <TableCell>{s.category}</TableCell>
                    <TableCell>{s.question.length > 60 ? `${s.question.slice(0, 60)}...` : s.question}</TableCell>
                    <TableCell>{s.answer.length > 80 ? `${s.answer.slice(0, 80)}...` : s.answer}</TableCell>
                    <TableCell><Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setScriptEdit(s)}>Edit</Button><Switch checked={s.is_active} onCheckedChange={async (v) => { await supabase.from('qa_scripts').update({ is_active: v }).eq('id', s.id); await load(); }} /><Button variant="destructive" size="sm" onClick={async () => { await supabase.from('qa_scripts').delete().eq('id', s.id); await load(); }}>Delete</Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card><CardHeader><CardTitle>Total Clients</CardTitle></CardHeader><CardContent>{clients.length} <p className="text-xs text-muted-foreground">Active {clients.filter((x) => x.subscription_status === 'active').length} / Trial {clients.filter((x) => x.subscription_status === 'trial').length} / Paused {clients.filter((x) => x.subscription_status === 'paused').length} / Rejected {clients.filter((x) => x.subscription_status === 'rejected').length}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader><CardContent>{monthlyRevenue.toLocaleString()} EGP</CardContent></Card>
            <Card><CardHeader><CardTitle>New Leads This Month</CardTitle></CardHeader><CardContent>{contacts.filter((c) => c.created_at >= monthStart).length}</CardContent></Card>
            <Card><CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader><CardContent>{pending.length}</CardContent></Card>
            <Card><CardHeader><CardTitle>Conversion Rate</CardTitle></CardHeader><CardContent>{conversionRate.toFixed(1)}%</CardContent></Card>
            <Card><CardHeader><CardTitle>Total Appointments Today</CardTitle></CardHeader><CardContent>{appointmentsToday}</CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2">{activity.map((a) => <div key={a.id} className="text-sm text-muted-foreground">{new Date(a.date).toLocaleString()} - {a.text}</div>)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(approveTarget)} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Approve {approveTarget?.business_name || approveTarget?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Service Type</Label><div className="grid grid-cols-1 gap-2 md:grid-cols-2">{(Object.keys(SERVICE_LABELS) as Exclude<ServiceType, null>[]).map((k) => <Button key={k} type="button" variant={approvalForm.service_type === k ? 'default' : 'outline'} onClick={() => setApprovalForm((p) => ({ ...p, service_type: k, service_label: SERVICE_LABELS[k], features: SERVICE_DEFAULTS[k] }))}>{SERVICE_LABELS[k]}</Button>)}</div></div>
            <div className="space-y-2"><Label>Service Display Label</Label><Input value={approvalForm.service_label} onChange={(e) => setApprovalForm((p) => ({ ...p, service_label: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Dashboard Sections</Label><div className="grid grid-cols-1 gap-2 md:grid-cols-2">{FEATURES.map((f) => <div className="flex items-center justify-between rounded-lg border p-3" key={f}><span className="capitalize">{f === 'whatsapp' ? 'Messages (WhatsApp inbox)' : f === 'scripts' ? 'Scripts (Q&A library)' : f === 'reports' ? 'Reports & Analytics' : f.charAt(0).toUpperCase() + f.slice(1)}</span><Switch checked={approvalForm.features.includes(f)} onCheckedChange={(v) => setApprovalForm((p) => ({ ...p, features: v ? Array.from(new Set([...p.features, f])) : p.features.filter((x) => x !== f) }))} /></div>)}</div></div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Monthly Price</Label><Input type="number" value={approvalForm.monthly_price} onChange={(e) => setApprovalForm((p) => ({ ...p, monthly_price: e.target.value }))} /></div><div className="space-y-2"><Label>Plan</Label><Select value={approvalForm.plan} onValueChange={(v) => setApprovalForm((p) => ({ ...p, plan: (v ?? 'Starter') as PlanType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Starter">Starter</SelectItem><SelectItem value="Growth">Growth</SelectItem><SelectItem value="Scale">Scale</SelectItem><SelectItem value="Custom">Custom</SelectItem></SelectContent></Select></div></div>
            <div className="space-y-2"><Label>Internal Notes</Label><Textarea value={approvalForm.notes} onChange={(e) => setApprovalForm((p) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button><Button onClick={approve}>Approve & Activate</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(declineTarget)} onOpenChange={(o) => !o && setDeclineTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Decline {declineTarget?.business_name || declineTarget?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Rejection reason</Label><Textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setDeclineTarget(null)}>Cancel</Button><Button variant="destructive" onClick={decline}>Decline</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editClient)} onOpenChange={(o) => !o && setEditClient(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit {editClient?.business_name || editClient?.full_name}</DialogTitle></DialogHeader>
          {editClient && <div className="space-y-3"><Input value={editClient.business_name || ''} onChange={(e) => setEditClient({ ...editClient, business_name: e.target.value })} /><Input value={editClient.full_name} onChange={(e) => setEditClient({ ...editClient, full_name: e.target.value })} /><Input value={editClient.phone || ''} onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })} /><DialogFooter><Button variant="outline" onClick={() => setEditClient(null)}>Cancel</Button><Button onClick={async () => { await supabase.from('profiles').update({ full_name: editClient.full_name, business_name: editClient.business_name, phone: editClient.phone }).eq('id', editClient.id); await supabase.from('clients').upsert({ id: editClient.client_id, profile_id: editClient.id, service_type: editClient.service_type, service_label: editClient.service_label, plan: editClient.plan, monthly_price: editClient.monthly_price, notes: editClient.notes, features: editClient.features }, { onConflict: 'id' }); setEditClient(null); await load(); }}>Save</Button></DialogFooter></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(featureTarget)} onOpenChange={(o) => !o && setFeatureTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Manage Features</DialogTitle></DialogHeader>
          {featureTarget && <div className="space-y-3">{FEATURES.map((f) => <div key={f} className="flex items-center justify-between rounded-lg border p-3"><span className="capitalize">{f}</span><Switch checked={(featureTarget.features || []).includes(f)} onCheckedChange={(v) => setFeatureTarget({ ...featureTarget, features: v ? Array.from(new Set([...(featureTarget.features || []), f])) : (featureTarget.features || []).filter((x) => x !== f) })} /></div>)}<DialogFooter><Button variant="outline" onClick={() => setFeatureTarget(null)}>Cancel</Button><Button onClick={async () => { await supabase.from('clients').upsert({ id: featureTarget.client_id, profile_id: featureTarget.id, features: featureTarget.features || [] }, { onConflict: 'id' }); setFeatureTarget(null); await load(); }}>Save</Button></DialogFooter></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete {deleteTarget?.business_name || deleteTarget?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Type business name to confirm</Label><Input value={deleteName} onChange={(e) => setDeleteName(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" disabled={deleteName.trim() !== (deleteTarget?.business_name || '').trim()} onClick={async () => { if (!deleteTarget) return; await supabase.from('profiles').delete().eq('id', deleteTarget.id); setDeleteTarget(null); await load(); }}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(scriptEdit)} onOpenChange={(o) => !o && setScriptEdit(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Script</DialogTitle></DialogHeader>
          {scriptEdit && <div className="space-y-3"><Input value={scriptEdit.category} onChange={(e) => setScriptEdit({ ...scriptEdit, category: e.target.value })} /><Textarea value={scriptEdit.question} onChange={(e) => setScriptEdit({ ...scriptEdit, question: e.target.value })} /><Textarea value={scriptEdit.answer} onChange={(e) => setScriptEdit({ ...scriptEdit, answer: e.target.value })} /><DialogFooter><Button variant="outline" onClick={() => setScriptEdit(null)}>Cancel</Button><Button onClick={async () => { await supabase.from('qa_scripts').update({ category: scriptEdit.category, question: scriptEdit.question, answer: scriptEdit.answer }).eq('id', scriptEdit.id); setScriptEdit(null); await load(); }}>Save</Button></DialogFooter></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
