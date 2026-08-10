/**
 * ETL: Strapi DB → clean Postgres (cutover).
 * Requires STRAPI_DATABASE_URL + DATABASE_URL.
 * Copies bcrypt password hashes as-is (compatible with authenticateUser).
 */
import "dotenv/config";

import { randomUUID } from "node:crypto";
import postgres from "postgres";

type CountRow = { count: number };

async function countOrZero(sql: postgres.Sql, table: string): Promise<number> {
  try {
    const rows = await sql.unsafe(
      `SELECT COUNT(*)::int AS count FROM ${table}`,
    );
    return (rows[0] as CountRow).count;
  } catch {
    return 0;
  }
}

type StrapiUser = {
  id: number;
  document_id: string | null;
  username: string;
  email: string | null;
  password: string | null;
  name: string | null;
  last_name: string | null;
  phone: string | null;
  code: number | null;
  role_type: string | null;
  blocked: boolean | null;
};

const ROLE_MAP: Record<string, string> = {
  admin: "admin",
  manager: "manager",
  leader: "leader",
  colaborator: "colaborator",
  kiosk: "kiosk",
};

async function migrateUsers(
  source: postgres.Sql,
  target: postgres.Sql,
): Promise<number> {
  const rows = await source`
    SELECT id, document_id, username, email, password, name, last_name, phone,
           code, role_type, blocked
    FROM up_users
  `.catch(() => [] as StrapiUser[]);

  let inserted = 0;
  for (const row of rows as StrapiUser[]) {
    if (!row.username || !row.password) continue;
    const role = ROLE_MAP[row.role_type ?? ""] ?? "colaborator";
    const id = row.document_id && row.document_id.length > 10
      ? row.document_id
      : randomUUID();

    await target`
      INSERT INTO users (
        id, username, email, password_hash, name, last_name, phone, code,
        role, blocked, active, created_at, updated_at
      ) VALUES (
        ${id}::uuid,
        ${row.username},
        ${row.email},
        ${row.password},
        ${row.name ?? row.username},
        ${row.last_name},
        ${row.phone},
        ${row.code ?? 0},
        ${role}::user_role,
        ${Boolean(row.blocked)},
        ${!row.blocked},
        NOW(),
        NOW()
      )
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        blocked = EXCLUDED.blocked,
        updated_at = NOW()
    `.catch(async () => {
      // document_id may not be uuid — fall back to random uuid
      const fallbackId = randomUUID();
      await target`
        INSERT INTO users (
          id, username, email, password_hash, name, last_name, phone, code,
          role, blocked, active, created_at, updated_at
        ) VALUES (
          ${fallbackId}::uuid,
          ${row.username},
          ${row.email},
          ${row.password},
          ${row.name ?? row.username},
          ${row.last_name},
          ${row.phone},
          ${row.code ?? 0},
          ${role}::user_role,
          ${Boolean(row.blocked)},
          ${!row.blocked},
          NOW(),
          NOW()
        )
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          updated_at = NOW()
      `;
    });
    inserted += 1;
  }
  return inserted;
}

async function main(): Promise<void> {
  const sourceUrl = process.env.STRAPI_DATABASE_URL?.trim();
  const targetUrl = process.env.DATABASE_URL?.trim();
  if (!sourceUrl || !targetUrl) {
    throw new Error(
      "STRAPI_DATABASE_URL and DATABASE_URL are required for ETL",
    );
  }

  const source = postgres(sourceUrl, { max: 1 });
  const target = postgres(targetUrl, { max: 1 });

  try {
    const inventory = {
      up_users: await countOrZero(source, "up_users"),
      awards: await countOrZero(source, "awards"),
      tasks: await countOrZero(source, "tasks"),
      files: await countOrZero(source, "files"),
    };
    // eslint-disable-next-line no-console -- ETL CLI
    console.log("Strapi source inventory:", inventory);

    const usersMigrated = await migrateUsers(source, target);
    // eslint-disable-next-line no-console -- ETL CLI
    console.log(`Migrated/upserted users: ${usersMigrated}`);
    // eslint-disable-next-line no-console -- ETL CLI
    console.log(
      "Next: copy strapi/public/uploads → next/storage/uploads, then set AUTH_STRAPI_FALLBACK=0.",
    );
    // eslint-disable-next-line no-console -- ETL CLI
    console.log("See CUTOVER.md for remaining domain mappers.");
  } finally {
    await source.end({ timeout: 5 });
    await target.end({ timeout: 5 });
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console -- ETL CLI
  console.error(error);
  process.exit(1);
});
