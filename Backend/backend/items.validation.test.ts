import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

const ctx: TrpcContext = {
  user: {
    id: 12,
    openId: "validation-user",
    name: "Validation User",
    email: "validation@diu.edu.bd",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

describe("item report validation", () => {
  it("rejects underspecified public report content before touching the database", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.items.create({
        reportType: "lost",
        title: "x",
        description: "too short",
        category: "Other",
        eventDate: Date.now(),
        location: "x",
        contactDetails: "x",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a holding location for found-item reports", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.items.create({
        reportType: "found",
        title: "Found campus calculator",
        description: "A scientific calculator was found beside the library entrance.",
        category: "Electronics",
        eventDate: Date.now(),
        location: "DIU Library entrance",
        holdingLocation: "",
        contactDetails: "student@diu.edu.bd",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
