import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      business_name,
      preferred_date,
      preferred_time,
      notes,
      session_id,
    } = body;

    if (!full_name?.trim() || !phone?.trim() || !preferred_date || !preferred_time) {
      return NextResponse.json(
        { error: 'Name, phone, date, and time are required' },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const messageParts = [
      `Preferred date: ${preferred_date}`,
      `Preferred time: ${preferred_time}`,
      session_id ? `Consultation session: ${session_id}` : null,
      notes ? `Notes: ${notes}` : null,
    ].filter(Boolean);

    const bn = typeof business_name === 'string' ? business_name.trim() : '';
    if (bn) messageParts.push(`Business: ${bn}`);

    const emailTrim = typeof email === 'string' ? email.trim() : '';
    const safeEmail = emailTrim.length > 0 ? emailTrim : 'pending@twentyfour.local';

    const baseRow = {
      full_name: full_name.trim(),
      email: safeEmail,
      phone: phone.trim(),
      whatsapp: phone.trim(),
      message: messageParts.join('\n'),
      source: 'discovery_call',
    };

    let { error } = await supabase.from('contact_requests').insert({
      ...baseRow,
      business_name: bn || null,
      status: 'new',
    });

    if (error) {
      ({ error } = await supabase.from('contact_requests').insert(baseRow));
    }

    if (error) {
      console.error('Discovery call insert error:', error);
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discovery call API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
