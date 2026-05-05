import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      full_name,
      email,
      phone,
      business_name,
      preferred_date,
      preferred_time,
      notes,
      business_type,
      city,
      team_size,
      years_in_business,
      daily_operations,
      client_acquisition,
      current_tools,
      daily_volume,
      time_wasters,
      recurring_problems,
      one_thing_to_fix,
      automation_goals,
      timeline,
    } = body ?? {};

    if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const noteParts: string[] = [];
    if (preferred_date) noteParts.push(`Preferred date: ${preferred_date}`);
    if (preferred_time) noteParts.push(`Preferred time: ${preferred_time}`);
    if (notes && typeof notes === "string" && notes.trim().length > 0) {
      noteParts.push(`Notes: ${notes.trim()}`);
    }
    const combinedNotes = noteParts.length > 0 ? noteParts.join("\n") : null;

    const insertPayload = {
      full_name: full_name.trim(),
      email: email && typeof email === "string" && email.trim().length > 0 ? email.trim() : null,
      phone: phone.trim(),
      business_name: business_name && typeof business_name === "string" ? business_name.trim() : null,
      business_type: business_type && typeof business_type === "string" && business_type.trim().length > 0 ? business_type.trim() : null,
      city: city && typeof city === "string" && city.trim().length > 0 ? city.trim() : null,
      team_size: team_size && typeof team_size === "string" && team_size.trim().length > 0 ? team_size.trim() : null,
      years_in_business: years_in_business && typeof years_in_business === "string" && years_in_business.trim().length > 0 ? years_in_business.trim() : null,
      daily_operations: daily_operations && typeof daily_operations === "string" && daily_operations.trim().length > 0 ? daily_operations.trim() : null,
      client_acquisition: client_acquisition && typeof client_acquisition === "string" && client_acquisition.trim().length > 0 ? client_acquisition.trim() : null,
      current_tools: current_tools && typeof current_tools === "string" && current_tools.trim().length > 0 ? current_tools.trim() : null,
      daily_volume: daily_volume && typeof daily_volume === "string" && daily_volume.trim().length > 0 ? daily_volume.trim() : null,
      time_wasters: time_wasters && typeof time_wasters === "string" && time_wasters.trim().length > 0 ? time_wasters.trim() : null,
      recurring_problems: recurring_problems && typeof recurring_problems === "string" && recurring_problems.trim().length > 0 ? recurring_problems.trim() : null,
      one_thing_to_fix: one_thing_to_fix && typeof one_thing_to_fix === "string" && one_thing_to_fix.trim().length > 0 ? one_thing_to_fix.trim() : null,
      automation_goals: automation_goals && typeof automation_goals === "string" && automation_goals.trim().length > 0 ? automation_goals.trim() : null,
      timeline: timeline && typeof timeline === "string" && timeline.trim().length > 0 ? timeline.trim() : null,
      source: "discovery_call",
      notes: combinedNotes,
      status: "new",
    };

    const { data, error } = await supabase
      .from("contact_requests")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("Discovery call insert error:", error);
      return NextResponse.json(
        { error: "Failed to save request", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (err) {
    console.error("Discovery call route exception:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
