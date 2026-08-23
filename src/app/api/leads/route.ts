import type { NextRequest } from "next/server";
import { createLead } from "@/lib/server/store";
import { sendEmail } from "@/lib/server/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, brand, itemType, size, condition, notes } = body;
    if (!name || !email || !brand || !itemType || !size || !condition) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    const lead = await createLead({
      name: String(name),
      email: String(email),
      brand: String(brand),
      itemType: String(itemType),
      size: String(size),
      condition: String(condition),
      notes: notes ? String(notes) : undefined,
    });

    await sendEmail({
      to: lead.email,
      template: "lead-enquiry",
      data: { ...lead },
    });

    return Response.json({ ok: true, id: lead.id }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
