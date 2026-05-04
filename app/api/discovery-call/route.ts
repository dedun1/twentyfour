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

    const messageText = messageParts.join('\n');
    const cleanedEmail = email?.trim() || null;
    const emailForInsert = cleanedEmail || 'pending@twentyfour.local';
    const cleanedBusinessName = business_name?.trim() || null;

    const fullPayload: Record<string, unknown> = {
      full_name: full_name.trim(),
      email: emailForInsert,
      phone: phone.trim(),
      whatsapp: phone.trim(),
      business_name: cleanedBusinessName,
      message: messageText,
      source: 'discovery_call',
      status: 'new',
    };

    let { error } = await supabase.from('contact_requests').insert(fullPayload);

    if (error) {
      console.error('Discovery call insert error (attempt 1):', JSON.stringify(error, null, 2));

      const fallback1: Record<string, unknown> = {
        full_name: full_name.trim(),
        email: emailForInsert,
        phone: phone.trim(),
        whatsapp: phone.trim(),
        business_name: cleanedBusinessName,
        message: messageText,
        source: 'discovery_call',
      };
      const result2 = await supabase.from('contact_requests').insert(fallback1);

      if (result2.error) {
        console.error('Discovery call insert error (attempt 2):', JSON.stringify(result2.error, null, 2));

        const fallback2: Record<string, unknown> = {
          full_name: full_name.trim(),
          whatsapp: phone.trim(),
          phone: phone.trim(),
          email: emailForInsert,
          message: `[Discovery Call Request]\n${messageText}\nBusiness: ${cleanedBusinessName ?? 'n/a'}`,
        };
        const result3 = await supabase.from('contact_requests').insert(fallback2);

        if (result3.error) {
          console.error('Discovery call insert error (attempt 3, minimal):', JSON.stringify(result3.error, null, 2));
          const msg =
            result3.error && typeof result3.error === 'object' && 'message' in result3.error
              ? String((result3.error as { message: string }).message)
              : 'Unknown error';
          return NextResponse.json({ error: 'Failed to save request', details: msg }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discovery call API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
