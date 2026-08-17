import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { claims, items, statusHistory, users } from "../../database/schema";
import { adminProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";
import { dispatchNotification } from "../services/notifications";
import { statusAfterClaimReview } from "../services/rules";

export const adminRouter = router({
  overview: adminProcedure.query(async () => {
    const db = await requireDb();
    const [itemCounts, claimCounts, userCount] = await Promise.all([
      db.select({ status: items.status, value: count() }).from(items).groupBy(items.status),
      db.select({ status: claims.status, value: count() }).from(claims).groupBy(claims.status),
      db.select({ value: count() }).from(users),
    ]);
    const byItemStatus = Object.fromEntries(itemCounts.map(entry => [entry.status, entry.value]));
    const byClaimStatus = Object.fromEntries(claimCounts.map(entry => [entry.status, entry.value]));
    return {
      totalUsers: userCount[0]?.value ?? 0,
      lost: byItemStatus.Lost ?? 0,
      claimed: byItemStatus.Claimed ?? 0,
      verified: byItemStatus.Verified ?? 0,
      returned: byItemStatus.Returned ?? 0,
      pendingClaims: byClaimStatus.pending ?? 0,
    };
  }),

  claims: adminProcedure
    .input(
      z
        .object({
          status: z.enum(["all", "pending", "approved", "rejected"]).default("pending"),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const filters = input ?? { status: "pending" as const, page: 1, pageSize: 20 };
      const where = filters.status === "all" ? undefined : eq(claims.status, filters.status);
      const rows = await db
        .select({
          claim: claims,
          item: items,
          claimantName: users.name,
          claimantEmail: users.email,
        })
        .from(claims)
        .innerJoin(items, eq(claims.itemId, items.id))
        .innerJoin(users, eq(claims.claimantId, users.id))
        .where(where)
        .orderBy(desc(claims.createdAt))
        .limit(filters.pageSize)
        .offset((filters.page - 1) * filters.pageSize);
      const totalRows = await db.select({ value: count() }).from(claims).where(where);
      const total = totalRows[0]?.value ?? 0;
      return { rows, total, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) };
    }),

  reviewClaim: adminProcedure
    .input(
      z.object({
        claimId: z.number().int().positive(),
        decision: z.enum(["approved", "rejected"]),
        reviewNote: z.string().trim().min(4).max(2_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const rows = await db
        .select({ claim: claims, item: items, claimantEmail: users.email })
        .from(claims)
        .innerJoin(items, eq(claims.itemId, items.id))
        .innerJoin(users, eq(claims.claimantId, users.id))
        .where(eq(claims.id, input.claimId))
        .limit(1);
      const row = rows[0];
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found." });
      if (row.claim.status !== "pending") {
        throw new TRPCError({ code: "CONFLICT", message: "This claim has already been reviewed." });
      }
      if (row.item.status === "Returned") {
        throw new TRPCError({ code: "CONFLICT", message: "The item has already been returned." });
      }

      const now = Date.now();
      await db
        .update(claims)
        .set({
          status: input.decision,
          reviewerId: ctx.user.id,
          reviewNote: input.reviewNote,
          reviewedAt: now,
        })
        .where(eq(claims.id, input.claimId));

      if (input.decision === "approved") {
        const competing = await db
          .select({ id: claims.id, claimantId: claims.claimantId, email: users.email })
          .from(claims)
          .innerJoin(users, eq(claims.claimantId, users.id))
          .where(and(eq(claims.itemId, row.item.id), eq(claims.status, "pending"), ne(claims.id, row.claim.id)));
        if (competing.length) {
          await db
            .update(claims)
            .set({ status: "rejected", reviewerId: ctx.user.id, reviewNote: "Another claim was verified.", reviewedAt: now })
            .where(and(eq(claims.itemId, row.item.id), eq(claims.status, "pending"), ne(claims.id, row.claim.id)));
          for (const other of competing) {
            await dispatchNotification({
              userId: other.claimantId,
              recipientEmail: other.email,
              type: "claim_rejected",
              title: "Ownership claim rejected",
              message: `Your ownership claim for “${row.item.title}” was not approved because another claim was verified.`,
              itemId: row.item.id,
              claimId: other.id,
            });
          }
        }
        const fromStatus = row.item.status;
        const nextStatus = statusAfterClaimReview(fromStatus, "approved", 0);
        await db.update(items).set({ status: nextStatus, updatedAt: now }).where(eq(items.id, row.item.id));
        await db.insert(statusHistory).values({
          itemId: row.item.id,
          fromStatus,
          toStatus: nextStatus,
          actorId: ctx.user.id,
          note: input.reviewNote,
          createdAt: now,
        });
      } else {
        const pending = await db
          .select({ value: count() })
          .from(claims)
          .where(and(eq(claims.itemId, row.item.id), eq(claims.status, "pending")));
        const nextStatus = statusAfterClaimReview(row.item.status, "rejected", pending[0]?.value ?? 0);
        if (nextStatus !== row.item.status) {
          await db.update(items).set({ status: nextStatus, updatedAt: now }).where(eq(items.id, row.item.id));
          await db.insert(statusHistory).values({
            itemId: row.item.id,
            fromStatus: "Claimed",
            toStatus: nextStatus,
            actorId: ctx.user.id,
            note: "Claim rejected; the item is open for new claims.",
            createdAt: now,
          });
        }
      }

      await dispatchNotification({
        userId: row.claim.claimantId,
        recipientEmail: row.claimantEmail,
        type: input.decision === "approved" ? "claim_approved" : "claim_rejected",
        title: input.decision === "approved" ? "Ownership claim approved" : "Ownership claim rejected",
        message:
          input.decision === "approved"
            ? `DIU staff verified your ownership claim for “${row.item.title}”. Please follow the return instructions.`
            : `DIU staff reviewed and rejected your ownership claim for “${row.item.title}”.`,
        itemId: row.item.id,
        claimId: row.claim.id,
      });
      return { success: true } as const;
    }),

  markReturned: adminProcedure
    .input(z.object({ itemId: z.number().int().positive(), note: z.string().trim().min(4).max(2_000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const rows = await db.select().from(items).where(eq(items.id, input.itemId)).limit(1);
      const item = rows[0];
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item report not found." });
      if (item.status !== "Verified") {
        throw new TRPCError({ code: "CONFLICT", message: "Only a verified item can be marked as returned." });
      }
      const now = Date.now();
      await db
        .update(items)
        .set({ status: "Returned", returnedAt: now, updatedAt: now, adminNote: input.note })
        .where(eq(items.id, input.itemId));
      await db.insert(statusHistory).values({
        itemId: input.itemId,
        fromStatus: "Verified",
        toStatus: "Returned",
        actorId: ctx.user.id,
        note: input.note,
        createdAt: now,
      });
      return { success: true } as const;
    }),

  recentReturns: adminProcedure.query(async () => {
    const db = await requireDb();
    return db
      .select()
      .from(items)
      .where(eq(items.status, "Returned"))
      .orderBy(desc(items.returnedAt))
      .limit(10);
  }),
});
