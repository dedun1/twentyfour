import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (!isAdmin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        userEmail={user.email}
        userName={profile?.full_name || user.user_metadata?.full_name}
        isAdmin={isAdmin}
      />
      <main className="ml-16 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
