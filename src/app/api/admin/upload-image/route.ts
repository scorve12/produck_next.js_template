import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/supabase/tenant";

const BUCKET = process.env.SUPABASE_IMAGE_BUCKET ?? "images";
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

export async function POST(req: Request) {
  try {
    await requireRole("editor");
  } catch (e) {
    if (e instanceof AuthError) {
      const status = e.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json({ error: e.code }, { status });
    }
    throw e;
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "UNSUPPORTED_TYPE" }, { status: 415 });
  }

  const originalName = file.name || "upload";
  const ext = (originalName.split(".").pop() ?? "bin").toLowerCase().slice(0, 8);
  const path = `${TENANT_ID}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json(
      { error: "UPLOAD_FAILED", detail: error.message },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
