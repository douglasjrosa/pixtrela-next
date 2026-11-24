import { notFound } from "next/navigation";

import { ProductionTvBoard } from "@/components/panel/production-tv-board";
import { loadProductionTvBySlug } from "@/lib/panels/load-panel-tv";

import { pollProductionTv } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductionTvPage({ params }: PageProps) {
  const { slug } = await params;
  const view = await loadProductionTvBySlug(slug);
  if (!view) notFound();

  return (
    <ProductionTvBoard
      key={slug}
      slug={slug}
      initial={view}
      poll={pollProductionTv}
    />
  );
}
