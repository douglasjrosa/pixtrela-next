import { config } from "dotenv";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { DEFAULT_KIOSK_ENTRY_ACCESS } from "../lib/business/entry-access";
import { users } from "../drizzle/schema";
import { closeDb, getDb } from "../lib/db/client";
import { upsertEntryAccessSettings } from "../lib/repos/entry-access";

config({ path: ".env.local" });
config();

const BCRYPT_ROUNDS = 10;

type E2eUserSpec = {
  envLogin: string;
  envPassword: string;
  defaultLogin: string;
  defaultPassword: string;
  name: string;
  role: "manager" | "colaborator" | "kiosk";
  email: string;
  code?: number;
};

const E2E_USERS: E2eUserSpec[] = [
  {
    envLogin: "E2E_MANAGER_LOGIN",
    envPassword: "E2E_MANAGER_PASSWORD",
    defaultLogin: "e2e-manager",
    defaultPassword: "PixtrelaE2e1",
    name: "E2E Manager",
    role: "manager",
    email: "e2e-manager@pixtrela.local",
  },
  {
    envLogin: "E2E_COLABORATOR_LOGIN",
    envPassword: "E2E_COLABORATOR_PASSWORD",
    defaultLogin: "e2e-colaborator",
    defaultPassword: "PixtrelaE2e2",
    name: "E2E Colaborator",
    role: "colaborator",
    email: "e2e-colaborator@pixtrela.local",
    code: 9_001_001,
  },
  {
    envLogin: "E2E_KIOSK_LOGIN",
    envPassword: "E2E_KIOSK_PASSWORD",
    defaultLogin: "e2e-kiosk",
    defaultPassword: "PixtrelaE2e3",
    name: "E2E Kiosk",
    role: "kiosk",
    email: "e2e-kiosk@pixtrela.local",
  },
];

async function upsertE2eUser(spec: E2eUserSpec): Promise<void> {
  const username = process.env[spec.envLogin]?.trim() || spec.defaultLogin;
  const password =
    process.env[spec.envPassword]?.trim() || spec.defaultPassword;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const db = getDb();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        name: spec.name,
        role: spec.role,
        email: spec.email,
        active: true,
        blocked: false,
        ...(spec.code !== undefined ? { code: spec.code } : {}),
      })
      .where(eq(users.id, existing.id));
    console.log(`Updated E2E user "${username}" (${spec.role})`);
    return;
  }

  await db.insert(users).values({
    username,
    passwordHash,
    name: spec.name,
    role: spec.role,
    email: spec.email,
    active: true,
    blocked: false,
    ...(spec.code !== undefined ? { code: spec.code } : {}),
  });
  console.log(`Created E2E user "${username}" (${spec.role})`);
}

async function ensureKioskE2eEntryAccess(): Promise<void> {
  await upsertEntryAccessSettings("kiosk", {
    ...DEFAULT_KIOSK_ENTRY_ACCESS,
    computer: {
      ...DEFAULT_KIOSK_ENTRY_ACCESS.computer,
      code: true,
    },
  });
  console.log("Kiosk entry access: computer code+password enabled for E2E");
}

async function main(): Promise<void> {
  for (const spec of E2E_USERS) {
    await upsertE2eUser(spec);
  }
  await ensureKioskE2eEntryAccess();
  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
