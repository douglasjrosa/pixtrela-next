import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";

import { mediaAssets } from "../drizzle/schema";
import { closeDb, getDb } from "../lib/db/client";
import { extensionFromMime } from "../lib/media/media-mime";
import { storeMedia } from "../lib/media/store-media";
import { insertMediaAsset } from "../lib/repos/media";
import { upsertBrandingMediaIds } from "../lib/repos/branding";

const PRODUCT_ASSETS = [
  {
    key: "menuLogo" as const,
    relativePath: "images/logotipo-colorido-fundo-transparente-400x400px.png",
    mimeType: "image/png",
  },
  {
    key: "rankingFirst" as const,
    relativePath: "images/ranking-antares-1st.svg",
    mimeType: "image/svg+xml",
  },
  {
    key: "rankingSecond" as const,
    relativePath: "images/ranking-sirius-2nd.svg",
    mimeType: "image/svg+xml",
  },
  {
    key: "rankingThird" as const,
    relativePath: "images/ranking-vega-3rd.svg",
    mimeType: "image/svg+xml",
  },
];

async function findExistingByFilename(filename: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(eq(mediaAssets.originalFilename, filename))
    .limit(1);
  return row?.id ?? null;
}

async function upsertProductAsset(asset: (typeof PRODUCT_ASSETS)[number]) {
  const filename = path.basename(asset.relativePath);
  const existingId = await findExistingByFilename(filename);
  if (existingId) {
    console.log(`Reusing media for ${filename}`);
    return existingId;
  }

  const absolute = path.join(process.cwd(), "public", asset.relativePath);
  const bytes = await readFile(absolute);
  const extension = extensionFromMime(asset.mimeType, filename);
  const stored = await storeMedia({
    bytes,
    mimeType: asset.mimeType,
    extension,
  });
  const inserted = await insertMediaAsset(stored, filename);
  console.log(`Uploaded ${filename} → ${inserted.id}`);
  return inserted.id;
}

async function main(): Promise<void> {
  const ids = {
    menuLogoMediaId: null as string | null,
    rankingFirstMediaId: null as string | null,
    rankingSecondMediaId: null as string | null,
    rankingThirdMediaId: null as string | null,
  };

  for (const asset of PRODUCT_ASSETS) {
    const id = await upsertProductAsset(asset);
    if (asset.key === "menuLogo") ids.menuLogoMediaId = id;
    if (asset.key === "rankingFirst") ids.rankingFirstMediaId = id;
    if (asset.key === "rankingSecond") ids.rankingSecondMediaId = id;
    if (asset.key === "rankingThird") ids.rankingThirdMediaId = id;
  }

  await upsertBrandingMediaIds(ids);
  console.log("Branding preferences updated with product media ids");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
