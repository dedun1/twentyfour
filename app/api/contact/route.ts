import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      full_name, email, phone, whatsapp, whatsapp_number,
      business_name, business_type, city, team_size, years_in_business,
      daily_operations, client_acquisition, current_tools, daily_volume,
      time_wasters, recurring_problems, one_thing_to_fix,
      automation_goals, timeline, source,
    } = body;

    const resolvedPhone = phone || whatsapp || whatsapp_number;

    if (!full_name || !resolvedPhone) {
      return NextResponse.json({ error: 'Name and best phone number (messaging field) are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('contact_requests').insert({
      full_name,
      email: email || null,
      phone: resolvedPhone,
      business_name: business_name || null,
      business_type: business_type || null,
      city: city || null,
      team_size: team_size || null,
      years_in_business: years_in_business || null,
      daily_operations: daily_operations || null,
      client_acquisition: client_acquisition || null,
      current_tools: current_tools || null,
      daily_volume: daily_volume || null,
      time_wasters: time_wasters || null,
      recurring_problems: recurring_problems || null,
      one_thing_to_fix: one_thing_to_fix || null,
      automation_goals: automation_goals || null,
      timeline: timeline || null,
      source: source || 'contact_form',
    });

    if (error) {
      console.error('Contact insert error:', error);
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
