export type SettingsTabDef = {
  href: string;
  labelKey:
    | "tabs.logs"
    | "tabs.files"
    | "tabs.steps"
    | "tabs.currency"
    | "tabs.automations"
    | "tabs.kiosk"
    | "tabs.login"
    | "tabs.integrations"
    | "tabs.themes"
    | "tabs.subtasks";
  activePrefix?: string;
};

/** Settings tabs in display order. Logs is the first item. */
export const SETTINGS_TAB_DEFS: SettingsTabDef[] = [
  { href: "/settings/logs", labelKey: "tabs.logs" },
  { href: "/settings/files", labelKey: "tabs.files" },
  { href: "/settings/steps", labelKey: "tabs.steps" },
  { href: "/settings/currency", labelKey: "tabs.currency" },
  { href: "/settings/automations", labelKey: "tabs.automations" },
  { href: "/settings/kiosk", labelKey: "tabs.kiosk" },
  { href: "/settings/login", labelKey: "tabs.login" },
  {
    href: "/settings/integrations/ribermax",
    activePrefix: "/settings/integrations",
    labelKey: "tabs.integrations",
  },
  {
    href: "/settings/themes/colors",
    activePrefix: "/settings/themes",
    labelKey: "tabs.themes",
  },
  {
    href: "/settings/subtasks/categories",
    activePrefix: "/settings/subtasks",
    labelKey: "tabs.subtasks",
  },
];
