'use client';

import { createContext, useContext } from 'react';
import type { FeatureKey, SubscriptionStatus, UserRole } from '@/lib/types';

interface ClientContextValue {
  clientId?: string | null;
  role?: UserRole;
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
  return (
    <ClientContext.Provider value={{ clientId, role, ownerName, serviceLabel, features, subscriptionStatus }}>
      {children}
    </ClientContext.Provider>
  );
}
