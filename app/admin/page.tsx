'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users, UserPlus, Search, X, Check, ChevronRight, ExternalLink, Inbox, Clock, DollarSign, BarChart3, Pause, Play, Trash2, MessageCircle, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { AddClientModal } from '@/components/admin/AddClientModal';
import { ClientsDataTable } from '@/components/admin/ClientsDataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminClient, FeatureKey, SubscriptionStatus, ContactRequest, ContactRequestStatus } from '@/lib/types';

type Tab = 'pending' | 'clients' | 'contacts' | 'features' | 'stats';

const ALL_FEATURES: FeatureKey[] = ['appointments', 'whatsapp', 'scripts', 'reports', 'reminders'];
const STATUS_LIST: SubscriptionStatus[] = ['active', 'trial', 'pending_approval', 'paused', 'rejected', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  trial: '#3b82f6',
  pending_approval: '#f59e0b',
  paused: '#9ca3af',
  cancelled: '#ef4444',
};

const CONTACT_STATUS_COLORS: Record<ContactRequestStatus, string> = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  converted: '#22c55e',
  closed: '#9ca3af',
};

export default function AdminPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const ta = t.admin;
  const [tab, setTab] = useState<Tab>('pending');
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [drawerClient, setDrawerClient] = useState<AdminClient | null>(null);
  const [drawerForm, setDrawerForm] = useState<Partial<AdminClient>>({});
  const [saving, setSaving] = useState(false);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<AdminClient | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminClient | null>(null);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();

    const [{ data: profiles }, { data: clientsData }, { data: contactsData }] = await Promise.all([
      supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }),
      supabase.from('clients').select('*'),
      supabase.from('contact_requests').select('*').order('created_at', { ascending: false }),
    ]);

    const merged: AdminClient[] = (profiles || []).map((p) => {
      const cr = (clientsData || []).find((c) => c.profile_id === p.id);
      return {
        ...p,
        features: cr?.features || [],
        subscription_status: cr?.subscription_status || 'pending_approval',
        owner_whatsapp: cr?.owner_whatsapp || '',
        setup_fee: cr?.setup_fee || 0,
      };
    });

    setClients(merged);
    setContactRequests((contactsData as ContactRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pendingClients = useMemo(
    () => clients.filter((c) => c.subscription_status === 'pending_approval' || c.subscription_status === 'trial'),
    [clients]
  );

  const newContactsCount = useMemo(
    () => contactRequests.filter((r) => !r.status || r.status === 'new').length,
    [contactRequests]
  );


  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.subscription_status === 'active').length,
    trial: clients.filter((c) => c.subscription_status === 'trial').length,
    pending: clients.filter((c) => c.subscription_status === 'pending_approval').length,
    paused: clients.filter((c) => c.subscription_status === 'paused').length,
    revenue: clients
      .filter((c) => c.subscription_status === 'active')
      .reduce((sum, c) => sum + (c.setup_fee || 0), 0),
    newLeads: contactRequests.filter((r) => {
      const d = new Date(r.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const handleSetStatus = async (id: string, status: SubscriptionStatus) => {
    const supabase = createClient();
    await supabase.from('clients').upsert({ profile_id: id, subscription_status: status }, { onConflict: 'profile_id' });
    toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated');
    load();
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const supabase = createClient();
    await supabase.from('clients').upsert({
      profile_id: rejectTarget.id,
      subscription_status: 'rejected',
      rejection_reason: rejectReason.trim() || null,
    }, { onConflict: 'profile_id' });
    toast.success(lang === 'ar' ? 'تم الرفض' : 'Rejected');
    setRejectOpen(false);
    setRejectReason('');
    setRejectTarget(null);
    load();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('profiles').delete().eq('id', id);
    toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
    load();
  };

  const openDrawer = (client: AdminClient) => {
    setDrawerClient(client);
    setDrawerForm({
      full_name: client.full_name,
      phone: client.phone,
      business_name: client.business_name,
      owner_whatsapp: client.owner_whatsapp,
      setup_fee: client.setup_fee,
      subscription_status: client.subscription_status || 'pending_approval',
      features: client.features || [],
    });
  };

  const toggleFeature = (feature: FeatureKey) => {
    setDrawerForm((prev) => {
      const current = prev.features || [];
      return {
        ...prev,
        features: current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature],
      };
    });
  };

  const handleSaveDrawer = async () => {
    if (!drawerClient) return;
    setSaving(true);
    const supabase = createClient();

    await supabase.from('profiles').update({
      full_name: drawerForm.full_name,
      phone: drawerForm.phone,
      business_name: drawerForm.business_name,
    }).eq('id', drawerClient.id);

    await supabase.from('clients').upsert({
      profile_id: drawerClient.id,
      features: drawerForm.features,
      subscription_status: drawerForm.subscription_status,
      owner_whatsapp: drawerForm.owner_whatsapp,
      setup_fee: drawerForm.setup_fee,
    }, { onConflict: 'profile_id' });

    toast.success(lang === 'ar' ? 'تم الحفظ' : 'Saved');
    setSaving(false);
    setDrawerClient(null);
    load();
  };

  const handleAddClient = async (data: { full_name: string; email: string; phone?: string; business_name?: string; password: string }) => {
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) { toast.error(result.error); return; }
    toast.success(lang === 'ar' ? 'تم إضافة العميل' : 'Client added');
    setShowModal(false);
    load();
  };

  const updateContactStatus = async (id: string, status: ContactRequestStatus) => {
    const supabase = createClient();
    await supabase.from('contact_requests').update({ status }).eq('id', id);
    toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated');
    load();
  };

  const deleteContact = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) return;
    const supabase = createClient();
    await supabase.from('contact_requests').delete().eq('id', id);
    toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
    load();
  };

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    {
      id: 'pending',
      label: lang === 'ar' ? 'الموافقات' : 'Pending',
      icon: AlertCircle,
      badge: pendingClients.length || undefined,
    },
    { id: 'clients', label: lang === 'ar' ? 'كل العملاء' : 'All Clients', icon: Users },
    {
      id: 'contacts',
      label: lang === 'ar' ? 'طلبات التواصل' : 'Contact Requests',
      icon: Inbox,
      badge: newContactsCount || undefined,
    },
    { id: 'features', label: lang === 'ar' ? 'الميزات' : 'Manage Features', icon: ChevronRight },
    { id: 'stats', label: lang === 'ar' ? 'الإحصائيات' : 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ta.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'إدارة العملاء والطلبات' : 'Manage clients and requests'}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <UserPlus />
          {ta.addClient}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex flex-wrap">
          {tabs.map(({ id, label, badge }) => (
            <TabsTrigger key={id} value={id} className="gap-2">
              {label}
              {badge !== undefined && (
                <Badge className="ms-1 bg-red-500/15 text-red-500">
                  {badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* TAB 1: Pending Approvals */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-16"><span className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : pendingClients.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Check size={40} className="mx-auto mb-3" style={{ color: '#22c55e', opacity: 0.7 }} />
              <p style={{ color: 'var(--muted-fg)' }}>
                {lang === 'ar' ? 'لا توجد موافقات معلقة' : 'No pending approvals'}
              </p>
            </div>
          ) : (
            pendingClients.map((c) => (
              <div key={c.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                      {c.business_name || c.full_name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>{c.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }} dir="ltr">{c.phone || '-'}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
                      {new Date(c.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handleSetStatus(c.id, 'active')}>
                      {lang === 'ar' ? 'موافقة' : 'Approve'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setRejectTarget(c); setRejectOpen(true); }}>
                      {lang === 'ar' ? 'رفض' : 'Decline'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openDrawer(c)}>
                      {lang === 'ar' ? 'التفاصيل' : 'View Details'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setDeleteTarget(c); setDeleteOpen(true); }}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: All Clients */}
      {tab === 'clients' && (
        <ClientsDataTable
          data={clients}
          loading={loading}
          onEdit={openDrawer}
          onDelete={(id) => {
            const target = clients.find((c) => c.id === id) ?? null;
            setDeleteTarget(target);
            setDeleteOpen(true);
          }}
          onSetStatus={handleSetStatus}
        />
      )}

      {/* TAB 3: Contact Requests */}
      {tab === 'contacts' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-16"><span className="spinner" style={{ width: 32, height: 32 }} /></div>
          ) : contactRequests.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Inbox size={40} className="mx-auto mb-3" style={{ color: 'var(--muted-fg)', opacity: 0.4 }} />
              <p style={{ color: 'var(--muted-fg)' }}>
                {lang === 'ar' ? 'لا توجد طلبات' : 'No contact requests'}
              </p>
            </div>
          ) : (
            contactRequests.map((req) => {
              const isExpanded = expandedContact === req.id;
              const status = req.status || 'new';
              const waLink = req.whatsapp ? `https://wa.me/${req.whatsapp.replace(/\D/g, '').replace(/^0/, '20')}` : null;
              return (
                <div key={req.id} className="glass-card p-4">
                  <div
                    className="flex items-start justify-between gap-4 cursor-pointer"
                    onClick={() => setExpandedContact(isExpanded ? null : req.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{req.full_name}</p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${CONTACT_STATUS_COLORS[status]}18`, color: CONTACT_STATUS_COLORS[status] }}
                        >
                          {status}
                        </span>
                        {req.business_name && (
                          <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>{req.business_name}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--muted-fg)' }}>
                        {req.business_type && <span>{req.business_type}</span>}
                        {req.city && <span>{req.city}</span>}
                        {req.team_size && <span>{req.team_size}</span>}
                      </div>
                    </div>
                    <p className="text-xs shrink-0" style={{ color: 'var(--muted-fg)' }}>
                      {new Date(req.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 space-y-3 text-xs" style={{ borderTop: '1px solid rgba(31,41,55,0.5)' }}>
                      {req.email && <p><span style={{ color: 'var(--muted-fg)' }}>Email:</span> {req.email}</p>}
                      {req.whatsapp && <p><span style={{ color: 'var(--muted-fg)' }}>WhatsApp:</span> <span dir="ltr">{req.whatsapp}</span></p>}
                      {req.years_in_business && <p><span style={{ color: 'var(--muted-fg)' }}>Years:</span> {req.years_in_business}</p>}
                      {req.daily_volume && <p><span style={{ color: 'var(--muted-fg)' }}>Daily volume:</span> {req.daily_volume}</p>}
                      {req.daily_operations && <p className="leading-relaxed"><span style={{ color: 'var(--muted-fg)' }}>Daily ops:</span> {req.daily_operations}</p>}
                      {req.client_acquisition && <p className="leading-relaxed"><span style={{ color: 'var(--muted-fg)' }}>Acquisition:</span> {req.client_acquisition}</p>}
                      {req.current_tools && <p className="leading-relaxed"><span style={{ color: 'var(--muted-fg)' }}>Tools:</span> {req.current_tools}</p>}
                      {req.time_wasters && <p className="leading-relaxed"><span style={{ color: 'var(--muted-fg)' }}>Time wasters:</span> {req.time_wasters}</p>}
                      {req.recurring_problems && <p className="leading-relaxed"><span style={{ color: 'var(--muted-fg)' }}>Problems:</span> {req.recurring_problems}</p>}
                      {req.one_thing_to_fix && <p className="leading-relaxed"><span style={{ color: 'var(--muted-fg)' }}>One fix:</span> {req.one_thing_to_fix}</p>}
                      {req.automation_goals && <p className="leading-relaxed"><span style={{ color: 'var(--muted-fg)' }}>Goals:</span> {req.automation_goals}</p>}
                      {req.timeline && <p><span style={{ color: 'var(--muted-fg)' }}>Timeline:</span> {req.timeline}</p>}

                      <div className="flex flex-wrap gap-2 pt-3">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                          >
                            <MessageCircle size={12} />
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => updateContactStatus(req.id, 'contacted')}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                        >
                          {lang === 'ar' ? 'تم التواصل' : 'Mark Contacted'}
                        </button>
                        <button
                          onClick={() => updateContactStatus(req.id, 'converted')}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                        >
                          {lang === 'ar' ? 'حوّل لعميل' : 'Convert'}
                        </button>
                        <button
                          onClick={() => updateContactStatus(req.id, 'closed')}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: 'rgba(31,41,55,0.5)', color: 'var(--muted-fg)' }}
                        >
                          {lang === 'ar' ? 'إغلاق' : 'Close'}
                        </button>
                        <button
                          onClick={() => deleteContact(req.id)}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: Manage Client Features */}
      {tab === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {lang === 'ar' ? 'إدارة ميزات العملاء' : 'Manage client features'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10"><span className="spinner size-8" /></div>
            ) : clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">{ta.noClients}</p>
            ) : (
              <div className="space-y-3">
                {clients.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{c.business_name || c.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openDrawer(c)}>
                        {lang === 'ar' ? 'عرض' : 'View Details'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ALL_FEATURES.map((feature) => {
                        const enabled = (c.features || []).includes(feature);
                        return (
                          <div key={feature} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <span className="text-sm font-medium">{ta.features[feature]}</span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={async (val) => {
                                const supabase = createClient();
                                const next = val
                                  ? Array.from(new Set([...(c.features || []), feature]))
                                  : (c.features || []).filter((f) => f !== feature);
                                setClients((prev) => prev.map((x) => x.id === c.id ? { ...x, features: next } : x));
                                await supabase.from('clients').upsert({ profile_id: c.id, features: next }, { onConflict: 'profile_id' });
                                toast.success(lang === 'ar' ? 'تم الحفظ' : 'Saved');
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: System Stats */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: lang === 'ar' ? 'إجمالي العملاء' : 'Total Clients', value: stats.total, icon: Users },
            { label: lang === 'ar' ? 'العملاء النشطين' : 'Active Clients', value: stats.active, icon: Check },
            { label: lang === 'ar' ? 'موافقات معلقة' : 'Pending Approvals', value: stats.pending, icon: Clock },
            { label: lang === 'ar' ? 'موقفين' : 'Paused', value: stats.paused, icon: Pause },
            { label: lang === 'ar' ? 'إيراد الشهر' : 'Revenue this month', value: `${stats.revenue} EGP`, icon: DollarSign },
            { label: lang === 'ar' ? 'طلبات جديدة' : 'New Leads (month)', value: stats.newLeads, icon: Inbox },
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

      {/* Add Client Modal */}
      {showModal && (
        <AddClientModal onClose={() => setShowModal(false)} onSave={handleAddClient} />
      )}

      {/* Client Detail Drawer */}
      {drawerClient && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerClient(null)} />
          <div className="drawer">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{ta.clientDetails}</h2>
              <button onClick={() => setDrawerClient(null)} style={{ color: 'var(--muted-fg)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-fg)' }}>{ta.clientName}</label>
                <input
                  value={drawerForm.full_name || ''}
                  onChange={(e) => setDrawerForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-fg)' }}>{ta.businessName}</label>
                <input
                  value={drawerForm.business_name || ''}
                  onChange={(e) => setDrawerForm((p) => ({ ...p, business_name: e.target.value }))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-fg)' }}>{ta.ownerWhatsapp}</label>
                <input
                  value={drawerForm.owner_whatsapp || ''}
                  onChange={(e) => setDrawerForm((p) => ({ ...p, owner_whatsapp: e.target.value }))}
                  className="input-base"
                  placeholder="201xxxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-fg)' }}>{ta.subscriptionStatusLabel}</label>
                <select
                  value={drawerForm.subscription_status || 'pending_approval'}
                  onChange={(e) => setDrawerForm((p) => ({ ...p, subscription_status: e.target.value as SubscriptionStatus }))}
                  className="input-base"
                  style={{ background: '#1f2937' }}
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>{ta.subscriptionStatus[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-fg)' }}>{ta.setupFee}</label>
                <input
                  type="number"
                  value={drawerForm.setup_fee || ''}
                  onChange={(e) => setDrawerForm((p) => ({ ...p, setup_fee: Number(e.target.value) }))}
                  className="input-base"
                  dir="ltr"
                />
              </div>

              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-fg)' }}>{ta.features.title}</p>
                <div className="space-y-2">
                  {ALL_FEATURES.map((feature) => {
                    const active = (drawerForm.features || []).includes(feature);
                    return (
                      <button
                        key={feature}
                        onClick={() => toggleFeature(feature)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                        style={{
                          background: active ? 'rgba(240,165,0,0.1)' : 'rgba(31,41,55,0.5)',
                          border: `1px solid ${active ? 'rgba(240,165,0,0.3)' : 'transparent'}`,
                        }}
                      >
                        <span className="text-sm" style={{ color: active ? 'var(--primary)' : 'var(--muted-fg)' }}>
                          {ta.features[feature]}
                        </span>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: active ? 'var(--primary)' : 'rgba(31,41,55,0.8)' }}
                        >
                          {active && <Check size={12} className="text-[#0a0f1e]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleSaveDrawer} disabled={saving} className="btn-gold w-full justify-center">
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Check size={16} />}
                {ta.saveChanges}
              </button>
            </div>
          </div>
        </>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === 'ar' ? 'سبب الرفض' : 'Rejection reason'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject_reason">{lang === 'ar' ? 'السبب (اختياري)' : 'Reason (optional)'}</Label>
            <Input id="reject_reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectOpen(false); setRejectReason(''); setRejectTarget(null); }}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              {lang === 'ar' ? 'رفض' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{lang === 'ar' ? 'تأكيد الحذف' : 'Confirm delete'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'سيتم حذف العميل وملفه الشخصي نهائياً.'
              : 'This will permanently delete the client and their profile.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                await handleDelete(deleteTarget.id);
                setDeleteOpen(false);
                setDeleteTarget(null);
              }}
            >
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
