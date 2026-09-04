import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Menu photos are written to the local disk under public/uploads/menu.
// Fine for a single-instance dev/staging box; on an ephemeral host (e.g.
// Vercel serverless) this won't persist across deploys or instances — swap
// for object storage (S3/R2/Vercel Blob) before going to production.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "menu");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveMenuItemImage(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Image must be JPEG, PNG, or WebP");
  if (file.size > MAX_BYTES) throw new Error("Image must be under 5MB");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/menu/${filename}`;
}
