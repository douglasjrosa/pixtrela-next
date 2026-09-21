import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import {
  matchRouteTheme,
  routeThemeContentSurfaceTopRadiusClass,
} from "@/lib/themes/match-route-theme";

export async function loadQueuesToolbarTopRadiusClass(): Promise<string> {
  const themes = await loadRouteThemes();
  return routeThemeContentSurfaceTopRadiusClass(
    matchRouteTheme("/queues", themes),
  );
}
