import { revalidatePath, updateTag } from "next/cache";

export type RevalidateOptions = {
  paths?: string[];
};

function isRevalidateOptions(value: unknown): value is RevalidateOptions {
  return typeof value === "object" && value !== null && "paths" in value;
}

/**
 * Invalidate Strapi list caches after a Server Action mutation.
 *
 * Uses updateTag + revalidatePath only. Call router.refresh() on the client
 * after mutations — refresh() must not run inside Server Actions.
 */
export function revalidateStrapiTags(
  ...args: string[] | [...string[], RevalidateOptions]
): void {
  let tags: string[];
  let paths: string[] = [];

  if (args.length > 0 && isRevalidateOptions(args[args.length - 1])) {
    const options = args.pop() as RevalidateOptions;
    paths = options.paths ?? [];
    tags = args as string[];
  } else {
    tags = args as string[];
  }

  const uniqueTags = [...new Set(tags.filter(Boolean))];
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  for (const tag of uniqueTags) {
    updateTag(tag);
  }
  for (const path of uniquePaths) {
    revalidatePath(path);
  }
}
