'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { FeatureKey, SubscriptionStatus, UserRole } from '@/lib/types';

interface ClientContextValue {
  clientId?: string | null;
  role?: UserRole;
  userRole?: UserRole;
  ownerName?: string | null;
  serviceLabel?: string | null;
  features: FeatureKey[];
  subscriptionStatus: SubscriptionStatus;
}

const ClientContext = createContext<ClientContextValue>({
  clientId: null,
  role: 'client',
  ownerName: null,
  serviceLabel: null,
  features: [],
  subscriptionStatus: 'pending_approval',
});

export function useClient() {
  return useContext(ClientContext);
}

interface Props {
  clientId?: string | null;
  role?: UserRole;
  ownerName?: string | null;
  serviceLabel?: string | null;
  features: FeatureKey[];
  subscriptionStatus: SubscriptionStatus;
  children: React.ReactNode;
}

export function ClientProvider({
  clientId = null,
  role = 'client',
  ownerName = null,
  serviceLabel = null,
  features,
  subscriptionStatus,
  children,
}: Props) {
  const [state, setState] = useState<ClientContextValue>({
    clientId,
    role,
    userRole: role,
    ownerName,
    serviceLabel,
    features,
    subscriptionStatus,
  });

  useEffect(() => {
    const supabase = createClient();

    const loadFresh = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, client_id, full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      const resolvedRole = ((profile?.role as UserRole | undefined) ?? role);
      const resolvedClientId = (profile?.client_id as string | null | undefined) ?? clientId;

      let resolvedStatus: SubscriptionStatus = subscriptionStatus;
      let resolvedFeatures: FeatureKey[] = features;
      let resolvedServiceLabel: string | null | undefined = serviceLabel;

      if (resolvedClientId) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, subscription_status, features, name, service_label')
          .eq('id', resolvedClientId)
          .maybeSingle();

        resolvedStatus = ((client?.subscription_status as SubscriptionStatus | undefined) ?? subscriptionStatus);
        resolvedFeatures = (Array.isArray(client?.features) ? (client.features as FeatureKey[]) : features);
        resolvedServiceLabel = ((client as { service_label?: string | null } | null)?.service_label ?? serviceLabel);

        console.log('[ClientProvider] role:', profile?.role, 'status:', client?.subscription_status);
      } else {
        console.log('[ClientProvider] role:', profile?.role, 'status:', undefined);
      }

      setState({
        clientId: resolvedClientId ?? null,
        role: resolvedRole,
        userRole: resolvedRole,
        ownerName: (profile?.full_name as string | undefined) ?? ownerName,
        serviceLabel: resolvedServiceLabel ?? null,
        features: resolvedFeatures,
        subscriptionStatus: resolvedStatus,
      });
    };

    loadFresh();
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      loadFresh();
    });
    return () => {
      authSub.subscription.unsubscribe();
    };
  }, [clientId, features, ownerName, role, serviceLabel, subscriptionStatus]);

  const value = useMemo(
    () => state,
    [state]
  );

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}
