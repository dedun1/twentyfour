import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Session id required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("onboarding_sessions")
      .select("captured_email, captured_phone, captured_business_name, detected_industry, captured_facts")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Prefill fetch error:", error);
      return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: true, prefill: {} });
    }

    const facts = (data.captured_facts ?? {}) as Record<string, unknown>;
    const pickString = (v: unknown): string | null =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

    const prefill = {
      email: pickString(data.captured_email),
      phone: pickString(data.captured_phone),
      business_name: pickString(data.captured_business_name),
      business_type: pickString(facts.business_type) ?? pickString(data.detected_industry),
      city: pickString(facts.city),
      team_size: pickString(facts.team_size),
      years_in_business: pickString(facts.years_in_business),
      daily_operations: pickString(facts.daily_operations),
      client_acquisition: pickString(facts.client_acquisition),
      current_tools: pickString(facts.current_tools),
      daily_volume: pickString(facts.daily_volume),
      time_wasters: pickString(facts.time_wasters),
      recurring_problems: pickString(facts.recurring_problems),
      one_thing_to_fix: pickString(facts.one_thing_to_fix),
      automation_goals: pickString(facts.automation_goals),
      timeline: pickString(facts.timeline),
    };

    return NextResponse.json({ ok: true, prefill });
  } catch (err) {
    console.error("Prefill route exception:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
