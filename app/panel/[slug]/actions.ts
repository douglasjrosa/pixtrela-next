"use server";

import { loadProductionTvBySlug } from "@/lib/panels/load-panel-tv";

export async function pollProductionTv(slug: string) {
  return loadProductionTvBySlug(slug);
}
