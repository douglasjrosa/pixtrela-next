import { refresh, updateTag } from "next/cache";

/**
 * Invalidate Strapi list caches after a Server Action mutation.
 *
 * Next.js 16: `revalidateTag` is stale-while-revalidate — lists stay stale until
 * a hard reload. `updateTag` + `refresh` give read-your-own-writes in actions.
 */
export function revalidateStrapiTags(...tags: string[]): void {
  const unique = [...new Set(tags.filter(Boolean))];
  for (const tag of unique) {
    updateTag(tag);
  }
  if (unique.length > 0) {
    refresh();
  }
}
