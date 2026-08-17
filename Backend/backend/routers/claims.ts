import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { claims, items, profiles, statusHistory, users } from "../../database/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";
import { dispatchNotification } from "../services/notifications";
import { claimSubmissionIssue, statusAfterClaimSubmission } from "../services/rules";

export const claimsRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db
      .select({
        claim: claims,
        itemTitle: items.title,
        itemStatus: items.status,
        itemImageUrl: items.imageUrl,
      })
      .from(claims)
      .innerJoin(items, eq(claims.itemId, items.id))
      .where(eq(claims.claimantId, ctx.user.id))
      .orderBy(desc(claims.createdAt));
  }),

  submit: protectedProcedure
    .input(
      z.object({
        itemId: z.number().int().positive(),
        uniqueIdentifiers: z.string().trim().min(6).max(2_000),
        proofDescription: z.string().trim().min(12).max(4_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const profile = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, ctx.user.id)).limit(1);
      if (!profile[0]) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete your DIU profile before submitting a claim." });
      }

      const itemRows = await db
        .select({ item: items, reporterEmail: users.email })
        .from(items)
        .innerJoin(users, eq(items.reporterId, users.id))
        .where(eq(items.id, input.itemId))
        .limit(1);
      const row = itemRows[0];
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Found item report not found." });
      const duplicate = await db
        .select({ id: claims.id })
        .from(claims)
        .where(and(eq(claims.itemId, input.itemId), eq(claims.claimantId, ctx.user.id)))
        .limit(1);
      const issue = claimSubmissionIssue(row.item, ctx.user.id, Boolean(duplicate[0]));
      if (issue) {
        throw new TRPCError({
          code: row.item.status === "Verified" || row.item.status === "Returned" || duplicate[0] ? "CONFLICT" : "BAD_REQUEST",
          message: issue,
        });
      }

      const now = Date.now();
      const inserted = await db
        .insert(claims)
        .values({
          itemId: input.itemId,
          claimantId: ctx.user.id,
          uniqueIdentifiers: input.uniqueIdentifiers,
          proofDescription: input.proofDescription,
          status: "pending",
          createdAt: now,
        })
        .$returningId();
      const claimId = inserted[0]?.id;
      if (!claimId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to submit the claim." });

      const nextStatus = statusAfterClaimSubmission(row.item.status);
      if (nextStatus !== row.item.status) {
        await db.update(items).set({ status: nextStatus, updatedAt: now }).where(eq(items.id, row.item.id));
        await db.insert(statusHistory).values({
          itemId: row.item.id,
          fromStatus: "Lost",
          toStatus: "Claimed",
          actorId: ctx.user.id,
          note: "An ownership claim was submitted.",
          createdAt: now,
        });
      }

      await dispatchNotification({
        userId: row.item.reporterId,
        recipientEmail: row.reporterEmail,
        type: "claim_submitted",
        title: "A new ownership claim was submitted",
        message: `A DIU user submitted an ownership claim for “${row.item.title}”. Staff can now review the verification details.`,
        itemId: row.item.id,
        claimId,
      });
      return { id: claimId };
    }),
});
