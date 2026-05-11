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

    // Flexible string picker: strings → trimmed; numbers → string; arrays → joined; else null.
    const toReadableString = (v: unknown): string | null => {
      if (v == null) return null;
      if (typeof v === "string") {
        const t = v.trim();
        return t.length > 0 ? t : null;
      }
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
      if (Array.isArray(v)) {
        const items = v
          .map((item) => (typeof item === "string" ? item.trim() : typeof item === "number" ? String(item) : ""))
          .filter((s) => s.length > 0);
        return items.length > 0 ? items.join(", ") : null;
      }
      return null;
    };

    const prefill = {
      email: toReadableString(data.captured_email),
      phone: toReadableString(data.captured_phone),
      business_name: toReadableString(data.captured_business_name),
      // business_type prefers detected_industry (e.g. "service_business"), captured_facts doesn't store this key
      business_type: toReadableString(data.detected_industry),
      // city, years_in_business, timeline: not in canonical captured_facts shape, return null
      city: null,
      team_size: toReadableString(facts.team_size),
      years_in_business: null,
      // daily_operations: synthesize from product_or_service + manual_processes for context
      daily_operations: toReadableString(facts.product_or_service)
        ?? toReadableString(facts.manual_processes),
      // client_acquisition: read canonical acquisition_channel key
      client_acquisition: toReadableString(facts.acquisition_channel),
      current_tools: toReadableString(facts.current_tools),
      // daily_volume: derived from daily_orders + average_order_value if both present
      daily_volume: (() => {
        const orders = typeof facts.daily_orders === "number" ? facts.daily_orders : null;
        const aov = typeof facts.average_order_value === "number" ? facts.average_order_value : null;
        if (orders && aov) return `${orders} orders/day at ~$${aov} each`;
        if (orders) return `${orders} orders/day`;
        return null;
      })(),
      // time_wasters: canonical key is pain_points
      time_wasters: toReadableString(facts.pain_points),
      // recurring_problems: canonical key is manual_processes
      recurring_problems: toReadableString(facts.manual_processes),
      // one_thing_to_fix, automation_goals: not in canonical shape, return null
      one_thing_to_fix: null,
      automation_goals: null,
      timeline: null,
    };

    return NextResponse.json({ ok: true, prefill });
  } catch (err) {
    console.error("Prefill route exception:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
