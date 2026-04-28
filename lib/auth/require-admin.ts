import { createClient } from '@/lib/supabase/server';

export class AdminAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AdminAuthContext = {
  userId: string;
  profileId: string;
  email: string | null;
};

export async function requireAdmin(): Promise<AdminAuthContext> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;

  if (authError || !user) {
    throw new AdminAuthError(401, 'Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new AdminAuthError(403, 'Forbidden');
  }

  if (profile.role !== 'admin') {
    throw new AdminAuthError(403, 'Forbidden');
  }

  return {
    userId: user.id,
    profileId: profile.id,
    email: profile.email ?? user.email ?? null,
  };
}
