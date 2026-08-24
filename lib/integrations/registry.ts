export const RIBERMAX_PLUGIN_ID = "ribermax" as const;

export type IntegrationPluginId = typeof RIBERMAX_PLUGIN_ID;

/**
 * Compile-time registry. Ribermax stays enabled for this tenant;
 * a future flag can gate membership without changing call sites.
 */
export const ENABLED_INTEGRATION_PLUGINS: readonly IntegrationPluginId[] = [
  RIBERMAX_PLUGIN_ID,
];

export function isIntegrationEnabled(id: IntegrationPluginId): boolean {
  return ENABLED_INTEGRATION_PLUGINS.includes(id);
}
