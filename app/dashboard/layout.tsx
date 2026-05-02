import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { SubscriptionGate } from '@/components/layout/SubscriptionGate';
import { DashboardNotifications } from '@/components/layout/DashboardNotifications';
import { ClientProvider } from '@/components/providers/ClientProvider';
import { BookCallButton } from '@/components/layout/BookCallButton';
import type { FeatureKey, SubscriptionStatus, UserRole } from '@/lib/types';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isAdmin =
    profile?.role === 'admin' ||
    user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const role: UserRole = (isAdmin ? 'admin' : (profile?.role as UserRole) || 'client');
  const clientId = (profile as { client_id?: string | null } | null)?.client_id ?? null;

  const { data: clientRecord } = clientId
    ? await supabase
      .from('clients')
      .select('features, subscription_status, service_label, owner_name, rejection_reason')
      .eq('id', clientId)
      .maybeSingle()
    : { data: null };

  const allFeatures: FeatureKey[] = ['appointments', 'whatsapp', 'scripts', 'reports', 'reminders'];
  const rawFeatures = clientRecord?.features as unknown;
  const features: FeatureKey[] = isAdmin
    ? allFeatures
    : (Array.isArray(rawFeatures) ? (rawFeatures as FeatureKey[]) : []);

  const subscriptionStatus: SubscriptionStatus = isAdmin
    ? 'active'
    : ((clientRecord?.subscription_status as SubscriptionStatus) ?? 'pending_approval');
  const isGated = !isAdmin && subscriptionStatus !== 'active' && subscriptionStatus !== 'trial';
  const serviceLabel = (clientRecord as { service_label?: string | null } | null)?.service_label ?? null;
  const ownerName = (clientRecord as { owner_name?: string | null } | null)?.owner_name ?? profile?.full_name ?? null;

  return (
    <ClientProvider
      clientId={clientId}
      role={role}
      ownerName={ownerName}
      serviceLabel={serviceLabel}
      features={features}
      subscriptionStatus={subscriptionStatus}
    >
      <div className="min-h-screen bg-background">
        <Sidebar
          userEmail={user.email}
          userName={profile?.full_name || user.user_metadata?.full_name}
          isAdmin={isAdmin}
          features={features}
          serviceLabel={serviceLabel}
          disableNavigation={isGated}
        />
        <main className="ml-16 min-h-screen">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <DashboardNotifications userId={user.id} />
            <SubscriptionGate rejectionReason={clientRecord?.rejection_reason ?? null}>
              {children}
            </SubscriptionGate>
          </div>
        </main>
        <BookCallButton />
      </div>
    </ClientProvider>
  );
}
