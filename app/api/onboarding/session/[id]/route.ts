import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    console.log('Delete route hit, id:', sessionId);

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    console.log('Auth user:', user?.id);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!sessionId) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });

    const admin = createAdminClient();
    const { data: row, error: lookupError } = await admin
      .from('onboarding_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .maybeSingle();

    if (lookupError) {
      console.log('Supabase lookup error:', lookupError);
      return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
    if (!row) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (row.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // User-scoped delete: works with RLS policy "users_own_sessions_delete" and user JWT.
    console.log('Attempting delete of session:', sessionId, 'for user:', user.id);
    const { error: deleteError } = await supabase
      .from('onboarding_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.log('Supabase delete error:', deleteError);
      // Fallback: service role (bypasses RLS) when user delete is blocked (e.g. policy not migrated yet).
      const { error: adminDeleteError } = await admin.from('onboarding_sessions').delete().eq('id', sessionId);
      if (adminDeleteError) {
        console.log('Supabase delete error (admin fallback):', adminDeleteError);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.log('Delete route exception:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

