import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
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

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  storageKey: text("storage_key").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 128 }),
  byteSize: integer("byte_size"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  lastName: varchar("last_name", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  code: integer("code").default(0).notNull(),
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
  currencyPerSecond: doublePrecision("currency_per_second")
    .default(0)
    .notNull(),
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

export const kioskSettings = pgTable("kiosk_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionIdleSeconds: integer("session_idle_seconds").default(120).notNull(),
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

export const subTaskPresets = pgTable("sub_task_presets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  expectedTime: integer("expected_time").default(0).notNull(),
  sharingType: sharingTypeEnum("sharing_type").default("duration").notNull(),
  maxSameTimeWorkers: integer("max_same_time_workers").default(1).notNull(),
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
  reasonForDeactivation: text("reason_for_deactivation"),
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
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
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

export const exchanges = pgTable("exchanges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  awardId: uuid("award_id")
    .references(() => awards.id)
    .notNull(),
  currencyId: uuid("currency_id")
    .references(() => currencies.id)
    .notNull(),
  qty: integer("qty").default(1).notNull(),
  numberOf: doublePrecision("number_of").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
