import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin =
      profile?.role === 'admin' ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, phone, business_name } = body;

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: newUser, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, business_name, role: 'client' },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (newUser.user) {
      await adminSupabase.from('profiles').upsert({
        id: newUser.user.id,
        email,
        full_name,
        phone,
        business_name,
        role: 'client',
        onboarding_completed: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
