import { relations } from "drizzle-orm";
import {
  claims,
  emailDeliveries,
  itemMatches,
  items,
  notifications,
  profiles,
  statusHistory,
  users,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  items: many(items),
  claims: many(claims),
  notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  reporter: one(users, {
    fields: [items.reporterId],
    references: [users.id],
  }),
  claims: many(claims),
  statusHistory: many(statusHistory),
  lostMatches: many(itemMatches, { relationName: "lostItemMatches" }),
  foundMatches: many(itemMatches, { relationName: "foundItemMatches" }),
  notifications: many(notifications),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  item: one(items, { fields: [claims.itemId], references: [items.id] }),
  claimant: one(users, { fields: [claims.claimantId], references: [users.id] }),
  reviewer: one(users, { fields: [claims.reviewerId], references: [users.id] }),
  notifications: many(notifications),
}));

export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  item: one(items, { fields: [statusHistory.itemId], references: [items.id] }),
  actor: one(users, { fields: [statusHistory.actorId], references: [users.id] }),
}));

export const itemMatchesRelations = relations(itemMatches, ({ one }) => ({
  lostItem: one(items, {
    relationName: "lostItemMatches",
    fields: [itemMatches.lostItemId],
    references: [items.id],
  }),
  foundItem: one(items, {
    relationName: "foundItemMatches",
    fields: [itemMatches.foundItemId],
    references: [items.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  item: one(items, { fields: [notifications.itemId], references: [items.id] }),
  claim: one(claims, { fields: [notifications.claimId], references: [claims.id] }),
  emailDeliveries: many(emailDeliveries),
}));

export const emailDeliveriesRelations = relations(emailDeliveries, ({ one }) => ({
  notification: one(notifications, {
    fields: [emailDeliveries.notificationId],
    references: [notifications.id],
  }),
}));
