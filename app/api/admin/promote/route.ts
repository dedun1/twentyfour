import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError, requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

type PromoteBody = {
  email?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const supabaseAdmin = createAdminClient();
    const body = (await req.json()) as PromoteBody;
    const email = (body.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, client_id, email')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'No user with that email has signed up yet. Ask them to register at /register first.' },
        { status: 404 }
      );
    }

    if (profile.role === 'admin') {
      return NextResponse.json({ error: 'This user is already an admin' }, { status: 409 });
    }

    const { data: updatedProfiles, error: roleError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', profile.id)
      .select('id, client_id');
    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }
    if (!updatedProfiles || updatedProfiles.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updatedProfile = updatedProfiles[0];
    let clientId: string | null = updatedProfile?.client_id ?? profile.client_id ?? null;
    let clientStatus: string | null = null;

    if (clientId) {
      const { data: clientById, error: clientByIdError } = await supabaseAdmin
        .from('clients')
        .select('id, subscription_status')
        .eq('id', clientId)
        .maybeSingle();
      if (clientByIdError) {
        return NextResponse.json({ error: clientByIdError.message }, { status: 500 });
      }
      if (clientById) {
        clientStatus = clientById.subscription_status ?? null;
      }
    }

    if (!clientId) {
      const { data: clientByProfile, error: clientByProfileError } = await supabaseAdmin
        .from('clients')
        .select('id, subscription_status')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (clientByProfileError) {
        return NextResponse.json({ error: clientByProfileError.message }, { status: 500 });
      }
      if (clientByProfile) {
        clientId = clientByProfile.id;
        clientStatus = clientByProfile.subscription_status ?? null;
      }
    }

    if (clientId) {
      const { data: linkedRows, error: linkUpdateError } = await supabaseAdmin
        .from('clients')
        .update({ profile_id: profile.id })
        .eq('id', clientId)
        .select('id');
      if (linkUpdateError) {
        console.error('[promote] clients.profile_id link update failed:', linkUpdateError);
        return NextResponse.json({ error: linkUpdateError.message }, { status: 500 });
      }
      if (!linkedRows || linkedRows.length === 0) {
        return NextResponse.json({ error: 'Linked client not found for promoted profile' }, { status: 500 });
      }
    }

    if (clientId && clientStatus === 'pending_approval') {
      const { error: statusError } = await supabaseAdmin
        .from('clients')
        .update({ subscription_status: 'active' })
        .eq('id', clientId);
      if (statusError) {
        return NextResponse.json({ error: statusError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      email,
      profileId: profile.id,
      clientId,
      message: 'User promoted to admin',
    });
  } catch (err: unknown) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
