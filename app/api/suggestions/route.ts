import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { businessData, lang } = await request.json();

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const isArabic = lang === 'ar';

    const prompt = isArabic
      ? `بناءً على معلومات هذا العمل، قدم 4 توصيات محددة وعملية لصاحب العمل لتحسين عمله باستخدام ميزات TwentyFour (إدارة المواعيد، السكريبتات الذكية، التذكيرات، التقارير، المساعد الذكي).

معلومات العمل:
- اسم العمل: ${businessData.businessName}
- نوع العمل: ${businessData.businessType}
- الخدمات: ${businessData.services}
- الجمهور المستهدف: ${businessData.targetAudience}
- الأهداف: ${businessData.goals}
- التحديات: ${businessData.challenges}
- حجم الفريق: ${businessData.teamSize}

أرجع فقط مصفوفة JSON صالحة بهذا الشكل بدون أي نص إضافي:
[
  {
    "id": "1",
    "title": "العنوان بالعربية",
    "description": "الوصف بالعربية (جملتان)",
    "category": "الفئة",
    "icon": "Calendar"
  }
]
الأيقونات المتاحة: Calendar, FileText, Bell, BarChart2, MessageSquare, Star, Zap, Target`
      : `Based on this business information, provide 4 specific, actionable recommendations for the business owner to improve their operations using TwentyFour features (appointment management, AI scripts, reminders, reports, AI assistant).

Business Info:
- Business Name: ${businessData.businessName}
- Business Type: ${businessData.businessType}
- Services: ${businessData.services}
- Target Audience: ${businessData.targetAudience}
- Goals: ${businessData.goals}
- Challenges: ${businessData.challenges}
- Team Size: ${businessData.teamSize}

Return ONLY a valid JSON array with no extra text:
[
  {
    "id": "1",
    "title": "Title in English",
    "description": "Description in English (2 sentences)",
    "category": "Category",
    "icon": "Calendar"
  }
]
Available icons: Calendar, FileText, Bell, BarChart2, MessageSquare, Star, Zap, Target`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ suggestions: [] });
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
