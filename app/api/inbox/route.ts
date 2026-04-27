import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, lang } = await request.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = lang === 'ar'
      ? 'أنت مساعد ذكي لمنصة TwentyFour لإدارة الأعمال. ساعد أصحاب الأعمال في إدارة مواعيدهم وعملائهم وأعمالهم. كن مختصراً ومفيداً وودوداً. أجب باللغة العربية دائماً.'
      : 'You are an AI assistant for TwentyFour business management platform. Help business owners manage their appointments, clients, and operations. Be concise, helpful, and friendly. Always respond in English.';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const content = response.content[0];
    const reply = content.type === 'text' ? content.text : '';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Inbox API error:', error);
    return NextResponse.json({ reply: '' }, { status: 500 });
  }
}
