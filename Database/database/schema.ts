import {
  bigint,
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "../shared/lostFound";

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => [index("users_role_idx").on(table.role)],
);

export const localCredentials = mysqlTable(
  "local_credentials",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    studentId: varchar("studentId", { length: 32 }).notNull(),
    passwordHash: varchar("passwordHash", { length: 512 }).notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  },
  table => [
    uniqueIndex("local_credentials_user_unique").on(table.userId),
    uniqueIndex("local_credentials_email_unique").on(table.email),
    uniqueIndex("local_credentials_student_id_unique").on(table.studentId),
  ],
);

export const profiles = mysqlTable(
  "profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    studentId: varchar("studentId", { length: 32 }).notNull(),
    department: varchar("department", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    affiliation: mysqlEnum("affiliation", ["student", "staff"]).default("student").notNull(),
    contactInfo: varchar("contactInfo", { length: 320 }).notNull(),
    profileCompleted: boolean("profileCompleted").default(true).notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  },
  table => [
    uniqueIndex("profiles_user_unique").on(table.userId),
    uniqueIndex("profiles_student_id_unique").on(table.studentId),
    index("profiles_affiliation_idx").on(table.affiliation),
  ],
);

export const items = mysqlTable(
  "items",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporterId").notNull().references(() => users.id, { onDelete: "cascade" }),
    reportType: mysqlEnum("reportType", ["lost", "found"]).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    searchText: varchar("searchText", { length: 512 }).notNull(),
    category: mysqlEnum("category", ITEM_CATEGORIES).notNull(),
    eventDate: bigint("eventDate", { mode: "number" }).notNull(),
    location: varchar("location", { length: 220 }).notNull(),
    holdingLocation: varchar("holdingLocation", { length: 220 }),
    contactDetails: varchar("contactDetails", { length: 320 }).notNull(),
    imageKey: varchar("imageKey", { length: 512 }),
    imageUrl: varchar("imageUrl", { length: 768 }),
    status: mysqlEnum("status", ITEM_STATUSES).default("Lost").notNull(),
    adminNote: text("adminNote"),
    returnedAt: bigint("returnedAt", { mode: "number" }),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  },
  table => [
    index("items_reporter_idx").on(table.reporterId),
    index("items_type_status_idx").on(table.reportType, table.status),
    index("items_category_idx").on(table.category),
    index("items_title_idx").on(table.title),
    index("items_location_idx").on(table.location),
    index("items_search_text_idx").on(table.searchText),
    index("items_event_date_idx").on(table.eventDate),
    index("items_created_at_idx").on(table.createdAt),
  ],
);

export const claims = mysqlTable(
  "claims",
  {
    id: int("id").autoincrement().primaryKey(),
    itemId: int("itemId").notNull().references(() => items.id, { onDelete: "cascade" }),
    claimantId: int("claimantId").notNull().references(() => users.id, { onDelete: "cascade" }),
    uniqueIdentifiers: text("uniqueIdentifiers").notNull(),
    proofDescription: text("proofDescription").notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
    reviewerId: int("reviewerId").references(() => users.id, { onDelete: "set null" }),
    reviewNote: text("reviewNote"),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    reviewedAt: bigint("reviewedAt", { mode: "number" }),
  },
  table => [
    uniqueIndex("claims_item_claimant_unique").on(table.itemId, table.claimantId),
    index("claims_item_status_idx").on(table.itemId, table.status),
    index("claims_claimant_idx").on(table.claimantId),
    index("claims_status_idx").on(table.status),
  ],
);

export const statusHistory = mysqlTable(
  "status_history",
  {
    id: int("id").autoincrement().primaryKey(),
    itemId: int("itemId").notNull().references(() => items.id, { onDelete: "cascade" }),
    fromStatus: mysqlEnum("fromStatus", ITEM_STATUSES),
    toStatus: mysqlEnum("toStatus", ITEM_STATUSES).notNull(),
    actorId: int("actorId").notNull().references(() => users.id, { onDelete: "cascade" }),
    note: text("note"),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  table => [index("status_history_item_idx").on(table.itemId, table.createdAt)],
);

export const itemMatches = mysqlTable(
  "item_matches",
  {
    id: int("id").autoincrement().primaryKey(),
    lostItemId: int("lostItemId").notNull().references(() => items.id, { onDelete: "cascade" }),
    foundItemId: int("foundItemId").notNull().references(() => items.id, { onDelete: "cascade" }),
    matchScore: int("matchScore").notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  table => [
    uniqueIndex("item_matches_pair_unique").on(table.lostItemId, table.foundItemId),
    index("item_matches_lost_idx").on(table.lostItemId),
    index("item_matches_found_idx").on(table.foundItemId),
  ],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", [
      "item_match",
      "claim_submitted",
      "claim_approved",
      "claim_rejected",
    ]).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    message: text("message").notNull(),
    itemId: int("itemId").references(() => items.id, { onDelete: "set null" }),
    claimId: int("claimId").references(() => claims.id, { onDelete: "set null" }),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  },
  table => [
    index("notifications_user_read_idx").on(table.userId, table.isRead, table.createdAt),
    index("notifications_item_idx").on(table.itemId),
  ],
);

export const emailDeliveries = mysqlTable(
  "email_deliveries",
  {
    id: int("id").autoincrement().primaryKey(),
    notificationId: int("notificationId").notNull().references(() => notifications.id, { onDelete: "cascade" }),
    recipient: varchar("recipient", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 220 }).notNull(),
    body: text("body").notNull(),
    status: mysqlEnum("status", ["queued", "sent", "failed", "skipped"]).default("queued").notNull(),
    providerId: varchar("providerId", { length: 180 }),
    failureReason: text("failureReason"),
    createdAt: bigint("createdAt", { mode: "number" }).notNull(),
    sentAt: bigint("sentAt", { mode: "number" }),
  },
  table => [
    index("email_delivery_notification_idx").on(table.notificationId),
    index("email_delivery_status_idx").on(table.status, table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LocalCredential = typeof localCredentials.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
