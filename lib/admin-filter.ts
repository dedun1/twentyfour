import type { SupabaseClient } from '@supabase/supabase-js';

type MaybeRole = {
  role?: string | null;
};

// Mirrors existing All Clients exclusion logic: profiles query uses .neq('role', 'admin').
export function isAdminClient(client: MaybeRole) {
  return client.role === 'admin';
}

export async function getAdminClientIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('role', 'admin')
    .not('client_id', 'is', null);

  if (error) throw error;
  return Array.from(new Set((data || []).map((row) => row.client_id).filter((id): id is string => typeof id === 'string' && id.length > 0)));
}
