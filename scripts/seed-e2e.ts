import "dotenv/config";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { users } from "../drizzle/schema";
import { closeDb, getDb } from "../lib/db/client";

const LOGIN = process.env.E2E_MANAGER_LOGIN ?? "e2e-manager";
const PASSWORD = process.env.E2E_MANAGER_PASSWORD ?? "PixtrelaE2e1";

async function main(): Promise<void> {
  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, LOGIN))
    .limit(1);

  if (existing) {
     
    console.log(`E2E manager "${LOGIN}" already exists`);
    await closeDb();
    return;
  }

  await db.insert(users).values({
    username: LOGIN,
    passwordHash: await bcrypt.hash(PASSWORD, 10),
    name: "E2E Manager",
    role: "manager",
    email: "e2e-manager@pixtrela.local",
  });
   
  console.log(`Created E2E manager "${LOGIN}"`);
  await closeDb();
}

main().catch(async (error) => {
   
  console.error(error);
  await closeDb();
  process.exit(1);
});
