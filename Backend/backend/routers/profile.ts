import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { localCredentials, profiles, users } from "../../database/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";

const profileInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  studentId: z.string().trim().min(3).max(32),
  department: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(32),
  affiliation: z.enum(["student", "staff"]),
  contactInfo: z.string().trim().min(4).max(320),
});

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const result = await db
      .select({ user: users, profile: profiles, credential: localCredentials })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(localCredentials, eq(localCredentials.userId, users.id))
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return result[0] ?? { user: ctx.user, profile: null, credential: null };
  }),

  upsert: protectedProcedure.input(profileInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const now = Date.now();
    try {
      const registeredCredential = await db
        .select({ userId: localCredentials.userId })
        .from(localCredentials)
        .where(eq(localCredentials.studentId, input.studentId))
        .limit(1);
      if (registeredCredential[0] && registeredCredential[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "CONFLICT", message: "That student ID is already registered." });
      }
      await db.update(users).set({ name: input.name, email: input.email || null }).where(eq(users.id, ctx.user.id));
      await db
        .insert(profiles)
        .values({
          userId: ctx.user.id,
          studentId: input.studentId,
          department: input.department,
          phone: input.phone,
          affiliation: input.affiliation,
          contactInfo: input.contactInfo,
          profileCompleted: true,
          createdAt: now,
          updatedAt: now,
        })
        .onDuplicateKeyUpdate({
          set: {
            studentId: input.studentId,
            department: input.department,
            phone: input.phone,
            affiliation: input.affiliation,
            contactInfo: input.contactInfo,
            profileCompleted: true,
            updatedAt: now,
          },
        });
      return { success: true } as const;
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("duplicate")) {
        throw new TRPCError({ code: "CONFLICT", message: "That student ID is already registered." });
      }
      throw error;
    }
  }),
});
