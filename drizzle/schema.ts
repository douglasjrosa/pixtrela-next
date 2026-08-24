import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "leader",
  "colaborator",
  "kiosk",
]);

export const greetingGenderEnum = pgEnum("greeting_gender", [
  "male",
  "female",
  "neutral",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "waiting",
  "producing",
  "paused",
  "finished",
  "reviewed",
  "delivered",
]);

export const sharingTypeEnum = pgEnum("sharing_type", ["qty", "duration"]);

export const subTaskStatusEnum = pgEnum("sub_task_status", [
  "waiting",
  "producing",
  "paused",
  "finished",
]);

export const stepTaskOrderByEnum = pgEnum("step_task_order_by", [
  "manual",
  "delivery_date_asc",
  "delivery_date_desc",
  "created_at_asc",
  "created_at_desc",
]);

export const activationStatusEnum = pgEnum("activation_status", [
  "inactive",
  "active",
  "blocked",
]);

export const activityActionEnum = pgEnum("activity_action", [
  "started",
  "stoped",
]);

export const cartStatusEnum = pgEnum("cart_status", [
  "open",
  "checked_out",
  "abandoned",
]);

export const exchangeOrderStatusEnum = pgEnum("exchange_order_status", [
  "completed",
  "cancelled",
]);

export const exchangeBatchStatusEnum = pgEnum("exchange_batch_status", [
  "pending",
  "ready",
]);

export const mediaCategoryEnum = pgEnum("media_category", [
  "avatar",
  "face",
  "award",
  "currency",
  "branding",
  "route_theme",
  "document",
  "other",
]);

