const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

interface StrapiAuthResponse {
  jwt: string;
}

interface StrapiTaskRef {
  documentId: string;
}

interface StrapiListResponse<T> {
  data: T[];
}

export async function loginStrapi(
  identifier: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    throw new Error(`Strapi login failed (${res.status})`);
  }
  const data = (await res.json()) as StrapiAuthResponse;
  return data.jwt;
}

/** Deactivates active tasks with the given name so create E2E can run repeatedly. */
export async function deactivateActiveTasksByName(
  jwt: string,
  name: string,
): Promise<void> {
  const query = new URLSearchParams({
    "filters[name][$eq]": name,
    "filters[active][$eq]": "true",
    "fields[0]": "documentId",
  });
  const listRes = await fetch(`${STRAPI_URL}/api/tasks?${query}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!listRes.ok) {
    throw new Error(`Strapi task list failed (${listRes.status})`);
  }

  const { data } = (await listRes.json()) as StrapiListResponse<StrapiTaskRef>;
  await Promise.all(
    data.map(async (task) => {
      const res = await fetch(`${STRAPI_URL}/api/tasks/${task.documentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: { active: false } }),
      });
      if (!res.ok) {
        throw new Error(`Strapi task deactivate failed (${res.status})`);
      }
    }),
  );
}
