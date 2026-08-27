import "dotenv/config";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import {
  currencies,
  currencyForSubtasks,
  factoryActions,
  kioskSettings,
  steps,
  users,
} from "../drizzle/schema";
import { DEFAULT_FACTORY_ACTIONS } from "../lib/actions/default-actions";
import { closeDb, getDb } from "../lib/db/client";

const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "PixtrelaAdmin1";
const DEMO_CODE = 1111;
const DEMO_CODE_PASSWORD = "111111";
const DEMO_CODE_USERNAME = "code.1111";

async function main(): Promise<void> {
  const db = getDb();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, ADMIN_USERNAME))
    .limit(1);

  if (!existingAdmin) {
    await db.insert(users).values({
      username: ADMIN_USERNAME,
      passwordHash,
      name: "Admin",
      role: "admin",
      email: "admin@pixtrela.local",
      code: 0,
    });
     
    console.log(`Created admin user "${ADMIN_USERNAME}"`);
  } else {
     
    console.log(`Admin user "${ADMIN_USERNAME}" already exists`);
  }

  const [existingDemoCode] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, DEMO_CODE_USERNAME))
    .limit(1);

  if (!existingDemoCode) {
    const demoHash = await bcrypt.hash(DEMO_CODE_PASSWORD, 10);
    await db.insert(users).values({
      username: DEMO_CODE_USERNAME,
      passwordHash: demoHash,
      name: "Demo Code",
      role: "manager",
      email: "code1111@pixtrela.local",
      code: DEMO_CODE,
    });
     
    console.log(
      `Created code-login user "${DEMO_CODE_USERNAME}" (code ${DEMO_CODE})`,
    );
  } else {
     
    console.log(`Code-login user "${DEMO_CODE_USERNAME}" already exists`);
  }

  const [existingCurrency] = await db
    .select()
    .from(currencies)
    .where(eq(currencies.name, "Estrela"))
    .limit(1);

  let currencyId = existingCurrency?.id;
  if (!currencyId) {
    const [created] = await db
      .insert(currencies)
      .values({
        name: "Estrela",
        title: "Estrela",
        pluralTitle: "Estrelas",
        currencyPerSecond: 1,
      })
      .returning({ id: currencies.id });
    currencyId = created.id;
  }

  const [paymentSetting] = await db.select().from(currencyForSubtasks).limit(1);
  if (!paymentSetting) {
    await db.insert(currencyForSubtasks).values({ currencyId });
  }

  const existingSteps = await db.select({ id: steps.id }).from(steps).limit(1);
  if (existingSteps.length === 0) {
    await db.insert(steps).values([
      { name: "Fila de produção", index: 0 },
      { name: "Produção", index: 1 },
      { name: "Revisão", index: 2 },
    ]);
  }

  const [kiosk] = await db.select().from(kioskSettings).limit(1);
  if (!kiosk) {
    await db.insert(kioskSettings).values({ sessionIdleSeconds: 120 });
  }

  const [existingAction] = await db
    .select({ id: factoryActions.id })
    .from(factoryActions)
    .limit(1);
  if (!existingAction) {
    await db.insert(factoryActions).values(
      DEFAULT_FACTORY_ACTIONS.map((row) => ({
        name: row.name,
        unitTime: row.unitTime,
        description: row.description,
        qtyQuestion: row.qtyQuestion,
      })),
    );
  }

  console.log("Seed complete.");
  await closeDb();
}

main().catch(async (error) => {
   
  console.error(error);
  await closeDb();
  process.exit(1);
});
