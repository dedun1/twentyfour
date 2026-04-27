import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { answers } = await request.json();

    const answersText = Object.entries(answers as Record<string, string>)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `أنت مستشار أعمال خبير متخصص في الأعمال المصرية الصغيرة والمتوسطة. بناءً على المعلومات التالية عن العمل، حدد أهم الفرص لتطوير العمل وزيادة الإيرادات.

معلومات العمل:
${answersText}

أجب بـ JSON فقط بهذا الشكل بالضبط (لا تضف أي نص قبله أو بعده):
{
  "summary": "ملخص قصير عن العمل وأهم نقاط التحسين (2-3 جمل)",
  "opportunities": [
    {
      "id": "1",
      "title": "عنوان الفرصة",
      "description": "وصف مفصل للفرصة وكيفية تطبيقها",
      "impact": "high",
      "category": "تسويق"
    }
  ]
}

اكتب 8-10 فرص متنوعة. impact يجب أن يكون: high أو medium أو low. categories من: تسويق، مبيعات، عمليات، خدمة عملاء، تقنية، مالية`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed: { summary: string; opportunities: Array<{ id: string; title: string; description: string; impact: string; category: string }> };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const { data: savedResult } = await supabase
      .from('xray_results')
      .insert({
        user_id: user.id,
        opportunities: parsed.opportunities,
        summary: parsed.summary,
      })
      .select()
      .single();

    return NextResponse.json({ ...parsed, id: savedResult?.id });
  } catch (error) {
    console.error('X-Ray analysis error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
