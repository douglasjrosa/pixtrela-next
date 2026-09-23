/** Routes that admin audit logs are written for. */
export const TRACKED_LOG_ROUTES = [
  "/",
  "/activities",
  "/api/tasks",
  "/awards",
  "/exchanges",
  "/kiosk/staff",
  "/kiosk/staff/profile",
  "/settings/automations",
  "/settings/currency",
  "/settings/integrations/crm",
  "/settings/integrations/ribermax",
  "/settings/kiosk",
  "/settings/login",
  "/settings/steps",
  "/store",
  "/tasks",
  "/teams",
  "/templates/actions",
  "/templates/tasks",
  "/users",
] as const;

export type TrackedLogRoute = (typeof TRACKED_LOG_ROUTES)[number];

const TRACKED_ROUTE_SET = new Set<string>(TRACKED_LOG_ROUTES);

export function isTrackedLogRoute(route: string): route is TrackedLogRoute {
  return TRACKED_ROUTE_SET.has(route);
}
