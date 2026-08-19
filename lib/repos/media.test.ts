import { beforeAll, describe, expect, it } from "vitest";

import { eq } from "drizzle-orm";

import { mediaAssets, users } from "@/drizzle/schema";
import { getDb } from "@/lib/db/client";
import { storeMedia } from "@/lib/media/store-media";
import {
  loadResolvedBrandingAssets,
  updateMenuLogoMediaId,
} from "@/lib/repos/branding";
import {
  deleteMediaAsset,
  findMediaReferences,
  getMediaAsset,
  insertMediaAsset,
  listMediaAssets,
  updateMediaAssetMetadata,
} from "@/lib/repos/media";
import { deactivateUser } from "@/lib/repos/users";

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
      const asset = await insertMediaAsset(stored, {
        originalFilename: "unit-test-logo.png",
        category: "branding",
        sensitivity: "public",
      });

      expect(asset.category).toBe("branding");
      expect(asset.displayName).toBe("unit-test-logo");

      const listed = await listMediaAssets({
        q: "unit-test-logo",
        mimeFilter: "image",
        category: "branding",
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

  it(
    "excludes biometric assets from library list and updates metadata",
    async () => {
      const faceStored = await storeMedia({
        bytes: Buffer.from("fake-face"),
        mimeType: "image/png",
        extension: "png",
      });
      const faceAsset = await insertMediaAsset(faceStored, {
        originalFilename: "unit-test-face.png",
        category: "face",
        sensitivity: "biometric",
      });

      const hidden = await listMediaAssets({
        q: "unit-test-face",
        page: 1,
        pageSize: 10,
      });
      expect(hidden.items.some((item) => item.id === faceAsset.id)).toBe(false);

      const included = await listMediaAssets({
        q: "unit-test-face",
        includeBiometric: true,
        page: 1,
        pageSize: 10,
      });
      expect(included.items.some((item) => item.id === faceAsset.id)).toBe(true);

      await expect(
        updateMediaAssetMetadata(faceAsset.id, { displayName: "blocked" }),
      ).rejects.toThrow("forbidden");

      const awardStored = await storeMedia({
        bytes: Buffer.from("fake-award"),
        mimeType: "image/png",
        extension: "png",
      });
      const awardAsset = await insertMediaAsset(awardStored, {
        originalFilename: "unit-test-award.png",
        category: "award",
      });
      const updated = await updateMediaAssetMetadata(awardAsset.id, {
        displayName: "Enfeitinho",
        altText: "Prêmio Enfeitinho",
        category: "award",
      });
      expect(updated.displayName).toBe("Enfeitinho");
      expect(updated.altText).toBe("Prêmio Enfeitinho");

      await deleteMediaAsset(awardAsset.id);
      await deleteMediaAsset(faceAsset.id);
    },
    30_000,
  );

  it(
    "purges face photo and vector when deactivating a user",
    async () => {
      const db = getDb();
      const suffix = Date.now().toString(36);
      const [user] = await db
        .insert(users)
        .values({
          username: `media_lgpd_${suffix}`,
          passwordHash: "x",
          name: "LGPD Test",
          role: "colaborator",
          active: true,
          blocked: false,
        })
        .returning({ id: users.id });

      const faceStored = await storeMedia({
        bytes: Buffer.from("deactivate-face"),
        mimeType: "image/png",
        extension: "png",
      });
      const faceAsset = await insertMediaAsset(faceStored, {
        originalFilename: `deactivate-face-${suffix}.png`,
        category: "face",
        sensitivity: "biometric",
      });
      const avatarStored = await storeMedia({
        bytes: Buffer.from("deactivate-avatar"),
        mimeType: "image/png",
        extension: "png",
      });
      const avatarAsset = await insertMediaAsset(avatarStored, {
        originalFilename: `deactivate-avatar-${suffix}.png`,
        category: "avatar",
        sensitivity: "internal",
      });

      await db
        .update(users)
        .set({
          facePhotoMediaId: faceAsset.id,
          faceVector: [0.1, 0.2, 0.3],
          avatarMediaId: avatarAsset.id,
        })
        .where(eq(users.id, user.id));

      await deactivateUser(user.id, "unit_test_lgpd");

      const [afterUser] = await db
        .select({
          active: users.active,
          facePhotoMediaId: users.facePhotoMediaId,
          faceVector: users.faceVector,
          avatarMediaId: users.avatarMediaId,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      expect(afterUser.active).toBe(false);
      expect(afterUser.facePhotoMediaId).toBeNull();
      expect(afterUser.faceVector).toBeNull();
      expect(afterUser.avatarMediaId).toBe(avatarAsset.id);

      expect(await getMediaAsset(faceAsset.id)).toBeNull();
      expect(await getMediaAsset(avatarAsset.id)).not.toBeNull();

      await db
        .update(users)
        .set({ avatarMediaId: null })
        .where(eq(users.id, user.id));
      await deleteMediaAsset(avatarAsset.id);
      await db.delete(users).where(eq(users.id, user.id));
    },
    30_000,
  );
});