export const mediaSensitivityEnum = pgEnum("media_sensitivity", [
  "public",
  "internal",
  "biometric",
]);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    mimeType: varchar("mime_type", { length: 128 }),
    byteSize: integer("byte_size"),
    originalFilename: varchar("original_filename", { length: 255 }),
    displayName: varchar("display_name", { length: 255 }),
    description: text("description"),
    altText: varchar("alt_text", { length: 512 }),
    title: varchar("title", { length: 255 }),
    category: mediaCategoryEnum("category").default("other").notNull(),
    sensitivity: mediaSensitivityEnum("sensitivity").default("public").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("media_assets_category_idx").on(table.category),
    index("media_assets_sensitivity_idx").on(table.sensitivity),
  ],
);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  lastName: varchar("last_name", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  code: integer("code"),
  role: userRoleEnum("role").notNull(),
  blocked: boolean("blocked").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  reasonForDeactivation: text("reason_for_deactivation"),
  greetingGender: greetingGenderEnum("greeting_gender").default("neutral"),
  userTag: varchar("user_tag", { length: 64 }),
  faceVector: jsonb("face_vector").$type<number[] | null>(),
  avatarMediaId: uuid("avatar_media_id").references(() => mediaAssets.id),
  facePhotoMediaId: uuid("face_photo_media_id").references(() => mediaAssets.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const steps = pgTable("steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  index: integer("index").default(0).notNull(),
  taskOrderBy: stepTaskOrderByEnum("task_order_by").default("manual").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const currencies = pgTable("currencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }),
  pluralTitle: varchar("plural_title", { length: 128 }),
  currencyPerSecond: numeric("currency_per_second", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  exchangeRate: doublePrecision("exchange_rate").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  showInStore: boolean("show_in_store").default(true).notNull(),
  iconMediaId: uuid("icon_media_id").references(() => mediaAssets.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const currencyForSubtasks = pgTable("currency_for_subtasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const awards = pgTable("awards", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  title: varchar("title", { length: 256 }),
  description: text("description"),
  warnings: text("warnings"),
  imageMediaId: uuid("image_media_id").references(() => mediaAssets.id),
  active: boolean("active").default(true).notNull(),
  showInStore: boolean("show_in_store").default(true).notNull(),
  stock: integer("stock").default(0).notNull(),
  actualPrice: numeric("actual_price", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  autoRecalculate: boolean("auto_recalculate").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const awardPrices = pgTable("award_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  awardId: uuid("award_id")
    .references(() => awards.id, { onDelete: "cascade" })
    .notNull(),
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  numberOf: doublePrecision("number_of").default(0).notNull(),
});

export const routeThemes = pgTable("route_themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  routeKey: varchar("route_key", { length: 128 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  backgroundColor: varchar("background_color", { length: 32 }),
  backgroundColorOpacity: doublePrecision("background_color_opacity"),
  backgroundSize: varchar("background_size", { length: 64 }),
  backgroundPosition: varchar("background_position", { length: 64 }),
  backgroundRepeat: varchar("background_repeat", { length: 64 }),
  backgroundMotion: varchar("background_motion", { length: 64 }),
  parallaxIntensity: doublePrecision("parallax_intensity"),
  parallaxDirection: varchar("parallax_direction", { length: 32 }),
  parallaxBleed: doublePrecision("parallax_bleed"),
  contentMarginMobile: doublePrecision("content_margin_mobile"),
  contentMarginDesktop: doublePrecision("content_margin_desktop"),
  foregroundColor: varchar("foreground_color", { length: 32 }),
  surfaceColor: varchar("surface_color", { length: 32 }),
  surfaceColorOpacity: doublePrecision("surface_color_opacity"),
  backgroundImageMediaId: uuid("background_image_media_id").references(
    () => mediaAssets.id,
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const semanticThemeSettings = pgTable("semantic_theme_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokens: jsonb("tokens").$type<Record<string, string>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appBrandingSettings = pgTable("app_branding_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  menuLogoMediaId: uuid("menu_logo_media_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  menuLogoBackgroundColor: varchar("menu_logo_background_color", { length: 32 }),
  menuLogoBackgroundColorOpacity: doublePrecision(
    "menu_logo_background_color_opacity",
  ).default(0),
  rankingFirstMediaId: uuid("ranking_first_media_id").references(
    () => mediaAssets.id,
    { onDelete: "set null" },
  ),
  rankingSecondMediaId: uuid("ranking_second_media_id").references(
    () => mediaAssets.id,
    { onDelete: "set null" },
  ),
  rankingThirdMediaId: uuid("ranking_third_media_id").references(
    () => mediaAssets.id,
    { onDelete: "set null" },
  ),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const kioskSettings = pgTable("kiosk_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionIdleSeconds: integer("session_idle_seconds").default(120).notNull(),
  maxSimultaneousSubtaskIntervalSeconds: integer(
    "max_simultaneous_subtask_interval_seconds",
  )
    .default(300)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const entryAccessSettings = pgTable("entry_access_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  surface: varchar("surface", { length: 16 }).notNull().unique(),
  computerUsername: boolean("computer_username").default(true).notNull(),
  computerCode: boolean("computer_code").default(false).notNull(),
  computerFace: boolean("computer_face").default(false).notNull(),
  computerNfc: boolean("computer_nfc").default(false).notNull(),
  mobileUsername: boolean("mobile_username").default(true).notNull(),
  mobileCode: boolean("mobile_code").default(false).notNull(),
  mobileFace: boolean("mobile_face").default(true).notNull(),
  mobileNfc: boolean("mobile_nfc").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const taskAutomationSettings = pgTable("task_automation_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  enabled: boolean("enabled").default(false).notNull(),
  waitingStepId: uuid("waiting_step_id").references(() => steps.id, {
    onDelete: "set null",
  }),
  producingStepId: uuid("producing_step_id").references(() => steps.id, {
    onDelete: "set null",
  }),
  pausedStepId: uuid("paused_step_id").references(() => steps.id, {
    onDelete: "set null",
  }),
  finishedStepId: uuid("finished_step_id").references(() => steps.id, {
    onDelete: "set null",
  }),
  reviewedStepId: uuid("reviewed_step_id").references(() => steps.id, {
    onDelete: "set null",
  }),
  deliveredStepId: uuid("delivered_step_id").references(() => steps.id, {
    onDelete: "set null",
  }),
  // Matches DEFAULT_ASSIGN_WARN_MAX in lib/business/assign-warn-max.ts.
  assignWarnMax: integer("assign_warn_max").default(4).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ribermaxBoxTemplateSettings = pgTable(
  "ribermax_box_template_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cutSeconds: integer("cut_seconds").default(60).notNull(),
    adhesiveSeconds: integer("adhesive_seconds").default(30).notNull(),
    fastenerSeconds: integer("fastener_seconds").default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const subTaskCategories = pgTable("sub_task_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  ref: varchar("ref", { length: 16 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const flags = pgTable(
  "flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subTaskCategoryId: uuid("sub_task_category_id")
      .references(() => subTaskCategories.id, { onDelete: "restrict" })
      .notNull(),
    index: integer("index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("flags_category_index_unique").on(
      table.subTaskCategoryId,
      table.index,
    ),
  ],
);

export const subTaskPresets = pgTable("sub_task_presets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  expectedTime: integer("expected_time").default(0).notNull(),
  sharingType: sharingTypeEnum("sharing_type").default("duration").notNull(),
  maxSameTimeWorkers: integer("max_same_time_workers").default(1).notNull(),
  subTaskCategoryId: uuid("sub_task_category_id").references(
    () => subTaskCategories.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  leaderId: uuid("leader_id").references(() => users.id),
  exchangesFirstDay: integer("exchanges_first_day").default(3).notNull(),
  exchangesLastDay: integer("exchanges_last_day").default(15).notNull(),
  since: date("since"),
  until: date("until"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teamMembers = pgTable("team_members", {
  teamId: uuid("team_id")
    .references(() => teams.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});

export const templateTasks = pgTable("template_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const templateSubTasks = pgTable("template_sub_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateTaskId: uuid("template_task_id")
    .references(() => templateTasks.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  qty: integer("qty").default(1).notNull(),
  index: integer("index").default(0).notNull(),
  expectedTime: integer("expected_time").default(0).notNull(),
  sharingType: sharingTypeEnum("sharing_type").default("duration").notNull(),
  maxSameTimeWorkers: integer("max_same_time_workers").default(1).notNull(),
  dependencyIndexes: jsonb("dependency_indexes")
    .$type<number[]>()
    .default([])
    .notNull(),
  linkedToPrevious: boolean("linked_to_previous").default(false).notNull(),
  subTaskCategoryId: uuid("sub_task_category_id").references(
    () => subTaskCategories.id,
    { onDelete: "set null" },
  ),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  active: boolean("active").default(true).notNull(),
  reasonForDeactivation: text("reason_for_deactivation"),
  qty: integer("qty").default(1).notNull(),
  deliveryDate: date("delivery_date"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  stepId: uuid("step_id").references(() => steps.id, { onDelete: "set null" }),
  index: integer("index").default(0).notNull(),
  status: taskStatusEnum("status").default("waiting").notNull(),
  totalExpectedTime: integer("total_expected_time").default(0).notNull(),
  totalTimeSpent: integer("total_time_spent").default(0).notNull(),
  templateTaskCode: varchar("template_task_code", { length: 64 }),
  crmPedidoId: integer("crm_pedido_id"),
  crmItemKey: varchar("crm_item_key", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const subTasks = pgTable("sub_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  qty: integer("qty").default(1).notNull(),
  sharingType: sharingTypeEnum("sharing_type").default("duration").notNull(),
  maxSameTimeWorkers: integer("max_same_time_workers").default(1).notNull(),
  index: integer("index").default(0).notNull(),
  status: subTaskStatusEnum("status").default("waiting").notNull(),
  activationStatus: activationStatusEnum("activation_status")
    .default("inactive")
    .notNull(),
  expectedTime: integer("expected_time").default(0).notNull(),
  timeSpent: integer("time_spent").default(0).notNull(),
  linkedToPrevious: boolean("linked_to_previous").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  subTaskCategoryId: uuid("sub_task_category_id").references(
    () => subTaskCategories.id,
    { onDelete: "set null" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const subTaskDependencies = pgTable("sub_task_dependencies", {
  subTaskId: uuid("sub_task_id")
    .references(() => subTasks.id, { onDelete: "cascade" })
    .notNull(),
  dependsOnSubTaskId: uuid("depends_on_sub_task_id")
    .references(() => subTasks.id, { onDelete: "cascade" })
    .notNull(),
});

export const subTaskFlags = pgTable(
  "sub_task_flags",
  {
    subTaskId: uuid("sub_task_id")
      .references(() => subTasks.id, { onDelete: "cascade" })
      .notNull(),
    flagId: uuid("flag_id")
      .references(() => flags.id, { onDelete: "restrict" })
      .notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "sub_task_flags_pk",
      columns: [table.subTaskId, table.flagId],
    }),
    unique("sub_task_flags_flag_id_unique").on(table.flagId),
  ],
);

export const subTaskAssignees = pgTable("sub_task_assignees", {
  subTaskId: uuid("sub_task_id")
    .references(() => subTasks.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  subTaskId: uuid("sub_task_id")
    .references(() => subTasks.id, { onDelete: "cascade" })
    .notNull(),
  colaboratorId: uuid("colaborator_id")
    .references(() => users.id)
    .notNull(),
  action: activityActionEnum("action").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
  qty: integer("qty").default(0).notNull(),
  currencyAwarded: integer("currency_awarded").default(0).notNull(),
  chainRunId: uuid("chain_run_id"),
});

export const balances = pgTable("balances", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  currencyPluralTitle: text("currency_plural_title").notNull(),
  date: date("date").notNull(),
  previousBalance: doublePrecision("previous_balance").default(0).notNull(),
  totalIncome: doublePrecision("total_income").default(0).notNull(),
  totalOutcome: doublePrecision("total_outcome").default(0).notNull(),
  balance: doublePrecision("balance").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    status: cartStatusEnum("status").default("open").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("carts_one_open_per_user")
      .on(table.userId)
      .where(sql`${table.status} = 'open'`),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .references(() => carts.id, { onDelete: "cascade" })
      .notNull(),
    awardId: uuid("award_id")
      .references(() => awards.id)
      .notNull(),
    currencyId: uuid("currency_id")
      .references(() => currencies.id)
      .notNull(),
    qty: integer("qty").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("cart_items_cart_award_currency_unique").on(
      table.cartId,
      table.awardId,
      table.currencyId,
    ),
    index("cart_items_cart_id_idx").on(table.cartId),
  ],
);

export const exchangeBatches = pgTable(
  "exchange_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    status: exchangeBatchStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("exchange_batches_year_month_unique").on(table.year, table.month),
  ],
);

export const exchangeOrders = pgTable(
  "exchange_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    batchId: uuid("batch_id").references(() => exchangeBatches.id, {
      onDelete: "set null",
    }),
    status: exchangeOrderStatusEnum("status").default("completed").notNull(),
    currencyPluralTitle: text("currency_plural_title").notNull(),
    totalNumberOf: doublePrecision("total_number_of").notNull(),
    itemCount: integer("item_count").default(0).notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("exchange_orders_user_checked_out_idx").on(
      table.userId,
      table.checkedOutAt,
    ),
    index("exchange_orders_batch_id_idx").on(table.batchId),
    unique("exchange_orders_user_year_month_unique").on(
      table.userId,
      table.year,
      table.month,
    ),
  ],
);

export const exchangeOrderItems = pgTable(
  "exchange_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .references(() => exchangeOrders.id, { onDelete: "cascade" })
      .notNull(),
    awardId: uuid("award_id").references(() => awards.id, {
      onDelete: "set null",
    }),
    awardTitle: text("award_title").notNull(),
    qty: integer("qty").default(1).notNull(),
    unitNumberOf: doublePrecision("unit_number_of").notNull(),
    lineNumberOf: doublePrecision("line_number_of").notNull(),
    currencyId: uuid("currency_id").references(() => currencies.id, {
      onDelete: "set null",
    }),
    currencyPluralTitle: text("currency_plural_title"),
  },
  (table) => [index("exchange_order_items_order_id_idx").on(table.orderId)],
);

export const exchanges = pgTable(
  "exchanges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    orderId: uuid("order_id").references(() => exchangeOrders.id, {
      onDelete: "set null",
    }),
    awardTitle: text("award_title").notNull(),
    currencyPluralTitle: text("currency_plural_title").notNull(),
    qty: integer("qty").default(1).notNull(),
    numberOf: doublePrecision("number_of").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("exchanges_order_id_idx").on(table.orderId)],
);
