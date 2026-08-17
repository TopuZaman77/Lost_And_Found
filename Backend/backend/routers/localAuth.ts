import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import type { Response } from "express";
import { nanoid } from "nanoid";
import { localCredentials, profiles, users } from "../../database/schema";
import { manualLoginInput, manualRegistrationInput } from "../../shared/manualAuth";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";
import { hashPassword, verifyPassword } from "../services/passwords";

function setManualSession(res: Response | undefined, req: Parameters<typeof getSessionCookieOptions>[0], token: string) {
  if (!res) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create a secure session." });
  res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
}

export const localAuthRouter = router({
  register: publicProcedure.input(manualRegistrationInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [emailOwner, credentialOwner, profileOwner] = await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1),
      db.select({ id: localCredentials.id }).from(localCredentials).where(or(eq(localCredentials.email, input.email), eq(localCredentials.studentId, input.studentId))).limit(1),
      db.select({ id: profiles.id }).from(profiles).where(eq(profiles.studentId, input.studentId)).limit(1),
    ]);

    if (emailOwner[0] || credentialOwner[0] || profileOwner[0]) {
      throw new TRPCError({ code: "CONFLICT", message: "An account with that Gmail address or student ID already exists." });
    }

    const now = Date.now();
    const passwordHash = await hashPassword(input.password);

    try {
      const user = await db.transaction(async tx => {
        const inserted = await tx
          .insert(users)
          .values({
            openId: `local_${nanoid(28)}`,
            name: input.name,
            email: input.email,
            loginMethod: "password",
            role: "user",
            lastSignedIn: new Date(),
          })
          .$returningId();
        const userId = inserted[0]?.id;
        if (!userId) throw new Error("Unable to create account.");

        await tx.insert(localCredentials).values({
          userId,
          email: input.email,
          studentId: input.studentId,
          passwordHash,
          createdAt: now,
          updatedAt: now,
        });

        return { id: userId };
      });

      const registeredUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      const account = registeredUser[0];
      if (!account) throw new Error("Unable to load the new account.");
      const token = await sdk.createSessionToken(account.openId, { name: account.name ?? input.name });
      setManualSession(ctx.res, ctx.req, token);
      return { success: true, requiresProfile: true, user: { id: account.id, name: account.name, email: account.email } };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof Error && error.message.toLowerCase().includes("duplicate")) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with that Gmail address or student ID already exists." });
      }
      throw error;
    }
  }),

  login: publicProcedure.input(manualLoginInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const result = await db
      .select({ credential: localCredentials, user: users })
      .from(localCredentials)
      .innerJoin(users, eq(users.id, localCredentials.userId))
      .where(and(eq(localCredentials.email, input.email), eq(users.loginMethod, "password")))
      .limit(1);
    const account = result[0];
    const valid = account ? await verifyPassword(input.password, account.credential.passwordHash) : false;
    if (!account || !valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Gmail address or password." });
    }

    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, account.user.id));
    const token = await sdk.createSessionToken(account.user.openId, { name: account.user.name ?? "DIU FoundHub member" });
    setManualSession(ctx.res, ctx.req, token);
    const profile = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, account.user.id)).limit(1);
    return {
      success: true,
      requiresProfile: !profile[0],
      user: { id: account.user.id, name: account.user.name, email: account.user.email },
    };
  }),
});
