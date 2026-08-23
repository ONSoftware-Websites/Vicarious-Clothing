import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { getSupabase, productionRequiresSupabase } from "@/lib/server/supabase";
import fs from "node:fs";
import path from "node:path";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const bucketRaw = String(form.get("bucket") ?? "product-images");
    const bucket = bucketRaw === "journal-images" ? "journal-images" : "product-images";

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
    }
    if (file.type && !ALLOWED.has(file.type) && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName || `image.${ext}`}`;

    const supabase = getSupabase();
    if (supabase) {
      let { error } = await supabase.storage.from(bucket).upload(key, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (error && error.message.includes("Bucket not found")) {
        await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});
        const retry = await supabase.storage.from(bucket).upload(key, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        error = retry.error;
        if (error && error.message.includes("already exists")) error = null as unknown as typeof error;
      }
      if (error) {
        if ((error as { message?: string }).message?.includes("Bucket not found")) {
          return NextResponse.json(
            { error: `Bucket "${bucket}" not found — run supabase/storage.sql in Supabase SQL editor.` },
            { status: 500 }
          );
        }
        return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(key);
      return NextResponse.json({ url: urlData.publicUrl, path: key, bucket });
    }

    if (productionRequiresSupabase()) {
      return NextResponse.json(
        { error: "Supabase Storage is required for production uploads." },
        { status: 503 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      const localKey = `${Date.now()}-${key}`;
      fs.writeFileSync(path.join(uploadsDir, localKey), buffer);
      return NextResponse.json({ url: `/uploads/${localKey}`, path: localKey, bucket: "local" });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
