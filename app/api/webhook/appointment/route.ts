import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ success: true, note: 'No webhook configured' });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('n8n webhook failed:', response.status);
      return NextResponse.json({ error: 'Webhook failed' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Appointment webhook error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
