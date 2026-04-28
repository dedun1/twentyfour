import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError, requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

type DemoteBody = {
  profileId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const supabaseAdmin = createAdminClient();
    const body = (await req.json()) as DemoteBody;
    const profileId = (body.profileId || '').trim();

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    if (profileId === admin.profileId) {
      return NextResponse.json({ error: 'You cannot demote yourself. Ask another admin to do this.' }, { status: 400 });
    }

    const { count: adminCount, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }
    if ((adminCount || 0) <= 1) {
      return NextResponse.json({ error: 'Cannot demote the last admin. Promote another user first.' }, { status: 400 });
    }

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'client' })
      .eq('id', profileId)
      .select('id');
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: 'Profile not found - cannot demote' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Admin demoted to client' });
  } catch (err: unknown) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
