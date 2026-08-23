import type { NextRequest } from "next/server";
import { createLead } from "@/lib/server/store";
import { getSupabase } from "@/lib/server/supabase";
import { sendEmail } from "@/lib/server/mailer";

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let name = "";
    let email = "";
    let brand = "";
    let itemType = "";
    let size = "";
    let condition = "";
    let notes = "";
    let photos: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = text(form.get("name"));
      email = text(form.get("email")).toLowerCase();
      brand = text(form.get("brand"));
      itemType = text(form.get("itemType"));
      size = text(form.get("size"));
      condition = text(form.get("condition"));
      notes = text(form.get("notes"));
      photos = form
        .getAll("photos")
        .filter((value): value is File => value instanceof File && value.size > 0);
    } else {
      const body = await request.json();
      name = String(body.name ?? "").trim();
      email = String(body.email ?? "").trim().toLowerCase();
      brand = String(body.brand ?? "").trim();
      itemType = String(body.itemType ?? "").trim();
      size = String(body.size ?? "").trim();
      condition = String(body.condition ?? "").trim();
      notes = String(body.notes ?? "").trim();
    }

    if (!name || !email.includes("@") || !brand || !itemType || !size || !condition) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (photos.length > MAX_PHOTOS) {
      return Response.json({ error: `Upload no more than ${MAX_PHOTOS} photographs.` }, { status: 400 });
    }

    const photoUrls: string[] = [];
    if (photos.length) {
      const supabase = getSupabase();
      if (!supabase) {
        return Response.json({ error: "Photo upload is temporarily unavailable." }, { status: 503 });
      }

      const submissionKey = crypto.randomUUID();
      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        if (!photo.type.startsWith("image/")) {
          return Response.json({ error: "Only image files can be uploaded." }, { status: 400 });
        }
        if (photo.size > MAX_PHOTO_BYTES) {
          return Response.json({ error: "Each photograph must be 8 MB or smaller." }, { status: 400 });
        }

        const extension = photo.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
        const objectPath = `${submissionKey}/${index + 1}.${extension}`;
        const bytes = new Uint8Array(await photo.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from("lead-photos")
          .upload(objectPath, bytes, {
            contentType: photo.type,
            upsert: false,
          });
        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
        const { data } = supabase.storage.from("lead-photos").getPublicUrl(objectPath);
        photoUrls.push(data.publicUrl);
      }
    }

    const storedNotes = [
      notes,
      ...photoUrls.map((url) => `PHOTO: ${url}`),
    ]
      .filter(Boolean)
      .join("\n");

    const lead = await createLead({
      name,
      email,
      brand,
      itemType,
      size,
      condition,
      notes: storedNotes || undefined,
    });

    let emailSent = true;
    try {
      await sendEmail({
        to: lead.email,
        template: "lead-enquiry",
        data: { ...lead },
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Lead acknowledgement email failed:", emailError);
    }

    return Response.json(
      { ok: true, id: lead.id, photos: photoUrls.length, emailSent },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lead submission failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
