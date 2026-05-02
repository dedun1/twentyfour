import { createClient } from '@/lib/supabase/server';

export type NavAuthState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  displayName: string | null;
  email: string | null;
};

/**
 * Server-side fetch of the current user's auth state for navbar rendering.
 * Returns sane defaults for anonymous users.
 */
export async function getNavAuthState(): Promise<NavAuthState> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      return { isAuthenticated: false, isAdmin: false, displayName: null, email: null };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin =
      profile?.role === 'admin' ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    const displayName =
      profile?.full_name?.trim() ||
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      null;

    return {
      isAuthenticated: true,
      isAdmin,
      displayName,
      email: user.email || null,
    };
  } catch {
    return { isAuthenticated: false, isAdmin: false, displayName: null, email: null };
  }
}
