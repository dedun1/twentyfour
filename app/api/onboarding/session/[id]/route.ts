import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookieHasSessionId, removeSessionIdFromCookie } from '@/lib/onboarding-session';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    if (!sessionId) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
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

    // Authorization:
    // - If session has a user_id, requester must be that user.
    // - If session is anonymous, cookie array must contain the session id.
    if (row.user_id) {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (row.user_id !== user.id) {
        const { data: roleRow } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (roleRow?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      const allowed = await cookieHasSessionId(sessionId);
      if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete via service role (works for both auth and anon paths).
    const { error: adminDeleteError } = await admin.from('onboarding_sessions').delete().eq('id', sessionId);
    if (adminDeleteError) {
      console.log('Supabase delete error:', adminDeleteError);
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }

    // For anonymous sessions, also remove from the cookie so the history list updates.
    if (!row.user_id) {
      await removeSessionIdFromCookie(sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.log('Delete route exception:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
