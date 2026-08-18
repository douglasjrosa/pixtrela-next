import { beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import {
  loadResolvedBrandingAssets,
  updateMenuLogoMediaId,
} from "@/lib/repos/branding";
import {
  deleteMediaAsset,
  findMediaReferences,
  insertMediaAsset,
  listMediaAssets,
} from "@/lib/repos/media";

describe("media repo", () => {
  beforeAll(() => {
    getDb();
  });

  it(
    "lists inserted assets and blocks delete while branding references them",
    async () => {
      const previous = await loadResolvedBrandingAssets();
      const stored = await storeMedia({
        bytes: Buffer.from("fake-png"),
        mimeType: "image/png",
        extension: "png",
      });
      const asset = await insertMediaAsset(stored, "unit-test-logo.png");

      const listed = await listMediaAssets({
        q: "unit-test-logo",
        mimeFilter: "image",
        page: 1,
        pageSize: 10,
      });
      expect(listed.items.some((item) => item.id === asset.id)).toBe(true);

      await updateMenuLogoMediaId(asset.id);
      const refs = await findMediaReferences(asset.id);
      expect(refs.some((ref) => ref.kind === "branding")).toBe(true);
      expect(refs.some((ref) => ref.sectionKey === "preferences")).toBe(true);

      await expect(deleteMediaAsset(asset.id)).rejects.toThrow("inUse");

      await updateMenuLogoMediaId(previous.menuLogoMediaId);
      await deleteMediaAsset(asset.id);

      const after = await listMediaAssets({
        q: "unit-test-logo",
        page: 1,
        pageSize: 10,
      });
      expect(after.items.some((item) => item.id === asset.id)).toBe(false);
    },
    30_000,
  );
});
