import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function context(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role
      ? {
          id: 10,
          openId: "test-open-id",
          name: "DIU Test User",
          email: "student@diu.edu.bd",
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("staff authorization", () => {
  it("rejects a normal authenticated user from staff procedures", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.admin.overview()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("rejects an unauthenticated visitor from staff procedures", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.admin.overview()).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});
