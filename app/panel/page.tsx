import { ProductionTvHome } from "@/components/panel/production-tv-home";
import { listProductionTvHome } from "@/lib/panels/load-panel-tv";

export const dynamic = "force-dynamic";

export default async function PanelHomePage() {
  const panels = await listProductionTvHome();
  return <ProductionTvHome panels={panels} />;
}
