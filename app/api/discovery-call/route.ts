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
