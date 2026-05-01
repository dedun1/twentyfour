import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { clearSessionCookie, getSessionIdFromCookie } from '@/lib/onboarding-session';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null || !('sessionId' in body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const sessionId = (body as { sessionId?: unknown }).sessionId;
    if (typeof sessionId !== 'string' || !sessionId.trim()) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const cookieSessionId = await getSessionIdFromCookie();
    if (!cookieSessionId || cookieSessionId !== sessionId) {
      return NextResponse.json({ error: 'Session mismatch' }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createAdminClient();

    const { data: sessionRow, error: sessionError } = await supabaseAdmin
      .from('onboarding_sessions')
      .select('id, business_summary')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
    if (!sessionRow) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, client_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    if (!profileRow) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Prefer profiles.client_id (what dashboard layout uses), but fall back to matching clients.profile_id.
    let clientId: string | null = (profileRow.client_id as string | null) ?? null;
    if (!clientId) {
      const { data: clientRow } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('profile_id', profileRow.id)
        .maybeSingle();
      clientId = clientRow?.id ?? null;
    }

    const { error: updateSessionError } = await supabaseAdmin
      .from('onboarding_sessions')
      .update({
        user_id: user.id,
        client_id: clientId,
        is_anonymous: false,
      })
      .eq('id', sessionId);

    if (updateSessionError) return NextResponse.json({ error: 'Failed to link session' }, { status: 500 });

    if (clientId) {
      // Existing admin UI maps "internal_notes" from `clients.notes`.
      const { error: updateClientError } = await supabaseAdmin
        .from('clients')
        .update({ notes: sessionRow.business_summary ?? null })
        .eq('id', clientId);

      if (updateClientError) {
        // Linking is still successful; don't block the user on an optional context update.
        // eslint-disable-next-line no-console
        console.error('Failed to update client notes:', updateClientError);
      }
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

