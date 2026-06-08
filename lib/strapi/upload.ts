import { auth } from "@/auth";

import { redirectToLogin } from "@/lib/auth/session";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

interface UploadedFile {
  id: number;
}

function readUploadedId(payload: unknown): number | null {
  const file = Array.isArray(payload) ? payload[0] : payload;
  if (!file || typeof file !== "object") return null;
  const id = (file as UploadedFile).id;
  return typeof id === "number" ? id : null;
}

/** Uploads a file to Strapi media library; returns the media id. */
export async function strapiUpload(file: File): Promise<number> {
  const session = await auth();
  if (!session?.jwt) {
    redirectToLogin();
  }

  const formData = new FormData();
  formData.append("files", file, file.name);

  const response = await fetch(`${STRAPI_URL}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.jwt}` },
    body: formData,
  });

  if (response.status === 401) {
    redirectToLogin();
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message ? `: ${body.error.message}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`upload failed (${response.status})${detail}`);
  }

  const data = await response.json();
  const id = readUploadedId(data);
  if (id === null) {
    throw new Error("upload failed: missing file id");
  }
  return id;
}
