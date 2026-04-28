'use client';

import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Calendar, MessageSquare, FileText, BarChart2, Bell, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getAdminClientIds } from '@/lib/admin-filter';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { FeatureKey, SubscriptionStatus } from '@/lib/types';
import { EmptyState } from '@/app/admin/components/EmptyState';

type ClientControlRow = {
  id: string;
  business_name: string | null;
  contact_email: string | null;
  plan: string | null;
  subscription_status: SubscriptionStatus | null;
  features: FeatureKey[] | null;
};

type SidebarPreviewItem = {
  key: keyof ReturnType<typeof useT>['sidebar'];
  icon: typeof LayoutDashboard;
  feature?: FeatureKey;
  alwaysShow?: boolean;
};

const FEATURE_KEYS: FeatureKey[] = ['appointments', 'whatsapp', 'scripts', 'reports', 'reminders'];

const SIDEBAR_ITEMS: SidebarPreviewItem[] = [
  { key: 'dashboard', icon: LayoutDashboard, alwaysShow: true },
  { key: 'appointments', icon: Calendar, feature: 'appointments' },
  { key: 'whatsapp', icon: MessageSquare, feature: 'whatsapp' },
  { key: 'scripts', icon: FileText, feature: 'scripts' },
  { key: 'reports', icon: BarChart2, feature: 'reports' },
  { key: 'reminders', icon: Bell, feature: 'reminders' },
  { key: 'settings', icon: Settings, alwaysShow: true },
];

const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  active: 'bg-green-500/15 text-green-500',
  trial: 'bg-blue-500/15 text-blue-500',
  pending_approval: 'bg-amber-500/15 text-amber-500',
  paused: 'bg-yellow-500/15 text-yellow-500',
  rejected: 'bg-red-500/15 text-red-500',
  cancelled: 'bg-zinc-500/15 text-zinc-400',
};

function normalizeFeatures(features: FeatureKey[] | null | undefined): FeatureKey[] {
  if (!Array.isArray(features)) return [];
  return FEATURE_KEYS.filter((feature) => features.includes(feature));
}

export function DashboardControlTab() {
  const supabase = createClient();
  const { lang } = useLanguage();
  const t = useT(lang);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientControlRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [savedFeatures, setSavedFeatures] = useState<FeatureKey[]>([]);
  const [draftFeatures, setDraftFeatures] = useState<FeatureKey[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, adminClientIds] = await Promise.all([
      supabase
        .from('clients')
        .select('id, business_name, contact_email, plan, subscription_status, features')
        .order('business_name', { ascending: true }),
      getAdminClientIds(supabase),
    ]);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const nonAdminClients = ((data || []) as ClientControlRow[]).filter((client) => !adminClientIds.includes(client.id));
    setClients(nonAdminClients);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const name = (client.business_name || '').toLowerCase();
      const email = (client.contact_email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [clients, search]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const hasUnsavedChanges = useMemo(() => {
    const a = [...savedFeatures].sort().join('|');
    const b = [...draftFeatures].sort().join('|');
    return a !== b;
  }, [draftFeatures, savedFeatures]);

  const selectClient = (client: ClientControlRow) => {
    const normalized = normalizeFeatures(client.features);
    setSelectedClientId(client.id);
    setSavedFeatures(normalized);
    setDraftFeatures(normalized);
  };

  const toggleFeature = (feature: FeatureKey, checked: boolean) => {
    setDraftFeatures((current) => {
      if (checked) return Array.from(new Set([...current, feature]));
      return current.filter((item) => item !== feature);
    });
  };

  const handleReset = () => {
    setDraftFeatures(savedFeatures);
  };

  const handleSave = async () => {
    if (!selectedClientId || !hasUnsavedChanges) return;
    setSaving(true);
    const payload = normalizeFeatures(draftFeatures);
    const { error } = await supabase
      .from('clients')
      .update({ features: payload })
      .eq('id', selectedClientId);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Features updated');
    setSavedFeatures(payload);
    await load();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clients..."
          />

          <div className="max-h-[320px] space-y-2 overflow-auto rounded-lg border border-border p-2">
            {loading ? (
              <p className="p-3 text-sm text-muted-foreground">Loading...</p>
            ) : filteredClients.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No clients found.</p>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => selectClient(client)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    selectedClientId === client.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <p className="font-medium">{client.business_name || '-'}</p>
                  <p className="text-xs text-muted-foreground">{client.contact_email || '-'}</p>
                </button>
              ))
            )}
          </div>

          {selectedClient ? (
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div>
                <p className="text-base font-semibold">{selectedClient.business_name || '-'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{selectedClient.plan || '-'}</Badge>
                  <Badge className={STATUS_BADGE[selectedClient.subscription_status || 'pending_approval']}>
                    {selectedClient.subscription_status || 'pending_approval'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                {FEATURE_KEYS.map((feature) => (
                  <div key={feature} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="capitalize">{feature}</span>
                    <Switch
                      checked={draftFeatures.includes(feature)}
                      onCheckedChange={(checked) => toggleFeature(feature, checked)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={!hasUnsavedChanges || saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={!hasUnsavedChanges || saving}>
                  Reset
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedClient ? `Preview — what ${selectedClient.business_name || 'client'} will see` : 'Preview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedClient ? (
            <div className="rounded-xl border border-border p-4">
              <div className="w-56 rounded-lg border border-border bg-card p-2">
                <div className="mb-2 flex items-center gap-2 border-b border-border px-2 pb-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <LayoutDashboard className="size-4" />
                  </div>
                  <p className="text-sm font-semibold">TwentyFour</p>
                </div>
                <div className="space-y-1">
                  {SIDEBAR_ITEMS.map((item) => {
                    const enabled = item.alwaysShow || !item.feature || draftFeatures.includes(item.feature);
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between rounded-md px-2 py-2 hover:bg-accent ${enabled ? '' : 'opacity-30'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span className="text-sm">{t.sidebar[item.key]}</span>
                        </div>
                        {!enabled ? <Badge variant="outline">hidden</Badge> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={LayoutDashboard}
              title="No client selected"
              description="Pick a client on the left to preview and edit their sidebar visibility."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
