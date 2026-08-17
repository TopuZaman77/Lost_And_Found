import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { notifications } from "../../database/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      return db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input?.limit ?? 20);
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const result = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
    return result[0]?.value ?? 0;
  }),

  markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
    return { success: true } as const;
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, ctx.user.id));
    return { success: true } as const;
  }),
});

